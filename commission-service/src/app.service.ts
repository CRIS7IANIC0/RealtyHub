import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
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

export const OPERATION_TYPES = ['Venta', 'Alquiler'] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export function normalizeOperation(raw: unknown): OperationType {
  return String(raw ?? '').trim().toLowerCase() === 'alquiler' ? 'Alquiler' : 'Venta';
}

// Acuerdos iniciales: se crean sólo si no existe ninguno vigente para el tipo de operación.
const DEFAULT_AGREEMENTS: Record<OperationType, { rate: number; agent: number; office: number; central: number }> = {
  Venta: { rate: 3, agent: 50, office: 30, central: 20 },
  Alquiler: { rate: 100, agent: 40, office: 35, central: 25 },
};

export interface Split {
  total: number;
  agent: number;
  office: number;
  central: number;
}

/** Reparte el total en pesos enteros; la central absorbe el redondeo para que la suma sea exacta. */
export function computeSplit(price: number, rate: number, agentPct: number, officePct: number): Split {
  const total = Math.round((price * rate) / 100);
  const agent = Math.round((total * agentPct) / 100);
  const office = Math.round((total * officePct) / 100);
  return { total, agent, office, central: total - agent - office };
}

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      for (const type of OPERATION_TYPES) {
        const active = await this.prisma.commissionAgreement.findFirst({ where: { operation_type: type, active: true } });
        if (active) continue;
        const d = DEFAULT_AGREEMENTS[type];
        await this.prisma.commissionAgreement.create({
          data: { operation_type: type, rate_percent: d.rate, agent_pct: d.agent, office_pct: d.office, central_pct: d.central },
        });
        console.log(`📜 [COMMISSION] Acuerdo inicial creado para ${type}`);
      }
    } catch (error) {
      console.error('❌ [COMMISSION] No se pudieron sembrar los acuerdos:', error);
    }
  }

  /** Acuerdo vigente en `at` para el tipo de operación (el de valid_from más reciente). */
  async agreementFor(type: OperationType, at: Date) {
    const found = await this.prisma.commissionAgreement.findFirst({
      where: {
        operation_type: type,
        valid_from: { lte: at },
        OR: [{ valid_to: null }, { valid_to: { gt: at } }],
      },
      orderBy: { valid_from: 'desc' },
    });
    if (found) return found;
    // Contrato anterior al primer acuerdo: se usa el vigente hoy
    return this.prisma.commissionAgreement.findFirst({
      where: { operation_type: type, active: true },
      orderBy: { valid_from: 'desc' },
    });
  }

  async listAgreements() {
    return this.prisma.commissionAgreement.findMany({ orderBy: [{ operation_type: 'asc' }, { valid_from: 'desc' }] });
  }

  private parseRates(body: any) {
    const type = normalizeOperation(body?.operation_type);
    const rate = Number(body?.rate_percent);
    const agent = Number(body?.agent_pct);
    const office = Number(body?.office_pct);
    const central = Number(body?.central_pct);
    if (![rate, agent, office, central].every(Number.isFinite)) {
      throw new BadRequestException('rate_percent, agent_pct, office_pct y central_pct deben ser números');
    }
    if (rate <= 0 || rate > 100) throw new BadRequestException('El porcentaje de comisión debe estar entre 0 y 100');
    if ([agent, office, central].some((n) => n < 0)) throw new BadRequestException('Los porcentajes de reparto no pueden ser negativos');
    if (Math.abs(agent + office + central - 100) > 0.001) {
      throw new BadRequestException('El reparto agente + oficina + central debe sumar 100%');
    }
    return { type, rate, agent, office, central };
  }

  async listAgentRules() {
    return this.prisma.agentCommissionRule.findMany({ orderBy: [{ agent_id: 'asc' }, { operation_type: 'asc' }] });
  }

  /** El administrador fija (o actualiza) la comisión de un agente para un tipo de operación. */
  async setAgentRule(body: any, updatedBy?: string) {
    const agentId = String(body?.agent_id ?? '').trim();
    if (!agentId) throw new BadRequestException('agent_id es obligatorio');
    const { type, rate, agent, office, central } = this.parseRates(body);
    const data = { rate_percent: rate, agent_pct: agent, office_pct: office, central_pct: central, updated_by: updatedBy ?? null };
    return this.prisma.agentCommissionRule.upsert({
      where: { agent_id_operation_type: { agent_id: agentId, operation_type: type } },
      create: { agent_id: agentId, operation_type: type, ...data },
      update: data,
    });
  }

  /** Quita la comisión individual: el agente vuelve al acuerdo general. */
  async deleteAgentRule(id: string) {
    await this.prisma.agentCommissionRule.delete({ where: { id } }).catch(() => null);
    return { deleted: true };
  }

  async createAgreement(body: any, createdBy?: string) {
    const { type, rate, agent, office, central } = this.parseRates(body);
    const now = new Date();
    const [, created] = await this.prisma.$transaction([
      this.prisma.commissionAgreement.updateMany({
        where: { operation_type: type, active: true },
        data: { active: false, valid_to: now },
      }),
      this.prisma.commissionAgreement.create({
        data: {
          operation_type: type,
          rate_percent: rate,
          agent_pct: agent,
          office_pct: office,
          central_pct: central,
          valid_from: now,
          created_by: createdBy ?? null,
        },
      }),
    ]);
    return created;
  }

  /** Calcula y persiste la comisión de un contrato firmado (idempotente por contract_id). */
  async registerSignedContract(data: any) {
    if (!data?.id) {
      console.log('⚠️ [COMMISSION] Payload inválido en contract.signed');
      return null;
    }
    const type = normalizeOperation(data.operation_type ?? data.type);
    const price = Number(data.price) || 0;
    const signedAt = data.signed_at ? new Date(data.signed_at) : new Date();
    const agentId: string = data.agent_id || 'agente-default';

    const agreement = await this.agreementFor(type, signedAt);
    if (!agreement) throw new Error(`Sin acuerdo comercial vigente para ${type}`);

    // La oficina del agente decide a quién va la porción de oficina
    const users = await fetchJson(`${USER_SVC}/users`);
    const agent = Array.isArray(users) ? users.find((u: any) => u.id === agentId) : null;
    const officeId: string | null = agent?.office_id ?? null;

    // Si el administrador fijó una comisión para este agente, prevalece sobre el acuerdo general
    const individual = await this.prisma.agentCommissionRule.findUnique({
      where: { agent_id_operation_type: { agent_id: agentId, operation_type: type } },
    });
    const ratePercent = individual?.rate_percent ?? agreement.rate_percent;
    const agentPct = individual?.agent_pct ?? agreement.agent_pct;
    let officePct = individual?.office_pct ?? agreement.office_pct;
    const centralBase = individual?.central_pct ?? agreement.central_pct;
    const split = computeSplit(price, ratePercent, agentPct, officePct);
    let rule = `${individual ? 'Acuerdo individual' : 'Acuerdo general'} ${type}: ${ratePercent}% · agente ${agentPct}% / oficina ${officePct}% / central ${centralBase}%`;
    if (!officeId) {
      // Sin oficina asignada, su porción pasa a la central
      split.central += split.office;
      split.office = 0;
      officePct = 0;
      rule += ' (agente sin oficina: la porción de oficina pasó a la central)';
    }

    const values = {
      agent_id: agentId,
      office_id: officeId,
      amount: split.total,
      split_rule_applied: rule,
      operation_type: type,
      contract_price: price,
      rate_percent: ratePercent,
      agent_pct: agentPct,
      office_pct: officePct,
      central_pct: 100 - agentPct - officePct,
      agent_amount: split.agent,
      office_amount: split.office,
      central_amount: split.central,
      agreement_id: agreement.id,
    };

    const existing = await this.prisma.commission.findFirst({ where: { contract_id: data.id } });
    if (existing) {
      // Contrato re-firmado tras haber sido anulado: se recalcula con el acuerdo vigente
      if (existing.status === 'Anulada') {
        return this.prisma.commission.update({ where: { id: existing.id }, data: { ...values, status: 'Pendiente', paid_at: null } });
      }
      console.log(`⚠️ [COMMISSION] La comisión del contrato ${data.id} ya existe. Omitiendo.`);
      return existing;
    }
    return this.prisma.commission.create({ data: { contract_id: data.id, status: 'Pendiente', ...values } });
  }

  /** Contrato devuelto a Pendiente: una comisión aún no pagada se anula. */
  async cancelForContract(contractId: string) {
    const existing = await this.prisma.commission.findFirst({ where: { contract_id: contractId } });
    if (!existing) return null;
    if (existing.status !== 'Pendiente') {
      console.log(`⚠️ [COMMISSION] Comisión ${existing.id} en estado ${existing.status}: no se anula.`);
      return existing;
    }
    return this.prisma.commission.update({ where: { id: existing.id }, data: { status: 'Anulada' } });
  }
}
