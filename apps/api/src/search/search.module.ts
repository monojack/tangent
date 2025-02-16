import { Module } from '@nestjs/common'
import { ElasticsearchModule } from '@nestjs/elasticsearch'

import { SearchService } from './search.service'

import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [
    DatabaseModule,
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: 'elastic',
        password: 'elastic',
      },
    }),
  ],
  providers: [SearchService],
  exports: [ElasticsearchModule, SearchService],
})
export class SearchModule {}
