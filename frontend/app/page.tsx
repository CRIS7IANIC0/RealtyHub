"use client";

/* ─────────────────────────────────────────────────────────────
   RealtyHub — Página de Inicio / Dashboard Principal
   Renderizado condicional basado en estado de autenticación:
   - Invitado (user === null): Landing Comercial público estilo Airbnb
     (CompactHeader con búsqueda + Carrusel + Grid de venta + Grid de alquiler)
   - Autenticado (user !== null): Dashboard Operativo Integral
     (KPIs + Propiedades + Leads + Visitas + Personal con RBAC)
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import WelcomeDoor from "@/components/WelcomeDoor";
import CompactHeader from "@/components/home/CompactHeader";
import PropertyCarousel from "@/components/home/PropertyCarousel";
import PropertyGrid from "@/components/home/PropertyGrid";
import ImageSlider from "@/components/ImageSlider";
import { useFavorites } from "@/lib/useFavorites";
import {
  getPropertyImage,
  getPropertyImages,
  inferType,
  isAvailable,
  isRental,
} from "@/lib/property";

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
  images?: string[];
  image_url?: string;
  operation?: string | null;
  property_type?: string | null;
  city?: string | null;
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

import { GATEWAY } from "@/lib/config";

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
    case "rented":
    case "alquilada":
      return "bg-sky-50 text-sky-700";
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
        <ImageSlider
          images={getPropertyImages(p)}
          alt={p.title || p.address}
          imgClassName="group-hover:scale-105 transition-transform duration-300"
        />
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

const CAROUSEL_MAX = 6;

function PublicLandingView({
  properties,
  isLoading,
}: {
  properties: Property[];
  isLoading: boolean;
}) {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const { isFavorite, toggle } = useFavorites();

  // Sólo se muestran al público los inmuebles Disponibles
  const availableProperties = useMemo(
    () => properties.filter(isAvailable),
    [properties]
  );

  // Carrusel: destacados con foto primero, luego el resto
  const featured = useMemo(
    () =>
      [...availableProperties]
        .sort((a, b) => Number(!!getPropertyImage(b)) - Number(!!getPropertyImage(a)))
        .slice(0, CAROUSEL_MAX),
    [availableProperties]
  );

  // Filtros de la barra de búsqueda (Dónde + Tipo), aplicados en tiempo real
  const filtered = useMemo(() => {
    const term = location.trim().toLowerCase();
    return availableProperties.filter((p) => {
      if (propertyType && inferType(p) !== propertyType) return false;
      if (!term) return true;
      return [p.title, p.address, p.description].some((f) =>
        f?.toLowerCase().includes(term)
      );
    });
  }, [availableProperties, location, propertyType]);

  const forSale = useMemo(() => filtered.filter((p) => !isRental(p)), [filtered]);
  const forRent = useMemo(() => filtered.filter(isRental), [filtered]);

  const hasFilters = location.trim() !== "" || propertyType !== "";

  function scrollToResults() {
    document
      .getElementById("resultados")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <CompactHeader
        location={location}
        onLocationChange={setLocation}
        propertyType={propertyType}
        onPropertyTypeChange={setPropertyType}
        onSearch={scrollToResults}
      />

      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-6 pb-8 space-y-14">
        {/* ── Carrusel principal ─────────────────────── */}
        <PropertyCarousel properties={featured} isLoading={isLoading} />

        <div id="resultados" className="space-y-4 scroll-mt-40 md:scroll-mt-28">
          {hasFilters && !isLoading && (
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#6a6a6a]">
              <span>
                {filtered.length}{" "}
                {filtered.length === 1 ? "resultado" : "resultados"} para tu búsqueda
              </span>
              <button
                type="button"
                onClick={() => {
                  setLocation("");
                  setPropertyType("");
                }}
                className="font-semibold text-[#222222] underline underline-offset-4 hover:text-[#ff385c] cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* ── Sección 1: Propiedades disponibles (venta) ── */}
          <PropertyGrid
            id="propiedades-disponibles"
            title="Propiedades disponibles"
            subtitle="Inmuebles listos para visitar y escriturar."
            properties={forSale}
            isLoading={isLoading}
            emptyMessage={
              hasFilters
                ? "Ninguna propiedad en venta coincide con tu búsqueda."
                : "Por ahora no hay propiedades en venta disponibles. Vuelve pronto."
            }
            isFavorite={isFavorite}
            onToggleFavorite={toggle}
            viewAllHref="/properties"
          />
        </div>

        {/* ── Sección 2: Propiedades para alquiler ────── */}
        <PropertyGrid
          id="propiedades-alquiler"
          title="Propiedades disponibles para alquiler"
          subtitle="Arriendos con disponibilidad inmediata."
          properties={forRent}
          isLoading={isLoading}
          emptyMessage={
            hasFilters
              ? "Ningún alquiler coincide con tu búsqueda."
              : "Por ahora no hay propiedades en alquiler disponibles. Vuelve pronto."
          }
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
          priceSuffix="/ mes"
        />

        {/* ── Footer ────────────────────────────────── */}
        <footer className="pt-10 border-t border-[#ebebeb]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6a6a6a]">
              © {new Date().getFullYear()} RealtyHub. Todos los derechos
              reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors no-underline"
              >
                Acceso para agentes
              </Link>
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

  // 3. Contenido según estado: carga → landing pública → dashboard interno con RBAC
  let content: React.ReactNode;
  if (isAuthLoading) {
    // Manejo de estado de carga para evitar hydration mismatch y parpadeos
    content = <LoadingSkeleton />;
  } else if (!user) {
    content = (
      <PublicLandingView
        properties={properties}
        isLoading={isDataLoading}
      />
    );
  } else {
    content = (
      <InternalDashboardView
        user={user}
        properties={properties}
        leads={leads}
        viewings={viewings}
        users={users}
      />
    );
  }

  // 4. La puerta de bienvenida es solo para visitantes: se monta cuando ya se
  //    leyó la sesión y no hay usuario (tras el login no vuelve a aparecer).
  const showWelcomeDoor = !isAuthLoading && !user;

  return (
    <>
      {showWelcomeDoor && <WelcomeDoor />}
      {content}
    </>
  );
}