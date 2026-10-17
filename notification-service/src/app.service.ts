import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as nodemailer from 'nodemailer';
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
const VIEWING_SVC = serviceUrl(process.env.VIEWING_SERVICE_URL, 'http://localhost:3005');

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export interface Recipient {
  type: 'USER' | 'CLIENT';
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface NotifyInput {
  recipients: Recipient[];
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  category: 'lead' | 'visit' | 'contract' | 'commission' | 'general';
  link?: string;
  /** Si se indica, la notificación se crea una sola vez por destinatario. */
  key?: string;
}

export const cop = (n: unknown) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const fechaHora = (d: string | Date) =>
  new Date(d).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

const REMINDER_EVERY_MS = 5 * 60 * 1000;

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly mailer = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    : null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Recordatorios de visitas: primer barrido a los 20 s y luego cada 5 min
    setTimeout(() => void this.sendVisitReminders(), 20_000).unref();
    this.timer = setInterval(() => void this.sendVisitReminders(), REMINDER_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ───────────────────────── Directorio ─────────────────────────

  async users(): Promise<any[]> {
    const users = await fetchJson(`${USER_SVC}/users`);
    return Array.isArray(users) ? users.filter((u) => u.active !== false) : [];
  }

  async leads(): Promise<any[]> {
    const leads = await fetchJson(`${LEAD_SVC}/leads`);
    return Array.isArray(leads) ? leads : [];
  }

  async property(id?: string): Promise<any | null> {
    return id ? fetchJson(`${PROPERTY_SVC}/properties/${id}`) : null;
  }

  userRecipient(u: any): Recipient {
    return { type: 'USER', id: u.id, name: u.name, email: u.email };
  }

  clientRecipient(l: any): Recipient {
    return { type: 'CLIENT', id: l.id, name: l.name, email: l.email };
  }

  managers(users: any[]): Recipient[] {
    return users.filter((u) => ['ADMIN', 'GERENTE'].includes(String(u.role).toUpperCase())).map((u) => this.userRecipient(u));
  }

  agents(users: any[]): Recipient[] {
    return users.filter((u) => String(u.role).toUpperCase() === 'AGENTE').map((u) => this.userRecipient(u));
  }

  // ───────────────────────── Envío ─────────────────────────

  /** Crea una notificación por destinatario (y correo si hay SMTP). Devuelve cuántas se crearon. */
  async notify(input: NotifyInput): Promise<number> {
    // Sin duplicados dentro de una misma llamada
    const seen = new Set<string>();
    const recipients = input.recipients.filter((r) => {
      const k = `${r.type}:${r.id}`;
      if (!r.id || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    let created = 0;
    for (const r of recipients) {
      // Correo sólo al cliente y a avisos operativos del personal (leads y visitas): evita saturar buzones
      const wantsEmail = r.email && (r.type === 'CLIENT' || input.category === 'lead' || input.category === 'visit');
      const emailStatus = wantsEmail ? await this.sendEmail(r.email!, input.title, input.message) : null;
      try {
        await this.prisma.notification.create({
          data: {
            title: input.title,
            message: input.message,
            type: input.type ?? 'info',
            category: input.category,
            recipient_type: r.type,
            recipient_id: r.id,
            recipient_name: r.name ?? null,
            recipient_email: r.email ?? null,
            email_status: emailStatus,
            link: input.link ?? null,
            event_key: input.key ? `${input.key}:${r.type}:${r.id}` : null,
          },
        });
        created++;
      } catch (error) {
        // P2002 = clave única repetida → el recordatorio ya existía
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
          console.error('❌ [NOTIFICATION] Error al guardar notificación:', error);
        }
      }
    }
    return created;
  }

  private async sendEmail(to: string, subject: string, text: string): Promise<'sent' | 'failed' | 'skipped'> {
    if (!this.mailer) return 'skipped';
    try {
      await this.mailer.sendMail({
        from: process.env.SMTP_FROM || 'RealtyHub <no-reply@realtyhub.com>',
        to,
        subject: `RealtyHub · ${subject}`,
        text,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px"><h2 style="color:#ff385c;margin:0 0 12px">RealtyHub</h2><h3>${subject}</h3><p style="color:#444;line-height:1.5">${text}</p></div>`,
      });
      return 'sent';
    } catch (error) {
      console.error(`❌ [NOTIFICATION] Falló el correo a ${to}:`, error);
      return 'failed';
    }
  }

  // ───────────────────────── Recordatorios de visitas ─────────────────────────

  async sendVisitReminders() {
    if (this.running) return;
    this.running = true;
    try {
      const viewings = await fetchJson(`${VIEWING_SVC}/viewings`);
      if (!Array.isArray(viewings)) return;

      const now = Date.now();
      const upcoming = viewings.filter((v) => {
        const at = new Date(v.scheduled_at).getTime();
        return at > now && at - now <= 24 * 3600_000 && !['Cancelada', 'Realizada'].includes(v.status);
      });
      if (upcoming.length === 0) return;

      const [users, leads] = await Promise.all([this.users(), this.leads()]);
      for (const v of upcoming) {
        const hoursLeft = (new Date(v.scheduled_at).getTime() - now) / 3600_000;
        const window = hoursLeft <= 1 ? '1h' : '24h';
        const property = await this.property(v.property_id);
        const lead = leads.find((l) => l.id === v.lead_id);
        const agent = users.find((u) => u.id === v.agent_id);
        const where = property?.title || property?.address || 'la propiedad';
        const when = fechaHora(v.scheduled_at);
        const lapse = window === '1h' ? 'en menos de 1 hora' : 'en las próximas 24 horas';

        if (agent) {
          await this.notify({
            recipients: [this.userRecipient(agent)],
            title: '⏰ Recordatorio de visita',
            message: `Tienes una visita ${lapse}: "${where}" el ${when}${lead?.name ? ` con ${lead.name}` : ''}${lead?.phone ? ` (${lead.phone})` : ''}.`,
            type: 'warning',
            category: 'visit',
            link: '/viewings',
            key: `visit.reminder${window}:${v.id}`,
          });
        } else {
          // Visita aún en el pool: se alerta a gerencia para que alguien la tome
          await this.notify({
            recipients: this.managers(users),
            title: '⚠️ Visita sin agente asignado',
            message: `La visita a "${where}" el ${when} sigue sin agente y es ${lapse}.`,
            type: 'warning',
            category: 'visit',
            link: '/viewings',
            key: `visit.reminder${window}:${v.id}`,
          });
        }

        if (lead) {
          await this.notify({
            recipients: [this.clientRecipient(lead)],
            title: '⏰ Recordatorio de tu visita',
            message: `Te esperamos ${lapse} en "${where}" (${when}).${agent?.name ? ` Tu asesor es ${agent.name}.` : ''}`,
            type: 'info',
            category: 'visit',
            key: `visit.reminder${window}:${v.id}`,
          });
        }
      }
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error en el barrido de recordatorios:', error);
    } finally {
      this.running = false;
    }
  }
}
