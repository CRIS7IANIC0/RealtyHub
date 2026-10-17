"use client";

/* ─────────────────────────────────────────────────────────────
   Cursor inmobiliario
     · Por defecto: una casita dibujada que sigue al puntero con inercia y se
       balancea según la velocidad, con un pulso de "ubicación" debajo.
     · Sobre enlaces y botones: la casa se convierte en una LLAVE que gira.
     · Sobre elementos con data-cursor="Ver": un CARTEL de inmobiliaria
       (como el de "Se vende") cuelga del puntero y se balancea como péndulo.
     · Sobre campos de texto: se esconde y queda el cursor nativo.
     · Clic: onda expansiva desde el punto.
     data-magnetic acerca el elemento al puntero.
   Solo con puntero fino y sin prefers-reduced-motion.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useSyncExternalStore } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";
const subscribe = (cb: () => void) => {
  const a = window.matchMedia(QUERY);
  const b = window.matchMedia("(prefers-reduced-motion: reduce)");
  a.addEventListener("change", cb);
  b.addEventListener("change", cb);
  return () => {
    a.removeEventListener("change", cb);
    b.removeEventListener("change", cb);
  };
};
const getSnapshot = () =>
  window.matchMedia(QUERY).matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Mode = "house" | "key" | "sign" | "text";

export default function Cursor() {
  const on = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const pulse = useRef<HTMLDivElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("has-cursor");
    return () => document.documentElement.classList.remove("has-cursor");
  }, [on]);

  useEffect(() => {
    if (!on) return;
    const R = root.current!;
    const B = body.current!;
    const P = pulse.current!;
    const X = burst.current!;
    const S = signRef.current!;
    const L = label.current!;

    let mx = -100, my = -100;     // puntero real
    let x = -100, y = -100;       // posición suavizada
    let vx = 0;                   // velocidad horizontal suavizada
    let swing = 0, swingV = 0;    // péndulo del cartel
    let tilt = 0;                 // balanceo de la casa
    let mode: Mode = "house";
    let tone: "dark" | "light" = "dark";

    // Luminancia efectiva del fondo bajo el puntero: sube por los ancestros hasta
    // encontrar un color opaco; imágenes, canvas y degradados cuentan como oscuros.
    const lum = (rgb: string) => {
      const m = rgb.match(/[\d.]+/g);
      if (!m) return 1;
      const [r, g, b] = m.slice(0, 3).map((v) => {
        const s = Number(v) / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const sample = () => {
      if (!visible) return;
      let el = document.elementFromPoint(mx, my) as HTMLElement | null;
      let l = 0.9;
      for (let i = 0; el && i < 12; i++, el = el.parentElement) {
        if (el.closest(".rh-cursor")) continue;
        const tag = el.tagName;
        if (tag === "CANVAS" || tag === "IMG" || tag === "VIDEO") {
          l = 0.1;
          break;
        }
        const cs = getComputedStyle(el);
        if (cs.backgroundImage !== "none") {
          l = 0.1;
          break;
        }
        const bg = cs.backgroundColor;
        const a = bg.match(/[\d.]+/g);
        const alpha = a && a.length > 3 ? Number(a[3]) : bg === "transparent" ? 0 : 1;
        if (alpha > 0.5) {
          l = lum(bg);
          break;
        }
      }
      const next = l < 0.32 ? "light" : "dark";
      if (next !== tone) {
        tone = next;
        R.dataset.tone = next;
      }
    };
    const sampler = window.setInterval(sample, 110);
    let visible = false;
    let raf = 0;
    let magnet: HTMLElement | null = null;

    const setMode = (m: Mode) => {
      if (m === mode) return;
      mode = m;
      R.dataset.mode = m;
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        x = mx;
        y = my;
        visible = true;
        R.style.opacity = "1";
      }
      if (magnet) {
        const m = magnet.getBoundingClientRect();
        const dx = e.clientX - (m.left + m.width / 2);
        const dy = e.clientY - (m.top + m.height / 2);
        magnet.style.transform = `translate(${dx * 0.22}px, ${dy * 0.28}px)`;
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;
      const tagged = t.closest<HTMLElement>("[data-cursor]");
      const interactive = t.closest("a, button, [role='button'], summary, select, label[for]");
      const text = t.closest("input, textarea");

      if (tagged) {
        L.textContent = tagged.dataset.cursor || "";
        setMode("sign");
      } else if (text) setMode("text");
      else if (interactive) setMode("key");
      else setMode("house");

      const mag = t.closest<HTMLElement>("[data-magnetic]");
      if (mag !== magnet) {
        if (magnet) {
          magnet.style.transition = "transform 0.5s cubic-bezier(0.23,1,0.32,1)";
          magnet.style.transform = "";
        }
        magnet = mag;
        if (magnet) magnet.style.transition = "transform 0.18s cubic-bezier(0.23,1,0.32,1)";
      }
    };

    const onDown = () => {
      B.classList.add("is-down");
      // Onda expansiva
      X.style.left = `${mx}px`;
      X.style.top = `${my}px`;
      X.classList.remove("go");
      void X.offsetWidth;
      X.classList.add("go");
    };
    const onUp = () => B.classList.remove("is-down");
    const onLeave = () => {
      visible = false;
      R.style.opacity = "0";
    };

    const tick = () => {
      const px = x;
      x += (mx - x) * 0.22;
      y += (my - y) * 0.22;
      const dvx = x - px;
      vx += (dvx - vx) * 0.25;

      // Balanceo de la casa según velocidad
      tilt += (Math.max(-24, Math.min(24, vx * 2.2)) - tilt) * 0.18;

      // Péndulo del cartel: resorte hacia 0 empujado por la velocidad
      swingV += (-swing * 0.09) + -vx * 0.06;
      swingV *= 0.9;
      swing += swingV;

      B.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      B.style.setProperty("--tilt", `${tilt}deg`);
      B.style.setProperty("--swing", `${Math.max(-40, Math.min(40, swing * 6))}deg`);
      P.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(sampler);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      void S;
    };
  }, [on]);

  if (!on) return null;

  return (
    <div
      ref={root}
      data-mode="house"
      aria-hidden="true"
      className="rh-cursor pointer-events-none fixed inset-0 z-[9998] overflow-hidden opacity-0 transition-opacity duration-300"
    >
      <style>{`
        .rh-cursor{--cur:#1e1c1a;--halo:rgba(250,248,244,.9)}
        .rh-cursor[data-tone="light"]{--cur:#faf8f4;--halo:rgba(21,25,34,.8)}
        .rh-cursor .ico,.rh-cursor .pulse::before,.rh-cursor .pulse::after{transition:color .3s,border-color .3s,opacity .25s,transform .5s cubic-bezier(.16,1,.3,1)}
        .rh-cursor .pulse{position:absolute;left:0;top:0;width:0;height:0;will-change:transform}
        .rh-cursor .pulse::before,.rh-cursor .pulse::after{content:"";position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;
          border:1px solid var(--cur);opacity:0;animation:rh-ping 2.6s cubic-bezier(.2,.6,.3,1) infinite}
        .rh-cursor .pulse::after{animation-delay:1.3s}
        @keyframes rh-ping{0%{transform:scale(.35);opacity:.55}100%{transform:scale(1.5);opacity:0}}
        .rh-cursor[data-mode="sign"] .pulse,.rh-cursor[data-mode="text"] .pulse{opacity:0}
        .rh-cursor .pulse{transition:opacity .3s}

        .rh-cursor .body{position:absolute;left:0;top:0;width:0;height:0;will-change:transform}
        .rh-cursor .ico{position:absolute;left:-17px;top:-19px;width:34px;height:34px;color:var(--cur);filter:drop-shadow(0 0 1.5px var(--halo));
          transform-origin:50% 90%;transition:opacity .25s,transform .5s cubic-bezier(.16,1,.3,1)}
        .rh-cursor .house{transform:rotate(var(--tilt,0deg)) scale(1)}
        .rh-cursor .key{opacity:0;transform:rotate(-40deg) scale(.4)}
        .rh-cursor[data-mode="key"] .house{opacity:0;transform:rotate(30deg) scale(.4)}
        .rh-cursor[data-mode="key"] .key{opacity:1;transform:rotate(0deg) scale(1.15)}
        .rh-cursor[data-mode="sign"] .ico,.rh-cursor[data-mode="text"] .ico{opacity:0;transform:scale(.3)}
        .rh-cursor .body.is-down .house{transform:rotate(var(--tilt,0deg)) scale(.82)}
        .rh-cursor .body.is-down .key{transform:rotate(25deg) scale(1)}

        /* Cartel: poste + letrero colgante */
        .rh-cursor .sign{position:absolute;left:0;top:0;width:0;height:0;opacity:0;transform:scale(.3);transform-origin:0 0;
          transition:opacity .25s,transform .5s cubic-bezier(.16,1,.3,1)}
        .rh-cursor[data-mode="sign"] .sign{opacity:1;transform:scale(1)}
        .rh-cursor .sign .arm{position:absolute;left:0;top:0;width:2px;height:30px;background:#faf8f4;border-radius:2px;
          box-shadow:0 0 0 1px rgba(21,25,34,.25)}
        .rh-cursor .sign .board{position:absolute;left:1px;top:30px;transform:translateX(-50%);min-width:76px;height:38px;padding:0 16px;
          display:flex;align-items:center;justify-content:center;border-radius:6px;background:#b04e42;color:#faf8f4;
          font:500 14px/1 var(--font-display),system-ui,sans-serif;letter-spacing:-0.01em;box-shadow:0 10px 24px -8px rgba(21,25,34,.5)}
        .rh-cursor .sign .board::before{content:"";position:absolute;top:-4px;left:50%;width:6px;height:6px;border-radius:50%;background:#faf8f4;transform:translateX(-50%)}
        .rh-cursor .sign .pendulum{position:absolute;left:0;top:0;transform-origin:0 0;transform:rotate(var(--swing,0deg))}

        .rh-cursor .burst{position:absolute;width:0;height:0}
        .rh-cursor .burst::before{content:"";position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:2px solid #b04e42;opacity:0}
        .rh-cursor .burst.go::before{animation:rh-burst .75s cubic-bezier(.16,1,.3,1)}
        @keyframes rh-burst{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.9);opacity:0}}
      `}</style>

      <div ref={pulse} className="pulse" />

      <div ref={body} className="body">
        {/* Casa */}
        <svg className="ico house" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17 17 4l14 13" />
          <path d="M7 14.5V29h20V14.5" />
          <path d="M14 29v-8h6v8" />
          <path d="M23 8.5V5h3v6" />
        </svg>
        {/* Llave */}
        <svg className="ico key" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="12" r="6" />
          <circle cx="11" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <path d="M15.5 16.5 29 30" />
          <path d="M24 25l3-3M27.5 28.5l2.5-2.5" />
        </svg>
        {/* Cartel */}
        <div ref={signRef} className="sign">
          <div className="pendulum">
            <div className="arm" />
            <div className="board">
              <span ref={label} />
            </div>
          </div>
        </div>
      </div>

      <div ref={burst} className="burst" />
    </div>
  );
}
