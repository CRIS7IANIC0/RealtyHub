'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Notification } from './page';
import { GATEWAY } from '@/lib/config';

const PAGE_SIZE = 8;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// ─── Helpers ────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'Ahora mismo';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtFull(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Reemplaza UUIDs por nombres reales (las notificaciones antiguas guardaban ids). */
function humanize(message: string, names: Record<string, string>): string {
  return message.replace(UUID_RE, (id) => {
    const name = names[id];
    return name ? `"${name}"` : `#${id.slice(0, 8)}`;
  });
}

const TYPE_STYLES: Record<string, { bg: string; fg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-emerald-50',
    fg: '#059669',
    icon: <polyline points="20 6 9 17 4 12" />,
  },
  warning: {
    bg: 'bg-amber-50',
    fg: '#d97706',
    icon: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
  info: {
    bg: 'bg-sky-50',
    fg: '#0284c7',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
  },
};

function TypeIcon({ type }: { type: string }) {
  const st = TYPE_STYLES[type] ?? TYPE_STYLES.info;
  return (
    <div className={`w-10 h-10 rounded-full ${st.bg} flex items-center justify-center flex-shrink-0`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={st.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {st.icon}
      </svg>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────

interface Props {
  notifications: Notification[];
  names: Record<string, string>;
}

export default function NotificationsClient({ notifications, names }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Si al marcar como leídas la página actual deja de existir, se usa la última válida
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function markAsRead(id: string) {
    if (loadingId) return;
    setLoadingId(id);
    try {
      await fetch(`${GATEWAY}/notifications/${id}/read`, { method: 'PATCH' });
      router.refresh();
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    } finally {
      setLoadingId(null);
    }
  }

  async function markAllAsRead() {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await fetch(`${GATEWAY}/notifications/read-all`, { method: 'PATCH' });
      router.refresh();
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    } finally {
      setMarkingAll(false);
    }
  }

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
      active ? 'bg-[#222222] text-white' : 'text-[#6a6a6a] hover:text-[#222222]'
    }`;

  const pagerBtn =
    'rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-[13px] font-medium text-[#222222] hover:border-[#222222] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#ebebeb]';

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-[#222222] mb-1">
            Notificaciones
          </h1>
          <p className="text-[14px] text-[#6a6a6a]">
            {unreadCount > 0
              ? `Tienes ${unreadCount} ${unreadCount === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}.`
              : 'Estás al día, no tienes notificaciones pendientes.'}
          </p>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-full border border-[#222222] px-5 py-2.5 text-[13px] font-semibold text-[#222222] hover:bg-[#222222] hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#222222]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 13 7 18 17 6" />
            <polyline points="12 16 14 18 22 8" />
          </svg>
          {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
        </button>
      </div>

      {/* Filters */}
      <div className="inline-flex rounded-full border border-[#ebebeb] bg-white p-1 mb-5">
        <button type="button" className={tabClass(filter === 'all')} onClick={() => { setFilter('all'); setPage(1); }}>
          Todas ({notifications.length})
        </button>
        <button type="button" className={tabClass(filter === 'unread')} onClick={() => { setFilter('unread'); setPage(1); }}>
          Sin leer ({unreadCount})
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-[#ebebeb] flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-[#222222] mb-1">
            {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'Sin notificaciones'}
          </p>
          <p className="text-[13px] text-[#6a6a6a]">
            Los eventos de contratos firmados aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((n) => {
            const isLoading = loadingId === n.id;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 rounded-[16px] border bg-white p-5 transition-colors ${
                  n.is_read ? 'border-[#ebebeb]' : 'border-[#ff385c]/30'
                }`}
              >
                <TypeIcon type={n.type} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#ff385c] flex-shrink-0" aria-label="No leída" />
                    )}
                    <p className={`text-[14px] text-[#222222] ${n.is_read ? 'font-medium' : 'font-semibold'}`}>
                      {n.title}
                    </p>
                  </div>
                  <p className="text-[13px] text-[#6a6a6a] leading-relaxed mb-2">
                    {humanize(n.message, names)}
                  </p>
                  <p className="text-[12px] text-[#9a9a9a]" title={fmtFull(n.created_at)}>
                    {fmtRelative(n.created_at)}
                  </p>
                </div>

                {n.is_read ? (
                  <span className="flex-shrink-0 text-[11px] text-[#9a9a9a] font-medium bg-[#f7f7f7] px-2.5 py-1 rounded-full self-center">
                    Leída
                  </span>
                ) : (
                  <button
                    onClick={() => markAsRead(n.id)}
                    disabled={isLoading}
                    className="flex-shrink-0 self-center text-[12px] font-semibold text-[#222222] border border-[#ebebeb] rounded-full px-3.5 py-1.5 hover:border-[#222222] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Marcar notificación como leída"
                  >
                    {isLoading ? '…' : 'Marcar leída'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between mt-6" aria-label="Paginación">
          <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={pagerBtn}>
            ← Anterior
          </button>
          <span className="text-[13px] text-[#6a6a6a]">
            Página <strong className="text-[#222222]">{current}</strong> de {totalPages}
          </span>
          <button type="button" onClick={() => setPage(current + 1)} disabled={current === totalPages} className={pagerBtn}>
            Siguiente →
          </button>
        </nav>
      )}
    </>
  );
}
