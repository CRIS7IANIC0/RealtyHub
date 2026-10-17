import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { AppService, cop, fechaHora } from './app.service';
import { PrismaService } from './prisma.service';

/** Qué notificaciones ve cada persona: las suyas + los avisos generales (+ copias de clientes si es gerencia). */
function visibleTo(userId?: string, role?: string): Prisma.NotificationWhereInput {
  if (!userId) return {};
  const or: Prisma.NotificationWhereInput[] = [
    { recipient_id: userId },
    { recipient_id: null, recipient_type: 'USER' },
  ];
  if (['ADMIN', 'GERENTE'].includes(String(role).toUpperCase())) or.push({ recipient_type: 'CLIENT' });
  return { OR: or };
}

@Controller('notifications')
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly service: AppService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Eventos RabbitMQ (realtyhub_notifications_queue)
  // ─────────────────────────────────────────────────────────────

  /** Lead nuevo: avisa al agente al que se asignó (o a gerencia si no había agentes). */
  @EventPattern('lead.created')
  async handleLeadCreated(@Payload() lead: any) {
    await this.safe('lead.created', async () => {
      const [users, property] = await Promise.all([this.service.users(), this.service.property(lead?.property_id)]);
      const agent = users.find((u) => u.id === lead?.agent_id);
      const where = property?.title || property?.address || 'una propiedad';
      const detail = `${lead.name} (${lead.phone || lead.email}) se interesó en "${where}". Canal: ${lead.source || 'Web'}.`;

      if (agent) {
        await this.service.notify({
          recipients: [this.service.userRecipient(agent)],
          title: '🎯 Nuevo lead asignado',
          message: `Se te asignó un nuevo lead: ${detail}`,
          type: 'info',
          category: 'lead',
          link: '/leads',
        });
      } else {
        await this.service.notify({
          recipients: this.service.managers(users),
          title: '⚠️ Lead sin agente asignado',
          message: `No hay agentes activos para atender al nuevo lead: ${detail}`,
          type: 'warning',
          category: 'lead',
          link: '/leads',
        });
      }
    });
  }

  /** Visita agendada por un cliente: alerta al pool de agentes (o al agente indicado) y confirma al cliente. */
  @EventPattern('viewing.created')
  async handleViewingCreated(@Payload() v: any) {
    await this.safe('viewing.created', async () => {
      const [users, leads, property] = await Promise.all([
        this.service.users(),
        this.service.leads(),
        this.service.property(v?.property_id),
      ]);
      const lead = leads.find((l) => l.id === v.lead_id);
      const where = property?.title || property?.address || 'la propiedad';
      const when = fechaHora(v.scheduled_at);
      const agent = users.find((u) => u.id === v.agent_id);

      await this.service.notify({
        recipients: agent ? [this.service.userRecipient(agent)] : this.service.agents(users),
        title: agent ? '📅 Nueva visita asignada' : '📅 Nueva visita en el pool',
        message: agent
          ? `Visita a "${where}" el ${when}${lead?.name ? ` con ${lead.name}` : ''}.`
          : `${lead?.name ?? 'Un cliente'} solicitó visitar "${where}" el ${when}. Tómala desde Visitas antes que otro agente.`,
        type: 'info',
        category: 'visit',
        link: '/viewings',
      });

      if (lead) {
        await this.service.notify({
          recipients: [this.service.clientRecipient(lead)],
          title: 'Recibimos tu solicitud de visita',
          message: `Tu visita a "${where}" quedó programada para el ${when}. Un asesor te confirmará muy pronto.`,
          type: 'success',
          category: 'visit',
        });
      }
    });
  }

  /** Un agente tomó la visita: confirmación al agente y al cliente. */
  @EventPattern('viewing.taken')
  async handleViewingTaken(@Payload() v: any) {
    await this.safe('viewing.taken', async () => {
      const [users, leads, property] = await Promise.all([
        this.service.users(),
        this.service.leads(),
        this.service.property(v?.property_id),
      ]);
      const agent = users.find((u) => u.id === v.agent_id);
      const lead = leads.find((l) => l.id === v.lead_id);
      const where = property?.title || property?.address || 'la propiedad';
      const when = fechaHora(v.scheduled_at);

      if (agent) {
        await this.service.notify({
          recipients: [this.service.userRecipient(agent)],
          title: '✅ Visita asignada a ti',
          message: `Atenderás la visita a "${where}" el ${when}${lead?.name ? ` con ${lead.name}` : ''}${lead?.phone ? ` · ${lead.phone}` : ''}. Te recordaremos antes de la cita.`,
          type: 'success',
          category: 'visit',
          link: '/viewings',
        });
      }
      if (lead) {
        await this.service.notify({
          recipients: [this.service.clientRecipient(lead)],
          title: 'Tu visita fue confirmada',
          message: `${agent?.name ?? 'Un asesor'} te atenderá en "${where}" el ${when}.`,
          type: 'success',
          category: 'visit',
        });
      }
    });
  }

  /** Contrato nuevo, pendiente de firma. */
  @EventPattern('contract.created')
  async handleContractCreated(@Payload() c: any) {
    await this.safe('contract.created', async () => {
      const ctx = await this.contractContext(c);
      await this.service.notify({
        recipients: [...ctx.agent, ...ctx.managers],
        title: '📝 Nuevo contrato pendiente de firma',
        message: `Contrato de ${ctx.operation} de "${ctx.where}" por ${cop(c.price)}${ctx.leadName ? ` para ${ctx.leadName}` : ''}. Falta la firma digital de las partes.`,
        type: 'info',
        category: 'contract',
        link: '/contracts',
      });
    });
  }

  /** Una de las partes firmó electrónicamente. */
  @EventPattern('contract.signature_added')
  async handleSignatureAdded(@Payload() c: any) {
    await this.safe('contract.signature_added', async () => {
      const ctx = await this.contractContext(c);
      const message = `${c.signer_name} firmó como ${String(c.party_label).toLowerCase()} el contrato de "${ctx.where}".${
        c.fully_signed ? ' Todas las partes firmaron: el contrato quedó cerrado.' : ' Falta la firma de la otra parte.'
      }`;
      await this.service.notify({
        recipients: [...ctx.agent, ...ctx.client, ...ctx.managers],
        title: '✍️ Firma digital registrada',
        message,
        type: 'info',
        category: 'contract',
        link: '/contracts',
      });
    });
  }

  /** Contrato cerrado: todas las partes (agente, cliente y gerencia) reciben el aviso. */
  @EventPattern('contract.signed')
  async handleContractSigned(@Payload() data: any) {
    console.log('📧 [NOTIFICATION-SERVICE] Evento contract.signed recibido');
    await this.safe('contract.signed', async () => {
      const c = data?.data ?? data;
      const ctx = await this.contractContext(c);
      const base = `Se firmó el contrato de ${ctx.operation} de "${ctx.where}" por ${cop(c?.price)}.`;
      const parts = [base];
      if (ctx.leadName) parts.push(`Cliente: ${ctx.leadName}.`);
      if (ctx.agentName) parts.push(`Agente: ${ctx.agentName}.`);

      await this.service.notify({
        recipients: [...ctx.agent, ...ctx.managers],
        title: '¡Nuevo Contrato Cerrado! 🎉',
        message: parts.join(' '),
        type: 'success',
        category: 'contract',
        link: '/contracts',
      });
      await this.service.notify({
        recipients: ctx.client,
        title: 'Tu contrato fue firmado 🎉',
        message: `${base} ${ctx.agentName ? `Tu asesor ${ctx.agentName} te contactará para los siguientes pasos.` : ''}`.trim(),
        type: 'success',
        category: 'contract',
      });
    });
  }

  /** Contrato devuelto a Pendiente: las firmas se anulan y todos deben saberlo. */
  @EventPattern('contract.reverted')
  async handleContractReverted(@Payload() c: any) {
    await this.safe('contract.reverted', async () => {
      const ctx = await this.contractContext(c);
      const message = `El contrato de ${ctx.operation} de "${ctx.where}" volvió a Pendiente. Las firmas anteriores quedaron anuladas y deberán repetirse.`;
      await this.service.notify({
        recipients: [...ctx.agent, ...ctx.managers],
        title: '↩️ Contrato devuelto a Pendiente',
        message,
        type: 'warning',
        category: 'contract',
        link: '/contracts',
      });
      await this.service.notify({
        recipients: ctx.client,
        title: 'Actualización de tu contrato',
        message,
        type: 'warning',
        category: 'contract',
      });
    });
  }

  /** Comisión liquidada: se avisa al agente beneficiario. */
  @EventPattern('commission.paid')
  async handleCommissionPaid(@Payload() c: any) {
    await this.safe('commission.paid', async () => {
      const users = await this.service.users();
      const agent = users.find((u) => u.id === c?.agent_id);
      if (!agent) return;
      await this.service.notify({
        recipients: [this.service.userRecipient(agent)],
        title: '💰 Comisión pagada',
        message: `Se liquidó tu comisión de ${cop(c.agent_amount)} por el contrato #${String(c.contract_id).slice(0, 8)}.`,
        type: 'success',
        category: 'commission',
        link: '/commissions',
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HTTP
  // ─────────────────────────────────────────────────────────────

  /** GET /notifications?user_id=&role=&unread=true — sin user_id devuelve todas. */
  @Get()
  async getNotifications(
    @Query('user_id') userId?: string,
    @Query('role') role?: string,
    @Query('unread') unread?: string,
  ) {
    try {
      return await this.prisma.notification.findMany({
        where: { ...visibleTo(userId, role), ...(unread === 'true' ? { is_read: false } : {}) },
        orderBy: { created_at: 'desc' },
        take: 500,
      });
    } catch (error) {
      console.error('❌ Error al obtener notificaciones:', error);
      return [];
    }
  }

  @Get('unread-count')
  async unreadCount(@Query('user_id') userId?: string, @Query('role') role?: string) {
    const count = await this.prisma.notification.count({ where: { ...visibleTo(userId, role), is_read: false } });
    return { count };
  }

  @Patch('read-all')
  async markAllAsRead(@Query('user_id') userId?: string, @Query('role') role?: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { ...visibleTo(userId, role), is_read: false },
      data: { is_read: true },
    });
    return { updated: count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    try {
      return await this.prisma.notification.update({ where: { id }, data: { is_read: true } });
    } catch (error) {
      console.error(`❌ Error al marcar notificación ${id} como leída:`, error);
      return { error: 'No se pudo actualizar la notificación' };
    }
  }

  // ─────────────────────────────────────────────────────────────

  private async safe(name: string, fn: () => Promise<void>) {
    try {
      await fn();
    } catch (error) {
      console.error(`❌ [NOTIFICATION-SERVICE] Error procesando ${name}:`, error);
    }
  }

  /** Resuelve nombres y destinatarios (agente, cliente, gerencia) de un contrato. */
  private async contractContext(c: any) {
    const [users, leads, property] = await Promise.all([
      this.service.users(),
      this.service.leads(),
      this.service.property(c?.property_id),
    ]);
    const agent = users.find((u) => u.id === c?.agent_id);
    const lead = leads.find((l) => l.id === c?.lead_id);
    return {
      where: property?.title || property?.address || 'la propiedad',
      operation: String(c?.operation_type ?? c?.type ?? 'Venta').toLowerCase() === 'alquiler' ? 'alquiler' : 'venta',
      agentName: agent?.name as string | undefined,
      leadName: lead?.name as string | undefined,
      agent: agent ? [this.service.userRecipient(agent)] : [],
      client: lead ? [this.service.clientRecipient(lead)] : [],
      managers: this.service.managers(users),
    };
  }
}
