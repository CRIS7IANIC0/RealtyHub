"use client";

/* ─────────────────────────────────────────────────────────────
   PropertiesClient — Client Component
   Full property catalog UI + manages CreatePropertyModal
   Soporte RBAC y Protección de Datos:
   - Usuarios autenticados (user !== null): visualizan métricas
     administrativas (Total, Disponibles, Vendidas, Valor Portafolio)
     y el botón "+ Nueva Propiedad" + selector de cambio de estado.
   - Usuarios públicos (user === null): vista de catálogo limpio,
     sin métricas internas ni botones administrativos.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreatePropertyModal from "@/components/properties/CreatePropertyModal";
import Navbar from "@/components/Navbar";

// ─── Types ──────────────────────────────────────────────────
interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  office_id?: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  status: string;
  images?: string[];
  image_url?: string;
}

// ─── Helpers ────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function statusStyle(status: string): { bg: string; text: string; label: string; dot: string } {
  switch (status?.toLowerCase()) {
    case "available":
    case "disponible":
      return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Disponible", dot: "bg-emerald-500" };
    case "reserved":
    case "reservada":
      return { bg: "bg-amber-50", text: "text-amber-700", label: "Reservada", dot: "bg-amber-500" };
    case "sold":
    case "vendida":
      return { bg: "bg-rose-50", text: "text-rose-700", label: "Vendida", dot: "bg-rose-500" };
    default:
      return { bg: "bg-[#f7f7f7]", text: "text-[#6a6a6a]", label: status || "—", dot: "bg-[#b0b0b0]" };
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

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d1d1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function PropertyCard({
  property,
  onStatusUpdated,
  isAuth,
}: {
  property: Property;
  onStatusUpdated: (id: string, newStatus: string) => void;
  isAuth: boolean;
}) {
  const [currentStatus, setCurrentStatus] = useState(property.status || "Disponible");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const badge = statusStyle(currentStatus);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus || isUpdating || !isAuth) return;
    setIsUpdating(true);
    const prevStatus = currentStatus;
    setCurrentStatus(newStatus);

    try {
      const res = await fetch(`http://localhost:3000/properties/${property.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Error al actualizar estado");
      }
      onStatusUpdated(property.id, newStatus);
      router.refresh();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setCurrentStatus(prevStatus);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="rounded-[16px] bg-white overflow-hidden transition-all duration-300 hover:shadow-md border border-[#ebebeb] flex flex-col justify-between group">
      <Link href={`/properties/${property.id}`} className="block no-underline flex-1">
        {/* Image (4:3 aspect ratio) */}
        <div className="relative aspect-4/3 bg-[#ebebeb] overflow-hidden">
          {(property.images && property.images.length > 0) || property.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={property.images && property.images.length > 0 ? property.images[0] : property.image_url}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement?.classList.add("flex", "items-center", "justify-center");
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <IconImage />
            </div>
          )}

          {/* Status pill badge with dot */}
          <span
            className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-xs ${badge.bg} ${badge.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>

        {/* Details */}
        <div className="p-4">
          <p className="text-[15px] font-semibold text-[#222222] truncate group-hover:text-[#ff385c] transition-colors">
            {property.title}
          </p>

          <div className="flex items-center gap-1.5 mt-1.5">
            <IconMapPin />
            <p className="text-[13px] text-[#6a6a6a] truncate">
              {property.address}
            </p>
          </div>

          {property.description && (
            <p className="text-[12px] text-[#888888] line-clamp-2 mt-2 leading-relaxed">
              {property.description}
            </p>
          )}
        </div>
      </Link>

      {/* Footer / Price & Actions */}
      <div className="px-4 pb-4 pt-3 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] text-[#888888] block uppercase tracking-wider font-medium">
            Precio
          </span>
          <p className="text-[15px] font-bold text-[#222222]">
            {fmtPrice(property.price)}
          </p>
        </div>

        {/* Selector de estado SOLO para usuarios autenticados / Botón Ver Detalle para públicos */}
        {isAuth ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <select
              value={currentStatus}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-[12px] font-medium rounded-full border border-[#ebebeb] px-3 py-1 bg-white text-[#222222] hover:border-[#222222] transition-colors cursor-pointer outline-none focus:border-[#222222] disabled:opacity-50"
              title="Cambiar estado de la propiedad"
            >
              <option value="Disponible">Disponible</option>
              <option value="Reservada">Reservada</option>
              <option value="Vendida">Vendida</option>
            </select>
          </div>
        ) : (
          <Link
            href={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#ff385c] hover:bg-[#ff385c]/10 px-3 py-1 rounded-full transition-colors no-underline border border-[#ff385c]/20"
          >
            Ver Detalle
            <span>→</span>
          </Link>
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
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-white p-5 border border-[#ebebeb] shadow-xs">
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

export default function PropertiesClient({
  properties,
}: {
  properties: Property[];
}) {
  const [propertiesList, setPropertiesList] = useState<Property[]>(properties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Estado de sesión y autenticación
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function loadUser() {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }

    loadUser();

    // Sincronización en tiempo real
    window.addEventListener("storage", loadUser);
    window.addEventListener("realtyhub_auth_changed", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("realtyhub_auth_changed", loadUser);
    };
  }, []);

  const handleStatusUpdated = (id: string, newStatus: string) => {
    setPropertiesList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  /* Filter */
  const filtered = propertiesList.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || p.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  /* KPIs Administrativos (Solo para usuarios autenticados) */
  const totalValue = propertiesList.reduce((s, p) => s + (p.price || 0), 0);
  const disponibles = propertiesList.filter(
    (p) => p.status?.toLowerCase() === "disponible" || p.status?.toLowerCase() === "available"
  ).length;
  const vendidas = propertiesList.filter(
    (p) => p.status?.toLowerCase() === "vendida" || p.status?.toLowerCase() === "sold"
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV — Sticky Airbnb / SaaS Design System
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="properties" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ── Breadcrumb ─────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          <a
            href="/"
            className="flex items-center gap-1 text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors no-underline font-medium"
          >
            <IconChevronLeft />
            Inicio
          </a>
          <span className="text-[13px] text-[#ebebeb]">/</span>
          <span className="text-[13px] text-[#222222] font-semibold">
            Propiedades
          </span>
        </div>

        {/* ── Page header ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-white border border-[#ebebeb] shadow-2xs">
              <IconBuilding />
            </div>
            <div>
              <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#222222]">
                Catálogo de Propiedades
              </h1>
              <p className="text-[14px] text-[#6a6a6a] mt-0.5">
                {user
                  ? "Gestiona los inmuebles, disponibilidad y valores de tu portafolio."
                  : "Explora las propiedades residenciales y comerciales disponibles."}
              </p>
            </div>
          </div>

          {/* Botón "+ Nueva Propiedad" SOLO para usuarios autenticados */}
          {user && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff385c] hover:bg-[#e00b41] px-5 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 shadow-sm hover:shadow cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <IconPlus />
              Nueva Propiedad
            </button>
          )}
        </div>

        {/* ── KPI Strip (Métricas Administrativas SOLO para usuarios autenticados) ── */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Stat label="Total Inmuebles" value={propertiesList.length} />
            <Stat label="Disponibles" value={disponibles} accent />
            <Stat label="Vendidas" value={vendidas} />
            <Stat label="Valor Portafolio" value={fmtPrice(totalValue)} />
          </div>
        )}

        {/* ── Filters bar ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="flex items-center gap-2.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2.5 flex-1 max-w-[420px] focus-within:border-[#222222] transition-colors shadow-2xs">
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar por título, dirección o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[14px] text-[#222222] placeholder:text-[#999999] w-full"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[#6a6a6a] hover:text-[#222222] cursor-pointer text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {[
              { value: "all", label: "Todos" },
              { value: "disponible", label: "Disponibles" },
              { value: "reservada", label: "Reservadas" },
              { value: "vendida", label: "Vendidas" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all cursor-pointer border ${
                  filterStatus === f.value
                    ? "bg-[#222222] text-white border-[#222222] shadow-xs"
                    : "bg-white text-gray-600 border-[#ebebeb] hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Property Grid ──────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[16px] bg-white border border-[#ebebeb] py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4 text-2xl">
              🏠
            </div>
            <p className="text-[16px] font-semibold text-[#222222] mb-1">
              {search || filterStatus !== "all"
                ? "No se encontraron propiedades con esos filtros."
                : "No hay propiedades registradas aún."}
            </p>
            {!search && filterStatus === "all" && (
              <p className="text-[13px] text-[#6a6a6a]">
                {user ? (
                  <>
                    Usa el botón{" "}
                    <span className="font-semibold text-[#ff385c]">
                      + Nueva Propiedad
                    </span>{" "}
                    para registrar tu primer inmueble.
                  </>
                ) : (
                  "Pronto se publicarán nuevas propiedades en el catálogo."
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onStatusUpdated={handleStatusUpdated}
                isAuth={!!user}
              />
            ))}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────── */}
        <footer className="py-10 border-t border-[#ebebeb] mt-16">
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

      {/* ── Modal (Solo activo si está logueado) ──────── */}
      {user && (
        <CreatePropertyModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
      )}
    </div>
  );
}
