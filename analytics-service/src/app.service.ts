import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

function serviceUrl(env: string | undefined, fallback: string): string {
  const clean = env?.trim().replace(/\/+$/, '');
  if (!clean) return fallback;
  if (clean.startsWith('http')) return clean;
  return clean.includes('.railway.internal') ? `http://${clean}` : `https://${clean}`;
}
const CONTRACT_SVC = serviceUrl(process.env.CONTRACT_SERVICE_URL, 'http://localhost:3006');
const LEAD_SVC = serviceUrl(process.env.LEAD_SERVICE_URL, 'http://localhost:3004');
const PROPERTY_SVC = serviceUrl(process.env.PROPERTY_SERVICE_URL, 'http://localhost:3003');
const USER_SVC = serviceUrl(process.env.USER_SERVICE_URL, 'http://localhost:3001');
const COMMISSION_SVC = serviceUrl(process.env.COMMISSION_SERVICE_URL, 'http://localhost:3007');

async function fetchList(url: string): Promise<any[] | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      console.warn(`⚠️ [ANALYTICS] ${url} respondió ${res.status}`);
      return null;
    }
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (error) {
    // Aparece en los logs de Railway: revisa que la variable *_SERVICE_URL de este servicio apunte bien
    console.warn(`⚠️ [ANALYTICS] No se pudo alcanzar ${url}: ${(error as any)?.cause?.code ?? (error as Error).message}`);
    return null;
  }
}

const HOUR = 3600_000;
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const rate = (part: number, total: number) => (total > 0 ? round((part / total) * 100) : 0);

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * KPIs comerciales calculados en vivo con los datos de contratos, leads, propiedades y usuarios.
   * Al leer el estado actual, un contrato devuelto a Pendiente deja de contar de inmediato.
   */
  async buildDashboard() {
    const [contracts, leads, properties, users, offices, commissions] = await Promise.all([
      fetchList(`${CONTRACT_SVC}/contracts`),
      fetchList(`${LEAD_SVC}/leads`),
      fetchList(`${PROPERTY_SVC}/properties`),
      fetchList(`${USER_SVC}/users`),
      fetchList(`${USER_SVC}/users/offices`),
      fetchList(`${COMMISSION_SVC}/commissions`),
    ]);

    // Sin contract-service se recurre a las métricas persistidas por RabbitMQ
    if (!contracts) return { ...(await this.fallbackFromMetrics()), data_complete: false };

    const signed = contracts.filter((c) => String(c.status).toLowerCase() === 'firmado');
    const leadList = leads ?? [];
    const propById = new Map((properties ?? []).map((p) => [p.id, p]));
    const leadById = new Map(leadList.map((l) => [l.id, l]));
    const userById = new Map((users ?? []).map((u) => [u.id, u]));
    const officeById = new Map((offices ?? []).map((o) => [o.id, o]));

    const closedAt = (c: any) => new Date(c.signed_at ?? c.created_at).getTime();
    // Tiempo de cierre: desde que el lead entró hasta la firma (si no hay lead, desde la creación del contrato)
    const closingHours = (c: any) => {
      const start = new Date(leadById.get(c.lead_id)?.created_at ?? c.created_at).getTime();
      return Math.max(0, (closedAt(c) - start) / HOUR);
    };
    const convertedLeadIds = new Set(signed.map((c) => c.lead_id));

    const total_revenue = signed.reduce((s, c) => s + (Number(c.price) || 0), 0);
    const total_sales = signed.length;

    // ── Tiempo medio de cierre por tipo de propiedad ──
    const byType = new Map<string, number[]>();
    for (const c of signed) {
      const type = propById.get(c.property_id)?.property_type || 'Sin tipo';
      byType.set(type, [...(byType.get(type) ?? []), closingHours(c)]);
    }
    const avg_closing_by_property_type = [...byType.entries()]
      .map(([property_type, hours]) => ({
        property_type,
        deals: hours.length,
        avg_hours: round(avg(hours)),
        avg_days: round(avg(hours) / 24, 2),
      }))
      .sort((a, b) => b.deals - a.deals);

    // ── Conversión de leads por canal de origen ──
    const bySource = new Map<string, { leads: number; converted: number }>();
    for (const l of leadList) {
      const key = l.source || 'Sin canal';
      const row = bySource.get(key) ?? { leads: 0, converted: 0 };
      row.leads++;
      if (convertedLeadIds.has(l.id)) row.converted++;
      bySource.set(key, row);
    }
    const conversion_by_source = [...bySource.entries()]
      .map(([source, r]) => ({ source, leads: r.leads, converted: r.converted, rate: rate(r.converted, r.leads) }))
      .sort((a, b) => b.leads - a.leads);
    const convertedTotal = leadList.filter((l) => convertedLeadIds.has(l.id)).length;

    // ── Rendimiento por agente ──
    const agentIds = new Set<string>([
      ...(users ?? []).filter((u) => String(u.role).toUpperCase() === 'AGENTE').map((u) => u.id),
      ...contracts.map((c) => c.agent_id),
      ...leadList.map((l) => l.agent_id).filter(Boolean),
    ]);
    const agents = [...agentIds].map((id) => {
      const user = userById.get(id);
      const mine = signed.filter((c) => c.agent_id === id);
      const allMine = contracts.filter((c) => c.agent_id === id);
      const myLeads = leadList.filter((l) => l.agent_id === id);
      const revenue = mine.reduce((s, c) => s + (Number(c.price) || 0), 0);
      const commission = (commissions ?? [])
        .filter((k) => k.agent_id === id && k.status !== 'Anulada')
        .reduce((s, k) => s + (Number(k.agent_amount) || 0), 0);
      return {
        agent_id: id,
        name: user?.name ?? 'Agente desconocido',
        office_id: user?.office_id ?? null,
        office_name: officeById.get(user?.office_id)?.name ?? null,
        deals: mine.length,
        contracts_total: allMine.length,
        close_rate: rate(mine.length, allMine.length),
        revenue,
        avg_ticket: mine.length ? Math.round(revenue / mine.length) : 0,
        avg_hours: round(avg(mine.map(closingHours))),
        leads: myLeads.length,
        leads_converted: myLeads.filter((l) => convertedLeadIds.has(l.id)).length,
        lead_conversion: rate(myLeads.filter((l) => convertedLeadIds.has(l.id)).length, myLeads.length),
        commission_earned: commission,
      };
    });
    agents.sort((a, b) => b.revenue - a.revenue || b.deals - a.deals);

    // ── Rendimiento por oficina (suma de sus agentes) ──
    const officeIds = new Set<string>([...officeById.keys(), ...agents.map((a) => a.office_id).filter(Boolean) as string[]]);
    const officeRows = [...officeIds].map((id) => {
      const members = agents.filter((a) => a.office_id === id);
      const deals = members.reduce((s, a) => s + a.deals, 0);
      const revenue = members.reduce((s, a) => s + a.revenue, 0);
      const leadsN = members.reduce((s, a) => s + a.leads, 0);
      const converted = members.reduce((s, a) => s + a.leads_converted, 0);
      const hours = signed
        .filter((c) => userById.get(c.agent_id)?.office_id === id)
        .map(closingHours);
      return {
        office_id: id,
        name: officeById.get(id)?.name ?? id,
        region: officeById.get(id)?.region ?? null,
        agents: members.length,
        deals,
        revenue,
        avg_ticket: deals ? Math.round(revenue / deals) : 0,
        avg_hours: round(avg(hours)),
        leads: leadsN,
        lead_conversion: rate(converted, leadsN),
      };
    });
    officeRows.sort((a, b) => b.revenue - a.revenue || b.deals - a.deals);

    // ── Por tipo de operación y últimos 6 meses ──
    const by_operation = ['Venta', 'Alquiler'].map((operation) => {
      const rows = signed.filter((c) => (c.operation_type || c.type || 'Venta').toLowerCase() === operation.toLowerCase());
      return { operation, deals: rows.length, revenue: rows.reduce((s, c) => s + (Number(c.price) || 0), 0) };
    });

    const monthly: { month: string; deals: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rows = signed.filter((c) => {
        const at = new Date(c.signed_at ?? c.created_at);
        return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}` === key;
      });
      monthly.push({ month: key, deals: rows.length, revenue: rows.reduce((s, c) => s + (Number(c.price) || 0), 0) });
    }

    return {
      total_revenue,
      total_sales,
      avg_ticket: total_sales ? Math.round(total_revenue / total_sales) : 0,
      avg_closing_hours: round(avg(signed.map(closingHours))),
      avg_closing_by_property_type,
      lead_conversion: { total_leads: leadList.length, converted: convertedTotal, rate: rate(convertedTotal, leadList.length) },
      conversion_by_source,
      agents,
      offices: officeRows,
      by_operation,
      monthly,
      generated_at: new Date().toISOString(),
      data_complete: [contracts, leads, properties, users, offices].every(Boolean),
    };
  }

  private async fallbackFromMetrics() {
    try {
      const metrics = await this.prisma.metric.findMany({ where: { event_type: 'contract_signed' } });
      const total_revenue = metrics.reduce((acc, m) => acc + (Number(m.revenue_value) || 0), 0);
      return { ...this.empty(), total_revenue, total_sales: metrics.length };
    } catch (error) {
      console.error('❌ [ANALYTICS] Error al leer métricas:', error);
      return this.empty();
    }
  }

  private empty() {
    return {
      total_revenue: 0,
      total_sales: 0,
      avg_ticket: 0,
      avg_closing_hours: 0,
      avg_closing_by_property_type: [],
      lead_conversion: { total_leads: 0, converted: 0, rate: 0 },
      conversion_by_source: [],
      agents: [],
      offices: [],
      by_operation: [],
      monthly: [],
      generated_at: new Date().toISOString(),
    };
  }
}
