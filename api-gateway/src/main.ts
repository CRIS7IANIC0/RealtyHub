import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS global para permitir la conexión desde Vercel
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(3000);
  console.log('🚀 API Gateway corriendo en el puerto 3000 (CORS Habilitado globalmente)');
}
bootstrap();