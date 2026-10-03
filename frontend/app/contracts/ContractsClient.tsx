"use client";

/* ─────────────────────────────────────────────────────────────
   ContractsClient — Client Component
   Módulo de Gestión de Contratos · Strict Airbnb Design System
   Canvas fondo #f7f7f7 · Cero sombras · Precio en 16px font-semibold (#222222)
   Pills para el estado · Botón principal en Rausch (#ff385c) rounded-full
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GATEWAY } from "@/lib/config";
import CreateContractModal from "@/components/contracts/CreateContractModal";
import Navbar from "@/components/Navbar";
import type { Contract, PropertySnippet, LeadSnippet, UserSnippet } from "./page";

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] shrink-0">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
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

function IconUserCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] shrink-0">
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#222222]">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Componente Principal ───────────────────────────────────

export default function ContractsClient({
  contracts,
  properties = [],
  leads = [],
  users = [],
}: {
  contracts: Contract[];
  properties?: PropertySnippet[];
  leads?: LeadSnippet[];
  users?: UserSnippet[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Firmado" | "Pendiente">("all");

  async function toggleStatus(contract: Contract) {
    const next = contract.status.toLowerCase() === "firmado" ? "Pendiente" : "Firmado";
    if (
      next === "Pendiente" &&
      !window.confirm("¿Volver este contrato a Pendiente? Las comisiones ya generadas no se revierten automáticamente.")
    ) {
      return;
    }
    setBusyId(contract.id);
    setActionError(null);
    try {
      const res = await fetch(`${GATEWAY}/contracts/${contract.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Error del servidor (${res.status})`);
      }
      router.refresh();
    } catch (err) {
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
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV (AIRBNB CLEAN HEADER con RBAC)
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="contracts" />

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
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#ff385c] bg-[#ff385c]/10 px-2.5 py-0.5 rounded-full">
                Módulo Comercial
              </span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.5px] text-[#222222]">
              Gestión de Contratos
            </h1>
            <p className="text-[14px] text-[#6a6a6a] mt-1">
              Registro y administración de cierres de ventas y alquileres con automatización por eventos.
            </p>
          </div>

          {/* Botón principal en color Rausch (#ff385c), rounded-full */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#ff385c] hover:bg-[#d90b3e] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-none self-start sm:self-auto"
          >
            <IconPlus />
            <span>Nuevo Contrato</span>
          </button>
        </div>

        {/* ── KPI Strip ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Total Contratos</p>
            <p className="text-[24px] font-semibold text-[#222222]">{totalCount}</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Contratos Firmados</p>
            <p className="text-[24px] font-semibold text-emerald-700">{signedCount}</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Pendientes</p>
            <p className="text-[24px] font-semibold text-amber-700">{draftCount}</p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Volumen Firmado</p>
            <p className="text-[20px] sm:text-[22px] font-semibold text-[#222222] truncate">
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
              className="w-full rounded-full border border-[#ebebeb] bg-white pl-11 pr-4 py-2.5 text-[14px] text-[#222222] placeholder:text-[#6a6a6a] outline-none transition-colors focus:border-[#222222]"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Estado filter */}
            <div className="inline-flex rounded-full border border-[#ebebeb] bg-white p-1">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-[#222222] text-white"
                    : "text-[#6a6a6a] hover:text-[#222222]"
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
                    : "text-[#6a6a6a] hover:text-[#222222]"
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
                    : "text-[#6a6a6a] hover:text-[#222222]"
                }`}
              >
                Pendientes ({draftCount})
              </button>
            </div>

            {/* Tipo filter */}
            <div className="inline-flex rounded-full border border-[#ebebeb] bg-white p-1">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-[#222222] text-white"
                    : "text-[#6a6a6a] hover:text-[#222222]"
                }`}
              >
                Tipo: Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Venta")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterType === "Venta"
                    ? "bg-[#ff385c] text-white"
                    : "text-[#6a6a6a] hover:text-[#222222]"
                }`}
              >
                Venta
              </button>
              <button
                type="button"
                onClick={() => setFilterType("Alquiler")}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  filterType === "Alquiler"
                    ? "bg-[#ff385c] text-white"
                    : "text-[#6a6a6a] hover:text-[#222222]"
                }`}
              >
                Alquiler
              </button>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mb-4 rounded-[8px] border border-[#ebebeb] bg-white px-4 py-3 text-[13px] text-[#c13515]">
            {actionError}
          </div>
        )}

        {/* ── Contracts Grid (Airbnb Design System) ───────────────── */}
        {filteredContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] bg-white border border-[#ebebeb] py-16 px-8 text-center shadow-none">
            <div className="w-14 h-14 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[#6a6a6a] mb-4">
              <IconFileText />
            </div>
            <h3 className="text-[17px] font-semibold text-[#222222] mb-1">
              No se encontraron contratos
            </h3>
            <p className="text-[14px] text-[#6a6a6a] max-w-md mb-6">
              {contracts.length === 0
                ? "Aún no hay contratos registrados. Crea el primer contrato para iniciar los cierres de venta o alquiler."
                : "No hay contratos que coincidan con los filtros o el término de búsqueda actual."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff385c] hover:bg-[#d90b3e] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-none"
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
                  className="rounded-[12px] bg-white p-5 border border-[#ebebeb] shadow-none hover:border-[#222222] transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top: Type badge + Status pill */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#f7f7f7] text-[#222222]">
                          {contract.operation_type || contract.type}
                        </span>
                        {isSigned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full" title="Evento contract.signed emitido a RabbitMQ">
                            <IconCheckCircle />
                            <span>RabbitMQ</span>
                          </span>
                        )}
                      </div>

                      {/* Pill para el estado */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${pill.bg} ${pill.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                        {pill.label}
                      </span>
                    </div>

                    {/* Price in 16px font-semibold (#222222 Hof) */}
                    <div className="mb-4">
                      <p className="text-[12px] text-[#6a6a6a] mb-0.5">Precio pactado</p>
                      <p className="text-[16px] font-semibold text-[#222222] tracking-tight">
                        {fmtPrice(contract.price)}
                      </p>
                    </div>

                    {/* Details: Property, Lead, Agent */}
                    <div className="space-y-2.5 pt-3 border-t border-[#f7f7f7] mb-4">
                      {/* Property */}
                      <div className="flex items-start gap-2.5">
                        <IconBuilding />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#222222] truncate">
                            {prop?.title || prop?.address || "Inmueble"}
                          </p>
                          <p className="text-[11px] text-[#6a6a6a] truncate">
                            ID: <code className="bg-[#f7f7f7] px-1 py-0.5 rounded">{contract.property_id}</code>
                          </p>
                        </div>
                      </div>

                      {/* Lead */}
                      <div className="flex items-start gap-2.5">
                        <IconUser />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#222222] truncate">
                            {lead?.name || "Cliente / Prospecto"}
                          </p>
                          <p className="text-[11px] text-[#6a6a6a] truncate">
                            Lead: <code className="bg-[#f7f7f7] px-1 py-0.5 rounded">{contract.lead_id}</code>
                          </p>
                        </div>
                      </div>

                      {/* Agent */}
                      <div className="flex items-start gap-2.5">
                        <IconUserCheck />
                        <div className="min-w-0 text-[13px]">
                          <p className="font-medium text-[#222222] truncate">
                            {agent?.name || "Agente Inmobiliario"}
                          </p>
                          <p className="text-[11px] text-[#6a6a6a] truncate">
                            Agente: <code className="bg-[#f7f7f7] px-1 py-0.5 rounded">{contract.agent_id}</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones: cambiar estado + PDF */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(contract)}
                      disabled={busyId === contract.id}
                      className={`flex-1 px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                        isSigned
                          ? "border border-[#ebebeb] text-[#222222] hover:border-[#222222]"
                          : "bg-[#ff385c] hover:bg-[#d90b3e] text-white"
                      }`}
                    >
                      {isSigned ? "Marcar como pendiente" : "Marcar como firmado"}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPdf(contract)}
                      disabled={busyId === contract.id}
                      className="px-4 py-2 rounded-full border border-[#ebebeb] text-[13px] font-medium text-[#222222] hover:border-[#222222] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      PDF
                    </button>
                  </div>

                  {/* Card Footer: Dates & Contract ID */}
                  <div className="pt-3 border-t border-[#ebebeb] flex items-center justify-between text-[11px] text-[#6a6a6a]">
                    <span>
                      {isSigned && contract.signed_at
                        ? `Firmado: ${fmtDate(contract.signed_at)}`
                        : `Creado: ${fmtDate(contract.created_at)}`}
                    </span>
                    <span className="font-mono text-[10px] text-[#6a6a6a] bg-[#f7f7f7] px-1.5 py-0.5 rounded">
                      {contract.id.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal para Crear Contrato */}
      <CreateContractModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        properties={properties}
        leads={leads}
        agents={users}
      />
    </div>
  );
}
