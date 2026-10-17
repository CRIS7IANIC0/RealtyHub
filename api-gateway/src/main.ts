import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // La firma manuscrita viaja como PNG en base64 (hasta 300 KB)
  app.useBodyParser('json', { limit: '1mb' });
  app.setGlobalPrefix('api/v1');

  // Configuración de CORS simplificada y dinámica para aceptar peticiones de Vercel
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway corriendo en el puerto ${port} (CORS dinámico habilitado)`);
}
bootstrap();