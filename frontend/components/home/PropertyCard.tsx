"use client";

/* ─────────────────────────────────────────────────────────────
   PropertyCard — tarjeta editorial
   Foto vertical grande · etiqueta de operación · encabezado en display ·
   precio en terracota (el único lugar donde el acento aparece en el catálogo).
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import ImageSlider from "@/components/ImageSlider";
import {
  cardHeading,
  fmtPrice,
  getPropertyImages,
  isRental,
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
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
        fill={filled ? "#c4584c" : "none"}
        stroke={filled ? "#c4584c" : "#1e1c1a"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
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
  const subtitle = p.title && p.title !== heading ? p.title : p.address;
  const rental = isRental(p);

  return (
    <article className="group relative">
      <Link href={`/properties/${p.id}`} data-cursor="Ver" className="block no-underline text-inherit">
        <div className="img-clip relative aspect-[4/3] rounded-md overflow-hidden bg-[#ece6dc]">
          <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
            <ImageSlider images={getPropertyImages(p)} alt={p.title || p.address} />
          </div>
          <span className="absolute top-3 left-3 rounded-full bg-[#faf8f4]/95 px-3 py-1 text-[12px] font-medium text-[#1e1c1a]">
            {rental ? "En alquiler" : "En venta"}
          </span>
        </div>

        <div className="mt-4">
          <h3 className="font-display text-[22px] font-light leading-tight tracking-[-0.02em] text-[#1e1c1a] truncate">
            {heading}
          </h3>
          <p className="text-[14px] text-[#6b655e] truncate mt-0.5">{subtitle}</p>
          <p className="mt-3 pt-3 border-t border-[#e2dcd2] flex items-baseline gap-1.5">
            <span className="font-display text-[20px] font-medium tracking-[-0.01em] text-[#a64739] tabular">
              {fmtPrice(p.price)}
            </span>
            {priceSuffix && <span className="text-[13px] text-[#6b655e]">{priceSuffix}</span>}
          </p>
        </div>
      </Link>

      {/* Fuera del <Link> para no anidar elementos interactivos */}
      <button
        type="button"
        onClick={() => onToggleFavorite(p.id)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-[#faf8f4]/95 cursor-pointer transition-transform hover:scale-110 active:scale-90"
      >
        <IconHeart filled={isFavorite} />
      </button>
    </article>
  );
}
