"use client";

/* ─────────────────────────────────────────────────────────────
   Footer corporativo — 4 columnas responsivas
   Marca | Navegación | Legal (con modal rápido) | Contacto
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/Navbar";
import { PrivacyContent, TermsContent } from "@/components/legal/LegalContent";

type LegalModal = "terms" | "privacy" | null;

const linkCls =
  "text-[14px] text-[#6a6a6a] hover:text-[#ff385c] transition-colors no-underline";
const titleCls = "text-[14px] font-semibold text-[#222222] mb-4";

function SocialIcon({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-[#f7f7f7] text-[#222222] hover:bg-[#ff385c] hover:text-white transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </a>
  );
}

export default function Footer() {
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

  return (
    <footer className="mt-14 pt-12 border-t border-[#ebebeb]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10">
        {/* Columna 1: Marca */}
        <div>
          <BrandLogo />
          <p className="text-[14px] leading-relaxed text-[#6a6a6a] mt-4 max-w-[300px]">
            Nuestra misión es conectar a las personas con el hogar ideal,
            ofreciendo un servicio inmobiliario transparente, cercano y
            respaldado por tecnología.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <SocialIcon label="Facebook" href="https://facebook.com">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </SocialIcon>
            <SocialIcon label="Instagram" href="https://instagram.com">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </SocialIcon>
            <SocialIcon label="X (Twitter)" href="https://x.com">
              <path d="M4 4l16 16M20 4L4 20" />
            </SocialIcon>
            <SocialIcon label="LinkedIn" href="https://linkedin.com">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </SocialIcon>
          </div>
        </div>

        {/* Columna 2: Navegación */}
        <nav aria-label="Navegación del pie de página">
          <h3 className={titleCls}>Navegación</h3>
          <ul className="space-y-3">
            <li><Link href="/" className={linkCls}>Inicio</Link></li>
            <li><Link href="/#propiedades-disponibles" className={linkCls}>Propiedades en Venta</Link></li>
            <li><Link href="/#propiedades-alquiler" className={linkCls}>Propiedades en Alquiler</Link></li>
            <li><Link href="/login" className={linkCls}>Iniciar Sesión</Link></li>
          </ul>
        </nav>

        {/* Columna 3: Legal */}
        <div>
          <h3 className={titleCls}>Legal</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/terms" className={linkCls}>Términos y Condiciones</Link>
              <button
                type="button"
                onClick={() => setModal("terms")}
                className="ml-2 text-[12px] font-medium text-[#ff385c] hover:underline cursor-pointer"
              >
                Vista rápida
              </button>
            </li>
            <li>
              <Link href="/privacy" className={linkCls}>Política de Privacidad</Link>
              <button
                type="button"
                onClick={() => setModal("privacy")}
                className="ml-2 text-[12px] font-medium text-[#ff385c] hover:underline cursor-pointer"
              >
                Vista rápida
              </button>
            </li>
          </ul>
        </div>

        {/* Columna 4: Contacto */}
        <address className="not-italic">
          <h3 className={titleCls}>Contacto</h3>
          <ul className="space-y-3 text-[14px] text-[#6a6a6a]">
            <li>
              <a href="mailto:soporte@realtyhub.com" className={linkCls}>
                soporte@realtyhub.com
              </a>
            </li>
            <li>
              <a href="tel:+576041234567" className={linkCls}>
                +57 (604) 123 4567
              </a>
            </li>
            <li>Sede principal: Calle 27 #3-45, Montería, Córdoba, Colombia</li>
          </ul>
        </address>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#ebebeb] py-6 text-center md:text-left">
        <p className="text-[13px] text-[#6a6a6a]">
          © 2026 RealtyHub. Todos los derechos reservados.
        </p>
      </div>

      {/* Modal legal */}
      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modal === "terms" ? "Términos y Condiciones" : "Política de Privacidad"}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[720px] max-h-[85vh] flex flex-col bg-white rounded-[20px] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb]">
              <h2 className="text-[18px] font-semibold text-[#222222]">
                {modal === "terms" ? "Términos y Condiciones" : "Política de Privacidad"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full hover:bg-[#f7f7f7] text-[#222222] text-xl cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              {modal === "terms" ? <TermsContent /> : <PrivacyContent />}
            </div>
            <div className="px-6 py-4 border-t border-[#ebebeb] flex justify-end gap-3">
              <Link
                href={modal === "terms" ? "/terms" : "/privacy"}
                className="px-4 py-2 text-[14px] font-medium text-[#222222] no-underline hover:text-[#ff385c]"
              >
                Abrir página completa
              </Link>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 rounded-[10px] bg-[#ff385c] hover:bg-[#e31c5f] text-white text-[14px] font-semibold cursor-pointer transition-colors"
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
