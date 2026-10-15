'use client';

/* ─────────────────────────────────────────────────────────────
   AnalyticsClient — Client Component
   Módulo de Analíticas · Strict Airbnb Design System
   Fondo general #f3efe8 · Cero sombras · Tarjetas blancas rounded-[12px]
   Métricas grandes: Volumen Total de Ventas y Contratos Cerrados
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link';
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

function IconBell() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1e1c1a"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const totalRevenue = data?.total_revenue ?? 0;
  const totalSales = data?.total_sales ?? 0;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="min-h-screen bg-[#f3efe8]">
      {/* ══════════════════════════════════════════════
          TOP NAV — Airbnb Design System con RBAC
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="analytics" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY — Strict Airbnb Design System
          ══════════════════════════════════════════════ */}
      <main
        className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-16 pt-8 md:pt-12"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              
              <span className="text-[12px] text-[#6b655e]">Tiempo Real</span>
            </div>
            <h1 className="page-title text-[28px] font-semibold tracking-[-0.5px] text-[#1e1c1a]">
              Dashboard de Analíticas
            </h1>
            <p className="text-[14px] text-[#6b655e] mt-0.5">
              Métricas consolidadas a partir de eventos transaccionales emitidos por contratos cerrados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Datos al día
            </span>
          </div>
        </div>

        {/* ─── Hero KPI Cards (Grandes Tarjetas Airbnb) ───────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta 1: Volumen Total de Ventas */}
          <div className="bg-white rounded-[12px] border border-[#e2dcd2] p-7 shadow-none hover:border-[#a39d94] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium text-[#6b655e]">
                Volumen Total de Ventas
              </span>
              <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <p className="text-[34px] font-bold tracking-[-1px] text-[#1e1c1a] mb-2 leading-none">
              {fmtPrice(totalRevenue)}
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Suma consolidada
              </span>
              <span className="text-[12px] text-[#6b655e]">
                {totalSales > 0 ? `${totalSales} ventas registradas` : 'Sin ventas aún'}
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Cantidad de Contratos Cerrados */}
          <div className="bg-white rounded-[12px] border border-[#e2dcd2] p-7 shadow-none hover:border-[#a39d94] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium text-[#6b655e]">
                Cantidad de Contratos Cerrados
              </span>
              <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>
            <p className="text-[34px] font-bold tracking-[-1px] text-[#1e1c1a] mb-2 leading-none">
              {totalSales}
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-[12px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {totalSales === 1 ? '1 contrato firmado' : `${totalSales} contratos firmados`}
              </span>
              <span className="text-[12px] text-[#6b655e]">Eventos procesados</span>
            </div>
          </div>

          {/* Tarjeta 3: Ticket Promedio por Venta */}
          <div className="bg-white rounded-[12px] border border-[#e2dcd2] p-7 shadow-none hover:border-[#a39d94] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium text-[#6b655e]">
                Ticket Promedio
              </span>
              <div className="w-10 h-10 rounded-full bg-[#faf5ff] flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
            </div>
            <p className="text-[34px] font-bold tracking-[-1px] text-[#1e1c1a] mb-2 leading-none">
              {fmtPrice(avgTicket)}
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-[12px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Por transacción
              </span>
              <span className="text-[12px] text-[#6b655e]">Promedio ponderado</span>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-[#6b655e] max-w-[60ch]">
          Cada contrato que pasa a estado Firmado suma su valor a estas métricas de forma automática.
        </p>
      </main>
    </div>
  );
}
