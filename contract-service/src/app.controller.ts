import { Controller, Get, Post, Patch, Body, Param, Inject, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
import { lastValueFrom } from 'rxjs';
import { buildContractPdf } from './contract-pdf';

export const CONTRACT_STATUSES = ['Pendiente', 'Firmado'] as const;

// "Borrador" era el nombre anterior del estado inicial; se acepta por compatibilidad.
function normalizeStatus(raw: unknown): 'Pendiente' | 'Firmado' {
  const v = String(raw ?? 'Pendiente').trim().toLowerCase();
  if (v === 'firmado') return 'Firmado';
  if (v === 'pendiente' || v === 'borrador') return 'Pendiente';
  throw new BadRequestException(`Estado inválido. Valores permitidos: ${CONTRACT_STATUSES.join(', ')}`);
}

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
    const status = normalizeStatus(data.status);

    // 1. Guardamos el contrato en Prisma
    const contract = await this.prisma.contract.create({
      data: {
        property_id: data.property_id,
        lead_id: data.lead_id,
        agent_id: data.agent_id,
        price: Number(data.price),
        type: data.type || data.operation_type || 'Venta',
        operation_type: data.operation_type || data.type || 'Venta',
        status,
        signed_at: status === 'Firmado' ? new Date() : null,
        city: data.city || null,
        payment_method: data.payment_method || null,
        deposit: data.deposit ? Number(data.deposit) : null,
        duration_months: data.duration_months ? Number(data.duration_months) : null,
        start_date: data.start_date ? new Date(data.start_date) : null,
        special_clauses: data.special_clauses || null,
      }
    });

    if (status === 'Firmado') await this.emitSigned(contract);

    return contract;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status?: string }) {
    const status = normalizeStatus(body?.status);
    const current = await this.prisma.contract.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Contrato no encontrado');
    if (current.status === status) return current;

    const contract = await this.prisma.contract.update({
      where: { id },
      data: { status, signed_at: status === 'Firmado' ? new Date() : null },
    });

    // El fanout solo se dispara en la transición Pendiente → Firmado
    if (status === 'Firmado') await this.emitSigned(contract);
    return contract;
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    // lead-service y user-service solo exponen el listado
    const [property, users, leads] = await Promise.all([
      fetchJson(`${PROPERTY_SVC}/properties/${contract.property_id}`),
      fetchJson(`${USER_SVC}/users`),
      fetchJson(`${LEAD_SVC}/leads`),
    ]);

    const pdf = await buildContractPdf({
      contract,
      property,
      lead: Array.isArray(leads) ? leads.find((l: any) => l.id === contract.lead_id) : null,
      agent: Array.isArray(users) ? users.find((u: any) => u.id === contract.agent_id) : null,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${contract.id.slice(0, 8)}.pdf"`,
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
  }

  // Fanout Pattern: emite "contract.signed" a las cuatro colas en paralelo
  private async emitSigned(contract: unknown) {
    console.log(`📢 Despachando "contract.signed" a colas en paralelo...`);
    try {
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
}
