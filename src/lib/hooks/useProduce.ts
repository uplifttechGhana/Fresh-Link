import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../authStore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FarmerInfo {
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  rating: number;
  totalReviews: number;
  location: string | null;
  bio: string | null;
}

export interface ProduceListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  status: string;
  farmer: FarmerInfo;
  createdAt: string;
}

export interface PaginatedProduce {
  items: ProduceListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProduceQuery {
  search?: string;
  category?: string;
  farmerId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: 'recent' | 'popular';
}

export interface FarmerSummary {
  id: string;
  userId: string;
  farmName: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  totalReviews: number;
  user: { id: string; name: string; avatarUrl: string | null };
  _count: { produce: number };
}

export interface PaginatedFarmers {
  items: FarmerSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicFarmerProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    phone: string;
  };
  bio: string | null;
  farmName: string | null;
  farmSize: string | null;
  location: string | null;
  rating: number;
  totalReviews: number;
  /** Produce items from the profile endpoint — farmer field may be absent */
  produce: Omit<ProduceListing, 'farmer'>[];
}

// Farmer's own listing (no nested farmer field — the farmer IS the caller)
export interface MyProduceListing {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  status: 'active' | 'out_of_stock' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProducePayload {
  title: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  category?: string;
  images?: string[];
}

export interface UpdateProducePayload extends Partial<CreateProducePayload> {
  status?: 'active' | 'out_of_stock' | 'deleted';
}

export interface FarmerReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyer: { name: string; avatarUrl: string | null };
}

// ── Query Keys ─────────────────────────────────────────────────────────────

export const produceKeys = {
  all: ['produce'] as const,
  lists: () => [...produceKeys.all, 'list'] as const,
  list: (q: ProduceQuery) => [...produceKeys.lists(), q] as const,
  myListings: () => [...produceKeys.all, 'my'] as const,
  detail: (id: string) => [...produceKeys.all, 'detail', id] as const,
  compare: (title: string) => [...produceKeys.all, 'compare', title] as const,
  farmer: (id: string) => ['farmers', id] as const,
  reviews: (farmerId: string) => ['farmers', farmerId, 'reviews'] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useProduceList(query: ProduceQuery = {}) {
  return useQuery({
    queryKey: produceKeys.list(query),
    queryFn: () => {
      const params = new URLSearchParams();
      if (query.search) params.set('search', query.search);
      if (query.category) params.set('category', query.category);
      if (query.farmerId) params.set('farmerId', query.farmerId);
      if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
      if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.sort) params.set('sort', query.sort);
      const qs = params.toString();
      return api.get<PaginatedProduce>(`/produce${qs ? `?${qs}` : ''}`);
    },
  });
}

export interface ProduceCategory {
  name: string;
  count: number;
  image: string | null;
}

export interface PriceTrendPoint { name: string; price: number; }

export function usePriceTrends() {
  return useQuery({
    queryKey: ['produce', 'price-trends'],
    queryFn: () => api.get<PriceTrendPoint[]>('/produce/my/price-trends'),
    staleTime: 30 * 60 * 1000,
  });
}

export function useProduceCategories() {
  return useQuery({
    queryKey: ['produce', 'categories'],
    queryFn: () => api.get<ProduceCategory[]>('/produce/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export const farmerKeys = {
  list: (q: { search?: string; page?: number }) => ['farmers', 'list', q] as const,
};

export function useFarmersList(query: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: farmerKeys.list(query),
    queryFn: () => {
      const params = new URLSearchParams();
      if (query.search) params.set('search', query.search);
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      const qs = params.toString();
      return api.get<PaginatedFarmers>(`/users/farmers${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useProduceDetail(id: string | undefined) {
  return useQuery({
    queryKey: produceKeys.detail(id ?? ''),
    queryFn: () => api.get<ProduceListing>(`/produce/${id}`),
    enabled: !!id,
  });
}

/** Best farmers for the Home screen — sorted by rating client-side */
export function useFeaturedFarmers() {
  return useQuery({
    queryKey: ['farmers', 'featured'],
    queryFn: async () => {
      const res = await api.get<PaginatedProduce>('/produce?limit=50');
      // Deduplicate farmers from produce list and sort by rating
      const seen = new Set<string>();
      const farmers: FarmerInfo[] = [];
      for (const p of res.items) {
        if (!seen.has(p.farmer.userId)) {
          seen.add(p.farmer.userId);
          farmers.push(p.farmer);
        }
      }
      return farmers.sort((a, b) => b.rating - a.rating).slice(0, 6);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFarmerProfile(id: string | undefined) {
  return useQuery({
    queryKey: produceKeys.farmer(id ?? ''),
    queryFn: () => api.get<PublicFarmerProfile>(`/users/farmers/${id}`),
    enabled: !!id,
  });
}

export function usePriceComparison(title: string) {
  return useQuery({
    queryKey: produceKeys.compare(title),
    queryFn: () => api.get<ProduceListing[]>(`/produce/compare?title=${encodeURIComponent(title)}`),
    enabled: !!title,
  });
}

// ── Farmer mutations ────────────────────────────────────────────────────────

export function useMyListings() {
  return useQuery({
    queryKey: produceKeys.myListings(),
    queryFn: () => api.get<MyProduceListing[]>('/produce/my/listings'),
  });
}

export function useCreateProduce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProducePayload) =>
      api.post<MyProduceListing>('/produce', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: produceKeys.myListings() });
      qc.invalidateQueries({ queryKey: produceKeys.lists() });
    },
  });
}

export function useUpdateProduce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProducePayload & { id: string }) =>
      api.patch<MyProduceListing>(`/produce/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: produceKeys.myListings() });
      qc.invalidateQueries({ queryKey: produceKeys.detail(vars.id) });
    },
  });
}

export function useDeleteProduce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/produce/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: produceKeys.myListings() });
      qc.invalidateQueries({ queryKey: produceKeys.lists() });
    },
  });
}

// ── Farmer reviews ──────────────────────────────────────────────────────────

export function useFarmerReviews(farmerId: string | undefined) {
  return useQuery({
    queryKey: produceKeys.reviews(farmerId ?? ''),
    queryFn: () => api.get<FarmerReview[]>(`/orders/reviews/farmer/${farmerId}`),
    enabled: !!farmerId,
  });
}

// ── Favorites ────────────────────────────────────────────────────────────────

export const favoritesKeys = {
  all: ['favorites'] as const,
  ids: () => ['favorites', 'ids'] as const,
};

export function useFavorites() {
  return useQuery({
    queryKey: favoritesKeys.all,
    queryFn: () => api.get<ProduceListing[]>('/produce/favorites'),
  });
}

export function useFavoriteIds() {
  const isLoggedIn = !!useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: favoritesKeys.ids(),
    queryFn: () => api.get<string[]>('/produce/favorites/ids'),
    staleTime: 60_000,
    enabled: isLoggedIn,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ produceId, isFav }: { produceId: string; isFav: boolean }) =>
      isFav
        ? api.delete<void>(`/produce/favorites/${produceId}`)
        : api.post<void>(`/produce/favorites/${produceId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: favoritesKeys.all });
      qc.invalidateQueries({ queryKey: favoritesKeys.ids() });
    },
    // Prevent React Query v5 from rethrowing mutation errors as unhandled exceptions
    onError: () => {},
  });
}
