"use client";

import { useEffect } from "react";

/**
 * Revela elementos `.reveal` al entrar al viewport.
 * El contenido se ve por defecto; la clase `reveal-ready` se añade solo si
 * el navegador soporta IntersectionObserver y no hay reduced-motion.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));

    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
