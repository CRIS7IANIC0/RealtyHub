import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupMetrics } from './metrics';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupMetrics(app, 'property-service'); // GET /metrics para Prometheus
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'realtyhub_property_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3003);
  console.log(`🏠 Property Service corriendo en el puerto ${process.env.PORT ?? 3003} (HTTP + RabbitMQ)`);
}
bootstrap();