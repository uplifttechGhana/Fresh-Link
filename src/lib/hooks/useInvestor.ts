import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FundingRequestFarmer {
  id: string;
  name: string;
  avatarUrl: string | null;
  farmerProfile: {
    farmName: string | null;
    location: string | null;
    description?: string | null;
    rating: number;
  } | null;
}

export interface FundingRequest {
  id: string;
  farmerId: string;
  title: string;
  description: string | null;
  goal: number;
  raised: number;
  status: 'open' | 'funded' | 'closed' | 'cancelled';
  deadline: string | null;
  createdAt: string;
  farmer: FundingRequestFarmer;
  investments: { id: string; amount: number; status: string }[];
}

export interface Investment {
  id: string;
  investorId: string;
  requestId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  paystackRef: string | null;
  createdAt: string;
  request: {
    id: string;
    title: string;
    goal: number;
    raised: number;
    status: string;
    farmer: { name: string; avatarUrl: string | null };
  };
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const investorKeys = {
  all: ['investor'] as const,
  requests: (status?: string) => [...investorKeys.all, 'requests', status ?? 'open'] as const,
  request: (id: string) => [...investorKeys.all, 'request', id] as const,
  investments: () => [...investorKeys.all, 'investments'] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Browse open funding opportunities (public, no auth required) */
export function useFundingRequests(status?: string) {
  return useQuery({
    queryKey: investorKeys.requests(status),
    queryFn: () =>
      api.get<FundingRequest[]>(
        `/investor/funding-requests${status ? `?status=${status}` : ''}`,
      ),
    staleTime: 60_000,
  });
}

/** Single funding request detail */
export function useFundingRequest(id: string) {
  return useQuery({
    queryKey: investorKeys.request(id),
    queryFn: () => api.get<FundingRequest>(`/investor/funding-requests/${id}`),
    enabled: !!id,
  });
}

/** Investor's own investment portfolio */
export function useMyInvestments() {
  return useQuery({
    queryKey: investorKeys.investments(),
    queryFn: () => api.get<Investment[]>('/investor/investments'),
  });
}

/** Create an investment in a funding request */
export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, amount }: { requestId: string; amount: number }) =>
      api.post<Investment>('/investor/investments', { requestId, amount }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: investorKeys.investments() });
      qc.invalidateQueries({ queryKey: investorKeys.request(vars.requestId) });
      qc.invalidateQueries({ queryKey: investorKeys.requests() });
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function progressPct(request: Pick<FundingRequest, 'goal' | 'raised'>): number {
  if (!request.goal) return 0;
  return Math.min(100, Math.round((request.raised / request.goal) * 100));
}
