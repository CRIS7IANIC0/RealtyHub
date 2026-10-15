"use client";

/* ─────────────────────────────────────────────────────────────
   PageTransition — cortina al cambiar de página.
   - Dos capas de ocho tiras (terracota debajo, noche encima) que suben
     con borde curvo y arrancan desde el punto donde hiciste clic (onda).
   - En el centro: una casa que se dibuja y el nombre del destino, letra
     a letra, con una barra de carga.
   - Se navega bajo la cortina; al descubrir, la capa de noche sale primero
     y la terracota después, y el contenido de la página nueva entra en
     cascada (html[data-pt="enter"]).
   - Intercepta clics en enlaces internos y el evento `rh:navigate`.
   - Con prefers-reduced-motion no intercepta.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Phase = "idle" | "cover" | "hold" | "reveal";

const LABELS: Record<string, string> = {
  "/": "Inicio",
  "/properties": "Propiedades",
  "/login": "Iniciar sesión",
  "/leads": "Leads",
  "/viewings": "Agenda",
  "/contracts": "Contratos",
  "/commissions": "Comisiones",
  "/analytics": "Analíticas",
  "/users": "Personal",
  "/notifications": "Notificaciones",
  "/terms": "Términos",
  "/privacy": "Privacidad",
};

const STRIPS = 8;
const COVER_MS = 980; // cubrir (incluye el desfase de la onda)
const MIN_HOLD_MS = 120;
const REVEAL_MS = 1300;

function labelFor(path: string) {
  if (LABELS[path]) return LABELS[path];
  if (path.startsWith("/properties/")) return "Propiedad";
  return "RealtyHub";
}

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("");
  const [origin, setOrigin] = useState(0.5); // 0..1, de dónde parte la onda
  const target = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const go = useCallback(
    (href: string, fromX?: number) => {
      if (phaseRef.current !== "idle") return;
      const url = new URL(href, window.location.href);
      target.current = url.pathname + url.search;
      router.prefetch(url.pathname + url.search);
      setLabel(labelFor(url.pathname));
      setOrigin(fromX === undefined ? 0.5 : Math.min(1, Math.max(0, fromX / window.innerWidth)));
      setPhase("cover");
      later(() => {
        setPhase("hold");
        router.push(url.pathname + url.search + url.hash);
        // Seguro: si la ruta no cambia, se retira sola
        later(() => setPhase((p) => (p === "hold" ? "reveal" : p)), 3000);
      }, COVER_MS);
    },
    [router]
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") || /^(mailto:|tel:|https?:|\/\/)/.test(href)) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      // Solo los enlaces marcados usan la cortina completa; el resto navega normal
      // y recibe la animación rápida (ver efecto de pathname).
      if (!a.closest('[data-transition="full"]')) return;
      const pre = document.getElementById("rh-preloader");
      if (pre && getComputedStyle(pre).display !== "none") return;
      e.preventDefault();
      go(url.pathname + url.search + url.hash, e.clientX);
    };
    const onNavigate = (e: Event) => {
      const href = (e as CustomEvent<string>).detail;
      if (typeof href !== "string") return;
      if (reduced) router.push(href);
      else go(href);
    };

    if (!reduced) document.addEventListener("click", onClick, true);
    window.addEventListener("rh:navigate", onNavigate);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("rh:navigate", onNavigate);
    };
  }, [go, router]);

  // Cambio de ruta SIN cortina: animación muy rápida en el mismo sitio
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    if (phaseRef.current !== "idle") return; // lo gestiona la cortina
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.dataset.ptq = "1";
    const bar = document.createElement("div");
    bar.className = "rh-topbar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    const tm = window.setTimeout(() => {
      delete document.documentElement.dataset.ptq;
      bar.remove();
    }, 650);
    return () => {
      window.clearTimeout(tm);
      bar.remove();
    };
  }, [pathname]);

  // La ruta cambió bajo la cortina: descubrir
  useEffect(() => {
    if (phaseRef.current !== "hold" || !target.current) return;
    if (target.current.split("?")[0] !== pathname) return;
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true });
    later(() => setPhase("reveal"), MIN_HOLD_MS);
  }, [pathname]);

  // Entrada del contenido y retorno a reposo
  useEffect(() => {
    if (phase !== "reveal") return;
    document.documentElement.dataset.pt = "enter";
    const t = window.setTimeout(() => {
      target.current = null;
      delete document.documentElement.dataset.pt;
      setPhase("idle");
    }, REVEAL_MS + 400);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const originIdx = Math.round(origin * (STRIPS - 1));
  const strips = Array.from({ length: STRIPS }, (_, i) => i);
  const letters = Array.from(label);

  return (
    <>
      <style>{`
        .rh-pt{position:fixed;inset:0;z-index:9990;pointer-events:none;visibility:hidden;overflow:hidden}
        .rh-pt:not([data-phase="idle"]){visibility:visible}
        .rh-pt[data-phase="cover"],.rh-pt[data-phase="hold"]{pointer-events:auto}
        .rh-pt .lay{position:absolute;inset:0;display:grid;grid-template-columns:repeat(${STRIPS},1fr)}
        .rh-pt .lay i{display:block;width:calc(100% + 1px);transform:translateY(105%);
          border-radius:50% 50% 0 0 / 11vh 11vh 0 0;
          transition:transform .7s cubic-bezier(.76,0,.24,1),border-radius .7s cubic-bezier(.76,0,.24,1);
          transition-delay:calc(var(--d) * 1ms + var(--base, 0) * 1ms)}
        .rh-pt .l1 i{background:#b04e42;--base:0}
        .rh-pt .l2 i{background:#151922;--base:110}
        .rh-pt[data-phase="idle"] .lay i{transition:none}
        .rh-pt[data-phase="cover"] .lay i,.rh-pt[data-phase="hold"] .lay i{transform:translateY(0);border-radius:0}
        /* Al descubrir: sale primero la noche, luego la terracota, con borde inferior curvo */
        .rh-pt[data-phase="reveal"] .lay i{transform:translateY(-105%);border-radius:0 0 50% 50% / 0 0 11vh 11vh}
        .rh-pt[data-phase="reveal"] .l2 i{--base:0}
        .rh-pt[data-phase="reveal"] .l1 i{--base:110}

        .rh-pt .lab{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;color:#faf8f4}
        .rh-pt .lab .word{display:flex;overflow:hidden;padding:.08em .04em;font-family:var(--font-display),system-ui,sans-serif;font-weight:500;
          font-size:clamp(40px,8vw,120px);line-height:1;letter-spacing:-.045em}
        .rh-pt .lab .word span{display:inline-block;transform:translateY(115%);transition:transform .6s cubic-bezier(.16,1,.3,1);
          transition-delay:calc(var(--k) * 20ms + 330ms)}
        .rh-pt[data-phase="cover"] .lab .word span,.rh-pt[data-phase="hold"] .lab .word span{transform:none}
        .rh-pt[data-phase="reveal"] .lab .word span{transform:translateY(-115%);transition-delay:calc(var(--k) * 10ms)}
        .rh-pt .lab svg{opacity:0;transition:opacity .3s}
        .rh-pt[data-phase="cover"] .lab svg,.rh-pt[data-phase="hold"] .lab svg{opacity:1;transition-delay:.3s}
        .rh-pt[data-phase="reveal"] .lab svg{opacity:0;transition-delay:0s}
        .rh-pt .lab svg path{stroke-dasharray:1;stroke-dashoffset:1}
        .rh-pt[data-phase="cover"] .lab svg path,.rh-pt[data-phase="hold"] .lab svg path{animation:rh-stroke .7s cubic-bezier(.65,0,.35,1) .3s forwards}
        .rh-pt .bar{position:relative;width:min(240px,46vw);height:2px;background:rgba(250,248,244,.25);overflow:hidden;border-radius:2px;opacity:0;transition:opacity .3s}
        .rh-pt .bar::after{content:"";position:absolute;inset:0;background:#faf8f4;transform:scaleX(0);transform-origin:left}
        .rh-pt[data-phase="cover"] .bar,.rh-pt[data-phase="hold"] .bar{opacity:1;transition-delay:.3s}
        .rh-pt[data-phase="cover"] .bar::after,.rh-pt[data-phase="hold"] .bar::after{animation:rh-load .8s cubic-bezier(.65,0,.35,1) .35s forwards}
        .rh-pt[data-phase="reveal"] .bar{opacity:0;transition-delay:0s}
        @keyframes rh-load{to{transform:scaleX(1)}}

        /* La página nueva entra en cascada */
        html[data-pt="enter"] main > *,html[data-pt="enter"] body > div > aside + *{animation:pt-in 1.1s cubic-bezier(.16,1,.3,1) both}
        html[data-pt="enter"] main > *:nth-child(2){animation-delay:.08s}
        html[data-pt="enter"] main > *:nth-child(3){animation-delay:.16s}
        html[data-pt="enter"] main > *:nth-child(4){animation-delay:.24s}
        @keyframes pt-in{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){html[data-pt="enter"] main > *{animation:none}}

        /* Animación rápida (sin cortina): contenido sube y aparece en ~0.3 s */
        html[data-ptq] main > *,html[data-ptq] body > div > aside + *{animation:ptq-in .32s cubic-bezier(.16,1,.3,1) both}
        html[data-ptq] main > *:nth-child(2){animation-delay:.04s}
        html[data-ptq] main > *:nth-child(3){animation-delay:.08s}
        html[data-ptq] main > *:nth-child(4){animation-delay:.12s}
        @keyframes ptq-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .rh-topbar{position:fixed;top:0;left:0;right:0;height:3px;z-index:9991;pointer-events:none;background:#b04e42;
          transform-origin:left;transform:scaleX(0);opacity:0;animation:ptq-bar .5s cubic-bezier(.4,0,.2,1) both}
        @keyframes ptq-bar{0%{transform:scaleX(0);opacity:1}70%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}
        @media (prefers-reduced-motion: reduce){html[data-ptq] main > *{animation:none}.rh-topbar{display:none}}
      `}</style>
      <div className="rh-pt" data-phase={phase} aria-hidden="true">
        {(["l1", "l2"] as const).map((l) => (
          <div key={l} className={`lay ${l}`}>
            {strips.map((i) => (
              <i key={i} style={{ ["--d" as string]: Math.abs(i - originIdx) * 42 }} />
            ))}
          </div>
        ))}
        <div className="lab">
          <svg viewBox="0 0 120 100" width="72" height="60" fill="none" stroke="#faf8f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path pathLength={1} d="M8 52 60 10l52 42M22 44v48h76V44M50 92V64h20v28" />
          </svg>
          <div className="word">
            {letters.map((ch, k) => (
              <span key={k} style={{ ["--k" as string]: k }}>
                {ch === " " ? " " : ch}
              </span>
            ))}
          </div>
          <div className="bar" />
        </div>
      </div>
    </>
  );
}
