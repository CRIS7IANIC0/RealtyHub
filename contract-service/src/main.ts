import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // La firma manuscrita viaja como PNG en base64 (hasta 300 KB)
  app.useBodyParser('json', { limit: '1mb' });
  await app.listen(process.env.PORT ?? 3006);
  console.log(`📄 Contract Service corriendo en el puerto ${process.env.PORT ?? 3006}`);
}
bootstrap();