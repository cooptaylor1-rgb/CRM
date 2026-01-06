'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { householdsService, Household } from '@/services/households.service';
import { toast } from 'react-hot-toast';

/**
 * Query Keys for Households
 * 
 * Consistent keys for cache invalidation and prefetching
 */
export const householdKeys = {
  all: ['households'] as const,
  lists: () => [...householdKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...householdKeys.lists(), filters] as const,
  details: () => [...householdKeys.all, 'detail'] as const,
  detail: (id: string) => [...householdKeys.details(), id] as const,
};

/**
 * useHouseholds
 * 
 * Fetch all households with caching and background refetching.
 * Data is cached for 30s (staleTime) and kept in memory for 5min (gcTime).
 */
export function useHouseholds(options?: Omit<UseQueryOptions<Household[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: householdKeys.lists(),
    queryFn: () => householdsService.getHouseholds(),
    ...options,
  });
}

/**
 * useHousehold
 * 
 * Fetch a single household by ID with caching.
 * Will use cached data from list if available.
 */
export function useHousehold(
  id: string,
  options?: Omit<UseQueryOptions<Household, Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: () => householdsService.getHousehold(id),
    // Try to get initial data from the list cache
    initialData: () => {
      const cachedHouseholds = queryClient.getQueryData<Household[]>(householdKeys.lists());
      return cachedHouseholds?.find((h) => h.id === id);
    },
    ...options,
  });
}

/**
 * useCreateHousehold
 * 
 * Create a new household with optimistic update.
 * Shows the new household immediately while the request is in flight.
 */
export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Household>) => householdsService.createHousehold(data),
    onMutate: async (newHousehold) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: householdKeys.lists() });

      // Snapshot the previous value
      const previousHouseholds = queryClient.getQueryData<Household[]>(householdKeys.lists());

      // Optimistically update the cache
      if (previousHouseholds) {
        const optimisticHousehold: Household = {
          id: `temp-${Date.now()}`,
          name: newHousehold.name || 'New Household',
          totalAum: newHousehold.totalAum || 0,
          status: newHousehold.status || 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...newHousehold,
        };

        queryClient.setQueryData<Household[]>(householdKeys.lists(), [
          optimisticHousehold,
          ...previousHouseholds,
        ]);
      }

      return { previousHouseholds };
    },
    onError: (err, _newHousehold, context) => {
      // Rollback on error
      if (context?.previousHouseholds) {
        queryClient.setQueryData(householdKeys.lists(), context.previousHouseholds);
      }
      toast.error('Failed to create household');
    },
    onSuccess: (data) => {
      toast.success(`Household "${data.name}" created`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
  });
}

/**
 * useUpdateHousehold
 * 
 * Update a household with optimistic update.
 * Shows the update immediately while the request is in flight.
 */
export function useUpdateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Household> }) =>
      householdsService.updateHousehold(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: householdKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: householdKeys.lists() });

      const previousHousehold = queryClient.getQueryData<Household>(householdKeys.detail(id));
      const previousHouseholds = queryClient.getQueryData<Household[]>(householdKeys.lists());

      // Optimistically update the detail
      if (previousHousehold) {
        queryClient.setQueryData<Household>(householdKeys.detail(id), {
          ...previousHousehold,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      // Optimistically update the list
      if (previousHouseholds) {
        queryClient.setQueryData<Household[]>(
          householdKeys.lists(),
          previousHouseholds.map((h) =>
            h.id === id ? { ...h, ...data, updatedAt: new Date().toISOString() } : h
          )
        );
      }

      return { previousHousehold, previousHouseholds };
    },
    onError: (err, { id }, context) => {
      if (context?.previousHousehold) {
        queryClient.setQueryData(householdKeys.detail(id), context.previousHousehold);
      }
      if (context?.previousHouseholds) {
        queryClient.setQueryData(householdKeys.lists(), context.previousHouseholds);
      }
      toast.error('Failed to update household');
    },
    onSuccess: (data) => {
      toast.success(`Household "${data.name}" updated`);
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
  });
}

/**
 * useDeleteHousehold
 * 
 * Delete a household with optimistic removal from the list.
 */
export function useDeleteHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => householdsService.deleteHousehold(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: householdKeys.lists() });

      const previousHouseholds = queryClient.getQueryData<Household[]>(householdKeys.lists());

      if (previousHouseholds) {
        queryClient.setQueryData<Household[]>(
          householdKeys.lists(),
          previousHouseholds.filter((h) => h.id !== id)
        );
      }

      return { previousHouseholds };
    },
    onError: (err, _id, context) => {
      if (context?.previousHouseholds) {
        queryClient.setQueryData(householdKeys.lists(), context.previousHouseholds);
      }
      toast.error('Failed to delete household');
    },
    onSuccess: () => {
      toast.success('Household deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
  });
}

/**
 * usePrefetchHousehold
 * 
 * Prefetch a household on hover to make navigation instant.
 */
export function usePrefetchHousehold() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: householdKeys.detail(id),
      queryFn: () => householdsService.getHousehold(id),
      staleTime: 30 * 1000,
    });
  };
}
