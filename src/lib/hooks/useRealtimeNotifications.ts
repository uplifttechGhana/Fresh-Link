import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import React from 'react';
import { connectSocket } from '../socket';
import { useAuthStore } from '../authStore';
import { notifKeys, type ApiNotification } from './useNotifications';

const ICON_BY_TYPE: Record<string, string> = {
  order_update: '📦',
  payment: '💰',
  message: '💬',
  job_offer: '🚚',
  investment: '📈',
  system: '🌱',
};

function NotifToast({ title, body, type }: { title: string; body: string; type: string }) {
  const isSystem = type === 'system';
  return React.createElement(
    'div',
    { className: 'flex items-start gap-3 w-full' },
    React.createElement(
      'div',
      { className: 'w-10 h-10 rounded-full overflow-hidden border-2 border-green-100 shadow-sm flex-shrink-0 bg-white' },
      isSystem
        ? React.createElement('img', { src: '/app-icon-192.png', alt: 'FreshLink', className: 'w-full h-full object-cover' })
        : React.createElement('span', { className: 'w-full h-full flex items-center justify-center text-lg' }, ICON_BY_TYPE[type] ?? '🔔'),
    ),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement('p', { className: 'font-bold text-sm text-ink leading-tight truncate' }, title),
      React.createElement('p', { className: 'text-xs text-muted mt-0.5 line-clamp-2 leading-snug' }, body),
    ),
  );
}

/**
 * Listens for `notification:new` WebSocket events and:
 * 1. Shows a branded toast with the app icon immediately
 * 2. Invalidates the notifications query so the bell badge updates
 */
export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token as string);

    const handleNew = (notification: ApiNotification) => {
      toast.custom(
        () => React.createElement(NotifToast, {
          title: notification.title,
          body: notification.body,
          type: notification.type,
        }),
        {
          duration: 6000,
          style: {
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            padding: '12px 16px',
            boxShadow: '0 8px 24px -8px rgba(14,77,44,0.18)',
          },
        },
      );
      qc.invalidateQueries({ queryKey: notifKeys.list() });
    };

    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [token, qc]);
}
