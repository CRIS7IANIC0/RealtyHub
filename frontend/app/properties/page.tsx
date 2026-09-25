/* ─────────────────────────────────────────────────────────────
   RealtyHub — Catálogo de Propiedades  (/properties)
   Server Component · SSR · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

import PropertiesClient from "./PropertiesClient";

// ─── Types ──────────────────────────────────────────────────
export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  status: string;
  images?: string[];
  image_url?: string;
}

// ─── Data fetcher ───────────────────────────────────────────
const GATEWAY = "http://localhost:3000";

async function fetchProperties(): Promise<Property[]> {
  try {
    const res = await fetch(`${GATEWAY}/properties`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Page (Server Component) ────────────────────────────────
export default async function PropertiesPage() {
  const properties = await fetchProperties();

  return <PropertiesClient properties={properties} />;
}
