"use client";

/* ─────────────────────────────────────────────────────────────
   ImageSlider — Una foto a la vez con desplazamiento automático
   - Avanza cada `intervalMs` (5 s por defecto) si hay más de una foto
   - Se pausa con el mouse encima; con prefers-reduced-motion cambia
     de foto sin animación de deslizamiento
   - controls="full": flechas + puntos clicables + swipe (vista detalle)
   - controls="indicators": sólo puntos informativos, sin elementos
     interactivos, para usarlo dentro de un <Link> (tarjetas)
   - Las fotos que fallan al cargar se descartan del recorrido
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ImageSliderProps {
  images: string[];
  alt: string;
  intervalMs?: number;
  controls?: "full" | "indicators";
  /** Clases extra para cada <img> (p. ej. efecto hover del padre). */
  imgClassName?: string;
  onImageClick?: (index: number) => void;
  /** Informa al padre del índice visible (p. ej. para abrir el lightbox ahí). */
  onIndexChange?: (index: number) => void;
}

const SWIPE_THRESHOLD = 40;

function IconChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
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

function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0]">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c7c7c7"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

export default function ImageSlider({
  images,
  alt,
  intervalMs = 5000,
  controls = "indicators",
  imgClassName = "",
  onImageClick,
  onIndexChange,
}: ImageSliderProps) {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [rawIndex, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const list = useMemo(() => images.filter((src) => !failed.has(src)), [images, failed]);
  const count = list.length;
  const index = count > 0 ? rawIndex % count : 0;

  const go = useCallback(
    (next: number) => {
      if (list.length === 0) return;
      const i = ((next % list.length) + list.length) % list.length;
      setIndex(i);
      onIndexChange?.(images.indexOf(list[i]));
    },
    [list, images, onIndexChange]
  );

  // Con prefers-reduced-motion también avanza, pero sin deslizamiento
  // (las clases motion-safe: del contenedor lo hacen instantáneo).
  useEffect(() => {
    if (isPaused || count < 2) return;
    const t = window.setTimeout(() => go(index + 1), intervalMs);
    return () => window.clearTimeout(t);
  }, [index, isPaused, count, intervalMs, go]);

  if (count === 0) return <Placeholder />;

  const full = controls === "full";

  return (
    <div
      className="group/slider absolute inset-0 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
      <div
        className="flex h-full motion-safe:transition-transform motion-safe:duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {list.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={src}
            src={src}
            alt={count > 1 ? `${alt} — foto ${i + 1} de ${count}` : alt}
            aria-hidden={i !== index}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            onClick={onImageClick ? () => onImageClick(images.indexOf(src)) : undefined}
            onError={() => setFailed((prev) => new Set(prev).add(src))}
            className={`w-full h-full shrink-0 object-cover ${
              onImageClick ? "cursor-pointer" : ""
            } ${imgClassName}`}
          />
        ))}
      </div>

      {count > 1 && full && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#222222] shadow-md transition sm:opacity-0 sm:group-hover/slider:opacity-100 focus-visible:opacity-100 cursor-pointer"
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#222222] shadow-md transition sm:opacity-0 sm:group-hover/slider:opacity-100 focus-visible:opacity-100 cursor-pointer"
          >
            <IconChevron dir="right" />
          </button>
        </>
      )}

      {count > 1 && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/25 backdrop-blur-sm"
          aria-hidden={!full}
        >
          {list.map((src, i) =>
            full ? (
              <button
                key={src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ) : (
              <span
                key={src}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
