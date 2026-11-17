import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupMetrics } from './metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupMetrics(app, 'viewing-service'); // GET /metrics para Prometheus
  app.enableCors();
  await app.listen(process.env.PORT ?? 3005);
  console.log(`👁️ Viewing Service corriendo en el puerto ${process.env.PORT ?? 3005}`);
}
bootstrap();