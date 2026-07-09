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

function NotifToast({ title, body }: { title: string; body: string; type: string }) {
  return React.createElement(
    'div',
    {
      style: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        minHeight: '76px',
        width: '100%',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
    },
    /* Logo — large, centered watermark */
    React.createElement('img', {
      src: '/freshlink-logo.png',
      alt: '',
      'aria-hidden': true,
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '75%',
        objectFit: 'contain',
        opacity: 0.35,
        pointerEvents: 'none',
      },
    }),
    /* Content row */
    React.createElement(
      'div',
      { style: { position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' } },
      /* App icon circle */
      React.createElement(
        'div',
        {
          style: {
            width: '44px', height: '44px', borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '2px solid rgba(21,128,61,0.35)',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(14,77,44,0.18)',
          },
        },
        React.createElement('img', { src: '/app-icon-192.png', alt: 'FreshLink', style: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ),
      /* Text */
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement('p', {
          style: { fontWeight: 700, fontSize: '14px', color: '#FFFFFF', lineHeight: 1.3, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.3)' },
        }, title),
        React.createElement('p', {
          style: { fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '3px', lineHeight: 1.4 },
        }, body),
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
            background: 'rgba(21,128,61,0.82)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '20px',
            padding: '14px 16px',
            boxShadow: '0 8px 32px -8px rgba(14,77,44,0.4)',
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
