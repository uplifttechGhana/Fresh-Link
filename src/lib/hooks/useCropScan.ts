import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { KnowledgeItem, YouTubeVideo } from './useKnowledge';

export type CropHealthStatus =
  | 'healthy'
  | 'possible_disease'
  | 'possible_pest'
  | 'unclear';

export interface CropDiseaseFinding {
  name: string;
  confidence: number;
  notes?: string;
}

export interface CropScanResult {
  id: string;
  imageUrl: string;
  crop: string;
  confidence: number;
  healthStatus: CropHealthStatus;
  diseases: CropDiseaseFinding[];
  advice: string;
  disclaimer: string;
  relatedArticles: KnowledgeItem[];
  relatedVideos: YouTubeVideo[];
  createdAt: string;
}

export interface CropScanSummary {
  id: string;
  imageUrl: string;
  crop: string | null;
  confidence: number | null;
  healthStatus: CropHealthStatus | null;
  advice: string | null;
  createdAt: string;
}

export function useCropScan() {
  return useMutation({
    mutationFn: (imageUrl: string) =>
      api.post<CropScanResult>('/crops/scan', { imageUrl }),
  });
}

export function useCropScanHistory(limit = 10) {
  return useQuery({
    queryKey: ['crops', 'scans', limit],
    queryFn: () => api.get<CropScanSummary[]>(`/crops/scans?limit=${limit}`),
  });
}

export function useCropScanDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['crops', 'scan', id],
    queryFn: () => api.get<CropScanResult>(`/crops/scans/${id}`),
    enabled: !!id,
  });
}

export const HEALTH_STATUS_LABELS: Record<CropHealthStatus, string> = {
  healthy: 'Looks healthy',
  possible_disease: 'Possible disease',
  possible_pest: 'Possible pest',
  unclear: 'Unclear — retake photo',
};

export const HEALTH_STATUS_COLORS: Record<CropHealthStatus, string> = {
  healthy: 'bg-green-100 text-green-800',
  possible_disease: 'bg-amber-100 text-amber-900',
  possible_pest: 'bg-orange-100 text-orange-900',
  unclear: 'bg-gray-100 text-gray-700',
};
