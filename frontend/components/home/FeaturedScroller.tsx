"use client";

/* ─────────────────────────────────────────────────────────────
   FeaturedScroller — vitrina fijada al scroll, una propiedad a la vez.
   Funciona igual de bien con 1, 2 o 6 propiedades:
   - Cada propiedad ocupa un tramo de scroll. La foto entra con un recorte
     que sube desde abajo (clip-path) y se asienta con zoom; el texto de la
     izquierda cambia con una máscara y hay un contador y una barra de avance.
   - Móvil/tablet y reduced-motion: lista de tarjetas normal.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ArrowIcon from "@/components/ui/ArrowIcon";
import SplitText from "@/components/ui/SplitText";
import PropertyCard from "@/components/home/PropertyCard";
import {
  cardHeading,
  fmtPrice,
  getPropertyImage,
  inferCity,
  inferType,
  isRental,
  type PublicProperty,
} from "@/lib/property";

interface Props {
  properties: PublicProperty[];
  isFavorite: (id: string | number) => boolean;
  onToggleFavorite: (id: string | number) => void;
}

const STEP_VH = 95; // scroll por propiedad

export default function FeaturedScroller({ properties, isFavorite, onToggleFavorite }: Props) {
  const section = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const imgs = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const n = properties.length;

  // ¿Modo fijado? (escritorio y con movimiento)
  useEffect(() => {
    const check = () =>
      setPinned(window.innerWidth >= 1024 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const sec = section.current;
    if (!sec || !pinned) return;
    let raf = 0;
    let last = -1;

    const update = () => {
      const rect = sec.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      // Posición continua: 0 … n-1
      const pos = p * (n - 1 + 0.0001);
      for (let i = 0; i < n; i++) {
        const layer = layers.current[i];
        const img = imgs.current[i];
        if (!layer) continue;
        // La capa i aparece cuando pos va de i-1 a i
        const t = i === 0 ? 1 : Math.min(1, Math.max(0, pos - (i - 1)));
        layer.style.clipPath = `inset(${(1 - t) * 100}% 0 0 0 round 10px)`;
        if (img) img.style.transform = `scale(${1 + (1 - t) * 0.18}) translateY(${(1 - t) * -4}%)`;
      }
      if (bar.current) bar.current.style.transform = `scaleX(${n > 1 ? pos / (n - 1) : 1})`;
      const idx = Math.min(n - 1, Math.round(pos));
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned, n]);

  if (n === 0) return null;

  /* ── Versión sin fijado: tarjetas ── */
  if (!pinned) {
    return (
      <section aria-labelledby="destacadas-title" className="w-full max-w-[1440px] mx-auto px-5 md:px-10 py-20">
        <SplitText
          as="h2"
          id="destacadas-title"
          parts={[{ t: "Propiedades" }, { t: "destacadas", accent: true }]}
          className="font-display text-[clamp(34px,6vw,60px)] leading-[1.04] tracking-[-0.045em] mb-10"
        />
        <div className="grid grid-cols-1 min-[640px]:grid-cols-2 gap-x-6 gap-y-12">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isFavorite={isFavorite(p.id)}
              onToggleFavorite={onToggleFavorite}
              priceSuffix={isRental(p) ? "/ mes" : undefined}
            />
          ))}
        </div>
      </section>
    );
  }

  /* ── Vitrina fijada ── */
  return (
    <section
      ref={section}
      aria-labelledby="destacadas-title"
      className="relative"
      style={{ height: `${100 + (n - 1) * STEP_VH}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto h-full px-10 pt-24 pb-10 grid grid-cols-12 gap-10 items-center">
          {/* Texto */}
          <div className="col-span-5 flex flex-col h-full justify-between py-4">
            <div>
              <h2
                id="destacadas-title"
                className="font-display text-[clamp(30px,3.2vw,48px)] leading-[1.05] tracking-[-0.045em]"
              >
                Propiedades <span className="text-[#a64739]">destacadas</span>
              </h2>
              <p className="mt-3 text-[15px] text-[#6b655e] tabular">
                {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </p>
            </div>

            <div className="relative min-h-[300px]">
              {properties.map((p, i) => {
                const on = i === active;
                const type = inferType(p);
                const city = inferCity(p);
                return (
                  <div
                    key={p.id}
                    aria-hidden={!on}
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      opacity: on ? 1 : 0,
                      transform: on ? "none" : `translateY(${i < active ? "-28px" : "28px"})`,
                      transition: "opacity .6s var(--ease-out), transform .8s var(--ease-out)",
                      pointerEvents: on ? "auto" : "none",
                    }}
                  >
                    <p className="text-[13px] text-[#6b655e] mb-3">
                      {isRental(p) ? "En alquiler" : "En venta"}
                      {type ? ` · ${type}` : ""}
                      {city ? ` · ${city}` : ""}
                    </p>
                    <h3 className="font-display text-[clamp(32px,4.4vw,68px)] leading-[1.02] tracking-[-0.045em]">
                      {cardHeading(p)}
                    </h3>
                    <p className="mt-3 text-[16px] text-[#6b655e] max-w-[40ch]">{p.title || p.address}</p>
                    <p className="mt-6 font-display text-[clamp(26px,2.6vw,38px)] tracking-[-0.03em] text-[#a64739] tabular">
                      {fmtPrice(p.price)}
                      {isRental(p) && <span className="text-[16px] text-[#6b655e]"> / mes</span>}
                    </p>
                    <Link
                      href={`/properties/${p.id}`}
                      data-magnetic
                      className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#1e1c1a] hover:bg-[#b04e42] text-[#faf8f4] text-[15px] font-medium px-7 py-3.5 no-underline transition-colors duration-300"
                    >
                      Ver propiedad <ArrowIcon />
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-[13px] text-[#6b655e]">
              <span className="relative block w-40 h-px bg-[#cfc7ba] overflow-hidden">
                <span ref={bar} className="absolute inset-0 bg-[#1e1c1a] origin-left" style={{ transform: "scaleX(0)" }} />
              </span>
              {n > 1 ? "Sigue bajando" : "Destacada"}
            </div>
          </div>

          {/* Fotos apiladas con recorte */}
          <div className="col-span-7 relative h-full max-h-[78vh] rounded-[10px] overflow-hidden bg-[#ece6dc]">
            {properties.map((p, i) => {
              const src = getPropertyImage(p);
              return (
                <div
                  key={p.id}
                  ref={(el) => {
                    layers.current[i] = el;
                  }}
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: i === 0 ? "inset(0 0 0 0 round 10px)" : "inset(100% 0 0 0 round 10px)" }}
                >
                  <div
                    ref={(el) => {
                      imgs.current[i] = el;
                    }}
                    className="absolute inset-0 bg-cover bg-center will-change-transform"
                    style={src ? { backgroundImage: `url(${src})` } : undefined}
                  >
                    {!src && <div className="absolute inset-0 hero-mesh" />}
                  </div>
                  <Link
                    href={`/properties/${p.id}`}
                    data-cursor="Ver"
                    aria-label={`Ver ${cardHeading(p)}`}
                    className="absolute inset-0"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
