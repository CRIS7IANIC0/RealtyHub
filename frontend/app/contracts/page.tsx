/* ─────────────────────────────────────────────────────────────
   RealtyHub — Gestión de Contratos  (/contracts)
   Server Component · SSR (cache: 'no-store') · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

import ContractsClient from "./ContractsClient";

// ─── Types ──────────────────────────────────────────────────
export interface Contract {
  id: string;
  property_id: string;
  lead_id: string;
  agent_id: string;
  price: number;
  type: string;
  operation_type?: string;
  status: string;
  signed_at?: string | null;
  created_at?: string;
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

export interface UserSnippet {
  id: string;
  name?: string;
  role?: string;
}

// ─── Data fetchers ───────────────────────────────────────────
const GATEWAY = "http://localhost:3000";

async function fetchContracts(): Promise<Contract[]> {
  try {
    const res = await fetch(`${GATEWAY}/contracts`, { cache: "no-store" });
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
export default async function ContractsPage() {
  const [contracts, properties, leads, users] = await Promise.all([
    fetchContracts(),
    fetchProperties(),
    fetchLeads(),
    fetchUsers(),
  ]);

  return (
    <ContractsClient
      contracts={contracts}
      properties={properties}
      leads={leads}
      users={users}
    />
  );
}
