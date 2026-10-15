"use client";

/* ─────────────────────────────────────────────────────────────
   SmoothScroll — desplazamiento con inercia (Lenis).
   - Solo con puntero fino y sin prefers-reduced-motion.
   - Expone el scroll por `window.__lenis` y emite `rh:scroll` en cada frame
     para los efectos ligados al scroll (parallax, progreso de secciones).
   ───────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !fine) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: { offset: -80 },
    });
    window.__lenis = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // El preloader bloquea el scroll: pausar/reanudar según su estado
    const sync = () => {
      if (document.body.style.overflow === "hidden") lenis.stop();
      else lenis.start();
    };
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    sync();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
