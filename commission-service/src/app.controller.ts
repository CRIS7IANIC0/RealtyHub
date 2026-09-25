import { Controller, Get, Patch, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';

@Controller('commissions')
export class AppController {
  constructor(private readonly prisma: PrismaService) { }

  // 1. Escuchador de Eventos (Asíncrono vía RabbitMQ)
  @EventPattern('contract.signed')
  async handleContractSigned(@Payload() data: any) {
    console.log('------------------------------------------------------');
    console.log(`💰 [COMMISSION] Contrato firmado detectado: ${data?.id}`);

    try {
      if (!data?.id) {
        console.log('⚠️ Payload inválido recibido en contract.signed.');
        return;
      }

      // REGLA DE NEGOCIO: Si no existe ya una comisión para ese contract_id
      const existing = await this.prisma.commission.findFirst({
        where: { contract_id: data.id },
      });

      if (existing) {
        console.log(`⚠️ La comisión para el contrato ${data.id} ya existe. Omitiendo.`);
        console.log('------------------------------------------------------');
        return existing;
      }

      // Calcular el monto: 5% del precio del contrato
      const contractPrice = Number(data.price) || 0;
      const baseCommission = contractPrice > 0 ? contractPrice * 0.05 : 5000;

      // Guardar en Prisma (SOLO CON LOS CAMPOS QUE EXISTEN EN EL SCHEMA)
      const commission = await this.prisma.commission.create({
        data: {
          contract_id: data.id,
          agent_id: data.agent_id || 'agente-default',
          amount: baseCommission,
          status: 'Pendiente',
        },
      });

      console.log(`✅ Comisión de $${baseCommission} guardada con estado "Pendiente" en Commission DB.`);
      console.log('------------------------------------------------------');
      return commission;

    } catch (error) {
      console.error('❌ ERROR CRÍTICO AL GUARDAR COMISIÓN:', error);
      console.log('------------------------------------------------------');
    }
  }

  // 2. Ruta HTTP normal (Síncrona) para ver todos los resultados
  @Get()
  async getAllCommissions() {
    return this.prisma.commission.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // 3. Ruta HTTP auxiliar para marcar comisión como pagada
  @Patch(':id/pay')
  async markAsPaid(@Param('id') id: string) {
    return this.prisma.commission.update({
      where: { id },
      data: { status: 'Pagada' },
    });
  }
}