"use client";

/* ─────────────────────────────────────────────────────────────
   PropertiesClient — catálogo de propiedades.
   Misma lógica de antes (sesión, RBAC, cambio de estado, modal de creación);
   cambia solo la presentación:
   - Banda oscura con título grande, contador y buscador.
   - Filtros por operación, tipo y estado + orden por precio.
   - Rejilla con una tarjeta destacada grande, inclinación 3D y entrada
     escalonada cada vez que cambia el filtro.
   - Equipo autenticado: métricas, "Nueva propiedad" y selector de estado.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CreatePropertyModal from "@/components/properties/CreatePropertyModal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageSlider from "@/components/ImageSlider";
import ArrowIcon from "@/components/ui/ArrowIcon";
import SplitText from "@/components/ui/SplitText";
import Tilt from "@/components/ui/Tilt";
import { GATEWAY } from "@/lib/config";
import {
  PROPERTY_TYPES,
  STATUSES,
  cardHeading,
  fmtPrice,
  getPropertyImages,
  inferCity,
  inferType,
  isRental,
} from "@/lib/property";

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
  operation?: string | null;
  property_type?: string | null;
  city?: string | null;
}

type Op = "" | "Venta" | "Alquiler";
type Sort = "recent" | "asc" | "desc";

function statusStyle(status: string): { bg: string; text: string; label: string; dot: string } {
  switch (status?.toLowerCase()) {
    case "available":
    case "disponible":
      return { bg: "bg-[#e3efe6]", text: "text-[#2f5d3d]", label: "Disponible", dot: "bg-[#3f8a56]" };
    case "reserved":
    case "reservada":
      return { bg: "bg-[#f6ead2]", text: "text-[#7a5516]", label: "Reservada", dot: "bg-[#c18a2a]" };
    case "sold":
    case "vendida":
      return { bg: "bg-[#f3e2de]", text: "text-[#7a2f25]", label: "Vendida", dot: "bg-[#b04e42]" };
    case "rented":
    case "alquilada":
      return { bg: "bg-[#dfe3ec]", text: "text-[#2c3445]", label: "Alquilada", dot: "bg-[#5b6a8c]" };
    default:
      return { bg: "bg-[#ece6dc]", text: "text-[#6b655e]", label: status || "—", dot: "bg-[#a39d94]" };
  }
}

function IconPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ── Tarjeta ───────────────────────────────────────────────── */
function Card({
  property,
  index,
  big,
  onStatusUpdated,
  isAuth,
}: {
  property: Property;
  index: number;
  big?: boolean;
  onStatusUpdated: (id: string, newStatus: string) => void;
  isAuth: boolean;
}) {
  const [currentStatus, setCurrentStatus] = useState(property.status || "Disponible");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const badge = statusStyle(currentStatus);
  const rental = isRental(property);
  const city = inferCity(property);
  const type = inferType(property);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus || isUpdating || !isAuth) return;
    setIsUpdating(true);
    const prev = currentStatus;
    setCurrentStatus(newStatus);
    try {
      const res = await fetch(`${GATEWAY}/properties/${property.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      onStatusUpdated(property.id, newStatus);
      router.refresh();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setCurrentStatus(prev);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div
      className={`card-in ${big ? "sm:col-span-2" : ""}`}
      style={{ ["--i" as string]: Math.min(index, 8) }}
    >
      <Tilt max={big ? 4 : 7}>
        <article className="group h-full flex flex-col rounded-[10px] bg-[#faf8f4] border border-[#e2dcd2] overflow-hidden shadow-[0_18px_40px_-28px_rgba(30,28,26,0.45)]">
          <Link href={`/properties/${property.id}`} data-cursor="Ver" className="block no-underline text-inherit flex-1">
            <div className={`relative overflow-hidden bg-[#ece6dc] ${big ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
              <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
                <ImageSlider images={getPropertyImages(property)} alt={property.title} />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />

              <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
              <span className="absolute top-3 right-3 text-[12px] font-medium px-3 py-1 rounded-full bg-[#faf8f4]/95 text-[#1e1c1a]">
                {rental ? "En alquiler" : "En venta"}
              </span>

              {big && (
                <p className="absolute left-5 bottom-4 font-display text-[clamp(22px,2.2vw,32px)] text-[#faf8f4] tracking-[-0.03em] pointer-events-none">
                  {fmtPrice(property.price)}
                  {rental && <span className="text-[15px] opacity-80"> / mes</span>}
                </p>
              )}
            </div>

            <div className="p-5">
              <h3 className="font-display text-[20px] leading-tight tracking-[-0.03em] text-[#1e1c1a] truncate">
                {property.title || cardHeading(property)}
              </h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#6b655e] truncate">
                <IconPin />
                <span className="truncate">{property.address}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {type && <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#ece6dc] text-[#433e39]">{type}</span>}
                {city && <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#ece6dc] text-[#433e39]">{city}</span>}
              </div>
              {property.description && (
                <p className="text-[13px] text-[#6b655e] line-clamp-2 mt-3 leading-relaxed">{property.description}</p>
              )}
            </div>
          </Link>

          <div className="px-5 pb-5 pt-4 mt-auto border-t border-[#e2dcd2] flex items-center justify-between gap-3">
            {!big ? (
              <div>
                <span className="text-[12px] text-[#6b655e] block">{rental ? "Canon mensual" : "Precio"}</span>
                <p className="font-display text-[20px] tracking-[-0.02em] text-[#a64739] tabular">
                  {fmtPrice(property.price)}
                  {rental && <span className="text-[13px] text-[#6b655e]"> / mes</span>}
                </p>
              </div>
            ) : (
              <span className="text-[13px] text-[#6b655e]">Destacada del catálogo</span>
            )}

            {isAuth ? (
              <select
                value={currentStatus}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-[13px] font-medium rounded-full border border-[#cfc7ba] px-3.5 py-1.5 bg-[#faf8f4] text-[#1e1c1a] hover:border-[#1e1c1a] transition-colors cursor-pointer outline-none focus:border-[#1e1c1a] disabled:opacity-50"
                title="Cambiar estado de la propiedad"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              <Link
                href={`/properties/${property.id}`}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1e1c1a] hover:text-[#a64739] border-b border-current pb-0.5 no-underline transition-colors"
              >
                Ver detalle <ArrowIcon size={14} />
              </Link>
            )}
          </div>
        </article>
      </Tilt>
    </div>
  );
}

/* ── Chip de filtro ────────────────────────────────────────── */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-300 cursor-pointer border ${
        active
          ? "bg-[#1e1c1a] text-[#faf8f4] border-[#1e1c1a]"
          : "bg-transparent text-[#433e39] border-[#cfc7ba] hover:border-[#1e1c1a]"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Página ────────────────────────────────────────────────── */
export default function PropertiesClient({ properties }: { properties: Property[] }) {
  const [propertiesList, setPropertiesList] = useState<Property[]>(properties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdTitle, setCreatedTitle] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [op, setOp] = useState<Op>("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  useEffect(() => {
    if (!createdTitle) return;
    const t = setTimeout(() => setCreatedTitle(null), 5000);
    return () => clearTimeout(t);
  }, [createdTitle]);

  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    function loadUser() {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
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

  const handleStatusUpdated = (id: string, newStatus: string) => {
    setPropertiesList((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = propertiesList.filter((p) => {
      const matchesSearch =
        !term ||
        p.title?.toLowerCase().includes(term) ||
        p.address?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);
      const matchesStatus = filterStatus === "all" || p.status?.toLowerCase() === filterStatus.toLowerCase();
      const matchesOp = !op || (op === "Alquiler" ? isRental(p) : !isRental(p));
      const matchesType = !typeFilter || inferType(p) === typeFilter;
      return matchesSearch && matchesStatus && matchesOp && matchesType;
    });
    if (sort === "asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [propertiesList, search, filterStatus, op, typeFilter, sort]);

  // Tipos que realmente existen en el catálogo
  const presentTypes = useMemo(
    () => PROPERTY_TYPES.filter((t) => propertiesList.some((p) => inferType(p) === t)),
    [propertiesList]
  );

  const totalValue = propertiesList.reduce((s, p) => s + (p.price || 0), 0);
  const disponibles = propertiesList.filter(
    (p) => p.status?.toLowerCase() === "disponible" || p.status?.toLowerCase() === "available"
  ).length;
  const vendidas = propertiesList.filter(
    (p) => p.status?.toLowerCase() === "vendida" || p.status?.toLowerCase() === "sold"
  ).length;

  const hasFilters = !!search.trim() || filterStatus !== "all" || !!op || !!typeFilter;
  const filterKey = `${op}|${typeFilter}|${filterStatus}|${sort}|${search}`;

  return (
    <div className="min-h-screen bg-[#f3efe8]">
      <Navbar activeTab="properties" />

      {/* Banda oscura: título, contador y buscador */}
      <section className="relative overflow-hidden bg-[#151922] text-[#faf8f4] grain">
        <div aria-hidden="true" className="absolute inset-0 hero-mesh opacity-70" />
        <div className="relative w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-14 pb-12 md:pt-20 md:pb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <SplitText
                as="h1"
                parts={[{ t: "Catálogo de" }, { t: "propiedades", accent: true }]}
                accentClassName="text-[#e7b4a8]"
                className="page-title !text-[clamp(38px,6vw,92px)] !leading-[0.98] !tracking-[-0.05em]"
              />
              <p className="mt-5 text-[17px] text-[#faf8f4]/70 max-w-[46ch]">
                {user
                  ? "Gestiona los inmuebles, su disponibilidad y los valores de tu portafolio."
                  : "Casas, apartamentos y locales con visita agendada en minutos."}
              </p>
            </div>

            <div className="flex items-center gap-5">
              <p className="font-display text-[clamp(44px,6vw,88px)] leading-none tracking-[-0.05em] tabular">
                {String(filtered.length).padStart(2, "0")}
                <span className="block text-[14px] tracking-normal text-[#faf8f4]/60 mt-1 font-sans">
                  {filtered.length === 1 ? "propiedad" : "propiedades"}
                </span>
              </p>
              {user && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  data-magnetic
                  className="inline-flex items-center gap-2 rounded-full bg-[#b04e42] hover:bg-[#933f33] px-6 py-3.5 text-[15px] font-medium text-[#faf8f4] transition-colors duration-300 cursor-pointer"
                >
                  <span className="text-[20px] leading-none -mt-0.5">+</span>
                  Nueva propiedad
                </button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <label className="mt-10 flex items-center gap-3 rounded-full bg-[#faf8f4] text-[#1e1c1a] px-6 py-4 max-w-[760px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] focus-within:ring-2 focus-within:ring-[#e7b4a8] transition-shadow">
            <IconSearch />
            <input
              type="text"
              placeholder="Busca por título, dirección o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[16px] placeholder:text-[#716b63] w-full"
              aria-label="Buscar propiedades"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-[#6b655e] hover:text-[#1e1c1a] cursor-pointer text-[14px]" aria-label="Borrar búsqueda">
                Borrar
              </button>
            )}
          </label>
        </div>
      </section>

      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-10 pb-6">
        {/* Métricas (solo equipo) */}
        {user && (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              ["Total de inmuebles", String(propertiesList.length), false],
              ["Disponibles", String(disponibles), true],
              ["Vendidas", String(vendidas), false],
              ["Valor del portafolio", fmtPrice(totalValue), false],
            ].map(([label, value, accent]) => (
              <div key={label as string} className="rounded-[10px] bg-[#faf8f4] border border-[#e2dcd2] p-5">
                <dt className="text-[13px] text-[#6b655e]">{label}</dt>
                <dd className={`mt-1 font-display text-[clamp(22px,2.2vw,30px)] tracking-[-0.03em] tabular ${accent ? "text-[#a64739]" : ""}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Filtros */}
        <div className="space-y-4 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={op === ""} onClick={() => setOp("")}>Todo</Chip>
            <Chip active={op === "Venta"} onClick={() => setOp("Venta")}>En venta</Chip>
            <Chip active={op === "Alquiler"} onClick={() => setOp("Alquiler")}>En alquiler</Chip>
            <span className="hidden sm:block w-px h-6 bg-[#cfc7ba] mx-2" />
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <Chip active={typeFilter === ""} onClick={() => setTypeFilter("")}>Cualquier tipo</Chip>
              {presentTypes.map((t) => (
                <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? "" : t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {[
                { value: "all", label: "Todos los estados" },
                { value: "disponible", label: "Disponibles" },
                { value: "reservada", label: "Reservadas" },
                { value: "vendida", label: "Vendidas" },
                { value: "alquilada", label: "Alquiladas" },
              ].map((f) => (
                <Chip key={f.value} active={filterStatus === f.value} onClick={() => setFilterStatus(f.value)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[14px] text-[#6b655e]">
              Ordenar
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-full border border-[#cfc7ba] bg-[#faf8f4] px-4 py-2 text-[14px] text-[#1e1c1a] outline-none hover:border-[#1e1c1a] focus:border-[#1e1c1a] cursor-pointer"
              >
                <option value="recent">Más recientes</option>
                <option value="asc">Precio: menor a mayor</option>
                <option value="desc">Precio: mayor a menor</option>
              </select>
            </label>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterStatus("all");
                setOp("");
                setTypeFilter("");
              }}
              className="text-[14px] font-medium text-[#1e1c1a] border-b border-[#1e1c1a] pb-0.5 hover:text-[#a64739] hover:border-[#a64739] cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Rejilla */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[10px] bg-[#ece6dc] py-24 px-8 text-center">
            <svg viewBox="0 0 120 100" width="86" height="72" fill="none" stroke="#716b63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 52 60 10l52 42M22 44v48h76V44M50 92V64h20v28" />
            </svg>
            <p className="font-display text-[26px] tracking-[-0.03em] mt-6">
              {hasFilters ? "Ninguna propiedad coincide con esos filtros." : "Aún no hay propiedades registradas."}
            </p>
            <p className="text-[15px] text-[#6b655e] mt-2 max-w-[44ch]">
              {hasFilters
                ? "Prueba con otra búsqueda o quita algún filtro."
                : user
                ? "Usa «Nueva propiedad» para registrar tu primer inmueble."
                : "Pronto se publicarán nuevas propiedades en el catálogo."}
            </p>
          </div>
        ) : (
          <div key={filterKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {filtered.map((p, i) => (
              <Card
                key={p.id}
                property={p}
                index={i}
                big={i === 0 && filtered.length >= 3}
                onStatusUpdated={handleStatusUpdated}
                isAuth={!!user}
              />
            ))}
          </div>
        )}
      </main>

      <div className="mt-20">
        <Footer dark />
      </div>

      {user && (
        <CreatePropertyModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          onCreated={(created) => {
            setPropertiesList((prev) => [created as Property, ...prev]);
            setCreatedTitle((created as Property).title || "La propiedad");
          }}
        />
      )}

      {createdTitle && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 rounded-full bg-[#1e1c1a] pl-4 pr-3 py-3 text-[#faf8f4] max-w-[calc(100vw-32px)]"
        >
          <span className="flex w-6 h-6 items-center justify-center rounded-full bg-[#3f8a56] shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[14px] font-medium truncate">¡Propiedad «{createdTitle}» creada con éxito!</span>
          <button
            type="button"
            onClick={() => setCreatedTitle(null)}
            aria-label="Cerrar aviso"
            className="w-6 h-6 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
