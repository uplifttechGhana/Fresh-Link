import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface KnowledgeItem {
  id: string;
  title: string;
  body: string;
  category: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isVideo: boolean;
  publishedAt: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  channelTitle: string;
  publishedAt: string;
}

export const YOUTUBE_VIDEO_PREFIX = 'yt:';

export function isYouTubeVideoId(id: string | undefined): boolean {
  return !!id?.startsWith(YOUTUBE_VIDEO_PREFIX);
}

export function extractYouTubeId(id: string): string {
  return id.startsWith(YOUTUBE_VIDEO_PREFIX) ? id.slice(YOUTUBE_VIDEO_PREFIX.length) : id;
}

export function toYouTubeRouteId(videoId: string): string {
  return `${YOUTUBE_VIDEO_PREFIX}${videoId}`;
}

export function useYouTubeVideos(category?: string, query?: string) {
  return useQuery({
    queryKey: ['knowledge', 'youtube', category ?? '', query ?? ''],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (query?.trim()) params.set('q', query.trim());
      return api.get<YouTubeVideo[]>(`/knowledge/youtube?${params}`);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useYouTubeVideo(videoId: string | undefined) {
  return useQuery({
    queryKey: ['knowledge', 'youtube', 'video', videoId],
    queryFn: () => api.get<YouTubeVideo>(`/knowledge/youtube/${videoId}`),
    enabled: !!videoId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useKnowledgeVideos(category?: string) {
  return useQuery({
    queryKey: ['knowledge', 'videos', category ?? ''],
    queryFn: () => {
      const params = new URLSearchParams({ isVideo: 'true' });
      if (category) params.set('category', category);
      return api.get<KnowledgeItem[]>(`/knowledge?${params}`);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useKnowledgeArticles(category?: string) {
  return useQuery({
    queryKey: ['knowledge', 'articles', category ?? ''],
    queryFn: () => {
      const params = new URLSearchParams({ isVideo: 'false' });
      if (category) params.set('category', category);
      return api.get<KnowledgeItem[]>(`/knowledge?${params}`);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useKnowledgeItem(id: string | undefined) {
  return useQuery({
    queryKey: ['knowledge', 'item', id],
    queryFn: () => api.get<KnowledgeItem>(`/knowledge/${id}`),
    enabled: !!id,
  });
}

export function useKnowledgeCategories() {
  return useQuery({
    queryKey: ['knowledge', 'categories'],
    queryFn: () => api.get<{ name: string; count: number }[]>('/knowledge/categories'),
    staleTime: 5 * 60 * 1000,
  });
}
