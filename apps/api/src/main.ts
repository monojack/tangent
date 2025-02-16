import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

async function bootstrap() {
  console.log('bootstrapping')

  const app = await NestFactory.create(AppModule)
  app.enableCors()
  await app.listen(process.env.API_PORT ?? 1337)
}

void bootstrap()
