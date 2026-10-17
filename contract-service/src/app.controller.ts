import { Controller, Get, Post, Patch, Body, Param, Inject, Res, Headers, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import type { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
import { lastValueFrom } from 'rxjs';
import { buildContractPdf } from './contract-pdf';
import {
  SIGNATURE_ROLES,
  contractHash,
  decodeSignatureImage,
  newSignToken,
  partyLabel,
  signatureSeal,
} from './signature.util';

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
// Dirección pública del frontend: el QR del PDF apunta a su página de verificación
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'http://localhost:3002').trim().replace(/\/+$/, '');
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
    else await this.emitNotification('contract.created', contract);

    return contract;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status?: string }) {
    const status = normalizeStatus(body?.status);
    const current = await this.prisma.contract.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Contrato no encontrado');
    if (current.status === status) return current;

    // Volver a Pendiente invalida las firmas electrónicas anteriores
    if (status === 'Pendiente') {
      await this.prisma.contractSignature.deleteMany({ where: { contract_id: id } });
    }

    const contract = await this.prisma.contract.update({
      where: { id },
      data: { status, signed_at: status === 'Firmado' ? new Date() : null },
    });

    // El fanout solo se dispara en la transición Pendiente → Firmado
    if (status === 'Firmado') await this.emitSigned(contract);
    else await this.emitReverted(contract);
    return contract;
  }

  // ─────────────────────────────────────────────────────────────
  // FIRMA DIGITAL
  // ─────────────────────────────────────────────────────────────

  /** Estado de firmas de un contrato (con los enlaces de firma). Crea las filas si faltan. */
  @Get(':id/signatures')
  async getSignatures(@Param('id') id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    const [property, leads] = await Promise.all([
      fetchJson(`${PROPERTY_SVC}/properties/${contract.property_id}`),
      fetchJson(`${LEAD_SVC}/leads`),
    ]);
    const lead = Array.isArray(leads) ? leads.find((l: any) => l.id === contract.lead_id) : null;
    const rows = await this.ensureSignatures(contract);
    return {
      contract_id: contract.id,
      status: contract.status,
      document_hash: contractHash(contract),
      property_title: property?.title ?? null,
      lead_name: lead?.name ?? null,
      lead_email: lead?.email ?? null,
      signatures: rows.map((r) => ({
        role: r.role,
        party_label: r.party_label,
        token: r.token,
        signed: !!r.signed_at,
        signer_name: r.signer_name,
        signer_document: r.signer_document,
        signed_at: r.signed_at,
      })),
    };
  }

  /** Verifica la integridad: huella del contrato + sello HMAC de cada firma. */
  @Get(':id/verify')
  async verifySignatures(@Param('id') id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { signatures: true },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    const hash = contractHash(contract);
    const signatures = contract.signatures
      .filter((s) => s.signed_at)
      .map((s) => {
        const valid =
          s.document_hash === hash &&
          s.signature_hash ===
            signatureSeal({
              document_hash: s.document_hash!,
              role: s.role,
              signer_name: s.signer_name ?? '',
              signer_document: s.signer_document ?? '',
              signer_email: s.signer_email,
              signed_at: s.signed_at!,
              signature_image: s.signature_image ?? '',
            });
        return { role: s.role, signer_name: s.signer_name, signed_at: s.signed_at, valid };
      });
    return {
      contract_id: contract.id,
      document_hash: hash,
      valid: signatures.length > 0 && signatures.every((s) => s.valid),
      signatures,
    };
  }

  /** Público (por token): datos mínimos para mostrar la pantalla de firma. */
  @Get('sign/:token')
  async getSigningRequest(@Param('token') token: string) {
    const sig = await this.prisma.contractSignature.findUnique({
      where: { token },
      include: { contract: { include: { signatures: true } } },
    });
    if (!sig) throw new NotFoundException('Enlace de firma inválido o vencido');
    const c = sig.contract;
    const [property, leads] = await Promise.all([
      fetchJson(`${PROPERTY_SVC}/properties/${c.property_id}`),
      fetchJson(`${LEAD_SVC}/leads`),
    ]);
    const lead = Array.isArray(leads) ? leads.find((l: any) => l.id === c.lead_id) : null;
    const esVenta = (c.operation_type || c.type).toLowerCase() !== 'alquiler';
    return {
      contract_number: `RH-${c.created_at.getFullYear()}-${c.id.slice(0, 8).toUpperCase()}`,
      operation_type: esVenta ? 'Venta' : 'Alquiler',
      price: c.price,
      property_title: property?.title ?? null,
      property_address: property?.address ?? null,
      city: c.city ?? property?.city ?? null,
      role: sig.role,
      party_label: sig.party_label,
      suggested_name: sig.role === 'PARTE_B' ? (lead?.name ?? '') : '',
      suggested_email: sig.role === 'PARTE_B' ? (lead?.email ?? '') : '',
      signed: !!sig.signed_at,
      signed_at: sig.signed_at,
      signer_name: sig.signer_name,
      contract_status: c.status,
      parties: [...c.signatures]
        .sort((a, b) => a.role.localeCompare(b.role))
        .map((p) => ({ party_label: p.party_label, signed: !!p.signed_at, signed_at: p.signed_at })),
    };
  }

  /** Público (por token): registra la firma de una parte. Con todas las firmas, el contrato pasa a Firmado. */
  @Post('sign/:token')
  async sign(
    @Param('token') token: string,
    @Body() body: any,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const sig = await this.prisma.contractSignature.findUnique({
      where: { token },
      include: { contract: true },
    });
    if (!sig) throw new NotFoundException('Enlace de firma inválido o vencido');
    if (sig.signed_at) throw new ConflictException('Esta parte ya firmó el contrato');
    if (sig.contract.status === 'Firmado') throw new ConflictException('El contrato ya está firmado');

    const name = String(body?.signer_name ?? '').trim();
    const document = String(body?.signer_document ?? '').trim();
    const email = String(body?.signer_email ?? '').trim() || null;
    if (name.length < 3) throw new BadRequestException('Indica tu nombre completo');
    if (document.length < 5) throw new BadRequestException('Indica un número de documento válido');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Correo electrónico inválido');
    if (body?.accept !== true) throw new BadRequestException('Debes aceptar los términos y firmar electrónicamente');
    if (!decodeSignatureImage(body?.signature_image)) {
      throw new BadRequestException('La firma manuscrita es obligatoria (PNG de hasta 300 KB)');
    }

    const signedAt = new Date();
    const documentHash = contractHash(sig.contract);
    const seal = signatureSeal({
      document_hash: documentHash,
      role: sig.role,
      signer_name: name,
      signer_document: document,
      signer_email: email,
      signed_at: signedAt,
      signature_image: body.signature_image,
    });

    // updateMany con signed_at:null evita que dos peticiones simultáneas firmen la misma parte dos veces
    const { count } = await this.prisma.contractSignature.updateMany({
      where: { id: sig.id, signed_at: null },
      data: {
        signer_name: name,
        signer_document: document,
        signer_email: email,
        signature_image: body.signature_image,
        document_hash: documentHash,
        signature_hash: seal,
        ip_address: forwardedFor?.split(',')[0]?.trim() || null,
        user_agent: userAgent?.slice(0, 300) || null,
        signed_at: signedAt,
      },
    });
    if (count === 0) throw new ConflictException('Esta parte ya firmó el contrato');

    const all = await this.prisma.contractSignature.findMany({ where: { contract_id: sig.contract_id } });
    const complete = SIGNATURE_ROLES.every((r) => all.some((s) => s.role === r && s.signed_at));

    await this.emitNotification('contract.signature_added', {
      ...sig.contract,
      signer_name: name,
      party_label: sig.party_label,
      fully_signed: complete,
    });

    let contract = sig.contract;
    if (complete) {
      contract = await this.prisma.contract.update({
        where: { id: sig.contract_id },
        data: { status: 'Firmado', signed_at: signedAt },
      });
      await this.emitSigned(contract);
    }

    return { ok: true, fully_signed: complete, contract_status: contract.status, seal: seal.slice(0, 16).toUpperCase() };
  }

  private async ensureSignatures(contract: { id: string; type: string; operation_type: string }) {
    const esVenta = (contract.operation_type || contract.type).toLowerCase() !== 'alquiler';
    const existing = await this.prisma.contractSignature.findMany({ where: { contract_id: contract.id } });
    for (const role of SIGNATURE_ROLES) {
      if (existing.some((s) => s.role === role)) continue;
      try {
        await this.prisma.contractSignature.create({
          data: { contract_id: contract.id, role, party_label: partyLabel(role, esVenta), token: newSignToken() },
        });
      } catch {
        // Carrera con otra petición: la fila ya existe y se relee abajo
      }
    }
    const rows = await this.prisma.contractSignature.findMany({ where: { contract_id: contract.id } });
    return rows.sort((a, b) => a.role.localeCompare(b.role));
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const contract = await this.prisma.contract.findUnique({ where: { id }, include: { signatures: true } });
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
      signatures: contract.signatures.filter((x) => x.signed_at),
      documentHash: contractHash(contract),
      verifyUrl: `${FRONTEND_URL}/verify/${contract.id}`,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${contract.id.slice(0, 8)}.pdf"`,
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
  }

  private async emitNotification(pattern: string, payload: unknown) {
    try {
      await lastValueFrom(this.notificationsClient.emit(pattern, payload));
    } catch (error) {
      console.error(`❌ No se pudo emitir "${pattern}" a notificaciones:`, error);
    }
  }

  // Una firma anulada (Firmado → Pendiente) cancela la comisión pendiente y avisa a las partes
  private async emitReverted(contract: unknown) {
    try {
      await Promise.all([
        lastValueFrom(this.salesClient.emit('contract.reverted', contract)),
        lastValueFrom(this.notificationsClient.emit('contract.reverted', contract)),
      ]);
    } catch (error) {
      console.error('❌ Error al emitir "contract.reverted":', error);
    }
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
