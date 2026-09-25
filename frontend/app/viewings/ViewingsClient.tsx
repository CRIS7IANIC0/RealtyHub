"use client";

/* ─────────────────────────────────────────────────────────────
   ViewingsClient — Client Component
   Módulo de Visitas con lógica Pool de Visitas ("Uber Style")
   - Visitas creadas en estado 'Pendiente' sin agente asignado
   - Usuarios con rol 'AGENTE' pueden tomar visitas directamente
   - Estado 'Asignada' con identificación del agente
   - Airbnb / SaaS Corporate Design System
   ───────────────────────────────────────────────────────────── */
import { GATEWAY } from "@/lib/config";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateViewingModal from "@/components/viewings/CreateViewingModal";
import Navbar from "@/components/Navbar";
import type { Viewing, PropertySnippet, LeadSnippet } from "./page";

interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  office_id?: string;
}

// ─── Helpers de Estilo y Formato ─────────────────────────────

function statusPill(status: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
  dot: string;
} {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "pendiente":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        label: "Pendiente",
        dot: "bg-amber-500",
      };
    case "asignada":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        label: "Asignada",
        dot: "bg-emerald-500",
      };
    case "programada":
    case "scheduled":
      return {
        bg: "bg-sky-50",
        text: "text-sky-800",
        border: "border-sky-200",
        label: "Programada",
        dot: "bg-sky-500",
      };
    case "completada":
    case "completed":
    case "realizada":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        label: "Completada",
        dot: "bg-emerald-500",
      };
    case "cancelada":
    case "cancelled":
      return {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-200",
        label: "Cancelada",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-[#f7f7f7]",
        text: "text-[#6a6a6a]",
        border: "border-[#ebebeb]",
        label: status || "Pendiente",
        dot: "bg-[#b0b0b0]",
      };
  }
}

function fmtDate(iso: string): { dateStr: string; timeStr: string; isPast: boolean } {
  try {
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const isPast = d.getTime() < Date.now();
    return { dateStr, timeStr, isPast };
  } catch {
    return { dateStr: iso, timeStr: "", isPast: false };
  }
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

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconHand() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────

function ViewingCard({
  viewing,
  property,
  lead,
  currentUser,
  onTakeViewing,
  isTaking,
}: {
  viewing: Viewing;
  property?: PropertySnippet;
  lead?: LeadSnippet;
  currentUser: AuthUser | null;
  onTakeViewing: (id: string) => void;
  isTaking: boolean;
}) {
  const pill = statusPill(viewing.status);
  const { dateStr, timeStr, isPast } = fmtDate(viewing.scheduled_at);

  const statusLower = (viewing.status || "").toLowerCase();
  const isPending = statusLower === "pendiente";
  const isAssigned = statusLower === "asignada";
  const isAgent = currentUser?.role?.toUpperCase() === "AGENTE";

  return (
    <div className="rounded-[16px] bg-white border border-[#ebebeb] p-6 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <div>
        {/* Header: Fecha y Status Pill */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
              <IconCalendar />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#222222] capitalize">
                {dateStr}
              </p>
              <div className="flex items-center gap-1.5 text-[12px] text-[#6a6a6a] mt-0.5 font-medium">
                <IconClock />
                <span>{timeStr || "Hora no definida"}</span>
                {isPast && isPending && (
                  <span className="text-[11px] text-[#ff385c] font-semibold ml-1">
                    (Vencida)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Pill con borde y punto coloreado */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${pill.bg} ${pill.text} ${pill.border} shadow-2xs`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
            {pill.label}
          </span>
        </div>

        {/* Separador */}
        <div className="h-px bg-[#f7f7f7] my-3" />

        {/* Datos de Propiedad y Lead */}
        <div className="space-y-3">
          {/* Propiedad */}
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">
              <IconHome />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6a6a6a]">
                Propiedad
              </p>
              <p className="text-[14px] font-semibold text-[#222222] truncate">
                {property?.title || property?.address || "Inmueble registrado"}
              </p>
              {property?.address && property.title && (
                <p className="text-[12px] text-[#6a6a6a] truncate mt-0.5">
                  {property.address}
                </p>
              )}
            </div>
          </div>

          {/* Lead */}
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">
              <IconUser />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6a6a6a]">
                Prospecto (Lead)
              </p>
              <p className="text-[14px] font-semibold text-[#222222] truncate">
                {lead?.name || lead?.email || "Prospecto registrado"}
              </p>
              {lead?.email && lead.name && (
                <p className="text-[12px] text-[#6a6a6a] truncate mt-0.5">
                  {lead.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer y Acciones de Reclamación (Uber Pool) */}
      <div className="pt-4 mt-4 border-t border-[#f0f0f0]">
        {/* Caso 1: Pendiente y usuario es AGENTE -> Botón 'Tomar Visita' */}
        {isPending && isAgent ? (
          <button
            onClick={() => onTakeViewing(viewing.id)}
            disabled={isTaking}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white py-2.5 px-4 text-[13px] font-bold transition-all duration-200 shadow-sm hover:shadow cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isTaking ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Asignando...</span>
              </>
            ) : (
              <>
                <IconHand />
                <span>Tomar Visita</span>
              </>
            )}
          </button>
        ) : isPending ? (
          /* Caso 2: Pendiente para otros roles (Gerente, Admin o no agente) */
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pool de Agentes
            </span>
            <span className="text-[11px] text-[#888888] font-mono">
              ID: {viewing.id.slice(0, 8)}…
            </span>
          </div>
        ) : isAssigned ? (
          /* Caso 3: Asignada -> Muestra badge de 'Agente Asignado' */
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Agente Asignado
            </span>
            <span
              className="text-[11px] font-mono text-[#444444] bg-[#f7f7f7] px-2 py-0.5 rounded max-w-[130px] truncate"
              title={viewing.agent_id || "Agente registrado"}
            >
              {viewing.agent_id
                ? viewing.agent_id === currentUser?.id
                  ? "✓ Asignada a ti"
                  : `Agente #${viewing.agent_id.slice(0, 6)}`
                : "Confirmada"}
            </span>
          </div>
        ) : (
          /* Otros estados (Completada, Cancelada, etc.) */
          <div className="flex items-center justify-between text-[11px] text-[#6a6a6a]">
            <span>Estado:</span>
            <span className="font-semibold text-[#222222] capitalize">
              {viewing.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-white border border-[#ebebeb] p-5 shadow-2xs">
      <p className="text-[13px] text-[#6a6a6a] mb-1 font-medium">{label}</p>
      <p
        className={`text-[24px] font-bold tracking-tight ${
          accent ? "text-[#ff385c]" : "text-[#222222]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────

export default function ViewingsClient({
  initialViewings = [],
  properties = [],
  leads = [],
}: {
  initialViewings: Viewing[];
  properties?: PropertySnippet[];
  leads?: LeadSnippet[];
}) {
  const router = useRouter();
  const [viewingsList, setViewingsList] = useState<Viewing[]>(initialViewings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [takingId, setTakingId] = useState<string | null>(null);

  // Sesión del usuario actual
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function loadUser() {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    }

    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("realtyhub_auth_changed", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("realtyhub_auth_changed", loadUser);
    };
  }, []);

  // Actualizar lista cuando cambien los datos del servidor
  useEffect(() => {
    setViewingsList(initialViewings);
  }, [initialViewings]);

  // Handler: Tomar Visita (Lógica Uber)
  async function handleTakeViewing(viewingId: string) {
    if (!currentUser?.id) {
      alert("Debes iniciar sesión con tu cuenta de agente para tomar la visita.");
      return;
    }

    setTakingId(viewingId);

    try {
      const res = await fetch(`${GATEWAY}/viewings/${viewingId}/take`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: currentUser.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Error al tomar la visita");
      }

      // Actualizar localmente de inmediato para UX fluida
      setViewingsList((prev) =>
        prev.map((v) =>
          v.id === viewingId
            ? { ...v, status: "Asignada", agent_id: currentUser.id }
            : v
        )
      );

      // Sincronizar en el servidor
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al tomar la visita.");
    } finally {
      setTakingId(null);
    }
  }

  // Mapas para resolución rápida de IDs a nombres
  const propertyMap = new Map(properties.map((p) => [p.id, p]));
  const leadMap = new Map(leads.map((l) => [l.id, l]));

  /* Filtrado reactivo */
  const filtered = viewingsList.filter((v) => {
    const prop = propertyMap.get(v.property_id);
    const lead = leadMap.get(v.lead_id);

    const matchesSearch =
      !search.trim() ||
      v.property_id?.toLowerCase().includes(search.toLowerCase()) ||
      v.lead_id?.toLowerCase().includes(search.toLowerCase()) ||
      v.id?.toLowerCase().includes(search.toLowerCase()) ||
      (prop?.title && prop.title.toLowerCase().includes(search.toLowerCase())) ||
      (prop?.address && prop.address.toLowerCase().includes(search.toLowerCase())) ||
      (lead?.name && lead.name.toLowerCase().includes(search.toLowerCase())) ||
      (lead?.email && lead.email.toLowerCase().includes(search.toLowerCase()));

    const statusLower = (v.status || "").toLowerCase();
    const matchesStatus =
      filterStatus === "all" ||
      statusLower === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  /* Métricas ajustadas al Pool de Visitas */
  const total = viewingsList.length;
  const pendientes = viewingsList.filter(
    (v) => (v.status || "").toLowerCase() === "pendiente"
  ).length;
  const asignadas = viewingsList.filter(
    (v) =>
      (v.status || "").toLowerCase() === "asignada" ||
      (v.status || "").toLowerCase() === "programada"
  ).length;
  const completadas = viewingsList.filter(
    (v) =>
      (v.status || "").toLowerCase() === "completada" ||
      (v.status || "").toLowerCase() === "realizada"
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV — Airbnb Design System con RBAC
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="viewings" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors no-underline font-medium"
          >
            <IconChevronLeft />
            Inicio
          </Link>
          <span className="text-[13px] text-[#ebebeb]">/</span>
          <span className="text-[13px] text-[#222222] font-semibold">
            Agenda de Visitas
          </span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] sm:text-[30px] font-bold text-[#222222] tracking-tight">
                Agenda de Visitas
              </h1>
              {pendientes > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[12px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {pendientes} en pool
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#6a6a6a] mt-1">
              Pool de visitas tipo Uber: citas pendientes asignables en tiempo real a los agentes disponibles.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff385c] hover:bg-[#e00b41] px-5 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 shadow-sm hover:shadow cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <IconPlus />
            <span>Agendar Visita</span>
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total Citas" value={total} />
          <Stat label="Pendientes (Pool)" value={pendientes} accent={pendientes > 0} />
          <Stat label="Asignadas" value={asignadas} />
          <Stat label="Completadas" value={completadas} />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="flex items-center gap-2.5 rounded-full border border-[#ebebeb] px-4 py-2.5 bg-white max-w-[380px] w-full shadow-2xs focus-within:border-gray-900 transition-colors">
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar por ID, propiedad o lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[14px] text-[#222222] placeholder:text-[#999999] w-full"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {[
              { key: "all", label: "Todas" },
              { key: "pendiente", label: "Pendientes (Pool)" },
              { key: "asignada", label: "Asignadas" },
              { key: "completada", label: "Completadas" },
              { key: "cancelada", label: "Canceladas" },
            ].map((tab) => {
              const active = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    active
                      ? "bg-[#222222] text-white border-[#222222] shadow-xs"
                      : "bg-white text-gray-600 border-[#ebebeb] hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Tarjetas de Visitas */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((viewing) => (
              <ViewingCard
                key={viewing.id}
                viewing={viewing}
                property={propertyMap.get(viewing.property_id)}
                lead={leadMap.get(viewing.lead_id)}
                currentUser={currentUser}
                onTakeViewing={handleTakeViewing}
                isTaking={takingId === viewing.id}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-[16px] bg-white border border-[#ebebeb] p-12 text-center max-w-[500px] mx-auto mt-6 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mx-auto mb-4 text-[#6a6a6a]">
              <IconCalendar />
            </div>
            <h3 className="text-[18px] font-bold text-[#222222] mb-1">
              {search || filterStatus !== "all"
                ? "No se encontraron visitas con ese filtro"
                : "No hay visitas en la agenda"}
            </h3>
            <p className="text-[14px] text-[#6a6a6a] mb-6">
              {search || filterStatus !== "all"
                ? "Intenta modificar el término de búsqueda o los filtros aplicados."
                : "Empieza agendando una cita. Ingresará al pool para que cualquier agente disponible la tome."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff385c] hover:bg-[#e00b41] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <IconPlus />
              <span>Agendar Visita</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal para agendar visitas */}
      <CreateViewingModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        properties={properties}
        leads={leads}
      />
    </div>
  );
}
