/* ─────────────────────────────────────────────────────────────
   RealtyHub — CRM de Leads  (/leads)
   Server Component · SSR · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

import LeadsClient from "./LeadsClient";

// ─── Types ──────────────────────────────────────────────────
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
  source: string;
  status: string;
  created_at: string;
}

// ─── Data fetcher ───────────────────────────────────────────
const GATEWAY = "http://localhost:3000";

async function fetchLeads(): Promise<Lead[]> {
  try {
    const res = await fetch(`${GATEWAY}/leads`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Page (Server Component) ────────────────────────────────
export default async function LeadsPage() {
  const leads = await fetchLeads();

  return <LeadsClient leads={leads} />;
}
