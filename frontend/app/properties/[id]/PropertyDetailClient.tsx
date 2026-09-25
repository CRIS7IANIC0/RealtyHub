"use client";

/* ─────────────────────────────────────────────────────────────
   PropertyDetailClient — Client Component
   Vista de Detalle de Propiedad Estilo Airbnb
   - Hero Section con imagen grande de alto impacto
   - Columna izquierda (2/3): Título, Ubicación, Descripción, Especificaciones
   - Columna derecha (1/3): Sticky Booking Card flotante
   - Flujo comercial: POST /leads -> POST /viewings (Pool 'Pendiente')
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import type { Property } from "../page";
import { GATEWAY } from "@/lib/config";

// ─── Helpers ────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function statusBadge(status: string): { bg: string; text: string; label: string; dot: string; border: string } {
  switch (status?.toLowerCase()) {
    case "available":
    case "disponible":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        label: "Disponible para Visita",
        dot: "bg-emerald-500",
      };
    case "reserved":
    case "reservada":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        label: "En Proceso / Reservada",
        dot: "bg-amber-500",
      };
    case "sold":
    case "vendida":
      return {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-200",
        label: "Vendida",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-[#f7f7f7]",
        text: "text-[#6a6a6a]",
        border: "border-[#ebebeb]",
        label: status || "Registrada",
        dot: "bg-[#b0b0b0]",
      };
  }
}

// ─── SVG Icons ──────────────────────────────────────────────

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff385c] shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCheckShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff385c] shrink-0">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff385c] shrink-0">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHandshake() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff385c] shrink-0">
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-4 4" />
      <path d="m18 10 1-1a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0l-1 1" />
      <path d="M7 10.8 11.2 15" />
      <path d="m2 14 5.3-5.3a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L6 18" />
    </svg>
  );
}

function IconImagePlaceholder() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d1d1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff385c]">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Componente Principal ───────────────────────────────────

export default function PropertyDetailClient({
  propertyId,
  property: initialProperty,
}: {
  propertyId: string;
  property?: Property;
}) {
  const [property, setProperty] = useState<Property | null>(initialProperty || null);
  const [loading, setLoading] = useState<boolean>(!initialProperty);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estados del Formulario de Agendamiento
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Estados de la Galería de Imágenes
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialProperty) return;
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    fetch(`${GATEWAY}/properties/${propertyId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || `Inmueble no encontrado (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setProperty(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error al cargar propiedad:", err);
          setFetchError(err.message || "No se pudo cargar la propiedad.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [propertyId, initialProperty]);

  // Orquestación Asíncrona: Lead + Viewing en Pool
  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !scheduledAt) {
      setError("Por favor completa todos los campos del formulario.");
      return;
    }

    if (!property) return;

    setSubmitting(true);

    try {
      // 1. POST /leads con datos del cliente y propiedad
      const leadRes = await fetch(`${GATEWAY}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          property_id: property.id,
          source: "Web",
          status: "Nuevo",
        }),
      });

      if (!leadRes.ok) {
        const errData = await leadRes.json().catch(() => null);
        throw new Error(errData?.message || "Error al registrar tus datos de contacto.");
      }

      const leadData = await leadRes.json();
      const leadId = leadData.id;

      if (!leadId) {
        throw new Error("No se pudo obtener el identificador de registro de contacto.");
      }

      // 2. POST /viewings con property_id, lead_id y scheduled_at (sin agent_id -> 'Pendiente')
      const isoDate = new Date(scheduledAt).toISOString();
      const viewingRes = await fetch(`${GATEWAY}/viewings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          lead_id: leadId,
          scheduled_at: isoDate,
          status: "Pendiente",
        }),
      });

      if (!viewingRes.ok) {
        const errData = await viewingRes.json().catch(() => null);
        throw new Error(
          errData?.message ||
          "La propiedad ya cuenta con una visita agendada en ese horario. Por favor selecciona otra hora."
        );
      }

      // 3. Confirmación exitosa
      setSuccessMessage(
        "¡Visita solicitada con éxito! Tu cita ha ingresado a nuestra agenda en el pool de agentes y un asesor se pondrá en contacto contigo a la brevedad."
      );
      setName("");
      setEmail("");
      setPhone("");
      setScheduledAt("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado al solicitar tu visita.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#222222] placeholder:text-gray-400 outline-none transition-colors focus:border-[#222222]";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <Navbar activeTab="properties" />
        <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8 animate-pulse">
          <div className="h-5 w-48 bg-gray-200 rounded-md mb-6" />
          <div className="w-full h-[340px] sm:h-[440px] md:h-[500px] rounded-2xl md:rounded-3xl bg-gray-200 mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-10 w-3/4 bg-gray-200 rounded-lg" />
              <div className="h-6 w-1/2 bg-gray-200 rounded-lg" />
              <div className="h-12 w-44 bg-gray-200 rounded-lg" />
              <div className="h-40 w-full bg-gray-200 rounded-2xl" />
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (fetchError || !property) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <Navbar activeTab="properties" />
        <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-[#222222]">
            {fetchError || "Propiedad no encontrada"}
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md">
            El inmueble con ID <span className="font-mono text-gray-700">{propertyId}</span> no existe o fue retirado del catálogo.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e00b41] text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm"
          >
            ← Volver al catálogo de propiedades
          </Link>
        </main>
      </div>
    );
  }

  const badge = statusBadge(property.status);
  const imageList: string[] =
    property.images && property.images.length > 0
      ? property.images
      : property.image_url
      ? [property.image_url]
      : [];

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV — Airbnb / SaaS Sticky Header
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="properties" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ── Breadcrumb de Navegación ── */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-900 transition-colors no-underline font-medium"
          >
            <IconChevronLeft />
            Inicio
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href="/properties"
            className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors no-underline font-medium"
          >
            Propiedades
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[13px] text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-none">
            {property.title}
          </span>
        </div>

        {/* ══════════════════════════════════════════════
            HERO SECTION — Galería Fotográfica Estilo Airbnb
            ══════════════════════════════════════════════ */}
        <section className="relative w-full h-[340px] sm:h-[440px] md:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200 mb-10 shadow-xs bg-gray-100">
          {imageList.length === 0 ? (
            /* Estado Sin Imágenes */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
              <IconImagePlaceholder />
              <p className="text-sm font-medium mt-2">Fotografía no disponible</p>
            </div>
          ) : imageList.length === 1 ? (
            /* 1 Imagen: 100% de Ancho */
            <div
              className="relative w-full h-full cursor-pointer group"
              onClick={() => {
                setSelectedImageIndex(0);
                setGalleryOpen(true);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageList[0]}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement?.classList.add("flex", "items-center", "justify-center");
                }}
              />
            </div>
          ) : (
            /* >1 Imágenes: Layout de Grid Estilo Airbnb (50% Principal + 50% Secundarias 2x2) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full w-full">
              {/* Lado Izquierdo (50%): Imagen Principal Grande */}
              <div
                className="relative w-full h-full overflow-hidden bg-gray-200 cursor-pointer group"
                onClick={() => {
                  setSelectedImageIndex(0);
                  setGalleryOpen(true);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageList[0]}
                  alt={`${property.title} - Principal`}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              </div>

              {/* Lado Derecho (50%): Grid 2x2 de Imágenes Secundarias (hasta 4 adicionales) */}
              <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-2 h-full w-full">
                {imageList.slice(1, 5).map((img, idx) => {
                  const imageIdx = idx + 1;
                  const isFourthSlot = idx === 3;
                  const extraCount = imageList.length - 5;
                  const showMoreOverlay = isFourthSlot && extraCount > 0;

                  // Ajuste de span si hay menos de 4 fotos secundarias
                  let cellSpan = "";
                  if (imageList.length === 2) {
                    cellSpan = "col-span-2 row-span-2";
                  } else if (imageList.length === 3) {
                    cellSpan = "col-span-2 row-span-1";
                  } else if (imageList.length === 4 && idx === 0) {
                    cellSpan = "col-span-2 row-span-1";
                  }

                  return (
                    <div
                      key={idx}
                      className={`relative w-full h-full overflow-hidden bg-gray-200 cursor-pointer group ${cellSpan}`}
                      onClick={() => {
                        setSelectedImageIndex(imageIdx);
                        setGalleryOpen(true);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${property.title} - Foto ${imageIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {showMoreOverlay && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-base cursor-pointer hover:bg-black/70 transition-colors">
                          +{extraCount + 1} fotos
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badge Flotante de Disponibilidad sobre la Imagen */}
          <div className="absolute top-5 left-5 z-10 pointer-events-none">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>

          {/* Pill de ID de Referencia */}
          <div className="absolute top-5 right-5 z-10 hidden sm:block pointer-events-none">
            <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-mono">
              Ref: {property.id.slice(0, 8)}
            </span>
          </div>

          {/* Botón Flotante "Ver todas las fotos" estilo Airbnb */}
          {imageList.length > 1 && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                type="button"
                onClick={() => {
                  setSelectedImageIndex(0);
                  setGalleryOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-md backdrop-blur-md border border-gray-200 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <IconGrid />
                <span>Ver las {imageList.length} fotos</span>
              </button>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            GRID DIVIDIDO (2/3 Información - 1/3 Reserva Flotante)
            ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* ──────────────────────────────────────────
              COLUMNA IZQUIERDA (2/3): INFORMACIÓN DEL INMUEBLE
              ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Título, Dirección y Precio */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff385c]/10 text-[#ff385c] text-[12px] font-bold mb-3">
                <IconSparkles />
                <span>Propiedad Exclusiva RealtyHub</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#222222] leading-tight">
                {property.title}
              </h1>

              <div className="flex items-center gap-2 text-gray-600 mt-3 text-base">
                <IconMapPin />
                <span className="font-medium">{property.address}</span>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-[#222222]">
                  {fmtPrice(property.price)}
                </span>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  COP · Precio Oficial
                </span>
              </div>
            </div>

            {/* Separador */}
            <div className="h-px bg-gray-200" />

            {/* Beneficios Inmobiliarios Airbnb Style */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff385c]/10 flex items-center justify-center shrink-0">
                  <IconCheckShield />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Propiedad 100% Verificada
                  </h3>
                  <p className="text-[13px] text-gray-600 mt-0.5">
                    Certificado de libertad y tradición verificado por el equipo legal de RealtyHub.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff385c]/10 flex items-center justify-center shrink-0">
                  <IconClock />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Visita Guiada Inmediata
                  </h3>
                  <p className="text-[13px] text-gray-600 mt-0.5">
                    Solicita tu recorrido presencial y uno de nuestros agentes dedicados se pondrá a tu disposición.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff385c]/10 flex items-center justify-center shrink-0">
                  <IconHandshake />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Acompañamiento sin Costo
                  </h3>
                  <p className="text-[13px] text-gray-600 mt-0.5">
                    No cobramos comisiones adicionales ni tarifas de reserva para visitar este inmueble.
                  </p>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="h-px bg-gray-200" />

            {/* Descripción Extensa */}
            <div>
              <h2 className="text-[22px] font-bold text-[#222222] mb-4">
                Acerca de este inmueble
              </h2>
              <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap font-normal">
                {property.description ||
                  "Hermosa propiedad ubicada en un sector privilegiado con fácil acceso a vías principales, zonas comerciales y transporte público. Cuenta con acabados modernos, excelente iluminación natural y distribución óptima de los espacios."}
              </p>
            </div>

            {/* Cuadrícula de Especificaciones Básicas */}
            <div className="rounded-2xl bg-white border border-gray-200 p-6 grid grid-cols-2 sm:grid-cols-3 gap-6 shadow-2xs">
              <div>
                <p className="text-xs uppercase font-bold text-gray-400">Tipo</p>
                <p className="text-[14px] font-semibold text-gray-900 mt-1">Residencial</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-gray-400">Disponibilidad</p>
                <p className="text-[14px] font-semibold text-emerald-700 mt-1">Inmediata</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-gray-400">Gestión</p>
                <p className="text-[14px] font-semibold text-gray-900 mt-1">Exclusiva RealtyHub</p>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────
              COLUMNA DERECHA (1/3): TARJETA FLOTANTE STICKY (BOOKING CARD)
              ────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-lg">
              {/* Encabezado de la Tarjeta Flotante */}
              <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#222222]">
                    {fmtPrice(property.price)}
                  </span>
                  <span className="text-xs text-gray-500 font-medium block">
                    Valor total de publicación
                  </span>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                  {property.status || "Disponible"}
                </span>
              </div>

              {/* Mensaje de Éxito */}
              {successMessage && (
                <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-[13px] leading-relaxed flex items-start gap-2.5">
                  <span className="text-emerald-600 text-lg">✓</span>
                  <div>
                    <p className="font-bold">¡Visita solicitada!</p>
                    <p className="mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Mensaje de Error */}
              {error && (
                <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-[13px] leading-relaxed flex items-start gap-2.5">
                  <span className="text-rose-600 text-lg">⚠</span>
                  <div>
                    <p className="font-bold">Error en la solicitud</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Formulario de Agendamiento Público */}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tu Nombre Completo <span className="text-[#ff385c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Camila Morales"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>

                <div className="text-left">
                  <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Correo Electrónico <span className="text-[#ff385c]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="camila@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>

                <div className="text-left">
                  <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp <span className="text-[#ff385c]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+57 300 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>

                <div className="text-left">
                  <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Fecha y Hora Deseada <span className="text-[#ff385c]">*</span></span>
                    <IconCalendar />
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>

                {/* Botón de Envío Prominente Estilo Airbnb */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white py-3.5 px-6 font-bold text-[15px] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Agendando Visita...</span>
                    </>
                  ) : (
                    <span>Agendar Visita</span>
                  )}
                </button>

                {/* Nota de Confianza */}
                <p className="text-[12px] text-gray-500 text-center mt-3 leading-snug">
                  No se realizará ningún cobro. Tu solicitud se asignará a un asesor disponible de nuestro pool comercial.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <footer className="py-12 border-t border-gray-200 mt-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-gray-500">
              © {new Date().getFullYear()} RealtyHub. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                Soporte
              </span>
              <span className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                Privacidad
              </span>
              <span className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                Términos
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* ══════════════════════════════════════════════
          MODAL LIGHTBOX FULLSCREEN — Galería Airbnb
          ══════════════════════════════════════════════ */}
      {galleryOpen && imageList.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col justify-between p-4 sm:p-8 backdrop-blur-md select-none"
          onClick={() => setGalleryOpen(false)}
        >
          {/* Barra Superior */}
          <div
            className="flex items-center justify-between text-white pb-3 max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wide text-gray-300">
                {selectedImageIndex + 1} / {imageList.length}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-sm text-gray-400 font-medium truncate max-w-[280px] sm:max-w-md">
                {property.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar galería"
            >
              <IconX />
            </button>
          </div>

          {/* Visualizador Central de la Foto */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto overflow-hidden py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Anterior */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? imageList.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 sm:left-4 z-10 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
                title="Foto anterior"
              >
                <IconChevronLeft />
              </button>
            )}

            {/* Foto Actual */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageList[selectedImageIndex]}
              alt={`${property.title} - ${selectedImageIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {/* Botón Siguiente */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev === imageList.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 sm:right-4 z-10 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
                title="Siguiente foto"
              >
                <IconChevronRight />
              </button>
            )}
          </div>

          {/* Tira Inferior de Miniaturas */}
          {imageList.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 pt-4 max-w-4xl w-full mx-auto overflow-x-auto pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer border-2 ${
                    idx === selectedImageIndex
                      ? "border-[#ff385c] scale-105 opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
