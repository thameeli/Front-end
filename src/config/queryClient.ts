import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx client errors (bad request, unauthorized, etc.)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Don't retry on timeout errors
        if (error?.name === 'TimeoutError') {
          return false;
        }
        // Retry up to 3 times for server errors or network issues
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Refetch when connection is restored
      structuralSharing: true, // Enable request deduplication
      refetchOnMount: true,
      // Note: Timeout handling should be done in individual query functions using withTimeout
      // See hooks/useProducts.ts for example
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Don't retry on timeout errors
        if (error?.name === 'TimeoutError') {
          return false;
        }
        // Retry once for network/server errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff, max 5s
      onError: (error) => {
        console.error('Mutation error:', error);
      },
      // Note: Timeout handling should be done in individual mutation functions using withTimeout
    },
  },
});

