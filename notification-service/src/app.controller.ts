import { Controller, Get, Patch, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';

function serviceUrl(env: string | undefined, fallback: string): string {
  const clean = env?.trim().replace(/\/+$/, '');
  if (!clean) return fallback;
  if (clean.startsWith('http')) return clean;
  return clean.includes('.railway.internal') ? `http://${clean}` : `https://${clean}`;
}
const PROPERTY_SVC = serviceUrl(process.env.PROPERTY_SERVICE_URL, 'http://localhost:3003');
const LEAD_SVC = serviceUrl(process.env.LEAD_SERVICE_URL, 'http://localhost:3004');
const USER_SVC = serviceUrl(process.env.USER_SERVICE_URL, 'http://localhost:3001');

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

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
      const propertyId = data?.property_id ?? data?.data?.property_id;
      const leadId = data?.lead_id ?? data?.data?.lead_id;
      const agentId = data?.agent_id ?? data?.data?.agent_id;

      // Resolvemos nombres reales (los otros servicios solo exponen listados)
      const [property, leads, users] = await Promise.all([
        propertyId ? fetchJson(`${PROPERTY_SVC}/properties/${propertyId}`) : null,
        leadId ? fetchJson(`${LEAD_SVC}/leads`) : null,
        agentId ? fetchJson(`${USER_SVC}/users`) : null,
      ]);
      const lead = Array.isArray(leads) ? leads.find((l: any) => l.id === leadId) : null;
      const agent = Array.isArray(users) ? users.find((u: any) => u.id === agentId) : null;

      const propertyName = property?.title || property?.address || 'la propiedad';
      const parts = [`Se firmó el contrato de "${propertyName}" por $${Number(price).toLocaleString('es-CO')}.`];
      if (lead?.name) parts.push(`Cliente: ${lead.name}.`);
      if (agent?.name) parts.push(`Agente: ${agent.name}.`);

      await this.prisma.notification.create({
        data: {
          title: '¡Nuevo Contrato Cerrado! 🎉',
          message: parts.join(' '),
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
  @Patch('read-all')
  async markAllAsRead() {
    const { count } = await this.prisma.notification.updateMany({
      where: { is_read: false },
      data: { is_read: true },
    });
    return { updated: count };
  }

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