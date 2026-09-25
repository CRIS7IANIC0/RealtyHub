import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Opcional: Si el User Service recibe peticiones directas desde el navegador, también necesitaría CORS. 
  // Pero como pasamos por el Gateway, no es estrictamente necesario aquí.
  app.enableCors();

  await app.listen(3001);
  console.log('👤 User Service corriendo en el puerto 3001');
}
bootstrap();