"use client";

/* ─────────────────────────────────────────────────────────────
   CommissionsClient — Client Component
   Módulo de Gestión de Comisiones · Strict Airbnb Design System
   Fondo general #f3efe8 · Tarjetas blancas #ffffff rounded-[12px]
   Sin sombras (shadow-none) · Borde #e2dcd2
   Monto en negrita (16px font-semibold #1e1c1a)
   Pill de estado: Pendiente = amarillo, Pagada = verde
   KPI en la parte superior con total por pagar
   Generación automática vía RabbitMQ (sin botón de nueva comisión)
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { GATEWAY } from "@/lib/config";
import type { Agreement, Commission, OfficeSnippet, UserSnippet } from "./page";

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
  if (s === "anulada") {
    return {
      bg: "bg-[#f3efe8] text-[#6b655e] border border-[#e2dcd2]",
      text: "text-[#6b655e]",
      dot: "bg-[#a39d94]",
      label: "Anulada",
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e]">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e]">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e] shrink-0">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e] shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#1e1c1a]">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Componente Principal ───────────────────────────────────

interface Me {
  id?: string;
  role?: string;
  token?: string;
}

const field =
  "w-full rounded-[8px] border border-[#cfc7ba] bg-white px-3 py-2 text-[14px] text-[#1e1c1a] outline-none focus:border-[#1e1c1a]";

export default function CommissionsClient({
  commissions,
  users = [],
  agreements = [],
  offices = [],
}: {
  commissions: Commission[];
  users?: UserSnippet[];
  agreements?: Agreement[];
  offices?: OfficeSnippet[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pendiente" | "Pagada" | "Anulada">("all");
  const [me, setMe] = useState<Me | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Agreement | null>(null);

  useEffect(() => {
    function loadUser() {
      try {
        setMe(JSON.parse(localStorage.getItem("user") ?? "null"));
      } catch {
        setMe(null);
      }
    }
    loadUser();
    window.addEventListener("realtyhub_auth_changed", loadUser);
    return () => window.removeEventListener("realtyhub_auth_changed", loadUser);
  }, []);

  const role = me?.role?.toUpperCase();
  const canManage = role === "ADMIN" || role === "GERENTE";
  const isAgent = role === "AGENTE";

  /* Un agente sólo ve sus propias comisiones; gerencia y administración ven todas */
  const visible = isAgent && me?.id ? commissions.filter((c) => c.agent_id === me.id) : commissions;

  const userMap = new Map(users.map((u) => [u.id, u]));
  const officeMap = new Map(offices.map((o) => [o.id, o]));
  const activeAgreements = agreements.filter((a) => a.active);

  const filtered = visible.filter((c) => {
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
    const matchesStatus = filterStatus === "all" || c.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  /* KPIs (las anuladas no cuentan) */
  const live = visible.filter((c) => c.status.toLowerCase() !== "anulada");
  const pendingCommissions = live.filter((c) => c.status.toLowerCase() !== "pagada");
  const paidCommissions = live.filter((c) => c.status.toLowerCase() === "pagada");
  const cancelledCount = visible.length - live.length;
  const sum = (list: Commission[], pick: (c: Commission) => number | undefined) =>
    list.reduce((acc, c) => acc + (pick(c) || 0), 0);
  const totalPendingAmount = sum(pendingCommissions, (c) => c.amount);
  const totalPaidAmount = sum(paidCommissions, (c) => c.amount);

  /* Reparto acumulado */
  const agentTotal = sum(live, (c) => c.agent_amount);
  const officeTotal = sum(live, (c) => c.office_amount);
  const centralTotal = sum(live, (c) => c.central_amount);

  /* Total por oficina */
  const byOffice = new Map<string, number>();
  for (const c of live) {
    if (c.office_id && c.office_amount) byOffice.set(c.office_id, (byOffice.get(c.office_id) ?? 0) + c.office_amount);
  }

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${me?.token ?? ""}` };

  async function pay(c: Commission) {
    setBusyId(c.id);
    setError(null);
    try {
      const res = await fetch(`${GATEWAY}/commissions/${c.id}/pay`, { method: "PATCH", headers: authHeaders });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `No se pudo registrar el pago (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveAgreement(a: Agreement) {
    setBusyId(a.id);
    setError(null);
    try {
      const res = await fetch(`${GATEWAY}/commissions/agreements`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          operation_type: a.operation_type,
          rate_percent: a.rate_percent,
          agent_pct: a.agent_pct,
          office_pct: a.office_pct,
          central_pct: a.central_pct,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || `No se pudo guardar el acuerdo (${res.status})`);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el acuerdo.");
    } finally {
      setBusyId(null);
    }
  }

  const filterBtn = (value: typeof filterStatus, label: string, activeClass: string) => (
    <button
      type="button"
      onClick={() => setFilterStatus(value)}
      className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
        filterStatus === value ? activeClass : "text-[#6b655e] hover:text-[#1e1c1a]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f3efe8]">
      <Navbar activeTab="commissions" />

      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-16 pt-8 md:pt-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title text-[28px] md:text-[32px] font-semibold tracking-[-0.5px] text-[#1e1c1a]">Gestión de Comisiones</h1>
            <p className="text-[14px] text-[#6b655e] mt-1">
              {isAgent
                ? "Tus comisiones por cierres firmados."
                : "Cada contrato firmado reparte su comisión entre agente, oficina y central según el acuerdo comercial vigente."}
            </p>
          </div>
        </div>

        {/* ── Acuerdos comerciales vigentes ── */}
        {activeAgreements.length > 0 && (
          <div className="rounded-[12px] bg-white border border-[#e2dcd2] p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-[#1e1c1a]">Acuerdo comercial vigente</h2>
              <span className="text-[12px] text-[#6b655e]">Se aplica a los contratos que se firmen desde hoy</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAgreements.map((a) => (
                <div key={a.id} className="rounded-[10px] border border-[#e2dcd2] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-[#1e1c1a]">{a.operation_type}</span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setEditing({ ...a })}
                        className="text-[12px] font-medium text-[#1e1c1a] underline-offset-2 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] text-[#6b655e] mb-2">
                    Comisión total: <strong className="text-[#1e1c1a]">{a.rate_percent}%</strong>{" "}
                    {a.operation_type === "Alquiler" ? "del canon mensual" : "del precio de venta"}
                  </p>
                  <SplitBar agent={a.agent_pct} office={a.office_pct} central={a.central_pct} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none col-span-2 lg:col-span-1">
            <p className="text-[13px] text-[#6b655e] mb-1">Total por Pagar</p>
            <p className="text-[22px] font-semibold text-amber-600 tracking-tight">{fmtPrice(totalPendingAmount)}</p>
            <p className="text-[12px] text-[#6b655e] mt-1">{pendingCommissions.length} pagos pendientes</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Total Pagado</p>
            <p className="text-[22px] font-semibold text-emerald-700 tracking-tight">{fmtPrice(totalPaidAmount)}</p>
            <p className="text-[12px] text-[#6b655e] mt-1">{paidCommissions.length} liquidadas</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Parte de Agentes</p>
            <p className="text-[22px] font-semibold text-[#1e1c1a] tracking-tight">{fmtPrice(agentTotal)}</p>
            <p className="text-[12px] text-[#6b655e] mt-1">{new Set(live.map((c) => c.agent_id)).size} agentes</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Parte de Oficinas</p>
            <p className="text-[22px] font-semibold text-[#1e1c1a] tracking-tight">{fmtPrice(officeTotal)}</p>
            <p className="text-[12px] text-[#6b655e] mt-1">{byOffice.size} oficinas</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Parte de la Central</p>
            <p className="text-[22px] font-semibold text-[#1e1c1a] tracking-tight">{fmtPrice(centralTotal)}</p>
            <p className="text-[12px] text-[#6b655e] mt-1">{live.length} cierres</p>
          </div>
        </div>

        {byOffice.size > 0 && !isAgent && (
          <div className="rounded-[12px] bg-white border border-[#e2dcd2] p-5 mb-8">
            <h2 className="text-[16px] font-semibold text-[#1e1c1a] mb-3">Comisión acumulada por oficina</h2>
            <ul className="divide-y divide-[#ece6dc]">
              {[...byOffice.entries()].map(([id, amount]) => (
                <li key={id} className="flex items-center justify-between py-2 text-[14px]">
                  <span className="text-[#1e1c1a]">{officeMap.get(id)?.name ?? id}</span>
                  <span className="font-semibold text-[#1e1c1a]">{fmtPrice(amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Filtros y Buscador ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por agente, ID de contrato o comisión..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#e2dcd2] bg-white pl-11 pr-4 py-2.5 text-[14px] text-[#1e1c1a] placeholder:text-[#6b655e] outline-none transition-colors focus:border-[#1e1c1a]"
            />
          </div>

          <div className="inline-flex rounded-full border border-[#e2dcd2] bg-white p-1 self-start md:self-auto">
            {filterBtn("all", `Todas (${visible.length})`, "bg-[#1e1c1a] text-white")}
            {filterBtn("Pendiente", `Pendientes (${pendingCommissions.length})`, "bg-amber-600 text-white")}
            {filterBtn("Pagada", `Pagadas (${paidCommissions.length})`, "bg-emerald-700 text-white")}
            {cancelledCount > 0 && filterBtn("Anulada", `Anuladas (${cancelledCount})`, "bg-[#6b655e] text-white")}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-[8px] border border-[#e2dcd2] bg-white px-4 py-3 text-[13px] text-[#a64739]">{error}</div>
        )}

        {/* ── Tarjetas de Comisiones ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] bg-white border border-[#e2dcd2] py-16 px-8 text-center shadow-none">
            <div className="w-14 h-14 rounded-full bg-[#f3efe8] flex items-center justify-center text-[#6b655e] mb-4">
              <IconCoins />
            </div>
            <h3 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">No hay comisiones para mostrar</h3>
            <p className="text-[14px] text-[#6b655e] max-w-md">
              {visible.length === 0
                ? "Las comisiones se generan automáticamente cuando las partes firman un contrato."
                : "No se encontraron comisiones que coincidan con los filtros aplicados."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((commission) => {
              const pill = statusPill(commission.status);
              const agent = userMap.get(commission.agent_id);
              const office = commission.office_id ? officeMap.get(commission.office_id) : null;
              const isPending = commission.status.toLowerCase() === "pendiente";
              const hasSplit = commission.agent_amount != null && (commission.rate_percent ?? 0) > 0;

              return (
                <div
                  key={commission.id}
                  className={`rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none hover:border-[#1e1c1a] transition-colors flex flex-col justify-between ${
                    pill.label === "Anulada" ? "opacity-70" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div>
                        <p className="text-[12px] text-[#6b655e] mb-0.5">
                          Comisión total{hasSplit ? ` (${commission.rate_percent}% · ${commission.operation_type})` : ""}
                        </p>
                        <p className="text-[16px] font-semibold text-[#1e1c1a] tracking-tight">{fmtPrice(commission.amount)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${pill.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                        {pill.label}
                      </span>
                    </div>

                    {hasSplit && (
                      <div className="mb-4">
                        <SplitBar agent={commission.agent_pct ?? 0} office={commission.office_pct ?? 0} central={commission.central_pct ?? 0} />
                        <dl className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                          <div>
                            <dt className="text-[#6b655e]">Agente</dt>
                            <dd className="font-semibold text-[#1e1c1a]">{fmtPrice(commission.agent_amount ?? 0)}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b655e]">Oficina</dt>
                            <dd className="font-semibold text-[#1e1c1a]">{fmtPrice(commission.office_amount ?? 0)}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b655e]">Central</dt>
                            <dd className="font-semibold text-[#1e1c1a]">{fmtPrice(commission.central_amount ?? 0)}</dd>
                          </div>
                        </dl>
                      </div>
                    )}

                    <div className="space-y-3 pt-3 border-t border-[#f3efe8] mb-4">
                      <div className="flex items-start gap-2.5">
                        <IconUser />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#1e1c1a] truncate">{agent?.name || "Agente Inmobiliario"}</p>
                          <p className="text-[11px] text-[#6b655e] truncate">{office ? `Oficina ${office.name}` : "Sin oficina asignada"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <IconFileText />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#1e1c1a] truncate">Contrato Asociado</p>
                          <p className="text-[11px] text-[#6b655e] truncate">
                            ID: <code className="bg-[#f3efe8] px-1 py-0.5 rounded">{commission.contract_id}</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {canManage && isPending && (
                    <button
                      type="button"
                      onClick={() => pay(commission)}
                      disabled={busyId === commission.id}
                      className="mb-3 w-full rounded-full bg-[#1e1c1a] hover:bg-black text-white text-[13px] font-medium py-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {busyId === commission.id ? "Registrando…" : "Marcar como pagada"}
                    </button>
                  )}

                  <div className="pt-3 border-t border-[#e2dcd2] flex items-center justify-between text-[11px] text-[#6b655e]">
                    <span>
                      {commission.paid_at ? `Pagada: ${fmtDate(commission.paid_at)}` : `Registrada: ${fmtDate(commission.created_at)}`}
                    </span>
                    <span className="font-mono text-[10px] text-[#6b655e] bg-[#f3efe8] px-1.5 py-0.5 rounded">{commission.id.slice(0, 8)}…</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Editor del acuerdo comercial ── */}
      {editing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.56)" }}
          onClick={() => busyId === null && setEditing(null)}
        >
          <div className="w-full max-w-[440px] rounded-[16px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-semibold text-[#1e1c1a] mb-1">Acuerdo comercial · {editing.operation_type}</h2>
            <p className="text-[13px] text-[#6b655e] mb-4">
              El nuevo acuerdo aplica a los contratos firmados desde ahora. Las comisiones ya generadas conservan su regla.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="block text-[12px] font-medium text-[#6b655e] mb-1">
                  % de comisión {editing.operation_type === "Alquiler" ? "sobre el canon mensual (100 = un canon)" : "sobre el precio de venta"}
                </span>
                <input
                  className={field}
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={editing.rate_percent}
                  onChange={(e) => setEditing({ ...editing, rate_percent: Number(e.target.value) })}
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["agent_pct", "% Agente"],
                    ["office_pct", "% Oficina"],
                    ["central_pct", "% Central"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="block text-[12px] font-medium text-[#6b655e] mb-1">{label}</span>
                    <input
                      className={field}
                      type="number"
                      min={0}
                      max={100}
                      value={editing[key]}
                      onChange={(e) => setEditing({ ...editing, [key]: Number(e.target.value) })}
                    />
                  </label>
                ))}
              </div>
              {(() => {
                const total = editing.agent_pct + editing.office_pct + editing.central_pct;
                return (
                  <p className={`text-[12px] ${Math.abs(total - 100) < 0.001 ? "text-emerald-700" : "text-[#a64739]"}`}>
                    Reparto: {total}% {Math.abs(total - 100) < 0.001 ? "✔" : "(debe sumar 100%)"}
                  </p>
                );
              })()}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busyId !== null}
                className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[#1e1c1a] hover:bg-[#f3efe8] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveAgreement(editing)}
                disabled={busyId !== null || Math.abs(editing.agent_pct + editing.office_pct + editing.central_pct - 100) > 0.001}
                className="px-5 py-2.5 rounded-full bg-[#c4584c] hover:bg-[#a64739] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyId !== null ? "Guardando…" : "Guardar acuerdo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Barra de reparto agente / oficina / central ─────────────

function SplitBar({ agent, office, central }: { agent: number; office: number; central: number }) {
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#ece6dc]">
        <span style={{ width: `${agent}%` }} className="bg-[#c4584c]" />
        <span style={{ width: `${office}%` }} className="bg-[#1e1c1a]" />
        <span style={{ width: `${central}%` }} className="bg-[#a39d94]" />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6b655e]">
        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#c4584c]" />Agente {agent}%</span>
        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#1e1c1a]" />Oficina {office}%</span>
        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#a39d94]" />Central {central}%</span>
      </div>
    </div>
  );
}
