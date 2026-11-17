import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupMetrics } from './metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupMetrics(app, 'user-service'); // GET /metrics para Prometheus
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🧑 User Service corriendo en el puerto ${process.env.PORT ?? 3001}`);
}
bootstrap();