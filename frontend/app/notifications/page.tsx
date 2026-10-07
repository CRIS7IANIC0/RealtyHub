/* ─────────────────────────────────────────────────────────────
   RealtyHub — Centro de Notificaciones (Server Component, SSR)
   ───────────────────────────────────────────────────────────── */

import type { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';
import Navbar from '@/components/Navbar';
import { GATEWAY } from '@/lib/config';

export const metadata: Metadata = {
  title: 'RealtyHub — Centro de Notificaciones',
  description: 'Historial de alertas automáticas generadas por eventos de contratos y ventas.',
};

export const dynamic = 'force-dynamic';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NameRef {
  id: string;
  name?: string;
  title?: string;
  address?: string;
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${GATEWAY}${path}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const [notifications, properties, leads, users] = await Promise.all([
    fetchList<Notification>('/notifications'),
    fetchList<NameRef>('/properties'),
    fetchList<NameRef>('/leads'),
    fetchList<NameRef>('/users'),
  ]);

  // Mapa id → nombre legible, para reemplazar UUIDs en notificaciones antiguas
  const names: Record<string, string> = {};
  for (const p of properties) names[p.id] = p.title || p.address || '';
  for (const l of leads) names[l.id] = l.name || '';
  for (const u of users) names[u.id] = u.name || '';

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <Navbar activeTab="notifications" />

      <main
        className="w-full max-w-[800px] mx-auto px-6 md:px-10 pb-16"
        style={{ paddingTop: 'calc(80px + 40px)' }}
      >
        <NotificationsClient notifications={notifications} names={names} />
      </main>
    </div>
  );
}
