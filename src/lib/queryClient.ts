import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,         // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      // Always attempt fetches on device — offlineFirst pauses queries when
      // navigator.onLine is false, which shows empty lists instead of errors.
      networkMode: 'always',
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});
