"use client";

/* ─────────────────────────────────────────────────────────────
   Hero — primera pantalla: foto a pantalla completa con zoom lento y
   parallax, titular enorme que entra palabra por palabra al terminar la
   precarga, buscador y una marquesina de ciudades al pie.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { Fragment, useEffect, useRef, type FormEvent } from "react";
import CityAutocomplete from "@/components/ui/CityAutocomplete";
import ArrowIcon from "@/components/ui/ArrowIcon";
import Marquee from "@/components/home/Marquee";
import {
  PROPERTY_TYPES,
  cardHeading,
  fmtPrice,
  isRental,
  type PublicProperty,
} from "@/lib/property";

// Foto de portada: casa moderna al atardecer (Unsplash, hotlink a su CDN).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1757524492552-d47a66a2b63e?auto=format&fit=crop&w=2000&q=80";

export type OperationFilter = "" | "Venta" | "Alquiler";

interface HeroProps {
  location: string;
  onLocationChange: (v: string) => void;
  propertyType: string;
  onPropertyTypeChange: (v: string) => void;
  operation: OperationFilter;
  onOperationChange: (v: OperationFilter) => void;
  onSearch: () => void;
  featured?: PublicProperty;
  saleCount: number;
  rentCount: number;
  isLoading: boolean;
}

// [palabra, cursiva?]
const HEADLINE: [string, boolean][] = [
  ["El", false],
  ["hogar", false],
  ["que", false],
  ["buscas,", false],
  ["sin", true],
  ["complicarte.", true],
];

const OPERATIONS: { value: OperationFilter; label: string }[] = [
  { value: "", label: "Todo" },
  { value: "Venta", label: "Comprar" },
  { value: "Alquiler", label: "Alquilar" },
];

const CITIES = ["Montería", "Bogotá", "Medellín", "Casas", "Apartamentos", "Fincas", "Locales", "Oficinas", "Lotes"];

export default function Hero({
  location,
  onLocationChange,
  propertyType,
  onPropertyTypeChange,
  operation,
  onOperationChange,
  onSearch,
  featured,
  saleCount,
  rentCount,
  isLoading,
}: HeroProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Parallax: la foto baja más lento que la página y el texto se desvanece un poco
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight * 1.2);
        if (bgRef.current) bgRef.current.style.transform = `translate3d(0, ${y * 0.32}px, 0)`;
        if (textRef.current) {
          textRef.current.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
          textRef.current.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch();
  }

  const field = "w-full bg-transparent outline-none text-[15px] text-[#1e1c1a] placeholder:text-[#716b63]";
  const label = "block text-[12px] font-medium text-[#6b655e] mb-1";

  return (
    <section
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className="relative min-h-[100svh] flex flex-col bg-[#151922] text-[#faf8f4] overflow-hidden grain">
      {/* Fondo */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform" aria-hidden="true">
        <div className="absolute inset-0 hero-mesh" />
        <div
          className="absolute inset-[-4%] bg-cover bg-center kenburns"
          style={{ backgroundImage: `url(${HERO_PHOTO})` }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#151922] via-[#151922]/55 to-[#151922]/30 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#151922]/75 via-[#151922]/15 to-transparent pointer-events-none"
      />

      <div aria-hidden="true" className="hero-spot absolute inset-0 pointer-events-none" />

      {/* Contenido */}
      <div
        ref={textRef}
        className="relative z-10 flex-1 flex flex-col justify-end w-full max-w-[1440px] mx-auto px-5 md:px-10 pt-36 pb-10 will-change-transform"
      >
        <h1 className="font-display font-light text-[clamp(40px,7.2vw,118px)] leading-[0.98] tracking-[-0.05em] max-w-[15ch]">
          {HEADLINE.map(([w, it], i) => (
            <Fragment key={i}>
              <span className="hero-word-mask">
                <span className="hero-word" style={{ ["--i" as string]: i }}>
                  {it ? <span className="accent-i text-[#e7b4a8]">{w}</span> : w}
                </span>
              </span>{" "}
            </Fragment>
          ))}
        </h1>

        <div className="mt-10 lg:mt-14 grid lg:grid-cols-[1fr_minmax(0,640px)] gap-8 lg:gap-16 items-end">
          <div className="hero-fade">
            <p className="text-[17px] leading-relaxed text-[#faf8f4]/80 max-w-[44ch]">
              Casas, apartamentos y locales en Colombia. Agenda tu visita en minutos y un asesor te
              acompaña hasta la firma.
            </p>
            <p className="mt-5 text-[14px] text-[#faf8f4]/60 tabular">
              {isLoading ? "Cargando propiedades…" : `${saleCount} en venta · ${rentCount} en alquiler`}
            </p>
            {featured && (
              <Link
                href={`/properties/${featured.id}`}
                data-cursor="Ver"
                className="mt-8 inline-flex items-center gap-4 no-underline text-inherit group"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full border border-[#faf8f4]/40 group-hover:bg-[#faf8f4] group-hover:text-[#151922] transition-colors duration-300">
                  <ArrowIcon />
                </span>
                <span>
                  <span className="block text-[12px] text-[#faf8f4]/60">
                    Destacada · {isRental(featured) ? "En alquiler" : "En venta"}
                  </span>
                  <span className="block text-[16px]">
                    {cardHeading(featured)} · {fmtPrice(featured.price)}
                    {isRental(featured) ? " / mes" : ""}
                  </span>
                </span>
              </Link>
            )}
          </div>

          <form
            role="search"
            onSubmit={handleSubmit}
            className="hero-fade rounded-md bg-[#faf8f4] text-[#1e1c1a] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]"
            style={{ ["--fd" as string]: "140ms" }}
          >
            <div className="flex gap-1 p-1" role="group" aria-label="Operación">
              {OPERATIONS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={operation === o.value}
                  onClick={() => onOperationChange(o.value)}
                  className={`rounded-full px-4 py-2 text-[14px] font-medium cursor-pointer transition-colors ${
                    operation === o.value ? "bg-[#1e1c1a] text-[#faf8f4]" : "text-[#6b655e] hover:bg-[#ece6dc]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-[1.3fr_1fr_auto] gap-2 items-stretch">
              <label htmlFor="hero-where" className="rounded-md px-4 py-3 hover:bg-[#f3efe8] focus-within:bg-[#f3efe8] transition-colors cursor-text">
                <span className={label}>Dónde</span>
                <CityAutocomplete
                  id="hero-where"
                  value={location}
                  onChange={onLocationChange}
                  placeholder="Ciudad, barrio o dirección"
                  className={field}
                />
              </label>
              <label htmlFor="hero-type" className="rounded-md px-4 py-3 hover:bg-[#f3efe8] focus-within:bg-[#f3efe8] transition-colors cursor-pointer">
                <span className={label}>Tipo de propiedad</span>
                <select
                  id="hero-type"
                  value={propertyType}
                  onChange={(e) => onPropertyTypeChange(e.target.value)}
                  className={`${field} cursor-pointer`}
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
                data-magnetic
                className="rounded-md bg-[#b04e42] hover:bg-[#933f33] text-[#faf8f4] text-[15px] font-medium px-8 py-4 cursor-pointer transition-colors duration-300"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="relative z-10 border-t border-[#faf8f4]/15">
        <Marquee items={CITIES} className="py-4 text-[13px] tracking-[0.16em] uppercase text-[#faf8f4]/55" />
      </div>
    </section>
  );
}
