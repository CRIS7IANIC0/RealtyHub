"use client";

/* ─────────────────────────────────────────────────────────────
   PropertyGrid — Sección con título + cuadrícula responsiva de PropertyCard
   1 col (móvil) → 2 → 3 → 4 → 5 columnas (pantallas anchas)
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import PropertyCard from "@/components/home/PropertyCard";
import type { PublicProperty } from "@/lib/property";

interface PropertyGridProps {
  id?: string;
  title: string;
  subtitle?: string;
  properties: PublicProperty[];
  isLoading: boolean;
  emptyMessage: string;
  isFavorite: (id: string | number) => boolean;
  onToggleFavorite: (id: string | number) => void;
  priceSuffix?: string;
  viewAllHref?: string;
}

const GRID =
  "grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10";

export default function PropertyGrid({
  id,
  title,
  subtitle,
  properties,
  isLoading,
  emptyMessage,
  isFavorite,
  onToggleFavorite,
  priceSuffix,
  viewAllHref,
}: PropertyGridProps) {
  return (
    <section id={id} className="scroll-mt-40 md:scroll-mt-28">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.4px] text-[#222222]">
            {title}
          </h2>
          {subtitle && <p className="text-[14px] text-[#6a6a6a] mt-0.5">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-[14px] font-semibold text-[#222222] underline underline-offset-4 hover:text-[#ff385c] transition-colors"
          >
            Ver todo
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className={GRID}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-[14px] bg-[#ebebeb]" />
              <div className="h-4 w-3/4 bg-[#ebebeb] rounded mt-3" />
              <div className="h-4 w-1/2 bg-[#ebebeb] rounded mt-2" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex items-center justify-center rounded-[16px] bg-white border border-[#ebebeb] py-14 px-6 text-center">
          <p className="text-[14px] text-[#6a6a6a] max-w-[420px]">{emptyMessage}</p>
        </div>
      ) : (
        <div className={GRID}>
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isFavorite={isFavorite(p.id)}
              onToggleFavorite={onToggleFavorite}
              priceSuffix={priceSuffix}
            />
          ))}
        </div>
      )}
    </section>
  );
}
