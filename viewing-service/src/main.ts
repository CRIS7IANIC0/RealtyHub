import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(3005); // Puerto exclusivo para Viewings
  console.log('Viewing Service corriendo en el puerto 3005');
}
bootstrap();