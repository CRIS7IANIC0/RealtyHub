import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
import { lastValueFrom } from 'rxjs';

@Controller('contracts')
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    // Cliente exclusivo → commission-service (realtyhub_sales_queue)
    @Inject('SALES_SERVICE') private salesClient: ClientProxy,
    // Cliente exclusivo → notification-service (realtyhub_notifications_queue)
    @Inject('NOTIFICATIONS_SERVICE') private notificationsClient: ClientProxy,
    // Cliente exclusivo → analytics-service (realtyhub_analytics_queue)
    @Inject('ANALYTICS_SERVICE') private analyticsClient: ClientProxy,
    // Cliente exclusivo → property-service (realtyhub_property_queue)
    @Inject('PROPERTY_SERVICE') private propertyClient: ClientProxy,
  ) { }

  @Get()
  async getContracts() {
    return this.prisma.contract.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  @Post()
  async createContract(@Body() data: any) {
    console.log('📝 Creando nuevo contrato...', data.property_id);

    // 1. Guardamos el contrato en Prisma
    const contract = await this.prisma.contract.create({
      data: {
        property_id: data.property_id,
        lead_id: data.lead_id,
        agent_id: data.agent_id,
        price: Number(data.price),
        type: data.type || data.operation_type || 'Venta',
        operation_type: data.operation_type || data.type || 'Venta',
        status: data.status,
        signed_at: data.status === 'Firmado' ? new Date() : null,
      }
    });

    // 2. Si está firmado → emitir a las cuatro colas en paralelo (Fanout Pattern)
    if (data.status === 'Firmado') {
      console.log(`📢 Despachando "contract.signed" a colas en paralelo...`);
      try {
        // Promise.all + lastValueFrom garantiza que los cuatro observables se resuelven
        await Promise.all([
          lastValueFrom(this.salesClient.emit('contract.signed', contract)),
          lastValueFrom(this.notificationsClient.emit('contract.signed', contract)),
          lastValueFrom(this.analyticsClient.emit('contract.signed', contract)),
          lastValueFrom(this.propertyClient.emit('contract.signed', contract)),
        ]);
        console.log('✅ Evento entregado a realtyhub_sales_queue, realtyhub_notifications_queue, realtyhub_analytics_queue y realtyhub_property_queue');
      } catch (error) {
        console.error('❌ Error crítico al emitir a RabbitMQ:', error);
      }
    }

    return contract;
  }
}