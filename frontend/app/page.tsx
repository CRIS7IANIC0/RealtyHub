"use client";

/* ─────────────────────────────────────────────────────────────
   RealtyHub — Página de Inicio / Dashboard Principal
   Renderizado condicional basado en estado de autenticación:
   - Invitado (user === null): Landing Comercial público estilo Airbnb
     (Hero Banner + Grid de Propiedades Destacadas 'Disponibles')
   - Autenticado (user !== null): Dashboard Operativo Integral
     (KPIs + Propiedades + Leads + Visitas + Personal con RBAC)
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";

// ─── Tipos de Datos ──────────────────────────────────────────
export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string; // 'AGENTE' | 'GERENTE' | 'ADMIN'
  office_id?: string;
}

interface Property {
  id: string | number;
  title?: string;
  description?: string;
  address: string;
  price: number;
  status: string;
  image_url?: string;
}

interface Lead {
  id: string | number;
  source: string;
  property_id: string | number;
  stage: string;
}

interface Viewing {
  id: string | number;
  scheduled_at: string;
  lead_id: string | number;
  status: string;
}

interface User {
  id: string | number;
  name: string;
  role: string;
  office_id: string | number;
}

const GATEWAY = "http://localhost:3000";

// ─── Helpers de Formato y Estilo ─────────────────────────────

function fmtPrice(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.round(diff / 86_400_000);

    if (days === 0) return "Hoy";
    if (days === 1) return "Mañana";
    if (days === -1) return "Ayer";

    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function statusStyle(status: string): string {
  switch (status?.toLowerCase()) {
    case "available":
    case "disponible":
      return "bg-emerald-50 text-emerald-700";
    case "reserved":
    case "reservada":
      return "bg-amber-50 text-amber-700";
    case "sold":
    case "vendida":
      return "bg-[#ff385c]/10 text-[#ff385c]";
    default:
      return "bg-[#f7f7f7] text-[#6a6a6a]";
  }
}

function stageStyle(stage: string): string {
  switch (stage?.toLowerCase()) {
    case "new":
    case "nuevo":
      return "bg-sky-50 text-sky-700";
    case "contacted":
    case "contactado":
      return "bg-violet-50 text-violet-700";
    case "qualified":
    case "calificado":
      return "bg-emerald-50 text-emerald-700";
    case "lost":
    case "perdido":
      return "bg-[#f7f7f7] text-[#6a6a6a]";
    default:
      return "bg-[#f7f7f7] text-[#6a6a6a]";
  }
}

function viewingStatusStyle(status: string): string {
  switch (status?.toLowerCase()) {
    case "pendiente":
      return "bg-amber-50 text-amber-700";
    case "asignada":
    case "completed":
    case "completada":
      return "bg-emerald-50 text-emerald-700";
    case "scheduled":
    case "programada":
      return "bg-sky-50 text-sky-700";
    case "cancelled":
    case "cancelada":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-[#f7f7f7] text-[#6a6a6a]";
  }
}

function roleBadge(role: string): { bg: string; text: string; label: string } {
  switch (role?.toLowerCase()) {
    case "admin":
      return {
        bg: "bg-[#ff385c]/10",
        text: "text-[#ff385c]",
        label: "Admin",
      };
    case "gerente":
    case "manager":
      return {
        bg: "bg-[#f7f7f7]",
        text: "text-[#222222]",
        label: role.charAt(0).toUpperCase() + role.slice(1),
      };
    default:
      return {
        bg: "bg-[#f7f7f7]",
        text: "text-[#6a6a6a]",
        label: role ? role.charAt(0).toUpperCase() + role.slice(1) : "Agente",
      };
  }
}

function sourceIcon(source: string): string {
  switch (source?.toLowerCase()) {
    case "web":
    case "website":
      return "🌐";
    case "referral":
    case "referido":
      return "🤝";
    case "social":
    case "redes":
      return "📱";
    case "phone":
    case "teléfono":
      return "📞";
    default:
      return "📋";
  }
}

// ─── Iconos SVG ──────────────────────────────────────────────

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a] shrink-0"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#ff385c]"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function IconCheckShield() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#ff385c]"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#ff385c]"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHandshake() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#ff385c]"
    >
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-4 4" />
      <path d="m18 10 1-1a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0l-1 1" />
      <path d="M7 10.8 11.2 15" />
      <path d="m2 14 5.3-5.3a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L6 18" />
    </svg>
  );
}

// ─── Sub-componentes del Dashboard ───────────────────────────

function SectionHeader({
  icon,
  title,
  count,
  linkHref,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  linkHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[#f7f7f7]">
          {icon}
        </div>
        <h2
          className="text-[22px] font-medium tracking-[-0.44px] text-[#222222]"
          style={{ lineHeight: "28px" }}
        >
          {title}
        </h2>
        <span className="ml-1 text-[13px] font-medium text-[#6a6a6a] bg-[#f7f7f7] rounded-full px-2.5 py-0.5">
          {count}
        </span>
      </div>
      {linkHref ? (
        <Link
          href={linkHref}
          className="flex items-center gap-1 text-[14px] font-medium text-[#222222] hover:text-[#ff385c] transition-colors cursor-pointer no-underline"
        >
          Ver todo
          <IconChevronRight />
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-[14px] font-medium text-[#222222]">
          Gestión activa
        </span>
      )}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-[12px] bg-white py-16 px-8 border border-[#ebebeb]">
      <p className="text-[14px] text-[#6a6a6a]">{message}</p>
    </div>
  );
}

function PropertyCard({ p }: { p: Property }) {
  const badge = statusStyle(p.status);

  return (
    <div className="shrink-0 w-[280px] rounded-[12px] bg-white overflow-hidden group cursor-pointer transition-transform duration-200 hover:scale-[1.02] border border-[#ebebeb]">
      <div className="relative aspect-square bg-[#f0f0f0] overflow-hidden">
        {p.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={p.image_url}
            alt={p.title || p.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement?.classList.add("flex", "items-center", "justify-center");
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d1d1"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <span
          className={`absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-xs ${badge}`}
        >
          {p.status || "Disponible"}
        </span>
      </div>

      <div className="p-4">
        <p className="text-[14px] font-medium text-[#222222] truncate">
          {p.title || p.address}
        </p>
        <p className="text-[12px] text-[#6a6a6a] truncate mt-0.5">
          {p.address}
        </p>
        <p className="text-[15px] font-semibold text-[#222222] mt-2">
          {fmtPrice(p.price)}
        </p>
      </div>
    </div>
  );
}

function LeadCard({ l }: { l: Lead }) {
  const badge = stageStyle(l.stage);

  return (
    <div className="shrink-0 w-[260px] rounded-[12px] bg-white p-5 cursor-pointer transition-transform duration-200 hover:scale-[1.02] border border-[#ebebeb]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{sourceIcon(l.source)}</span>
          <div>
            <p className="text-[14px] font-medium text-[#222222]">
              Lead #{String(l.id).padStart(3, "0")}
            </p>
            <p className="text-[13px] text-[#6a6a6a] capitalize">
              {l.source || "Desconocido"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${badge}`}
        >
          {l.stage}
        </span>
        <span className="text-[12px] text-[#6a6a6a]">
          Prop #{l.property_id ?? "—"}
        </span>
      </div>
    </div>
  );
}

function ViewingCard({ v }: { v: Viewing }) {
  const badge = viewingStatusStyle(v.status);

  return (
    <div className="shrink-0 w-[260px] rounded-[12px] bg-white p-5 cursor-pointer transition-transform duration-200 hover:scale-[1.02] border border-[#ebebeb]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[#6a6a6a] text-sm font-semibold">
          {fmtDate(v.scheduled_at).slice(0, 3)}
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#222222]">
            {fmtDate(v.scheduled_at)}
          </p>
          <p className="text-[13px] text-[#6a6a6a]">
            {fmtTime(v.scheduled_at)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${badge}`}
        >
          {v.status}
        </span>
        <span className="text-[12px] text-[#6a6a6a]">
          Lead #{v.lead_id ?? "—"}
        </span>
      </div>
    </div>
  );
}

function UserCard({ u }: { u: User }) {
  const role = roleBadge(u.role);

  return (
    <div className="shrink-0 w-[240px] rounded-[12px] bg-white p-5 cursor-pointer transition-transform duration-200 hover:scale-[1.02] border border-[#ebebeb]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[15px] font-semibold text-[#222222] uppercase">
          {u.name ? u.name.charAt(0) : "U"}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#222222] truncate">
            {u.name || "Sin nombre"}
          </p>
          <p className="text-[13px] text-[#6a6a6a]">
            Oficina {u.office_id ?? "—"}
          </p>
        </div>
      </div>

      <span
        className={`inline-block text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${role.bg} ${role.text}`}
      >
        {role.label}
      </span>
    </div>
  );
}

// ─── Componente de Carga Inicial (Previene Hydration Mismatch) ──

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <Navbar activeTab="inicio" />
      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        <div className="space-y-4 mb-10">
          <div className="h-9 w-64 bg-gray-200 animate-pulse rounded-[12px]" />
          <div className="h-4 w-96 bg-gray-200 animate-pulse rounded-[8px]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[12px] bg-white border border-[#ebebeb] p-5 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-[12px] bg-white border border-[#ebebeb] animate-pulse" />
      </main>
    </div>
  );
}

// ─── VISTA PÚBLICA: Landing Comercial Estilo Airbnb ───────────

function PublicLandingView({
  properties,
  isLoading,
}: {
  properties: Property[];
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar estrictamente solo propiedades Disponibles
  const availableProperties = useMemo(() => {
    return properties.filter((p) => {
      const st = p.status?.toLowerCase();
      return st === "disponible" || st === "available";
    });
  }, [properties]);

  // Filtro de búsqueda en tiempo real
  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return availableProperties;
    const term = searchTerm.toLowerCase();
    return availableProperties.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.address && p.address.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }, [availableProperties, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <Navbar activeTab="inicio" />

      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ══════════════════════════════════════════════
            HERO BANNER COMERCIAL ESTILO AIRBNB
            ══════════════════════════════════════════════ */}
        <section className="relative rounded-[24px] bg-gradient-to-b from-white via-white to-[#fbfbfb] border border-[#ebebeb] px-6 py-14 sm:py-20 md:py-24 text-center overflow-hidden mb-16 shadow-xs">
          {/* Acento estético sutil de fondo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#ff385c]/10 to-transparent blur-3xl pointer-events-none" />

          {/* Badge comercial de confianza */}
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff385c]/10 text-[#ff385c] text-[13px] font-semibold mb-6">
            <IconSparkles />
            <span>Portal Inmobiliario Exclusivo</span>
          </div>

          {/* Título de gran impacto */}
          <h1 className="relative text-[34px] sm:text-[46px] md:text-[56px] font-bold tracking-[-1px] text-[#222222] max-w-[800px] mx-auto leading-[1.12]">
            Encuentra tu próximo hogar
          </h1>

          {/* Subtítulo persuasivo */}
          <p className="relative text-[16px] sm:text-[18px] text-[#6a6a6a] max-w-[620px] mx-auto mt-4 mb-10 leading-relaxed font-normal">
            Explora las mejores casas, apartamentos y propiedades exclusivas
            verificadas, con disponibilidad inmediata para compra o alquiler.
          </p>

          {/* Barra de Búsqueda Flotante estilo Airbnb */}
          <div className="relative max-w-[700px] mx-auto bg-white rounded-full p-2 border border-[#ebebeb] shadow-lg flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 pl-4 pr-2">
              <IconMapPin />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por ciudad, barrio o dirección..."
                className="w-full text-[14px] text-[#222222] bg-transparent outline-none placeholder:text-[#999999]"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 bg-[#ff385c] hover:bg-[#d90b3e] text-white text-[14px] font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer shadow-sm"
              title="Buscar propiedades disponibles"
            >
              <IconSearch />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>

          {/* Micro métricas de garantía */}
          <div className="relative flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10 text-[13px] text-[#6a6a6a] font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              100% Inmuebles verificados
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Atención personalizada
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sin comisiones ocultas
            </span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECCIÓN: PROPIEDADES DESTACADAS (DISPONIBLES)
            ══════════════════════════════════════════════ */}
        <section style={{ marginBottom: "var(--rh-section-gap)" }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.5px] text-[#222222]">
                  Propiedades Destacadas
                </h2>
                <span className="text-[13px] font-semibold text-[#ff385c] bg-[#ff385c]/10 rounded-full px-3 py-1">
                  {filteredProperties.length} disponibles
                </span>
              </div>
              <p className="text-[14px] text-[#6a6a6a]">
                Inmuebles listos para visitar y escriturar de inmediato.
              </p>
            </div>

            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#222222] hover:text-[#ff385c] transition-colors no-underline cursor-pointer"
            >
              Ver catálogo completo
              <IconChevronRight />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-[16px] bg-white border border-[#ebebeb] p-4 h-80 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[20px] bg-white border border-[#ebebeb] py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4 text-2xl">
                🏠
              </div>
              <h3 className="text-[18px] font-medium text-[#222222] mb-1">
                No encontramos propiedades con ese criterio
              </h3>
              <p className="text-[14px] text-[#6a6a6a] max-w-[400px]">
                {searchTerm
                  ? "Prueba buscando con otra palabra clave o revisa nuestro catálogo completo."
                  : "Actualmente todas nuestras propiedades se encuentran en proceso o reservadas. Vuelve pronto."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-[13px] font-semibold text-[#ff385c] hover:underline cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProperties.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-[16px] bg-white border border-[#ebebeb] overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between"
                >
                  <Link href={`/properties/${p.id}`} className="block no-underline flex-1">
                    {/* Imagen de la propiedad */}
                    <div className="relative aspect-4/3 bg-[#f0f0f0] overflow-hidden">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.image_url}
                          alt={p.title || p.address}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement?.classList.add(
                              "flex",
                              "items-center",
                              "justify-center"
                            );
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#f7f7f7]">
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#d1d1d1"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}

                      {/* Badge 'Disponible' con punto verde */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Disponible
                      </span>
                    </div>

                    {/* Contenido textual */}
                    <div className="p-5">
                      <h3 className="text-[16px] font-semibold text-[#222222] truncate group-hover:text-[#ff385c] transition-colors">
                        {p.title || p.address}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[#6a6a6a]">
                        <IconMapPin />
                        <p className="text-[13px] truncate">{p.address}</p>
                      </div>
                      {p.description && (
                        <p className="text-[13px] text-[#6a6a6a] line-clamp-2 mt-2 leading-snug">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Pie de tarjeta con precio y acción */}
                  <div className="px-5 pb-5 pt-3 border-t border-[#f7f7f7] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#6a6a6a] uppercase tracking-wider block">
                        Precio
                      </span>
                      <p className="text-[16px] font-bold text-[#222222]">
                        {fmtPrice(p.price)}
                      </p>
                    </div>

                    <Link
                      href={`/properties/${p.id}`}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#ff385c] hover:underline no-underline"
                    >
                      Ver Detalle
                      <IconChevronRight />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECCIÓN DE BENEFICIOS Y PROPUESTA DE VALOR
            ══════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="rounded-[16px] bg-white border border-[#ebebeb] p-6">
            <div className="w-12 h-12 rounded-[12px] bg-[#ff385c]/10 flex items-center justify-center mb-4">
              <IconCheckShield />
            </div>
            <h3 className="text-[16px] font-semibold text-[#222222] mb-1">
              Transparencia Absoluta
            </h3>
            <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
              Cada propiedad publicada cuenta con validación legal previa,
              títulos claros y precio justo avalado por profesionales.
            </p>
          </div>

          <div className="rounded-[16px] bg-white border border-[#ebebeb] p-6">
            <div className="w-12 h-12 rounded-[12px] bg-[#ff385c]/10 flex items-center justify-center mb-4">
              <IconClock />
            </div>
            <h3 className="text-[16px] font-semibold text-[#222222] mb-1">
              Agilidad en Visitas
            </h3>
            <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
              Programa tu recorrido en minutos. Asignamos un agente dedicado
              para resolver todas tus dudas en el lugar.
            </p>
          </div>

          <div className="rounded-[16px] bg-white border border-[#ebebeb] p-6">
            <div className="w-12 h-12 rounded-[12px] bg-[#ff385c]/10 flex items-center justify-center mb-4">
              <IconHandshake />
            </div>
            <h3 className="text-[16px] font-semibold text-[#222222] mb-1">
              Acompañamiento Integral
            </h3>
            <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
              Te guiamos desde la negociación hasta la firma de escrituras o
              contratos de arrendamiento con total seguridad.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CALL TO ACTION INMOBILIARIO
            ══════════════════════════════════════════════ */}
        <section className="rounded-[20px] bg-[#222222] text-white p-8 sm:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-[22px] sm:text-[26px] font-bold tracking-tight mb-2">
              ¿Formas parte del equipo RealtyHub?
            </h3>
            <p className="text-[14px] text-gray-400 max-w-[500px]">
              Accede a tu panel administrativo para gestionar leads, visitas,
              contratos y comisiones en tiempo real.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#ff385c] hover:bg-[#d90b3e] text-white text-[14px] font-semibold transition-colors no-underline cursor-pointer shrink-0"
          >
            Ingresar al Dashboard
          </Link>
        </section>

        {/* ── Footer ────────────────────────────────── */}
        <footer className="py-10 border-t border-[#ebebeb]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6a6a6a]">
              © {new Date().getFullYear()} RealtyHub. Todos los derechos
              reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Soporte
              </span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Privacidad
              </span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Términos
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── VISTA PRIVADA: Dashboard Interno con RBAC ────────────────

function InternalDashboardView({
  user,
  properties,
  leads,
  viewings,
  users,
}: {
  user: AuthUser;
  properties: Property[];
  leads: Lead[];
  viewings: Viewing[];
  users: User[];
}) {
  const role = user?.role?.toUpperCase();
  const isManagerOrAdmin = role === "GERENTE" || role === "ADMIN";

  /* Cálculos de KPIs operativos */
  const totalValue = useMemo(
    () => properties.reduce((s, p) => s + (p.price || 0), 0),
    [properties]
  );

  const activeLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.stage?.toLowerCase() !== "lost" &&
          l.stage?.toLowerCase() !== "perdido"
      ).length,
    [leads]
  );

  const upcomingViewings = useMemo(
    () =>
      viewings.filter(
        (v) =>
          v.status?.toLowerCase() === "scheduled" ||
          v.status?.toLowerCase() === "programada" ||
          v.status?.toLowerCase() === "pendiente" ||
          v.status?.toLowerCase() === "asignada"
      ).length,
    [viewings]
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <Navbar activeTab="inicio" />

      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ── Encabezado de Bienvenida ────────────────── */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.5px] text-[#222222] mb-1">
              Panel de inicio
            </h1>
            <p className="text-[14px] text-[#6a6a6a]">
              Bienvenido,{" "}
              <span className="font-semibold text-[#222222]">
                {user.name || user.email}
              </span>
              . Resumen operativo en tiempo real de tu red inmobiliaria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                role === "ADMIN"
                  ? "bg-[#222222] text-white"
                  : role === "GERENTE"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              Rol: {role || "AGENTE"}
            </span>
          </div>
        </div>

        {/* ── KPI Strip ─────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb]">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Propiedades</p>
            <p className="text-[24px] font-semibold text-[#222222]">
              {properties.length}
            </p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb]">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Leads activos</p>
            <p className="text-[24px] font-semibold text-[#222222]">
              {activeLeads}
            </p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb]">
            <p className="text-[13px] text-[#6a6a6a] mb-1">
              Visitas pendientes
            </p>
            <p className="text-[24px] font-semibold text-[#222222]">
              {upcomingViewings}
            </p>
          </div>
          <div className="rounded-[12px] bg-white p-5 border border-[#ebebeb]">
            <p className="text-[13px] text-[#6a6a6a] mb-1">Valor portafolio</p>
            <p className="text-[24px] font-semibold text-[#222222]">
              {fmtPrice(totalValue)}
            </p>
          </div>
        </div>

        {/* ── SECTION: Propiedades ───────────────────── */}
        <section style={{ marginBottom: "var(--rh-section-gap)" }}>
          <SectionHeader
            icon={<IconBuilding />}
            title="Propiedades"
            count={properties.length}
            linkHref="/properties"
          />

          {properties.length === 0 ? (
            <EmptyRow message="No hay propiedades registradas aún." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {properties.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>

        {/* ── SECTION: Leads ────────────────────────── */}
        <section style={{ marginBottom: "var(--rh-section-gap)" }}>
          <SectionHeader
            icon={<IconTarget />}
            title="Leads"
            count={leads.length}
            linkHref="/leads"
          />

          {leads.length === 0 ? (
            <EmptyRow message="Aún no se han captado prospectos." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {leads.map((l) => (
                <LeadCard key={l.id} l={l} />
              ))}
            </div>
          )}
        </section>

        {/* ── SECTION: Visitas ──────────────────────── */}
        <section style={{ marginBottom: "var(--rh-section-gap)" }}>
          <SectionHeader
            icon={<IconCalendar />}
            title="Visitas"
            count={viewings.length}
            linkHref="/viewings"
          />

          {viewings.length === 0 ? (
            <EmptyRow message="No hay visitas agendadas." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {viewings.map((v) => (
                <ViewingCard key={v.id} v={v} />
              ))}
            </div>
          )}
        </section>

        {/* ── SECTION: Personal (RBAC: Solo GERENTE o ADMIN) ──── */}
        {isManagerOrAdmin && (
          <section style={{ marginBottom: "var(--rh-section-gap)" }}>
            <SectionHeader
              icon={<IconUsers />}
              title="Personal"
              count={users.length}
              linkHref="/users"
            />

            {users.length === 0 ? (
              <EmptyRow message="No hay miembros en el equipo." />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {users.map((u) => (
                  <UserCard key={u.id} u={u} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Footer ────────────────────────────────── */}
        <footer className="py-10 border-t border-[#ebebeb] mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6a6a6a]">
              © {new Date().getFullYear()} RealtyHub. Todos los derechos
              reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Soporte
              </span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Privacidad
              </span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Términos
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Componente Principal de Inicio ─────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Estados de datos
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // 1. Lectura del Estado de Sesión en el cliente y sincronización
  useEffect(() => {
    function readSession() {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error al leer sesión:", err);
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    readSession();

    // Sincronizar en tiempo real con cambios entre pestañas y eventos locales de auth
    window.addEventListener("storage", readSession);
    window.addEventListener("realtyhub_auth_changed", readSession);

    return () => {
      window.removeEventListener("storage", readSession);
      window.removeEventListener("realtyhub_auth_changed", readSession);
    };
  }, []);

  // 2. Carga Condicional de Datos según autenticación
  useEffect(() => {
    if (isAuthLoading) return;

    let isMounted = true;
    setIsDataLoading(true);

    async function loadData() {
      try {
        if (!user) {
          // VISTA PÚBLICA (Invitado): Fetch EXCLUSIVO a propiedades
          // Protege datos sensibles: NO se llama a /leads, /viewings ni /users
          const res = await fetch(`${GATEWAY}/properties`, { cache: "no-store" });
          if (res.ok && isMounted) {
            const data: Property[] = await res.json();
            setProperties(Array.isArray(data) ? data : []);
          }
          if (isMounted) {
            setLeads([]);
            setViewings([]);
            setUsers([]);
          }
        } else {
          // VISTA PRIVADA (Autenticado): Fetch al Dashboard operativo
          const role = user.role?.toUpperCase();
          const isManagerOrAdmin = role === "GERENTE" || role === "ADMIN";

          // Peticiones paralelas
          const promises: [
            Promise<Response>,
            Promise<Response>,
            Promise<Response>,
            Promise<Response> | Promise<null>
          ] = [
            fetch(`${GATEWAY}/properties`, { cache: "no-store" }),
            fetch(`${GATEWAY}/leads`, { cache: "no-store" }),
            fetch(`${GATEWAY}/viewings`, { cache: "no-store" }),
            isManagerOrAdmin
              ? fetch(`${GATEWAY}/users`, { cache: "no-store" })
              : Promise.resolve(null),
          ];

          const [propRes, leadRes, viewRes, userRes] = await Promise.all(promises);

          if (isMounted) {
            if (propRes.ok) {
              const propData = await propRes.json();
              setProperties(Array.isArray(propData) ? propData : []);
            }
            if (leadRes.ok) {
              const leadData = await leadRes.json();
              setLeads(Array.isArray(leadData) ? leadData : []);
            }
            if (viewRes.ok) {
              const viewData = await viewRes.json();
              setViewings(Array.isArray(viewData) ? viewData : []);
            }
            if (userRes && userRes.ok) {
              const userData = await userRes.json();
              setUsers(Array.isArray(userData) ? userData : []);
            } else {
              setUsers([]);
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar datos en la página de inicio:", err);
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading]);

  // 3. Manejo de estado de carga para evitar hydration mismatch y parpadeos
  if (isAuthLoading) {
    return <LoadingSkeleton />;
  }

  // 4. Renderizado Condicional: Pública vs Dashboard Interno con RBAC
  if (!user) {
    return (
      <PublicLandingView
        properties={properties}
        isLoading={isDataLoading}
      />
    );
  }

  return (
    <InternalDashboardView
      user={user}
      properties={properties}
      leads={leads}
      viewings={viewings}
      users={users}
    />
  );
}