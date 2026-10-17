"use client";

/* ─────────────────────────────────────────────────────────────
   PropertyGrid — sección con título editorial + cuadrícula de PropertyCard
   1 col (móvil) → 2 → 3 (escritorio). Pocas columnas = fotos grandes.
   ───────────────────────────────────────────────────────────── */

import ArrowIcon from "@/components/ui/ArrowIcon";
import Link from "next/link";
import PropertyCard from "@/components/home/PropertyCard";
import SplitText from "@/components/ui/SplitText";
import Tilt from "@/components/ui/Tilt";
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

const GRID = "grid grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14";

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
    <section id={id} className="scroll-mt-28">
      <div className="reveal flex items-end justify-between gap-6 pb-6 mb-10 border-b border-[#e2dcd2]">
        <div>
          <SplitText as="h2" parts={title} className="font-display text-[clamp(30px,4.4vw,60px)] leading-[1.04] tracking-[-0.04em] text-[#1e1c1a]" />
          {subtitle && <p className="text-[16px] text-[#6b655e] mt-3 max-w-[48ch]">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1e1c1a] no-underline border-b border-[#1e1c1a] pb-0.5 hover:text-[#a64739] hover:border-[#a64739] transition-colors"
          >
            Ver todo <ArrowIcon size={14} />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className={GRID}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] rounded-md bg-[#ece6dc]" />
              <div className="h-5 w-3/4 bg-[#ece6dc] rounded mt-4" />
              <div className="h-4 w-1/2 bg-[#ece6dc] rounded mt-2" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-md bg-[#ece6dc] py-16 px-6 text-center">
          <p className="text-[15px] text-[#6b655e] max-w-[44ch] mx-auto">{emptyMessage}</p>
        </div>
      ) : (
        <div className={GRID}>
          {properties.map((p, i) => (
            <div key={p.id} className="reveal" style={{ ["--reveal-delay" as string]: `${(i % 3) * 90}ms` }}>
              <Tilt>
                <PropertyCard
                  property={p}
                  isFavorite={isFavorite(p.id)}
                  onToggleFavorite={onToggleFavorite}
                  priceSuffix={priceSuffix}
                />
              </Tilt>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
