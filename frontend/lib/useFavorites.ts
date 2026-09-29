"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "realtyhub_favorites";

function readStored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set(); // almacenamiento bloqueado o corrupto
  }
}

/**
 * Favoritos del visitante guardados en este navegador (no hay endpoint aún).
 * Si localStorage no está disponible, los favoritos funcionan sólo en memoria.
 * Úsalo sólo en componentes montados en el cliente (la landing se monta tras
 * leer la sesión), para que el estado inicial no difiera del HTML del servidor.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(readStored);

  const toggle = useCallback((id: string | number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* sin persistencia */
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string | number) => favorites.has(String(id)),
    [favorites]
  );

  return { isFavorite, toggle };
}
