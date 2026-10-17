"use client";

/* ─────────────────────────────────────────────────────────────
   ContractsClient — Client Component
   Módulo de Gestión de Contratos · Strict Airbnb Design System
   Canvas fondo #f3efe8 · Cero sombras · Precio en 16px font-semibold (#1e1c1a)
   Pills para el estado · Botón principal en Rausch (#c4584c) rounded-full
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GATEWAY } from "@/lib/config";
import CreateContractModal from "@/components/contracts/CreateContractModal";
import SignaturesModal from "@/components/contracts/SignaturesModal";
import Navbar from "@/components/Navbar";
import { authHeaders, getSession, isManager, type SessionUser } from "@/lib/auth";
import type { Contract, PropertySnippet, LeadSnippet, UserSnippet, ViewingSnippet } from "./page";

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
  if (s === "firmado") {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Firmado",
    };
  }
  // "Borrador" es el nombre heredado del estado Pendiente
  return {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Pendiente",
  };
}

// ─── SVG Icons ──────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e]">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e] shrink-0">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
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

function IconUserCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b655e] shrink-0">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

export default function ContractsClient({
  contracts: allContracts,
  properties = [],
  leads = [],
  users = [],
  viewings = [],
}: {
  contracts: Contract[];
  properties?: PropertySnippet[];
  leads?: LeadSnippet[];
  users?: UserSnippet[];
  viewings?: ViewingSnippet[];
}) {
  const router = useRouter();
  const [me, setMe] = useState<SessionUser | null>(null);
  useEffect(() => {
    function loadUser() {
      setMe(getSession());
    }
    loadUser();
    window.addEventListener("realtyhub_auth_changed", loadUser);
    return () => window.removeEventListener("realtyhub_auth_changed", loadUser);
  }, []);

  // Un agente sólo trabaja con las visitas que tomó: ve los contratos de esos clientes/inmuebles
  const isAgent = !!me && !isManager(me.role);
  const taken = viewings.filter((v) => !!me?.id && v.agent_id === me.id);
  const contracts = isAgent
    ? allContracts.filter(
        (c) => c.agent_id === me?.id || taken.some((v) => v.lead_id === c.lead_id && v.property_id === c.property_id),
      )
    : allContracts;
  const takenLeadIds = new Set(taken.map((v) => v.lead_id));
  const takenPropertyIds = new Set(taken.map((v) => v.property_id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Firmado" | "Pendiente">("all");

  // Firmado → Pendiente pide confirmación con un diálogo propio
  // (window.confirm se bloquea en algunos navegadores y dejaba el botón sin efecto).
  const [confirmRevert, setConfirmRevert] = useState<Contract | null>(null);
  // Contrato cuyo modal de firma digital está abierto
  const [signingId, setSigningId] = useState<string | null>(null);

  // Pendiente → firma digital de las partes · Firmado → volver a Pendiente (anula las firmas)
  function toggleStatus(contract: Contract) {
    if (contract.status.toLowerCase() === "firmado") {
      setConfirmRevert(contract);
      return;
    }
    setSigningId(contract.id);
  }

  async function changeStatus(contract: Contract, next: "Firmado" | "Pendiente") {
    setBusyId(contract.id);
    setActionError(null);
    try {
      const res = await fetch(`${GATEWAY}/contracts/${contract.id}/status`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Error del servidor (${res.status})`);
      }
      setConfirmRevert(null);
      router.refresh();
    } catch (err) {
      setConfirmRevert(null);
      setActionError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setBusyId(null);
    }
  }

  async function downloadPdf(contract: Contract) {
    setBusyId(contract.id);
    setActionError(null);
    try {
      const res = await fetch(`${GATEWAY}/contracts/${contract.id}/pdf`);
      if (!res.ok) throw new Error(`No se pudo generar el PDF (${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrato-${contract.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo descargar el PDF.");
    } finally {
      setBusyId(null);
    }
  }
  const [filterType, setFilterType] = useState<"all" | "Venta" | "Alquiler">("all");

  /* Property & Lead & User Maps for friendly names */
  const propMap = new Map(properties.map((p) => [p.id, p]));
  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  /* Filtering */
  const filteredContracts = contracts.filter((c) => {
    const propInfo = propMap.get(c.property_id);
    const leadInfo = leadMap.get(c.lead_id);
    const userInfo = userMap.get(c.agent_id);

    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.id.toLowerCase().includes(term) ||
      c.property_id.toLowerCase().includes(term) ||
      c.lead_id.toLowerCase().includes(term) ||
      c.agent_id.toLowerCase().includes(term) ||
      (c.operation_type || c.type || "").toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      (propInfo?.title && propInfo.title.toLowerCase().includes(term)) ||
      (propInfo?.address && propInfo.address.toLowerCase().includes(term)) ||
      (leadInfo?.name && leadInfo.name.toLowerCase().includes(term)) ||
      (userInfo?.name && userInfo.name.toLowerCase().includes(term));

    const isSignedC = c.status.toLowerCase() === "firmado";
    const matchesStatus =
      filterStatus === "all" || (filterStatus === "Firmado" ? isSignedC : !isSignedC);

    const matchesType =
      filterType === "all" ||
      (c.operation_type || c.type || "").toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  /* KPIs */
  const totalCount = contracts.length;
  const signedCount = contracts.filter((c) => c.status.toLowerCase() === "firmado").length;
  const draftCount = contracts.filter((c) => c.status.toLowerCase() !== "firmado").length;
  const totalVolume = contracts
    .filter((c) => c.status.toLowerCase() === "firmado")
    .reduce((sum, c) => sum + (c.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#f3efe8]">
      {/* ══════════════════════════════════════════════
          TOP NAV (AIRBNB CLEAN HEADER con RBAC)
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="contracts" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main
        className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-16 pt-8 md:pt-12"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title text-[28px] md:text-[32px] font-semibold tracking-[-0.5px] text-[#1e1c1a]">
              Gestión de Contratos
            </h1>
            <p className="text-[14px] text-[#6b655e] mt-1">
              Registro y administración de cierres de ventas y alquileres con generación automática de comisiones y avisos.
            </p>
          </div>

          {/* Botón principal en color Rausch (#c4584c), rounded-full */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#b04e42] hover:bg-[#a64739] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-none self-start sm:self-auto"
          >
            <IconPlus />
            <span>Nuevo Contrato</span>
          </button>
        </div>

        {/* ── KPI Strip ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Total Contratos</p>
            <p className="text-[24px] font-semibold text-[#1e1c1a]">{totalCount}</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Contratos Firmados</p>
            <p className="text-[24px] font-semibold text-emerald-700">{signedCount}</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Pendientes</p>
            <p className="text-[24px] font-semibold text-amber-700">{draftCount}</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none">
            <p className="text-[13px] text-[#6b655e] mb-1">Volumen Firmado</p>
            <p className="text-[20px] sm:text-[22px] font-semibold text-[#1e1c1a] truncate">
              {fmtPrice(totalVolume)}
            </p>
          </div>
        </div>

        {/* ── Filters & Search ────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por ID, inmueble, lead, agente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#e2dcd2] bg-white pl-11 pr-4 py-2.5 text-[14px] text-[#1e1c1a] placeholder:text-[#6b655e] outline-none transition-colors focus:border-[#1e1c1a]"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Estado filter */}
            <div className="inline-flex rounded-full border border-[#e2dcd2] bg-white p-1">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-[#1e1c1a] text-white"
                    : "text-[#6b655e] hover:text-[#1e1c1a]"
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("Firmado")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterStatus === "Firmado"
                    ? "bg-emerald-700 text-white"
                    : "text-[#6b655e] hover:text-[#1e1c1a]"
                }`}
              >
                Firmados ({signedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("Pendiente")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterStatus === "Pendiente"
                    ? "bg-amber-600 text-white"
                    : "text-[#6b655e] hover:text-[#1e1c1a]"
                }`}
              >
                Pendientes ({draftCount})
              </button>
            </div>

            {/* Tipo filter */}
            <div className="inline-flex rounded-full border border-[#e2dcd2] bg-white p-1">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-[#1e1c1a] text-white"
                    : "text-[#6b655e] hover:text-[#1e1c1a]"
                }`}
              >
                Tipo: Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Venta")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterType === "Venta"
                    ? "bg-[#b04e42] text-white"
                    : "text-[#6b655e] hover:text-[#1e1c1a]"
                }`}
              >
                Venta
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Alquiler")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterType === "Alquiler"
                    ? "bg-[#b04e42] text-white"
                    : "text-[#6b655e] hover:text-[#1e1c1a]"
                }`}
              >
                Alquiler
              </button>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mb-4 rounded-[8px] border border-[#e2dcd2] bg-white px-4 py-3 text-[13px] text-[#a64739]">
            {actionError}
          </div>
        )}

        {/* ── Contracts Grid (Airbnb Design System) ───────────────── */}
        {filteredContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] bg-white border border-[#e2dcd2] py-16 px-8 text-center shadow-none">
            <div className="w-14 h-14 rounded-full bg-[#f3efe8] flex items-center justify-center text-[#6b655e] mb-4">
              <IconFileText />
            </div>
            <h3 className="text-[17px] font-semibold text-[#1e1c1a] mb-1">
              No se encontraron contratos
            </h3>
            <p className="text-[14px] text-[#6b655e] max-w-md mb-6">
              {contracts.length === 0
                ? "Aún no hay contratos registrados. Crea el primer contrato para iniciar los cierres de venta o alquiler."
                : "No hay contratos que coincidan con los filtros o el término de búsqueda actual."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b04e42] hover:bg-[#a64739] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-none"
            >
              <IconPlus />
              <span>Registrar Contrato</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredContracts.map((contract) => {
              const pill = statusPill(contract.status);
              const prop = propMap.get(contract.property_id);
              const lead = leadMap.get(contract.lead_id);
              const agent = userMap.get(contract.agent_id);
              const isSigned = contract.status.toLowerCase() === "firmado";

              return (
                <div
                  key={contract.id}
                  className="rounded-[12px] bg-white p-5 border border-[#e2dcd2] shadow-none hover:border-[#1e1c1a] transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top: Type badge + Status pill */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#f3efe8] text-[#1e1c1a]">
                          {contract.operation_type || contract.type}
                        </span>
                        {isSigned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full" title="Evento contract.signed emitido a RabbitMQ">
                            <IconCheckCircle />
                            <span>Automático</span>
                          </span>
                        )}
                      </div>

                      {/* Pill para el estado */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${pill.bg} ${pill.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                        {pill.label}
                      </span>
                    </div>

                    {/* Price in 16px font-semibold (#1e1c1a Hof) */}
                    <div className="mb-4">
                      <p className="text-[12px] text-[#6b655e] mb-0.5">Precio pactado</p>
                      <p className="text-[16px] font-semibold text-[#1e1c1a] tracking-tight">
                        {fmtPrice(contract.price)}
                      </p>
                    </div>

                    {/* Details: Property, Lead, Agent */}
                    <div className="space-y-2.5 pt-3 border-t border-[#f3efe8] mb-4">
                      {/* Property */}
                      <div className="flex items-start gap-2.5">
                        <IconBuilding />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#1e1c1a] truncate">
                            {prop?.title || prop?.address || "Inmueble"}
                          </p>
                        </div>
                      </div>

                      {/* Lead */}
                      <div className="flex items-start gap-2.5">
                        <IconUser />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#1e1c1a] truncate">
                            {lead?.name || "Cliente / Prospecto"}
                          </p>
                        </div>
                      </div>

                      {/* Agent */}
                      <div className="flex items-start gap-2.5">
                        <IconUserCheck />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#1e1c1a] truncate">
                            {agent?.name || "Agente Inmobiliario"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones: cambiar estado + PDF */}
                  <div className="flex items-center gap-2 mb-3">
                    {(!isSigned || !isAgent) && (
                    <button
                      type="button"
                      onClick={() => toggleStatus(contract)}
                      disabled={busyId === contract.id}
                      className={`flex-1 px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                        isSigned
                          ? "border border-[#e2dcd2] text-[#1e1c1a] hover:border-[#1e1c1a]"
                          : "bg-[#b04e42] hover:bg-[#a64739] text-white"
                      }`}
                    >
                      {isSigned ? "Marcar como pendiente" : "✍️ Firma digital"}
                    </button>
                    )}
                    {isSigned && (
                      <button
                        type="button"
                        onClick={() => setSigningId(contract.id)}
                        className="px-4 py-2 rounded-full border border-[#e2dcd2] text-[13px] font-medium text-[#1e1c1a] hover:border-[#1e1c1a] transition-colors cursor-pointer"
                      >
                        Firmas
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => downloadPdf(contract)}
                      disabled={busyId === contract.id}
                      className="px-4 py-2 rounded-full border border-[#e2dcd2] text-[13px] font-medium text-[#1e1c1a] hover:border-[#1e1c1a] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      PDF
                    </button>
                  </div>

                  {/* Card Footer: Dates & Contract ID */}
                  <div className="pt-3 border-t border-[#e2dcd2] flex items-center justify-between text-[11px] text-[#6b655e]">
                    <span>
                      {isSigned && contract.signed_at
                        ? `Firmado: ${fmtDate(contract.signed_at)}`
                        : `Creado: ${fmtDate(contract.created_at)}`}
                    </span>
                    <span className="font-mono text-[10px] text-[#6b655e] bg-[#f3efe8] px-1.5 py-0.5 rounded">
                      {contract.id.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmación: volver un contrato firmado a pendiente */}
      {confirmRevert && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.56)" }}
          onClick={() => busyId === null && setConfirmRevert(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[16px] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[18px] font-semibold text-[#1e1c1a] mb-2">¿Volver a Pendiente?</h2>
            <p className="text-[14px] text-[#6b655e] mb-6">
              El contrato de «{propMap.get(confirmRevert.property_id)?.title || "este inmueble"}» dejará de
              figurar como firmado y sus firmas digitales quedarán anuladas (deberán repetirse). La comisión se anula si aún no fue pagada.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRevert(null)}
                disabled={busyId !== null}
                className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[#1e1c1a] hover:bg-[#f3efe8] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => changeStatus(confirmRevert, "Pendiente")}
                disabled={busyId !== null}
                className="px-5 py-2.5 rounded-full bg-[#b04e42] hover:bg-[#a64739] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {busyId !== null ? "Guardando…" : "Sí, marcar pendiente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {signingId && (
        <SignaturesModal
          contractId={signingId}
          onClose={() => setSigningId(null)}
          onChanged={() => router.refresh()}
        />
      )}

      {/* Modal para Crear Contrato */}
      <CreateContractModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        properties={isAgent ? properties.filter((p) => takenPropertyIds.has(p.id)) : properties}
        leads={isAgent ? leads.filter((l) => takenLeadIds.has(l.id)) : leads}
        agents={isAgent ? users.filter((u) => u.id === me?.id) : users}
        canMarkSigned={!isAgent}
      />
    </div>
  );
}
