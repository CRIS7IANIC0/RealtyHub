import { Controller, Get, Patch, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';

@Controller('notifications')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // RabbitMQ Consumer: listens for contract.signed on realtyhub_sales_queue
  // ─────────────────────────────────────────────────────────────
  @EventPattern('contract.signed')
  async handleContractSigned(@Payload() data: any) {
    console.log('------------------------------------------------------');
    console.log('📧 [NOTIFICATION-SERVICE] Evento contract.signed recibido');
    console.log('Payload:', JSON.stringify(data));
    console.log('------------------------------------------------------');

    try {
      const contractId = data?.id ?? data?.data?.id ?? 'desconocido';
      const price = data?.price ?? data?.data?.price ?? 0;
      const propertyId = data?.property_id ?? data?.data?.property_id ?? '—';

      await this.prisma.notification.create({
        data: {
          title: '¡Nuevo Contrato Cerrado! 🎉',
          message: `Se ha firmado el contrato ${contractId} para la propiedad ${propertyId} por $${Number(price).toLocaleString('es-CO')}.`,
          type: 'success',
          is_read: false,
        },
      });

      console.log(`✅ [NOTIFICATION-SERVICE] Notificación guardada en BD para contrato ${contractId}`);
    } catch (error) {
      console.error('❌ [NOTIFICATION-SERVICE] Error al guardar notificación:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HTTP: GET /notifications — returns all notifications desc
  // ─────────────────────────────────────────────────────────────
  @Get()
  async getNotifications() {
    try {
      return await this.prisma.notification.findMany({
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      console.error('❌ Error al obtener notificaciones:', error);
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HTTP: PATCH /notifications/:id/read — marks is_read = true
  // ─────────────────────────────────────────────────────────────
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { is_read: true },
      });
    } catch (error) {
      console.error(`❌ Error al marcar notificación ${id} como leída:`, error);
      return { error: 'No se pudo actualizar la notificación' };
    }
  }
}