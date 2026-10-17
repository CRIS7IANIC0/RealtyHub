import { Controller, Get, Post, Body, Inject, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { PrismaService } from './prisma.service';

function serviceUrl(env: string | undefined, fallback: string): string {
  const clean = env?.trim().replace(/\/+$/, '');
  if (!clean) return fallback;
  if (clean.startsWith('http')) return clean;
  return clean.includes('.railway.internal') ? `http://${clean}` : `https://${clean}`;
}
const USER_SVC = serviceUrl(process.env.USER_SERVICE_URL, 'http://localhost:3001');

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

@Controller('leads')
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) { }

  @Get()
  async getAllLeads() {
    return this.prisma.lead.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Reparto equitativo: el agente activo con menos leads asignados recibe el nuevo lead.
   * Devuelve null si no hay agentes (el aviso llega entonces a gerencia).
   */
  private async pickAgent(): Promise<string | null> {
    const users = await fetchJson(`${USER_SVC}/users`);
    if (!Array.isArray(users)) return null;
    const agents = users.filter((u: any) => String(u.role).toUpperCase() === 'AGENTE' && u.active !== false);
    if (agents.length === 0) return null;

    const grouped = await this.prisma.lead.groupBy({
      by: ['agent_id'],
      where: { agent_id: { in: agents.map((a: any) => a.id) } },
      _count: { _all: true },
    });
    const load = new Map(grouped.map((g) => [g.agent_id, g._count._all]));
    agents.sort((a: any, b: any) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));
    return agents[0].id;
  }

  @Post()
  async createLead(
    @Body() data: {
      name: string;
      email: string;
      phone: string;
      property_id: string;
      source: string;
      status?: string;
    },
  ) {
    if (!data?.name?.trim() || !data?.email?.trim() || !data?.property_id) {
      throw new BadRequestException('name, email y property_id son obligatorios');
    }
    console.log('📥 Registrando nuevo lead:', data.name);

    const agentId = await this.pickAgent();

    const lead = await this.prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        property_id: data.property_id,
        source: data.source,
        status: data.status || 'Nuevo',
        agent_id: agentId,
      },
    });

    // La alerta no debe bloquear ni romper el registro del lead
    try {
      await lastValueFrom(this.notificationsClient.emit('lead.created', lead).pipe(timeout(3000)));
    } catch (error) {
      console.error('❌ No se pudo emitir "lead.created":', error);
    }

    return lead;
  }
}
