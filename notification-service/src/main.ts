import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Hybrid app: HTTP (REST) + RabbitMQ consumer
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Connect to RabbitMQ — exclusive queue for notifications only
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'realtyhub_notifications_queue', // <-- Cola exclusiva (sin Round-Robin)
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3009);
  console.log('🔔 Notification Service corriendo en el puerto 3009 (HTTP + RabbitMQ)');
}
bootstrap();