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
  created_at: string;
}

export interface UserSnippet {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

// ─── Data fetchers ───────────────────────────────────────────
const GATEWAY = "http://localhost:3000";

async function fetchCommissions(): Promise<Commission[]> {
  try {
    const res = await fetch(`${GATEWAY}/commissions`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchUsers(): Promise<UserSnippet[]> {
  try {
    const res = await fetch(`${GATEWAY}/users`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Page (Server Component) ────────────────────────────────
export default async function CommissionsPage() {
  const [commissions, users] = await Promise.all([
    fetchCommissions(),
    fetchUsers(),
  ]);

  return <CommissionsClient commissions={commissions} users={users} />;
}
