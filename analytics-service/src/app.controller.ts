import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. Consumidor de eventos de RabbitMQ ───────────────────
  @EventPattern('contract.signed')
  async handleContractSigned(@Payload() data: any) {
    try {
      console.log('------------------------------------------------------');
      console.log(`📊 [ANALYTICS] Contrato firmado recibido:`, data?.id);

      const price = Number(data?.price || 0);

      const metric = await this.prisma.metric.create({
        data: {
          event_type: 'contract_signed',
          revenue_value: price,
        },
      });

      console.log(`✅ [ANALYTICS] Métrica registrada con éxito:`, metric);
      console.log('------------------------------------------------------');
    } catch (error) {
      console.error('❌ [ANALYTICS] Error al procesar evento contract.signed:', error);
    }
  }

  // ─── 2. Endpoints HTTP para consultar métricas consolidadas ─
  @Get('analytics')
  async getAnalytics() {
    return this.calculateMetrics();
  }

  @Get()
  async getRoot() {
    return this.calculateMetrics();
  }

  private async calculateMetrics() {
    try {
      const metrics = await this.prisma.metric.findMany({
        where: { event_type: 'contract_signed' },
      });

      const total_revenue = metrics.reduce(
        (acc, m) => acc + (Number(m.revenue_value) || 0),
        0,
      );
      const total_sales = metrics.length;

      return {
        total_revenue,
        total_sales,
      };
    } catch (error) {
      console.error('❌ [ANALYTICS] Error al calcular métricas:', error);
      return {
        total_revenue: 0,
        total_sales: 0,
      };
    }
  }
}