import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupMetrics } from './metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupMetrics(app, 'contract-service'); // GET /metrics para Prometheus
  await app.listen(process.env.PORT ?? 3006);
  console.log(`📄 Contract Service corriendo en el puerto ${process.env.PORT ?? 3006}`);
}
bootstrap();