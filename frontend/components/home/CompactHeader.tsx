"use client";

/* ─────────────────────────────────────────────────────────────
   CompactHeader — Header público estilo Airbnb
   Logo | Barra de búsqueda segmentada (Dónde · Tipo · Buscar) | Acciones
   En móvil la barra baja a una segunda fila a ancho completo.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/Navbar";
import { PROPERTY_TYPES } from "@/lib/property";

interface CompactHeaderProps {
  location: string;
  onLocationChange: (value: string) => void;
  propertyType: string;
  onPropertyTypeChange: (value: string) => void;
  onSearch: () => void;
}

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function CompactHeader({
  location,
  onLocationChange,
  propertyType,
  onPropertyTypeChange,
  onSearch,
}: CompactHeaderProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch();
  }

  const segment =
    "flex flex-col justify-center min-w-0 px-4 sm:px-6 py-2 rounded-full hover:bg-[#f7f7f7] focus-within:bg-[#f7f7f7] transition-colors cursor-text";
  const label = "text-[11px] sm:text-[12px] font-semibold text-[#222222] leading-tight";
  const field =
    "w-full bg-transparent outline-none text-[13px] sm:text-[14px] text-[#222222] placeholder:text-[#6a6a6a] leading-tight mt-0.5";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#ebebeb]">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-3 md:py-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-4 gap-y-3">
        {/* ─── Logo ─── */}
        <div className="shrink-0 md:w-[180px] lg:w-[220px]">
          <BrandLogo compactOnMobile />
        </div>

        {/* ─── Barra de búsqueda segmentada ─── */}
        <form
          role="search"
          onSubmit={handleSubmit}
          className="order-last md:order-none w-full md:w-auto md:flex-1 md:max-w-[640px] flex items-center bg-white border border-[#dddddd] rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow pl-1 pr-1.5 py-1"
        >
          <label htmlFor="search-where" className={`${segment} flex-[1.4]`}>
            <span className={label}>Dónde</span>
            <input
              id="search-where"
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Ciudad, barrio o dirección"
              className={field}
              autoComplete="off"
            />
          </label>

          <span className="w-px h-8 bg-[#dddddd] shrink-0" aria-hidden="true" />

          <label htmlFor="search-type" className={`${segment} flex-1 cursor-pointer`}>
            <span className={`${label} whitespace-nowrap`}>
              <span className="sm:hidden">Tipo</span>
              <span className="hidden sm:inline">Tipo de propiedad</span>
            </span>
            <select
              id="search-type"
              value={propertyType}
              onChange={(e) => onPropertyTypeChange(e.target.value)}
              className={`${field} appearance-none cursor-pointer truncate`}
            >
              <option value="">Cualquier tipo</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="shrink-0 inline-flex items-center justify-center gap-2 h-11 min-w-11 px-3.5 lg:px-5 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white text-[14px] font-semibold transition-colors cursor-pointer active:scale-95"
            aria-label="Buscar propiedades"
          >
            <IconSearch />
            <span className="hidden lg:inline">Buscar</span>
          </button>
        </form>

        {/* ─── Acciones ─── */}
        <div className="shrink-0 md:w-[180px] lg:w-[220px] flex items-center justify-end gap-1 sm:gap-2">
          <Link
            href="/properties"
            className="hidden sm:inline-flex text-[14px] font-medium text-[#222222] px-3 py-2.5 rounded-full hover:bg-[#f7f7f7] transition-colors no-underline"
          >
            Catálogo
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-[#222222] hover:bg-black text-white text-[13px] sm:text-[14px] font-semibold transition-colors no-underline whitespace-nowrap"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
