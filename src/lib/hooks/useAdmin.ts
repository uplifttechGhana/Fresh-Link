import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../authStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  activeProduce: number;
  totalVolume: number;
  ordersByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

export interface PaginatedAdminUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  buyer: { name: string; phone?: string };
  farmer?: { user: { name: string } };
}

export interface PaginatedAdminOrders {
  items: AdminOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminTransaction {
  id: string;
  type: 'credit' | 'debit';
  source: string;
  amount: number;
  balance: number;
  note: string | null;
  createdAt: string;
  wallet: { user: { name: string; phone: string } };
}

export interface PaginatedAdminTransactions {
  items: AdminTransaction[];
  total: number;
  page: number;
  limit: number;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const adminKeys = {
  stats: () => ['admin', 'stats'] as const,
  users: (p: number, role?: string, search?: string) =>
    ['admin', 'users', p, role ?? '', search ?? ''] as const,
  orders: (p: number, status?: string) => ['admin', 'orders', p, status ?? ''] as const,
  transactions: (p: number) => ['admin', 'transactions', p] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Coerce Prisma groupBy rows or legacy {_count} objects into plain numbers. */
function toCountRecord(
  rows: unknown,
  keyField: 'status' | 'role',
): Record<string, number> {
  if (!rows || typeof rows !== 'object') return {};

  if (Array.isArray(rows)) {
    return Object.fromEntries(
      rows.map((row) => {
        const key = String((row as Record<string, unknown>)[keyField] ?? 'unknown');
        const raw = (row as Record<string, unknown>)._count;
        const count =
          typeof raw === 'number'
            ? raw
            : Number((raw as { _all?: number } | undefined)?._all ?? 0);
        return [key, count];
      }),
    );
  }

  return Object.fromEntries(
    Object.entries(rows as Record<string, unknown>).map(([key, value]) => {
      if (typeof value === 'number') return [key, value];
      if (value && typeof value === 'object' && '_count' in value) {
        const raw = (value as { _count: unknown })._count;
        const count =
          typeof raw === 'number'
            ? raw
            : Number((raw as { _all?: number } | undefined)?._all ?? 0);
        return [key, count];
      }
      return [key, Number(value ?? 0)];
    }),
  );
}

export function useAdminStats() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const raw = await api.get<AdminStats & {
        totals?: {
          users?: number;
          orders?: number;
          activeProduce?: number;
          transactionVolume?: number;
        };
        ordersByStatus?: Array<{ status: string; _count: number }> | Record<string, number>;
        usersByRole?: Array<{ role: string; _count: number }> | Record<string, number>;
      }>('/admin/stats');

      // Support legacy API shape if backend hasn't been restarted yet.
      if (raw.totalUsers !== undefined) {
        return {
          ...raw,
          totalVolume: Number(raw.totalVolume ?? 0),
          ordersByStatus: toCountRecord(raw.ordersByStatus, 'status'),
          usersByRole: toCountRecord(raw.usersByRole, 'role'),
        } satisfies AdminStats;
      }

      return {
        totalUsers: raw.totals?.users ?? 0,
        totalOrders: raw.totals?.orders ?? 0,
        activeProduce: raw.totals?.activeProduce ?? 0,
        totalVolume: Number(raw.totals?.transactionVolume ?? 0),
        ordersByStatus: toCountRecord(raw.ordersByStatus, 'status'),
        usersByRole: toCountRecord(raw.usersByRole, 'role'),
      } satisfies AdminStats;
    },
    refetchInterval: 60_000,
    enabled: isAdmin,
  });
}

export function useAdminUsers(page = 1, role?: string, search?: string) {
  return useQuery({
    queryKey: adminKeys.users(page, role, search),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (role) params.set('role', role);
      if (search) params.set('search', search);
      return api.get<PaginatedAdminUsers>(`/admin/users?${params}`);
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/suspend`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminOrders(page = 1, status?: string) {
  return useQuery({
    queryKey: adminKeys.orders(page, status),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await api.get<PaginatedAdminOrders & {
        items: Array<AdminOrder & { totalAmount?: number }>;
      }>(`/admin/orders?${params}`);
      return {
        ...res,
        items: res.items.map((order) => ({
          ...order,
          total: Number(order.total ?? order.totalAmount ?? 0),
        })),
      };
    },
    refetchInterval: 30_000,
  });
}

export function useAdminTransactions(page = 1) {
  return useQuery({
    queryKey: adminKeys.transactions(page),
    queryFn: () =>
      api.get<PaginatedAdminTransactions>(
        `/admin/transactions?page=${page}&limit=20`,
      ),
  });
}

// ── Revenue analytics ─────────────────────────────────────────────────────────

export interface RevenuePoint { name: string; revenue: number; }
export interface RevenueSeries {
  total: number;
  delta: string | null;
  data: RevenuePoint[];
  label: string;
}

export function useAdminRevenue(range: 'this_week' | 'last_week' = 'this_week') {
  return useQuery({
    queryKey: ['admin', 'revenue', range],
    queryFn: () => api.get<RevenueSeries>(`/admin/analytics/revenue?range=${range}`),
    staleTime: 60_000,
  });
}

// ── Disputes ─────────────────────────────────────────────────────────────────

export interface AdminDispute {
  id: string;
  orderId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { name: string; phone: string };
  order: { id: string; total: number; status: string };
}

export interface PaginatedDisputes {
  items: AdminDispute[];
  total: number;
  page: number;
  limit: number;
}

export function useAdminDisputes(page = 1, status?: string) {
  return useQuery({
    queryKey: ['admin', 'disputes', page, status ?? ''],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      return api.get<PaginatedDisputes>(`/admin/disputes?${params}`);
    },
    refetchInterval: 30_000,
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/disputes/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }),
  });
}
