"use client";

/* ─────────────────────────────────────────────────────────────
   CommissionsClient — Client Component
   Módulo de Gestión de Comisiones · Strict Airbnb Design System
   Fondo general #f7f7f7 · Tarjetas blancas #ffffff rounded-[12px]
   Sin sombras (shadow-none) · Borde #ebebeb
   Monto en negrita (16px font-semibold #222222)
   Pill de estado: Pendiente = amarillo, Pagada = verde
   KPI en la parte superior con total por pagar
   Generación automática vía RabbitMQ (sin botón de nueva comisión)
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import type { Commission, UserSnippet } from "./page";

// ─── Helpers ────────────────────────────────────────────────

function fmtPrice(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusPill(status: string): { bg: string; text: string; dot: string; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "pagada" || s === "paid" || s === "liquidada") {
    return {
      bg: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
      label: "Pagada",
    };
  }
  // Por defecto "Pendiente" (amarillo)
  return {
    bg: "bg-amber-50 text-amber-800 border border-amber-200/60",
    text: "text-amber-800",
    dot: "bg-amber-500",
    label: "Pendiente",
  };
}

// ─── SVG Icons ──────────────────────────────────────────────

function IconCoins() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] shrink-0">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#222222]">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Componente Principal ───────────────────────────────────

export default function CommissionsClient({
  commissions,
  users = [],
}: {
  commissions: Commission[];
  users?: UserSnippet[];
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pendiente" | "Pagada">("all");

  /* Map de agentes para mostrar el nombre real */
  const userMap = new Map(users.map((u) => [u.id, u]));

  /* Filtrado */
  const filtered = commissions.filter((c) => {
    const user = userMap.get(c.agent_id);
    const term = search.toLowerCase().trim();

    const matchesSearch =
      !term ||
      c.id.toLowerCase().includes(term) ||
      c.contract_id.toLowerCase().includes(term) ||
      c.agent_id.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      (user?.name && user.name.toLowerCase().includes(term)) ||
      (user?.email && user.email.toLowerCase().includes(term));

    const matchesStatus =
      filterStatus === "all" ||
      c.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  /* KPIs */
  const totalCount = commissions.length;
  const pendingCommissions = commissions.filter(
    (c) => c.status.toLowerCase() !== "pagada"
  );
  const paidCommissions = commissions.filter(
    (c) => c.status.toLowerCase() === "pagada"
  );

  // Total de comisiones por pagar (solicitado en el prompt)
  const totalPendingAmount = pendingCommissions.reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );

  const totalPaidAmount = paidCommissions.reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV (AIRBNB CLEAN HEADER con RBAC)
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="commissions" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main
        className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-16"
        style={{ paddingTop: "calc(80px + 36px)" }}
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Liquidación Comercial
              </span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.5px] text-[#222222]">
              Gestión de Comisiones
            </h1>
            <p className="text-[14px] text-[#6a6a6a] mt-1">
              Control de comisiones y pagos pendientes generados automáticamente tras el cierre de contratos.
            </p>
          </div>

          {/* Badge informativo de RabbitMQ */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#ebebeb] text-[13px] text-[#6a6a6a] shadow-none self-start sm:self-auto">
            <IconBolt />
            <span>Automatización activa vía <strong>RabbitMQ</strong></span>
          </div>
        </div>

        {/* ── KPI Strip (Airbnb Style: White Cards, Rounded 12px, No Shadows) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* KPI Principal Solicitado: Total comisiones por pagar */}
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Total Comisiones por Pagar</p>
            <p className="text-[24px] font-semibold text-amber-600 tracking-tight">
              {fmtPrice(totalPendingAmount)}
            </p>
            <p className="text-[12px] text-[#6a6a6a] mt-1">
              {pendingCommissions.length} pagos pendientes
            </p>
          </div>

          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Total Comisiones Pagadas</p>
            <p className="text-[24px] font-semibold text-emerald-700 tracking-tight">
              {fmtPrice(totalPaidAmount)}
            </p>
            <p className="text-[12px] text-[#6a6a6a] mt-1">
              {paidCommissions.length} pagos liquidados
            </p>
          </div>

          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Comisiones Registradas</p>
            <p className="text-[24px] font-semibold text-[#222222]">
              {totalCount}
            </p>
            <p className="text-[12px] text-[#6a6a6a] mt-1">
              Calculadas al 5% por contrato
            </p>
          </div>

          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Agentes con Liquidación</p>
            <p className="text-[24px] font-semibold text-[#222222]">
              {new Set(commissions.map((c) => c.agent_id)).size}
            </p>
            <p className="text-[12px] text-[#6a6a6a] mt-1">
              Miembros de la red
            </p>
          </div>
        </div>

        {/* ── Filtros y Buscador ────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Barra de búsqueda */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por agente, ID de contrato o comisión..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#ebebeb] bg-white pl-11 pr-4 py-2.5 text-[14px] text-[#222222] placeholder:text-[#6a6a6a] outline-none transition-colors focus:border-[#222222]"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="inline-flex rounded-full border border-[#ebebeb] bg-white p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                filterStatus === "all"
                  ? "bg-[#222222] text-white"
                  : "text-[#6a6a6a] hover:text-[#222222]"
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("Pendiente")}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                filterStatus === "Pendiente"
                  ? "bg-amber-600 text-white"
                  : "text-[#6a6a6a] hover:text-[#222222]"
              }`}
            >
              Pendientes ({pendingCommissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("Pagada")}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                filterStatus === "Pagada"
                  ? "bg-emerald-700 text-white"
                  : "text-[#6a6a6a] hover:text-[#222222]"
              }`}
            >
              Pagadas ({paidCommissions.length})
            </button>
          </div>
        </div>

        {/* ── Tarjetas de Comisiones (Airbnb Design System) ────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] bg-white border border-[#ebebeb] py-16 px-8 text-center shadow-none">
            <div className="w-14 h-14 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[#6a6a6a] mb-4">
              <IconCoins />
            </div>
            <h3 className="text-[17px] font-semibold text-[#222222] mb-1">
              No hay comisiones para mostrar
            </h3>
            <p className="text-[14px] text-[#6a6a6a] max-w-md">
              {commissions.length === 0
                ? "Las comisiones se generan automáticamente al firmar contratos en el módulo de Contratos."
                : "No se encontraron comisiones que coincidan con los filtros aplicados."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((commission) => {
              const pill = statusPill(commission.status);
              const agent = userMap.get(commission.agent_id);

              return (
                <div
                  key={commission.id}
                  className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none hover:border-[#222222] transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Header de tarjeta: Monto destacado (16px font-semibold #222222) + Pill de estado */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div>
                        <p className="text-[12px] text-[#6a6a6a] mb-0.5">Monto de Comisión (5%)</p>
                        {/* Monto en negrita (16px) */}
                        <p className="text-[16px] font-semibold text-[#222222] tracking-tight">
                          {fmtPrice(commission.amount)}
                        </p>
                      </div>

                      {/* Pill de estado: Amarillo para Pendiente, Verde para Pagada */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${pill.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                        {pill.label}
                      </span>
                    </div>

                    {/* Detalles: Agente y Contrato */}
                    <div className="space-y-3 pt-3 border-t border-[#f7f7f7] mb-4">
                      {/* Nombre del Agente */}
                      <div className="flex items-start gap-2.5">
                        <IconUser />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#222222] truncate">
                            {agent?.name || "Agente Inmobiliario"}
                          </p>
                          <p className="text-[11px] text-[#6a6a6a] truncate">
                            ID: <code className="bg-[#f7f7f7] px-1 py-0.5 rounded">{commission.agent_id}</code>
                          </p>
                        </div>
                      </div>

                      {/* Contrato Asociado */}
                      <div className="flex items-start gap-2.5">
                        <IconFileText />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#222222] truncate">
                            Contrato Asociado
                          </p>
                          <p className="text-[11px] text-[#6a6a6a] truncate">
                            ID: <code className="bg-[#f7f7f7] px-1 py-0.5 rounded">{commission.contract_id}</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Fecha de Creación & ID de Comisión */}
                  <div className="pt-3 border-t border-[#ebebeb] flex items-center justify-between text-[11px] text-[#6a6a6a]">
                    <span>
                      Registrada: {fmtDate(commission.created_at)}
                    </span>
                    <span className="font-mono text-[10px] text-[#6a6a6a] bg-[#f7f7f7] px-1.5 py-0.5 rounded">
                      {commission.id.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
