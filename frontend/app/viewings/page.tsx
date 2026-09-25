/* ─────────────────────────────────────────────────────────────
   RealtyHub — Agenda de Visitas  (/viewings)
   Server Component · SSR · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

import ViewingsClient from "./ViewingsClient";

// ─── Types ──────────────────────────────────────────────────
export interface Viewing {
  id: string;
  property_id: string;
  lead_id: string;
  agent_id?: string | null;
  scheduled_at: string;
  status: string;
}

export interface PropertySnippet {
  id: string;
  title?: string;
  address?: string;
}

export interface LeadSnippet {
  id: string;
  name?: string;
  email?: string;
}

// ─── Data fetchers ───────────────────────────────────────────
import { GATEWAY } from "@/lib/config";

async function fetchViewings(): Promise<Viewing[]> {
  try {
    const res = await fetch(`${GATEWAY}/viewings`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchProperties(): Promise<PropertySnippet[]> {
  try {
    const res = await fetch(`${GATEWAY}/properties`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchLeads(): Promise<LeadSnippet[]> {
  try {
    const res = await fetch(`${GATEWAY}/leads`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Page (Server Component) ────────────────────────────────
export default async function ViewingsPage() {
  const [viewings, properties, leads] = await Promise.all([
    fetchViewings(),
    fetchProperties(),
    fetchLeads(),
  ]);

  return (
    <ViewingsClient
      initialViewings={viewings}
      properties={properties}
      leads={leads}
    />
  );
}
