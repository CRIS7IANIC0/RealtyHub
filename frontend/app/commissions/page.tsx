/* ─────────────────────────────────────────────────────────────
   RealtyHub — Gestión de Comisiones  (/commissions)
   Server Component · SSR (cache: 'no-store') · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

import CommissionsClient from "./CommissionsClient";

// ─── Types ──────────────────────────────────────────────────
export interface Commission {
  id: string;
  contract_id: string;
  agent_id: string;
  office_id?: string | null;
  amount: number;
  split_rule_applied?: string | null;
  status: string;
  operation_type?: string;
  contract_price?: number;
  rate_percent?: number;
  agent_pct?: number;
  office_pct?: number;
  central_pct?: number;
  agent_amount?: number;
  office_amount?: number;
  central_amount?: number;
  paid_at?: string | null;
  created_at: string;
}

export interface Agreement {
  id: string;
  operation_type: string;
  rate_percent: number;
  agent_pct: number;
  office_pct: number;
  central_pct: number;
  active: boolean;
  valid_from: string;
  valid_to?: string | null;
}

export interface OfficeSnippet {
  id: string;
  name: string;
  region?: string;
}

export interface UserSnippet {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

// ─── Data fetchers ───────────────────────────────────────────
import { GATEWAY } from "@/lib/config";

async function fetchCommissions(): Promise<Commission[]> {
  try {
    const res = await fetch(`${GATEWAY}/commissions`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${GATEWAY}${path}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Page (Server Component) ────────────────────────────────
export default async function CommissionsPage() {
  const [commissions, users, agreements, offices] = await Promise.all([
    fetchCommissions(),
    fetchList<UserSnippet>("/users"),
    fetchList<Agreement>("/commissions/agreements"),
    fetchList<OfficeSnippet>("/offices"),
  ]);

  return (
    <CommissionsClient
      commissions={commissions}
      users={users}
      agreements={agreements}
      offices={offices}
    />
  );
}
