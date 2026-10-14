/* ─────────────────────────────────────────────────────────────
   PromoBanner — Banner con imagen y botón "CONOCER PROPIEDADES"
   Ocupa el mismo espacio/márgenes que ocupaba la sección de
   testimonios. La imagen se toma de /public/banner-propiedades.webp
   (reemplazar el archivo para cambiarla).
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";

export const PROMO_BANNER_IMAGE = "/banner-propiedades.webp";

export default function PromoBanner() {
  return (
    <section
      id="banner-propiedades"
      aria-label="Conocer propiedades"
      className="relative overflow-hidden rounded-[28px] border border-[#ebebeb] w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[1024/571] flex items-end bg-[#222222]"
      style={{
        backgroundImage: `url(${PROMO_BANNER_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Degradado para legibilidad del botón */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
      />

      <div className="relative w-full flex justify-center md:justify-start px-5 sm:px-8 md:px-12 pb-6 md:pb-10">
        <Link
          href="/properties"
          className="inline-flex items-center justify-center rounded-full bg-[#ff385c] hover:bg-[#e31c5f] active:scale-[0.98] text-white text-[14px] md:text-[15px] font-semibold uppercase tracking-wider px-8 py-3.5 shadow-lg transition-all no-underline"
        >
          Conocer propiedades
        </Link>
      </div>
    </section>
  );
}
