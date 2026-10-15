"use client";

/* ─────────────────────────────────────────────────────────────
   Tilt — inclinación 3D siguiendo al puntero, con brillo que se desplaza.
   Solo con puntero fino y sin prefers-reduced-motion; si no, es un div
   normal. Los hijos no se tocan (las tarjetas siguen siendo enlaces).
   ───────────────────────────────────────────────────────────── */

import { useRef, type ReactNode } from "react";

export default function Tilt({
  children,
  max = 7,
  className = "",
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);

  const enabled = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.PointerEvent) => {
    const el = box.current;
    if (!el || !enabled()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transition = "transform 0.12s ease-out";
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max * 1.4}deg) scale3d(1.02,1.02,1.02)`;
    if (glare.current) {
      glare.current.style.opacity = "1";
      glare.current.style.background = `radial-gradient(260px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.22), transparent 62%)`;
    }
  };
  const onLeave = () => {
    const el = box.current;
    if (!el) return;
    el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)";
    el.style.transform = "";
    if (glare.current) glare.current.style.opacity = "0";
  };

  return (
    <div
      ref={box}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      <div
        ref={glare}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 mix-blend-soft-light"
      />
    </div>
  );
}
