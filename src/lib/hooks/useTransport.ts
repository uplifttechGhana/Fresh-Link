import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { api, ApiError } from '../api';
import { walletKeys } from './useWallet';
import { useAuthStore } from '../authStore';

// ── Types ───────────────────────────────────────────────────────────────────

export interface TransportJobContact {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
}

export interface TransportJob {
  id: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickup: string;
  dropoff: string;
  distance: number | null;
  fee: number;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  transporterId: string | null;
  order?: {
    id: string;
    buyer: TransportJobContact;
    farmer?: { user: TransportJobContact };
  } | null;
  request?: {
    id: string;
    farmer: { user: TransportJobContact };
  } | null;
}

export interface TransportProfile {
  id: string;
  userId: string;
  vehicleType: string | null;
  vehiclePlate: string | null;
  vehicleCapacity: string | null;
  vehiclePhotoUrl: string | null;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  totalReviews: number;
}

export interface CreateTransportRequestPayload {
  pickup: string;
  dropoff: string;
  notes?: string;
  weight?: number;
  distance?: number;
}

export interface TransportRequestResult {
  id: string;
  pickup: string;
  dropoff: string;
  createdAt: string;
}

// ── Query Keys ──────────────────────────────────────────────────────────────

export const transportKeys = {
  all: ['transport'] as const,
  availableJobs: () => [...transportKeys.all, 'available'] as const,
  myJobs: (status?: string) => [...transportKeys.all, 'my', status ?? 'all'] as const,
  profile: (userId?: string) => [...transportKeys.all, 'profile', userId ?? 'anon'] as const,
};

// ── Farmer hook ─────────────────────────────────────────────────────────────

export function useCreateTransportRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransportRequestPayload) =>
      api.post<TransportRequestResult>('/transport/requests', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transportKeys.all });
    },
  });
}

// ── Driver hooks ─────────────────────────────────────────────────────────────

export function useAvailableJobs() {
  return useQuery({
    queryKey: transportKeys.availableJobs(),
    queryFn: () => api.get<TransportJob[]>('/transport/jobs/available'),
    refetchInterval: 20_000,
  });
}

export function useMyJobs(status?: string) {
  return useQuery({
    queryKey: transportKeys.myJobs(status),
    queryFn: () =>
      api.get<TransportJob[]>(`/transport/jobs${status ? `?status=${status}` : ''}`),
    refetchInterval: 15_000,
  });
}

export function useAcceptJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      api.patch<TransportJob>(`/transport/jobs/${jobId}/accept`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transportKeys.availableJobs() });
      qc.invalidateQueries({ queryKey: transportKeys.myJobs() });
    },
  });
}

export function useUpdateJobStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<TransportJob>(`/transport/jobs/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'my'] });
      qc.invalidateQueries({ queryKey: walletKeys.detail() });
    },
  });
}

export function useTransportProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: transportKeys.profile(userId),
    queryFn: () => api.get<TransportProfile>('/transport/profile'),
    enabled: !!userId,
    retry: (count, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return count < 2;
    },
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) =>
      api.patch<TransportProfile>('/transport/availability', { isAvailable }),
    onSuccess: (profile) => {
      qc.setQueryData(transportKeys.profile(), profile);
    },
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      api.patch('/transport/location', { latitude, longitude }),
  });
}

/**
 * Watches the browser GPS and broadcasts location to the backend every
 * `intervalMs` milliseconds while the component is mounted.
 */
export function useGpsTracking(enabled: boolean, intervalMs = 10_000) {
  const updateLocation = useUpdateLocation();
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < intervalMs) return;
        lastSentRef.current = now;
        updateLocation.mutate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      undefined,
      { enableHighAccuracy: true, timeout: 10_000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled]);
}

/** Helper: label for job status */
export function jobStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status;
}

/** Next status in the job workflow */
export function nextJobStatus(status: string): string | null {
  const flow: Record<string, string> = {
    accepted: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'delivered',
  };
  return flow[status] ?? null;
}

/** Label for the advance-status CTA button */
export function advanceLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted: 'Confirm Pickup',
    picked_up: 'Start Delivery',
    in_transit: 'Mark Delivered',
  };
  return labels[status] ?? 'Update Status';
}
