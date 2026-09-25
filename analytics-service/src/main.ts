import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'realtyhub_analytics_queue',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3010);
  console.log(`📊 Analytics Service corriendo en el puerto ${process.env.PORT ?? 3010} (HTTP + RabbitMQ)`);
}
bootstrap();