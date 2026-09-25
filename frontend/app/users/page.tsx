/* ─────────────────────────────────────────────────────────────
   RealtyHub — Directorio de Personal  (/users)
   Server Component · SSR · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

import UsersClient from "./UsersClient";

// ─── Types ──────────────────────────────────────────────────
export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  office_id: string | number;
}

// ─── Data fetcher ───────────────────────────────────────────
import { GATEWAY } from "@/lib/config";

async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${GATEWAY}/users`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Page (Server Component) ────────────────────────────────
export default async function UsersPage() {
  const users = await fetchUsers();

  return <UsersClient users={users} />;
}
