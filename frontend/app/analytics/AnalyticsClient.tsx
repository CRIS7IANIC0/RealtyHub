'use client';

/* ─────────────────────────────────────────────────────────────
   AnalyticsClient — Client Component
   Panel de Analítica · Strict Airbnb Design System
   KPIs comerciales: ventas, tiempo medio de cierre por tipo de propiedad,
   conversión de leads por canal y rendimiento comparado agentes / oficinas.
   ───────────────────────────────────────────────────────────── */

import Navbar from '@/components/Navbar';
import type { AnalyticsData } from './page';

// ─── Helpers ────────────────────────────────────────────────

function fmtPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Duración legible a partir de horas: minutos, horas o días. */
function fmtDuration(hours: number): string {
  if (!hours) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} días`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short' });
}

const card = 'bg-white rounded-[12px] border border-[#e2dcd2] p-6 shadow-none';

function Bar({ value, max, color = '#c4584c' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-[#ece6dc] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value > 0 ? pct : 0}%`, background: color }} />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-[#6b655e] py-6 text-center">{children}</p>;
}

// ─── Main Component ─────────────────────────────────────────

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const totalRevenue = data?.total_revenue ?? 0;
  const totalSales = data?.total_sales ?? 0;
  const avgTicket = data?.avg_ticket ?? (totalSales > 0 ? totalRevenue / totalSales : 0);
  const avgClosing = data?.avg_closing_hours ?? 0;
  const conv = data?.lead_conversion ?? { total_leads: 0, converted: 0, rate: 0 };
  const byType = data?.avg_closing_by_property_type ?? [];
  const bySource = data?.conversion_by_source ?? [];
  const agents = data?.agents ?? [];
  const offices = data?.offices ?? [];
  const monthly = data?.monthly ?? [];
  const byOperation = data?.by_operation ?? [];

  const maxHours = Math.max(0, ...byType.map((t) => t.avg_hours));
  const maxMonth = Math.max(0, ...monthly.map((m) => m.revenue));
  const maxAgentRevenue = Math.max(0, ...agents.map((a) => a.revenue));
  const maxOfficeRevenue = Math.max(0, ...offices.map((o) => o.revenue));

  return (
    <div className="min-h-screen bg-[#f3efe8]">
      <Navbar activeTab="analytics" />

      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-16 pt-8 md:pt-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] text-[#6b655e]">Tiempo Real</span>
            </div>
            <h1 className="page-title text-[28px] font-semibold tracking-[-0.5px] text-[#1e1c1a]">Panel de Analítica</h1>
            <p className="text-[14px] text-[#6b655e] mt-0.5">
              KPIs comerciales: cierres, tiempo medio de cierre, conversión de leads y rendimiento por agente y oficina.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {data?.data_complete === false ? 'Datos parciales' : 'Datos en vivo'}
          </span>
        </div>

        {data?.data_complete === false && (
          <div className="mb-6 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Algún servicio no respondió, por eso parte de los indicadores puede aparecer incompleta. Recarga en unos segundos.
          </div>
        )}

        {/* ─── KPIs principales ───────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={card}>
            <span className="text-[13px] font-medium text-[#6b655e] uppercase tracking-wide">Volumen de Ventas</span>
            <p className="text-[30px] font-bold tracking-[-1px] text-[#1e1c1a] mt-3 mb-1 leading-none">{fmtPrice(totalRevenue)}</p>
            <p className="text-[12px] text-[#6b655e]">{totalSales > 0 ? `${totalSales} contratos firmados` : 'Sin cierres aún'}</p>
          </div>
          <div className={card}>
            <span className="text-[13px] font-medium text-[#6b655e] uppercase tracking-wide">Ticket Promedio</span>
            <p className="text-[30px] font-bold tracking-[-1px] text-[#1e1c1a] mt-3 mb-1 leading-none">{fmtPrice(avgTicket)}</p>
            <p className="text-[12px] text-[#6b655e]">Por contrato cerrado</p>
          </div>
          <div className={card}>
            <span className="text-[13px] font-medium text-[#6b655e] uppercase tracking-wide">Tiempo Medio de Cierre</span>
            <p className="text-[30px] font-bold tracking-[-1px] text-[#1e1c1a] mt-3 mb-1 leading-none">{fmtDuration(avgClosing)}</p>
            <p className="text-[12px] text-[#6b655e]">Del primer contacto a la firma</p>
          </div>
          <div className={card}>
            <span className="text-[13px] font-medium text-[#6b655e] uppercase tracking-wide">Conversión de Leads</span>
            <p className="text-[30px] font-bold tracking-[-1px] text-[#1e1c1a] mt-3 mb-1 leading-none">{conv.rate}%</p>
            <p className="text-[12px] text-[#6b655e]">
              {conv.converted} de {conv.total_leads} leads con contrato firmado
            </p>
          </div>
        </div>

        {/* ─── Tiempo de cierre por tipo + Conversión por canal ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section className={card}>
            <h2 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">Tiempo medio de cierre por tipo de propiedad</h2>
            <p className="text-[13px] text-[#6b655e] mb-5">Desde que el lead entra hasta que se firma el contrato.</p>
            {byType.length === 0 ? (
              <Empty>Aún no hay contratos firmados para medir.</Empty>
            ) : (
              <ul className="space-y-4">
                {byType.map((t) => (
                  <li key={t.property_type}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-[#1e1c1a]">{t.property_type}</span>
                      <span className="text-[#6b655e]">
                        <strong className="text-[#1e1c1a]">{fmtDuration(t.avg_hours)}</strong> · {t.deals} {t.deals === 1 ? 'cierre' : 'cierres'}
                      </span>
                    </div>
                    <Bar value={t.avg_hours} max={maxHours} color="#2563eb" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">Conversión de leads por canal de origen</h2>
            <p className="text-[13px] text-[#6b655e] mb-5">Porcentaje de leads de cada canal que terminó en contrato firmado.</p>
            {bySource.length === 0 ? (
              <Empty>Aún no hay leads registrados.</Empty>
            ) : (
              <ul className="space-y-4">
                {bySource.map((s) => (
                  <li key={s.source}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-[#1e1c1a]">{s.source}</span>
                      <span className="text-[#6b655e]">
                        <strong className="text-[#1e1c1a]">{s.rate}%</strong> · {s.converted}/{s.leads} leads
                      </span>
                    </div>
                    <Bar value={s.rate} max={100} color="#16a34a" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ─── Rendimiento comparado: agentes ───────── */}
        <section className={`${card} mb-8`}>
          <h2 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">Rendimiento comparado entre agentes</h2>
          <p className="text-[13px] text-[#6b655e] mb-5">Ordenados por volumen cerrado.</p>
          {agents.length === 0 ? (
            <Empty>Sin agentes con actividad todavía.</Empty>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[#6b655e] border-b border-[#e2dcd2]">
                    <th className="px-2 py-2 font-medium">Agente</th>
                    <th className="px-2 py-2 font-medium">Oficina</th>
                    <th className="px-2 py-2 font-medium text-right">Cierres</th>
                    <th className="px-2 py-2 font-medium w-[200px]">Volumen</th>
                    <th className="px-2 py-2 font-medium text-right">Ticket prom.</th>
                    <th className="px-2 py-2 font-medium text-right">T. de cierre</th>
                    <th className="px-2 py-2 font-medium text-right">Leads</th>
                    <th className="px-2 py-2 font-medium text-right">Conversión</th>
                    <th className="px-2 py-2 font-medium text-right">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a, i) => (
                    <tr key={a.agent_id} className="border-b border-[#ece6dc] last:border-0">
                      <td className="px-2 py-3 font-medium text-[#1e1c1a]">
                        {i === 0 && a.revenue > 0 && <span className="mr-1" title="Mayor volumen">🏆</span>}
                        {a.name}
                      </td>
                      <td className="px-2 py-3 text-[#6b655e]">{a.office_name ?? '—'}</td>
                      <td className="px-2 py-3 text-right">{a.deals}</td>
                      <td className="px-2 py-3">
                        <div className="text-[12px] text-[#1e1c1a] mb-1">{fmtPrice(a.revenue)}</div>
                        <Bar value={a.revenue} max={maxAgentRevenue} />
                      </td>
                      <td className="px-2 py-3 text-right">{a.deals ? fmtPrice(a.avg_ticket) : '—'}</td>
                      <td className="px-2 py-3 text-right">{a.deals ? fmtDuration(a.avg_hours) : '—'}</td>
                      <td className="px-2 py-3 text-right">{a.leads}</td>
                      <td className="px-2 py-3 text-right">{a.leads ? `${a.lead_conversion}%` : '—'}</td>
                      <td className="px-2 py-3 text-right">{fmtPrice(a.commission_earned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ─── Rendimiento comparado: oficinas ───────── */}
        <section className={`${card} mb-8`}>
          <h2 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">Rendimiento comparado entre oficinas</h2>
          <p className="text-[13px] text-[#6b655e] mb-5">Suma del desempeño de los agentes de cada oficina.</p>
          {offices.length === 0 ? (
            <Empty>Sin oficinas registradas.</Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {offices.map((o, i) => (
                <div key={o.office_id} className="rounded-[10px] border border-[#e2dcd2] p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#1e1c1a] truncate">
                        {i === 0 && o.revenue > 0 && <span className="mr-1">🏆</span>}
                        {o.name}
                      </p>
                      <p className="text-[12px] text-[#6b655e]">
                        {o.region ? `${o.region} · ` : ''}
                        {o.agents} {o.agents === 1 ? 'agente' : 'agentes'}
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold text-[#1e1c1a] shrink-0">{o.deals} cierres</span>
                  </div>
                  <p className="text-[18px] font-semibold text-[#1e1c1a] mb-1.5">{fmtPrice(o.revenue)}</p>
                  <Bar value={o.revenue} max={maxOfficeRevenue} color="#1e1c1a" />
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                    <div>
                      <dt className="text-[#6b655e]">Ticket prom.</dt>
                      <dd className="font-semibold text-[#1e1c1a]">{o.deals ? fmtPrice(o.avg_ticket) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#6b655e]">T. de cierre</dt>
                      <dd className="font-semibold text-[#1e1c1a]">{o.deals ? fmtDuration(o.avg_hours) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#6b655e]">Conversión</dt>
                      <dd className="font-semibold text-[#1e1c1a]">{o.leads ? `${o.lead_conversion}%` : '—'}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Evolución mensual + operación ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className={`${card} lg:col-span-2`}>
            <h2 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">Ventas de los últimos 6 meses</h2>
            <p className="text-[13px] text-[#6b655e] mb-5">Volumen firmado por mes.</p>
            {monthly.every((m) => m.revenue === 0) ? (
              <Empty>Sin cierres en este periodo.</Empty>
            ) : (
              <div className="flex items-end gap-3 h-[160px]">
                {monthly.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full" title={`${fmtPrice(m.revenue)} · ${m.deals} cierres`}>
                    <span className="text-[10px] text-[#6b655e] mb-1">{m.deals > 0 ? m.deals : ''}</span>
                    <div
                      className="w-full rounded-t-[6px] bg-[#c4584c]"
                      style={{ height: `${maxMonth > 0 ? Math.max(m.revenue > 0 ? 4 : 0, (m.revenue / maxMonth) * 120) : 0}px` }}
                    />
                    <span className="text-[11px] text-[#6b655e] mt-1.5 capitalize">{monthLabel(m.month)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={card}>
            <h2 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">Por tipo de operación</h2>
            <p className="text-[13px] text-[#6b655e] mb-5">Cierres y volumen.</p>
            <ul className="space-y-4">
              {byOperation.map((o) => (
                <li key={o.operation} className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-[#1e1c1a]">{o.operation}</p>
                    <p className="text-[12px] text-[#6b655e]">{o.deals} {o.deals === 1 ? 'contrato' : 'contratos'}</p>
                  </div>
                  <p className="text-[14px] font-semibold text-[#1e1c1a]">{fmtPrice(o.revenue)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
