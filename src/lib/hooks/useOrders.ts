import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// ── Types ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  produceId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  produce: { id: string; title: string; images: string[]; unit: string };
}

export interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  deliveryFee?: number;
  deliveryAddress: string;
  notes?: string;
  paystackRef?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  buyer: { id: string; name: string; phone: string; avatarUrl: string | null };
  farmer: {
    id: string;
    userId: string;
    user: { id: string; name: string; phone: string; avatarUrl: string | null };
  };
  transportJob?: TransportJob | null;
  invoice?: Invoice | null;
  conversation?: { id: string } | null;
}

export interface TransportJob {
  id: string;
  status: string;
  transporterId?: string;
  transporter?: {
    user: { id: string; name: string; phone: string; avatarUrl: string | null };
    vehicleType: string;
    licensePlate: string | null;
  };
}

export interface Invoice {
  id: string;
  orderId: string;
  number: string;
  createdAt: string;
}

export interface CreateOrderDto {
  items: { produceId: string; quantity: number }[];
  deliveryAddress: string;
  notes?: string;
}

export interface InitPaymentResult {
  authorizationUrl: string;
  reference: string;
}

// ── Query Keys ─────────────────────────────────────────────────────────────

export const orderKeys = {
  all: ['orders'] as const,
  buyerList: () => ['orders', 'buyer'] as const,
  farmerList: () => ['orders', 'farmer'] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  invoice: (id: string) => ['orders', 'invoice', id] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useBuyerOrders() {
  return useQuery({
    queryKey: orderKeys.buyerList(),
    queryFn: () => api.get<Order[]>('/orders/buyer'),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while order is in an active state
      if (status && !['delivered', 'cancelled'].includes(status)) return 15_000;
      return false;
    },
  });
}

export function useOrderInvoice(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.invoice(orderId ?? ''),
    queryFn: () => api.get<Invoice>(`/orders/${orderId}/invoice`),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrderDto) => api.post<Order>('/orders', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.buyerList() });
    },
  });
}

export function useInitOrderPayment() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<InitPaymentResult>(`/payments/orders/${orderId}/initialize`, {}),
  });
}

export function useVerifyOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<{ status: string }>(`/payments/orders/${orderId}/verify`, {}),
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.farmerList() });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.patch<Order>(`/orders/${orderId}/cancel`, {}),
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.buyerList() });
    },
  });
}

// ── Farmer hooks ─────────────────────────────────────────────────────────────

export function useFarmerOrders() {
  return useQuery({
    queryKey: orderKeys.farmerList(),
    queryFn: () => api.get<Order[]>('/orders/farmer'),
    refetchInterval: 30_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Order>(`/orders/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: orderKeys.farmerList() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(vars.id) });
      if (vars.status === 'ready_for_pickup') {
        qc.invalidateQueries({ queryKey: ['transport', 'available'] });
      }
    },
  });
}

/** Format a raw order status string into a display-friendly label */
export function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    packed: 'Packed',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status;
}

export function orderStatusColor(status: string): string {
  if (status === 'delivered') return 'bg-green-50 text-green';
  if (status === 'in_transit') return 'bg-orange-soft text-orange';
  if (status === 'cancelled') return 'bg-red-50 text-red-500';
  return 'bg-gray-100 text-muted';
}

export interface DemandPoint { name: string; demand: number; }
export interface OrderConfig { deliveryFee: number; currency: string; }

export function useDemandAnalytics() {
  return useQuery({
    queryKey: ['orders', 'demand-analytics'],
    queryFn: () => api.get<DemandPoint[]>('/orders/demand-analytics'),
    staleTime: 30 * 60 * 1000,
  });
}

export function useOrderConfig() {
  return useQuery({
    queryKey: ['orders', 'config'],
    queryFn: () => api.get<OrderConfig>('/orders/config'),
    staleTime: Infinity,
  });
}
