import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  source: string;
  amount: number;
  balance: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface WalletData {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
  transactions: WalletTransaction[];
}

export interface PaginatedTransactions {
  items: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface PayoutProvider {
  name: string;
  code: string;
  type: string;
}

export interface PayoutAccount {
  id: string;
  userId: string;
  type: 'mobile_money' | 'bank';
  provider: string;
  accountName: string;
  paystackRecipientCode: string;
  isDefault: boolean;
  createdAt: string;
  maskedAccountNumber: string;
}

export interface WithdrawalResult {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  failureReason?: string | null;
  paystackReference: string;
  simulated?: boolean;
}

export const walletKeys = {
  all: ['wallet'] as const,
  detail: () => [...walletKeys.all, 'detail'] as const,
  transactions: (page: number) => [...walletKeys.all, 'transactions', page] as const,
  payoutAccounts: () => [...walletKeys.all, 'payout-accounts'] as const,
  payoutProviders: (type: string) => [...walletKeys.all, 'payout-providers', type] as const,
};

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.detail(),
    queryFn: () => api.get<WalletData>('/wallet'),
    refetchInterval: 60_000,
  });
}

export function useWalletTransactions(page = 1) {
  return useQuery({
    queryKey: walletKeys.transactions(page),
    queryFn: () =>
      api.get<PaginatedTransactions>(`/wallet/transactions?page=${page}&limit=20`),
  });
}

export function usePayoutProviders(type: 'mobile_money' | 'bank') {
  return useQuery({
    queryKey: walletKeys.payoutProviders(type),
    queryFn: () => api.get<PayoutProvider[]>(`/wallet/payout-providers?type=${type}`),
    staleTime: 5 * 60_000,
  });
}

export function usePayoutAccounts() {
  return useQuery({
    queryKey: walletKeys.payoutAccounts(),
    queryFn: () => api.get<PayoutAccount[]>('/wallet/payout-accounts'),
  });
}

export function useAddPayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      type: 'mobile_money' | 'bank';
      provider: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    }) => api.post<PayoutAccount>('/wallet/payout-accounts', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.payoutAccounts() });
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { amount: number; payoutAccountId?: string }) =>
      api.post<WithdrawalResult>('/wallet/withdraw', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.detail() });
      qc.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/** Human-readable label for a transaction source */
export function txSourceLabel(source: string): string {
  const map: Record<string, string> = {
    order_payment: 'Order Payment',
    transport_fee: 'Transport Fee',
    investment_return: 'Investment Return',
    withdrawal: 'Withdrawal',
    refund: 'Refund',
    investment: 'Investment',
    funding_disbursement: 'Funding',
  };
  return map[source] ?? source.replace(/_/g, ' ');
}
