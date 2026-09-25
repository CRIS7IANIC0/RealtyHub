'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Notification } from './page';
import { GATEWAY } from '@/lib/config';

// ─── Helpers ────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'success':
      return (
        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    case 'warning':
      return (
        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a73e8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      );
  }
}

// ─── Main Client Component ───────────────────────────────────

interface Props {
  notifications: Notification[];
}

export default function NotificationsClient({ notifications }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markAsRead(id: string) {
    if (loadingId) return;
    setLoadingId(id);
    try {
      await fetch(`${GATEWAY}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      router.refresh();
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    } finally {
      setLoadingId(null);
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-[16px] border border-[#ebebeb] overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          {/* Bell illustration */}
          <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d1d1"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-[#222222] mb-1">Sin notificaciones</p>
          <p className="text-[13px] text-[#6a6a6a]">
            Los eventos de contratos firmados aparecerán aquí automáticamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#ebebeb] overflow-hidden">
      {notifications.map((n, idx) => {
        const isLast = idx === notifications.length - 1;
        const isLoading = loadingId === n.id;

        return (
          <div
            key={n.id}
            className="flex items-start gap-4 px-6 py-5 transition-colors duration-150"
            style={{
              backgroundColor: n.is_read ? '#ffffff' : '#f0f7ff',
              borderBottom: isLast ? 'none' : '1px solid #ebebeb',
            }}
          >
            {/* Type icon */}
            <TypeIcon type={n.type} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {/* Unread dot */}
                {!n.is_read && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#1a73e8] flex-shrink-0"
                    aria-label="No leída"
                  />
                )}
                <p className="text-[14px] font-semibold text-[#222222] truncate">{n.title}</p>
              </div>
              <p className="text-[13px] text-[#6a6a6a] leading-relaxed mb-1">{n.message}</p>
              <p className="text-[12px] text-[#b0b0b0]">{fmtDateTime(n.created_at)}</p>
            </div>

            {/* Mark as read action */}
            {!n.is_read && (
              <button
                id={`mark-read-${n.id}`}
                onClick={() => markAsRead(n.id)}
                disabled={isLoading}
                title="Marcar como leída"
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-[#e8f0fe] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Marcar notificación como leída"
              >
                {isLoading ? (
                  /* Spinner */
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1a73e8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  /* Checkmark */
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1a73e8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )}

            {/* Read indicator for already-read items */}
            {n.is_read && (
              <span className="flex-shrink-0 text-[11px] text-[#b0b0b0] font-medium self-center">
                Leída
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
