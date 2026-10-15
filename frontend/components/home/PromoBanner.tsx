/* ─────────────────────────────────────────────────────────────
   PromoBanner — banner con la imagen original (/public/banner-propiedades.webp)
   y el botón "Conocer propiedades". Reemplazar el archivo para cambiarla.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import ArrowIcon from "@/components/ui/ArrowIcon";
import Marquee from "@/components/home/Marquee";

export const PROMO_BANNER_IMAGE = "/banner-propiedades.webp";

export default function PromoBanner() {
  return (
    <section
      id="banner-propiedades"
      aria-label="Conocer propiedades"
      className="relative overflow-hidden bg-[#151922] text-[#faf8f4]"
    >
      <div
        className="reveal relative w-full min-h-[460px] md:min-h-[620px] flex items-end bg-cover bg-center"
        style={{ backgroundImage: `url(${PROMO_BANNER_IMAGE})` }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative w-full max-w-[1440px] mx-auto px-5 md:px-10 pb-10 md:pb-14">
          <Link
            href="/properties"
            data-magnetic
            className="inline-flex items-center gap-3 rounded-full bg-[#b04e42] hover:bg-[#933f33] text-[#faf8f4] text-[15px] md:text-[16px] font-medium px-8 py-4 no-underline transition-colors duration-300"
          >
            Conocer propiedades <ArrowIcon />
          </Link>
        </div>
      </div>
      <div className="border-t border-[#faf8f4]/15">
        <Marquee
          items={["Venta", "Alquiler", "Visitas", "Contratos", "Asesoría", "Montería", "Bogotá", "Medellín"]}
          className="py-5 font-display text-[clamp(22px,3vw,40px)] tracking-[-0.03em] text-[#faf8f4]/80"
          gap="gap-12"
        />
      </div>
    </section>
  );
}
