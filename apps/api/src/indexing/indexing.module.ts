import { DynamicModule, Module } from '@nestjs/common'

import { IndexingConfig, IndexingService } from './indexing.service'

import { DatabaseModule } from '@/database/database.module'
import { SearchModule } from '@/search/search.module'

@Module({})
export class IndexingModule {
  static forRoot(config: IndexingConfig): DynamicModule {
    return {
      module: IndexingModule,
      imports: [DatabaseModule, SearchModule],
      providers: [
        { provide: 'INDEXING_CONFIG', useValue: config },
        IndexingService,
      ],
      exports: [IndexingService],
    }
  }
}
