import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface SavedFarmerItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
  farmerProfile?: {
    location?: string | null;
    rating?: number | null;
    totalReviews?: number | null;
  } | null;
  savedAt: string;
}

const KEYS = {
  all: ['saved-farmers'] as const,
};

export function useSavedFarmers(enabled = true) {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => api.get<SavedFarmerItem[]>('/users/saved-farmers'),
    enabled,
  });
}

export function useSaveFarmer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (farmerId: string) =>
      api.post<{ message: string }>(`/users/saved-farmers/${farmerId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUnsaveFarmer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (farmerId: string) =>
      api.delete<{ message: string }>(`/users/saved-farmers/${farmerId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
