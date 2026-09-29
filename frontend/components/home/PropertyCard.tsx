"use client";

/* ─────────────────────────────────────────────────────────────
   PropertyCard — Tarjeta estilo Airbnb
   Imagen cuadrada · corazón de favorito · encabezado · precio · calificación
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import ImageSlider from "@/components/ImageSlider";
import {
  cardHeading,
  fmtPrice,
  getPropertyImages,
  type PublicProperty,
} from "@/lib/property";

interface PropertyCardProps {
  property: PublicProperty;
  isFavorite: boolean;
  onToggleFavorite: (id: string | number) => void;
  /** Muestra "/ mes" junto al precio en la sección de alquiler. */
  priceSuffix?: string;
}

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
    >
      <path
        d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
        fill={filled ? "#ff385c" : "rgba(0,0,0,0.5)"}
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="12" height="12" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
      <path d="M15.1 1.58l-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z" />
    </svg>
  );
}

export default function PropertyCard({
  property: p,
  isFavorite,
  onToggleFavorite,
  priceSuffix,
}: PropertyCardProps) {
  const heading = cardHeading(p);
  // Si el encabezado ya es el título, el subtítulo muestra la dirección.
  const subtitle = p.title && p.title !== heading ? p.title : p.address;

  return (
    <article className="group relative">
      <Link href={`/properties/${p.id}`} className="block no-underline text-inherit">
        <div className="relative aspect-square rounded-[14px] overflow-hidden bg-[#f0f0f0]">
          <ImageSlider images={getPropertyImages(p)} alt={p.title || p.address} />
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-[#222222] truncate leading-snug">
            {heading}
          </h3>
          <span className="shrink-0 flex items-center gap-1 text-[14px] text-[#222222]">
            <IconStar />
            {typeof p.rating === "number" ? p.rating.toFixed(2) : "Nuevo"}
          </span>
        </div>
        <p className="text-[14px] text-[#6a6a6a] truncate leading-snug">{subtitle}</p>
        <p className="mt-1.5 text-[15px] text-[#222222]">
          <span className="font-semibold">{fmtPrice(p.price)}</span>
          {priceSuffix && <span className="text-[#6a6a6a]"> {priceSuffix}</span>}
        </p>
      </Link>

      {/* El botón queda fuera del <Link> para no anidar elementos interactivos */}
      <button
        type="button"
        onClick={() => onToggleFavorite(p.id)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        className="absolute top-3 right-3 p-1 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
      >
        <IconHeart filled={isFavorite} />
      </button>
    </article>
  );
}
