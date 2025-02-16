import { Module } from '@nestjs/common'
import { MongoClient, Db } from 'mongodb'

@Module({
  providers: [
    {
      provide: 'MONGODB_CONNECTION',
      useFactory: async (): Promise<Db> => {
        const client = await new MongoClient(
          process.env.MONGODB_URL ||
            'mongodb://127.0.0.1:27017/?replicaSet=rs0',
        ).connect()

        const db = client.db(process.env.MONGODB_DATABASE || 'mydb')
        // await db.collection('mycollection').createIndex({ id: 1 }, { unique: true, })

        return db
      },
    },
  ],
  exports: ['MONGODB_CONNECTION'],
})
export class DatabaseModule {}
