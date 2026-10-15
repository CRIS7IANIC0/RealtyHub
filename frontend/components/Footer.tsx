"use client";

/* ─────────────────────────────────────────────────────────────
   Footer — cuatro columnas claras y una firma tipográfica gigante.
   `dark`: versión a sangre completa sobre fondo noche (landing).
   Sin `dark`: versión clara para páginas legales.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/Navbar";
import { PrivacyContent, TermsContent } from "@/components/legal/LegalContent";

type LegalModal = "terms" | "privacy" | null;

export default function Footer({ dark = false }: { dark?: boolean }) {
  const [modal, setModal] = useState<LegalModal>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modal]);

  const linkCls = dark
    ? "text-[15px] text-[#faf8f4]/65 hover:text-[#faf8f4] transition-colors no-underline"
    : "text-[15px] text-[#6b655e] hover:text-[#a64739] transition-colors no-underline";
  const titleCls = dark
    ? "text-[13px] font-medium tracking-[0.1em] text-[#faf8f4]/45 mb-5"
    : "text-[13px] font-medium tracking-[0.1em] text-[#1e1c1a] mb-5";
  const muted = dark ? "text-[#faf8f4]/65" : "text-[#6b655e]";
  const quick = dark ? "text-[#e7b4a8]" : "text-[#a64739]";

  return (
    <footer
      className={
        dark
          ? "relative overflow-hidden bg-[#151922] text-[#faf8f4] grain"
          : "mt-10 pt-16 border-t border-[#1e1c1a]"
      }
    >
      <div className={dark ? "relative w-full max-w-[1440px] mx-auto px-5 md:px-10 pt-24" : ""}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 pb-16">
          <div className="lg:col-span-5">
            <BrandLogo tone={dark ? "light" : "dark"} />
            <p className={`text-[16px] leading-relaxed mt-5 max-w-[38ch] ${muted}`}>
              Conectamos a las personas con el hogar ideal, con un servicio inmobiliario transparente,
              cercano y respaldado por tecnología.
            </p>
          </div>

          <nav aria-label="Navegación del pie de página" className="lg:col-span-2">
            <h3 className={titleCls}>Navegación</h3>
            <ul className="space-y-3">
              <li><Link href="/" className={linkCls}>Inicio</Link></li>
              <li><Link href="/#propiedades-disponibles" className={linkCls}>Propiedades en venta</Link></li>
              <li><Link href="/#propiedades-alquiler" className={linkCls}>Propiedades en alquiler</Link></li>
              <li><Link href="/login" className={linkCls}>Iniciar sesión</Link></li>
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h3 className={titleCls}>Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className={linkCls}>Términos y condiciones</Link>
                <button
                  type="button"
                  onClick={() => setModal("terms")}
                  className={`ml-2 text-[13px] font-medium hover:underline cursor-pointer ${quick}`}
                >
                  Vista rápida
                </button>
              </li>
              <li>
                <Link href="/privacy" className={linkCls}>Política de privacidad</Link>
                <button
                  type="button"
                  onClick={() => setModal("privacy")}
                  className={`ml-2 text-[13px] font-medium hover:underline cursor-pointer ${quick}`}
                >
                  Vista rápida
                </button>
              </li>
            </ul>
          </div>

          <address className="not-italic lg:col-span-3">
            <h3 className={titleCls}>Contacto</h3>
            <ul className={`space-y-3 text-[15px] ${muted}`}>
              <li><a href="mailto:soporte@realtyhub.com" className={linkCls}>soporte@realtyhub.com</a></li>
              <li><a href="tel:+576041234567" className={linkCls}>+57 (604) 123 4567</a></li>
              <li>Calle 27 #3-45, Montería, Córdoba, Colombia</li>
            </ul>
          </address>
        </div>
      </div>

      {/* Firma tipográfica gigante */}
      <div
        className={`overflow-hidden select-none ${dark ? "relative" : "border-t border-[#e2dcd2] pt-8"}`}
        aria-hidden="true"
      >
        <p
          className={`font-display font-extralight leading-[0.86] tracking-[-0.06em] text-[clamp(56px,17.5vw,300px)] whitespace-nowrap text-center ${
            dark
              ? "bg-gradient-to-r from-[#faf8f4] via-[#e7b4a8] to-[#b04e42] bg-clip-text text-transparent"
              : "text-[#1e1c1a]"
          }`}
        >
          RealtyHub
        </p>
      </div>
      <div
        className={`${dark ? "relative w-full max-w-[1440px] mx-auto px-5 md:px-10" : ""} py-6 flex flex-col sm:flex-row gap-2 justify-between text-[13px] ${muted}`}
      >
        <p>© 2026 RealtyHub. Todos los derechos reservados.</p>
        <p>Montería · Bogotá · Medellín</p>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e1c1a]/50 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modal === "terms" ? "Términos y condiciones" : "Política de privacidad"}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[720px] max-h-[85vh] flex flex-col bg-[#faf8f4] text-[#1e1c1a] rounded-md shadow-[0_24px_60px_rgba(30,28,26,0.25)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2dcd2]">
              <h2 className="font-display text-[20px] font-light text-[#1e1c1a]">
                {modal === "terms" ? "Términos y condiciones" : "Política de privacidad"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full hover:bg-[#ece6dc] text-[#1e1c1a] text-xl cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              {modal === "terms" ? <TermsContent /> : <PrivacyContent />}
            </div>
            <div className="px-6 py-4 border-t border-[#e2dcd2] flex justify-end gap-3">
              <Link
                href={modal === "terms" ? "/terms" : "/privacy"}
                className="px-4 py-2 text-[14px] font-medium text-[#1e1c1a] no-underline hover:text-[#a64739]"
              >
                Abrir página completa
              </Link>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 rounded-full bg-[#1e1c1a] hover:bg-[#b04e42] text-[#faf8f4] text-[14px] font-medium cursor-pointer transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
