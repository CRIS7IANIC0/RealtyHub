"use client";

/* ─────────────────────────────────────────────────────────────
   PropertyCarousel — Slider principal de inmuebles destacados
   - Avance automático cada 6 s (pausa con hover/foco; sin animación
     de deslizamiento si hay prefers-reduced-motion)
   - Flechas, puntos indicadores, teclado (←/→) y swipe táctil
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cardHeading,
  fmtPrice,
  getPropertyImage,
  isRental,
  type PublicProperty,
} from "@/lib/property";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50;

function IconChevron({ dir }: { dir: "left" | "right" }) {
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
      <polyline points={dir === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );
}

export default function PropertyCarousel({
  properties,
  isLoading,
}: {
  properties: PublicProperty[];
  isLoading: boolean;
}) {
  const [rawIndex, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);
  const count = properties.length;
  // Si la lista se reduce (p. ej. al recargar datos), nunca apuntar fuera de rango
  const index = count > 0 ? rawIndex % count : 0;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    // Con prefers-reduced-motion avanza igual, pero sin deslizamiento (motion-safe:)
    if (isPaused || count < 2) return;
    const t = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [index, isPaused, count, go]);

  if (isLoading) {
    return (
      <div className="h-[320px] sm:h-[420px] lg:h-[500px] rounded-[20px] bg-[#ebebeb] animate-pulse" />
    );
  }

  if (count === 0) {
    return (
      <div className="h-[220px] sm:h-[280px] rounded-[20px] bg-white border border-[#ebebeb] flex flex-col items-center justify-center text-center px-6">
        <p className="text-[18px] font-semibold text-[#222222]">Pronto nuevos inmuebles</p>
        <p className="text-[14px] text-[#6a6a6a] mt-1 max-w-[420px]">
          En este momento no hay propiedades destacadas. Vuelve pronto o explora el catálogo
          completo.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Propiedades destacadas"
      className="relative h-[320px] sm:h-[420px] lg:h-[500px] rounded-[20px] overflow-hidden bg-[#222222] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? index + 1 : index - 1);
        touchStartX.current = null;
      }}
    >
      {/* Pista de slides */}
      <div
        className="flex h-full motion-safe:transition-transform motion-safe:duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {properties.map((p, i) => {
          const image = getPropertyImage(p);
          const showImage = image && !failed.has(String(p.id));
          const active = i === index;
          return (
            <div
              key={p.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${count}`}
              aria-hidden={!active}
              className="relative w-full h-full shrink-0"
            >
              {showImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={image}
                  alt={p.title || p.address}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() =>
                    setFailed((prev) => new Set(prev).add(String(p.id)))
                  }
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#3a3a3a] to-[#161616]" />
              )}

              {/* Degradado para legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
                <div className="min-w-0 max-w-[640px]">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white text-[#222222] mb-3">
                    {isRental(p) ? "En alquiler" : "Destacado"}
                  </span>
                  <h2 className="text-[24px] sm:text-[32px] lg:text-[40px] font-bold tracking-[-0.6px] leading-tight truncate">
                    {cardHeading(p)}
                  </h2>
                  <p className="text-[14px] sm:text-[15px] text-white/85 truncate mt-1">
                    {p.title && p.title !== cardHeading(p) ? p.title : p.address}
                  </p>
                  <p className="text-[18px] sm:text-[20px] font-semibold mt-2">
                    {fmtPrice(p.price)}
                  </p>
                </div>
                <Link
                  href={`/properties/${p.id}`}
                  tabIndex={active ? 0 : -1}
                  className="self-start sm:self-auto shrink-0 inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white text-[14px] font-semibold transition-colors no-underline"
                >
                  Ver propiedad
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#222222] shadow-md transition hover:scale-105 cursor-pointer"
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Siguiente"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#222222] shadow-md transition hover:scale-105 cursor-pointer"
          >
            <IconChevron dir="right" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {properties.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir a la propiedad ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
