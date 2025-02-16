import {
  AggregationsAggregate,
  SearchHit,
  SearchRequest,
  SearchResponse,
} from '@elastic/elasticsearch/lib/api/types'
import { Injectable } from '@nestjs/common'
import { ElasticsearchService } from '@nestjs/elasticsearch'

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  private getSearchRequest(
    query: string,
    fields: string[],
    useWildcard = false,
  ): SearchRequest {
    return useWildcard
      ? {
          query: {
            bool: {
              should: fields.map(field => ({
                wildcard: { [field]: { value: `*${query}*` } },
              })),
            },
          },
        }
      : {
          query: {
            bool: {
              should: fields.map(field => {
                const nestedPaths = field.split(/\.+/).filter(Boolean)
                const isNested = nestedPaths.length > 1

                if (!isNested) {
                  return { match: { [field]: query } }
                } else {
                  const path = nestedPaths[0]!
                  return {
                    nested: {
                      path,
                      query: {
                        match: { [field]: query },
                      },
                      inner_hits: {},
                    },
                  }
                }
              }),
            },
          },
        }
  }

  async search<Doc>(
    index: string,
    query: string,
    fields: string[],
  ): Promise<SearchResponse<Doc, Record<string, AggregationsAggregate>>> {
    const results = await this.esService.search<Doc>({
      index,
      body: this.getSearchRequest(query, fields),
    })

    return results
  }

  async scrollSearch<Doc>(
    index: string,
    query: string,
    fields: string[],
  ): Promise<SearchResponse<Doc, Record<string, AggregationsAggregate>>> {
    const all: SearchHit<Doc>[] = []

    const options = {
      index,
      body: this.getSearchRequest(query, fields),
    }

    const initialSearchResponse = await this.esService.search<Doc>({
      ...options,
      scroll: '30s',
      size: 1000,
    })

    const queue = [initialSearchResponse]

    while (queue.length) {
      const body = queue.shift()!
      all.push(...body.hits.hits)

      if (
        typeof body.hits.total === 'number'
          ? body.hits.total === all.length
          : body.hits.total?.value === all.length
      ) {
        break
      }

      queue.push(
        await this.esService.scroll({
          scroll_id: body._scroll_id,
          scroll: '30s',
        }),
      )
    }

    await this.esService.clearScroll({
      scroll_id: initialSearchResponse._scroll_id,
    })

    return {
      ...initialSearchResponse,
      hits: {
        ...initialSearchResponse.hits,
        hits: all,
      },
    }
  }
}
