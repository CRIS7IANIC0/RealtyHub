import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🧑 User Service corriendo en el puerto ${process.env.PORT ?? 3001}`);
}
bootstrap();