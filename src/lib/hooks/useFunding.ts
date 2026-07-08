import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface FundingRequest {
  id: string;
  farmerId: string;
  title: string;
  description: string | null;
  goal: number;
  raised: number;
  deadline: string | null;
  status: string;
  createdAt: string;
  farmer?: { user: { name: string; avatarUrl: string | null } };
}

export interface CreateFundingPayload {
  title: string;
  description?: string;
  goal: number;
  deadline?: string;
}

const fundingKeys = {
  all: ['funding'] as const,
  list: () => ['funding', 'list'] as const,
};

export function useMyFundingRequests() {
  return useQuery({
    queryKey: fundingKeys.list(),
    queryFn: () => api.get<FundingRequest[]>('/investor/funding-requests/mine'),
  });
}

export function useCreateFundingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFundingPayload) =>
      api.post<FundingRequest>('/investor/funding-requests', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fundingKeys.list() });
    },
  });
}
