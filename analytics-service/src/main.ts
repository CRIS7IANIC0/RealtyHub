import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Microservicio híbrido: Conexión a RabbitMQ en canal exclusivo
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'realtyhub_analytics_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3010);
  console.log('📊 Analytics Service corriendo en puerto 3010 y escuchando RabbitMQ (realtyhub_analytics_queue)');
}
bootstrap();