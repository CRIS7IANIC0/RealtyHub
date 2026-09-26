import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // Dos clientes independientes → canales exclusivos (Fanout Pattern)
    ClientsModule.register([
      {
        // Cliente 1: para commission-service (comisiones)
        name: 'SALES_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'realtyhub_sales_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        // Cliente 2: para notification-service (notificaciones)
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'realtyhub_notifications_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        // Cliente 3: para analytics-service (analíticas)
        name: 'ANALYTICS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'realtyhub_analytics_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        // Cliente 4: para property-service (actualizar estado)
        name: 'PROPERTY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'realtyhub_property_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }