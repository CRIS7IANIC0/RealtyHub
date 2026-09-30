"use client";

/* ─────────────────────────────────────────────────────────────
   RealtyHub — WelcomeDoor
   Overlay de bienvenida a pantalla completa: fachada contemporánea con
   puerta doble de nogal listonado, marco de acero negro y apliques de
   luz cálida sobre muro de concreto. Al pulsar
   'CONOCE TU NUEVO HOGAR' las dos hojas se abren hacia afuera
   (perspective + rotateY), entra la luz, la escena "cruza" la
   puerta desvaneciéndose y el componente se desmonta del DOM.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import styles from "./WelcomeDoor.module.css";

type Phase = "closed" | "opening" | "fading" | "done";

const OPEN_MS = 1500; // apertura de las puertas
const FADE_MS = 700; // acercamiento + desvanecimiento final

// La bienvenida se muestra una sola vez por sesión del navegador
const SEEN_KEY = "rh_welcome_seen";

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* almacenamiento no disponible: la puerta volverá a mostrarse */
  }
}

function DoorLeaf({ side }: { side: "left" | "right" }) {
  return (
    <div className={`${styles.door} ${styles[side]}`} aria-hidden="true">
      <span className={styles.handle} />
      <span className={styles.kick} />
    </div>
  );
}

/**
 * Montar solo en el cliente (p. ej. tras leer la sesión en un efecto):
 * el estado inicial lee sessionStorage para no mostrar la puerta de nuevo.
 */
export default function WelcomeDoor() {
  const [phase, setPhase] = useState<Phase>(() =>
    alreadySeen() ? "done" : "closed"
  );

  // Bloquea el scroll de la página mientras el overlay esté presente
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

  // Secuencia: opening (1.5 s) → fading (0.7 s) → done (desmontado)
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
      <div className={styles.scene}>
        <div className={styles.wall} />
        <span className={`${styles.sconce} ${styles.sconceLeft}`} />
        <span className={`${styles.sconce} ${styles.sconceRight}`} />
        <div className={styles.floor} />

        <div className={styles.portal}>
          <div className={styles.canopy} />
          <div className={styles.doorway}>
            <div className={styles.light} />
            <DoorLeaf side="left" />
            <DoorLeaf side="right" />
          </div>
        </div>
      </div>

      <div className={styles.center}>
        <p className={styles.brand}>
          Realty<span>Hub</span>
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => {
            markSeen();
            setPhase("opening");
          }}
          disabled={isOpen}
          autoFocus
        >
          CONOCE TU NUEVO HOGAR
        </button>
      </div>
    </div>
  );
}
