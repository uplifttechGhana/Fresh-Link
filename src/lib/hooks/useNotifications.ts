import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../authStore';

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  items: ApiNotification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export const notifKeys = {
  list: () => ['notifications'] as const,
};

export function useNotifications() {
  const isLoggedIn = !!useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notifKeys.list(),
    queryFn: () => api.get<NotificationsPage>('/notifications'),
    refetchInterval: 30_000,
    enabled: isLoggedIn,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<{ message: string }>('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.list() }),
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<ApiNotification>(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.list() }),
  });
}
