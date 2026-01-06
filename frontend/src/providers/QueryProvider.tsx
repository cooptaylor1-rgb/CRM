'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * React Query Provider
 * 
 * Provides caching, background refetching, and optimistic updates
 * throughout the application.
 * 
 * Configuration:
 * - staleTime: 30s - Data is fresh for 30 seconds before refetching
 * - gcTime: 5min - Garbage collect unused data after 5 minutes
 * - refetchOnWindowFocus: true - Refetch when user returns to tab
 * - retry: 1 - Retry failed requests once
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 30 seconds
            staleTime: 30 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Refetch when window regains focus
            refetchOnWindowFocus: true,
            // Only retry once on failure
            retry: 1,
            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
