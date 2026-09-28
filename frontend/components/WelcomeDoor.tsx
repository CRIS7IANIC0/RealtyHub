"use client";

/* ─────────────────────────────────────────────────────────────
   RealtyHub — WelcomeDoor
   Overlay de bienvenida a pantalla completa con dos puertas 3D.
   Al pulsar 'CONOCE TU NUEVO HOGAR' las puertas se abren hacia
   afuera (perspective + rotateY), el overlay se desvanece y el
   componente se desmonta para no bloquear la página de abajo.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import styles from "./WelcomeDoor.module.css";

type Phase = "closed" | "opening" | "fading" | "done";

const OPEN_MS = 1500; // duración de la apertura de las puertas
const FADE_MS = 500; // duración del desvanecimiento final

export default function WelcomeDoor() {
  const [phase, setPhase] = useState<Phase>("closed");

  // Bloquea el scroll de la página mientras las puertas estén cerradas
  useEffect(() => {
    if (phase === "done") return;
    const html = document.documentElement;
    const previous = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous.html;
      document.body.style.overflow = previous.body;
    };
  }, [phase]);

  // Secuencia: opening (1.5 s) → fading (0.5 s) → done (desmontado)
  useEffect(() => {
    if (phase === "opening") {
      const t = setTimeout(() => setPhase("fading"), OPEN_MS);
      return () => clearTimeout(t);
    }
    if (phase === "fading") {
      const t = setTimeout(() => setPhase("done"), FADE_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "done") return null;

  const isOpen = phase !== "closed";

  return (
    <div
      className={[
        styles.overlay,
        isOpen ? styles.open : "",
        phase === "fading" ? styles.fading : "",
      ].join(" ")}
      role="dialog"
      aria-modal={!isOpen}
      aria-label="Bienvenida a RealtyHub"
    >
      <div className={styles.stage}>
        <div className={`${styles.door} ${styles.left}`} aria-hidden="true">
          <span className={styles.panelTop} />
          <span className={styles.panelBottom} />
          <span className={styles.handle} />
        </div>

        <div className={`${styles.door} ${styles.right}`} aria-hidden="true">
          <span className={styles.panelTop} />
          <span className={styles.panelBottom} />
          <span className={styles.handle} />
        </div>
      </div>

      <div className={styles.center}>
        <p className={styles.brand}>RealtyHub</p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => setPhase("opening")}
          disabled={isOpen}
          autoFocus
        >
          CONOCE TU NUEVO HOGAR
        </button>
      </div>
    </div>
  );
}
