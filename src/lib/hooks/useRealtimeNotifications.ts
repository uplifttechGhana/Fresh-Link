import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectSocket } from '../socket';
import { useAuthStore } from '../authStore';
import { notifKeys, type ApiNotification } from './useNotifications';

const ICON_BY_TYPE: Record<string, string> = {
  order_update: '📦',
  payment: '💰',
  message: '💬',
  job_offer: '🚚',
  investment: '📈',
  system: '🔔',
};

/**
 * Listens for `notification:new` WebSocket events and:
 * 1. Shows a toast immediately
 * 2. Invalidates the notifications query so the bell badge updates
 *
 * Should be mounted once at the app root after authentication.
 */
export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token as string);

    const handleNew = (notification: ApiNotification) => {
      const icon = ICON_BY_TYPE[notification.type] ?? '🔔';
      toast(notification.title, {
        description: notification.body,
        icon,
        duration: 5000,
      });
      qc.invalidateQueries({ queryKey: notifKeys.list() });
    };

    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [token, qc]);
}
