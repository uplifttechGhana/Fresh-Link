import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface PaymentMethod {
  id: string;
  provider: string;
  accountNumber: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
}

const KEY = ['payment-methods'] as const;

export function usePaymentMethods() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<PaymentMethod[]>('/payment-methods'),
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { provider: string; accountNumber: string }) =>
      api.post<PaymentMethod>('/payment-methods', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<PaymentMethod>(`/payment-methods/${id}/default`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemovePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/payment-methods/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
