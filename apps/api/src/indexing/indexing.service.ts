import {
  Injectable,
  Logger,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import {
  Collection,
  ChangeStream,
  ChangeStreamDocument,
  Db,
  Document,
  WithId,
} from 'mongodb'

export interface IndexingConfig {
  collectionName: string
  indexName: string
  indexSettings?: any
  indexMappings: any
}

@Injectable()
export class IndexingService<T extends Document>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(IndexingService.name)
  private collection!: Collection<T>
  private changeStream!: ChangeStream
  private reconnecting = false
  private readonly fullDocumentOption = 'updateLookup' // ensures update events include the full document

  constructor(
    @Inject('MONGODB_CONNECTION') private readonly db: Db,
    private readonly esService: ElasticsearchService,
    @Inject('INDEXING_CONFIG')
    private readonly config: IndexingConfig,
  ) {
    // Validate configuration
    if (!this.config.collectionName || !this.config.indexName) {
      throw new Error(
        'Invalid configuration: collectionName and indexName are required.',
      )
    }
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `Initializing change stream for collection: ${this.config.collectionName}`,
    )
    this.collection = this.db.collection<T>(this.config.collectionName)
    // Use fullDocument option to include updated document in update events
    this.changeStream = this.collection.watch([], {
      fullDocument: this.fullDocumentOption,
    })
    await this.ensureIndex()
    this.attachChangeStreamListeners()
    await this.indexAll()
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log(
      `Closing change stream for collection: ${this.config.collectionName}`,
    )
    if (this.changeStream) {
      await this.changeStream.close()
    }
  }

  private async ensureIndex() {
    const { indexName, indexSettings, indexMappings } = this.config
    try {
      const exists = await this.esService.indices.exists({ index: indexName })
      if (!exists) {
        this.logger.log(`Index ${indexName} does not exist. Creating index...`)
        await this.esService.indices.create({
          index: indexName,
          body: {
            settings: indexSettings || {
              analysis: {
                filter: {
                  edge_ngram_filter: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 20,
                  },
                },
                analyzer: {
                  edge_ngram_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'edge_ngram_filter'],
                  },
                  whitespace_analyzer: {
                    type: 'custom',
                    tokenizer: 'whitespace',
                    filter: ['lowercase'],
                  },
                },
              },
            },
            mappings: indexMappings,
          },
        })
        this.logger.log(`Index ${indexName} created successfully.`)
      } else {
        this.logger.log(`Index ${indexName} already exists.`)
      }
    } catch (e) {
      const error = e as Error
      this.logger.error(`Error ensuring index: ${error.message}`, error.stack)
      throw error
    }
  }

  private attachChangeStreamListeners(): void {
    this.changeStream.on('change', async (change: ChangeStreamDocument<T>) => {
      this.logger.debug(`Change detected: ${JSON.stringify(change)}`)
      try {
        switch (change.operationType) {
          case 'insert': {
            const fullDocument = change.fullDocument as WithId<T>
            if (!fullDocument) return
            const docToIndex = this.removeId(fullDocument)
            await this.esService.index({
              index: this.config.indexName,
              id: (fullDocument as any)._id.toString(),
              body: docToIndex,
            })
            this.logger.debug(
              `Indexed new document with _id: ${(fullDocument as any)._id}`,
            )
            break
          }
          case 'update': {
            // With fullDocument: 'updateLookup', the updated document is included.
            const fullDocument = change.fullDocument as WithId<T>
            if (fullDocument) {
              const docToUpdate = this.removeId(fullDocument)
              await this.esService.update({
                index: this.config.indexName,
                id: (fullDocument as any)._id.toString(),
                body: { doc: docToUpdate },
              })
              this.logger.debug(
                `Updated document with _id: ${(fullDocument as any)._id}`,
              )
            } else {
              this.logger.warn('Update event did not include full document.')
            }
            break
          }
          case 'delete': {
            const documentId = (change.documentKey as any)._id
            await this.esService.delete({
              index: this.config.indexName,
              id: documentId.toString(),
            })
            this.logger.debug(`Deleted document with _id: ${documentId}`)
            break
          }
          default:
            this.logger.warn(
              `Unhandled change operation: ${change.operationType}`,
            )
        }
      } catch (e) {
        const error = e as Error
        this.logger.error(
          `Error processing change stream event: ${error.message}`,
          error.stack,
        )
      }
    })

    this.changeStream.on('error', async error => {
      this.logger.error(`Change stream error: ${error.message}`, error.stack)
      await this.reconnectChangeStream()
    })
  }

  private async reconnectChangeStream() {
    if (this.reconnecting) return
    this.reconnecting = true

    try {
      if (this.changeStream) {
        await this.changeStream.close()
      }
    } catch (e) {
      const closeError = e as Error
      this.logger.warn(`Error closing change stream: ${closeError.message}`)
    }

    setTimeout(async () => {
      this.logger.log('Attempting to reconnect change stream...')
      try {
        this.changeStream = this.collection.watch([], {
          fullDocument: this.fullDocumentOption,
        })
        this.attachChangeStreamListeners()
        this.logger.log('Successfully reconnected change stream.')
      } catch (e) {
        const reconnectError = e as Error
        this.logger.error(
          `Reconnection failed: ${reconnectError.message}`,
          reconnectError.stack,
        )
      } finally {
        this.reconnecting = false
      }
    }, 5000)
  }

  /**
   * Indexes all documents from the collection.
   * Uses _id-based pagination for better performance.
   */
  async indexAll() {
    const batchSize = 100
    let lastId: any = null
    let hasMore = true

    while (hasMore) {
      const query = lastId ? { _id: { $gt: lastId } } : {}
      const documents = await this.collection
        .find(query)
        .sort({ _id: 1 })
        .limit(batchSize)
        .toArray()

      if (documents.length === 0) {
        hasMore = false
        break
      }
      await this.indexBatch(documents)
      lastId = (documents[documents.length - 1] as any)._id
      this.logger.log(`Indexed batch up to _id: ${lastId}`)
    }
    this.logger.log('Finished indexing all documents.')
  }

  async indexBatch(documents: WithId<T>[]) {
    const { indexName } = this.config

    try {
      const body = documents.flatMap(doc => {
        const id = (doc as any)._id.toString()
        const docToIndex = this.removeId(doc)
        return [{ index: { _index: indexName, _id: id } }, docToIndex]
      })
      const bulkResponse = await this.esService.bulk({ body })
      if (bulkResponse.errors) {
        bulkResponse.items.forEach((item: any) => {
          if (item.index && item.index.error) {
            this.logger.error(
              `Error indexing document ${item.index._id}: ${JSON.stringify(item.index.error)}`,
            )
          }
        })
      }
    } catch (e) {
      const error = e as Error
      this.logger.error(`Bulk indexing failed: ${error.message}`, error.stack)
    }
  }

  private removeId(document: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = document
    return rest
  }
}
