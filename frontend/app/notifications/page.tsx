/* ─────────────────────────────────────────────────────────────
   RealtyHub — Centro de Notificaciones (Server Component, SSR)
   ───────────────────────────────────────────────────────────── */

import type { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';
import Navbar from '@/components/Navbar';

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

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const res = await fetch('http://localhost:3000/notifications', {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const notifications = await fetchNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════ TOP NAV ══════════════════════ */}
      <Navbar activeTab="notifications" />

      {/* ══════════════════════ BODY ══════════════════════ */}
      <main
        className="w-full max-w-[800px] mx-auto px-6 md:px-10"
        style={{ paddingTop: 'calc(80px + 40px)' }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-[#222222] mb-1">
                Centro de Notificaciones
              </h1>
              <p className="text-[14px] text-[#6a6a6a]">
                Alertas automáticas generadas por eventos del sistema.
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1a73e8] bg-[#e8f0fe] px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
                {unreadCount} sin leer
              </span>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <NotificationsClient notifications={notifications} />
      </main>
    </div>
  );
}
