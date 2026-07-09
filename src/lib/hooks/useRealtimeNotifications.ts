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
  return React.createElement(
    'div',
    { style: { position: 'relative', overflow: 'hidden', borderRadius: '20px', minHeight: '72px', width: '100%' } },
    // Background logo — centered, large, low opacity
    React.createElement('img', {
      src: '/freshlink-logo.png',
      alt: '',
      'aria-hidden': true,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        opacity: 0.12,
        pointerEvents: 'none',
        userSelect: 'none',
      },
    }),
    // Foreground content
    React.createElement(
      'div',
      { style: { position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0' } },
      React.createElement(
        'div',
        { style: { width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(21,128,61,0.2)', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('img', { src: '/app-icon-192.png', alt: 'FreshLink', style: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ),
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement('p', { style: { fontWeight: 700, fontSize: '14px', color: 'var(--color-ink)', lineHeight: 1.3, margin: 0 } }, title),
        React.createElement('p', { style: { fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, body),
      ),
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
            border: '1px solid rgba(21,128,61,0.2)',
            borderRadius: '20px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px -8px rgba(14,77,44,0.25)',
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
