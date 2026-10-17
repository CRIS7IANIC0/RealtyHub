import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly service: AppService,
  ) {}

  // ─── 1. Consumidor de eventos de RabbitMQ ───────────────────
  // Se conserva el registro de cada cierre como respaldo auditable de ingresos.
  @EventPattern('contract.signed')
  async handleContractSigned(@Payload() data: any) {
    try {
      console.log(`📊 [ANALYTICS] Contrato firmado recibido:`, data?.id);
      const metric = await this.prisma.metric.create({
        data: { event_type: 'contract_signed', revenue_value: Number(data?.price || 0) },
      });
      console.log(`✅ [ANALYTICS] Métrica registrada con éxito:`, metric.id);
    } catch (error) {
      console.error('❌ [ANALYTICS] Error al procesar evento contract.signed:', error);
    }
  }

  // ─── 2. KPIs comerciales ────────────────────────────────────
  @Get('analytics')
  async getAnalytics() {
    return this.service.buildDashboard();
  }

  @Get()
  async getRoot() {
    return this.service.buildDashboard();
  }
}
