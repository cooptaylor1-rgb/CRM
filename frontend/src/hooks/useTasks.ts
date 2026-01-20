'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { tasksService, Task, TaskFilter, TaskStats, CreateTaskDto, UpdateTaskDto } from '@/services/tasks.service';
import { toast } from 'react-hot-toast';

/**
 * Query Keys for Tasks
 * 
 * Consistent keys for cache invalidation and prefetching
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilter) => [...taskKeys.lists(), filters] as const,
  myTasks: () => [...taskKeys.all, 'my-tasks'] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
  dueSoon: (days?: number) => [...taskKeys.all, 'due-soon', days] as const,
  stats: (userId?: string) => [...taskKeys.all, 'stats', userId] as const,
  household: (householdId: string) => [...taskKeys.all, 'household', householdId] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  subtasks: (parentId: string) => [...taskKeys.all, 'subtasks', parentId] as const,
};

/**
 * useTasks
 * 
 * Fetch tasks with optional filtering and caching.
 */
export function useTasks(
  filter?: TaskFilter,
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.list(filter),
    queryFn: () => tasksService.getAll(filter),
    ...options,
  });
}

/**
 * useMyTasks
 * 
 * Fetch current user's tasks.
 */
export function useMyTasks(options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: taskKeys.myTasks(),
    queryFn: () => tasksService.getMyTasks(),
    ...options,
  });
}

/**
 * useOverdueTasks
 * 
 * Fetch overdue tasks - refetches more frequently.
 */
export function useOverdueTasks(options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: () => tasksService.getOverdue(),
    // Overdue tasks should refresh more often
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000, // Every minute
    ...options,
  });
}

/**
 * useTasksDueSoon
 * 
 * Fetch tasks due within specified days.
 */
export function useTasksDueSoon(
  days: number = 7,
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.dueSoon(days),
    queryFn: () => tasksService.getDueSoon(days),
    ...options,
  });
}

/**
 * useTaskStats
 * 
 * Fetch task statistics for dashboard.
 */
export function useTaskStats(
  userId?: string,
  options?: Omit<UseQueryOptions<TaskStats, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.stats(userId),
    queryFn: () => tasksService.getStats(userId),
    ...options,
  });
}

/**
 * useHouseholdTasks
 * 
 * Fetch tasks for a specific household.
 */
export function useHouseholdTasks(
  householdId: string,
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.household(householdId),
    queryFn: () => tasksService.getByHousehold(householdId),
    enabled: !!householdId,
    ...options,
  });
}

/**
 * useTask
 * 
 * Fetch a single task by ID.
 */
export function useTask(
  id: string,
  options?: Omit<UseQueryOptions<Task, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksService.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * useTaskSubtasks
 * 
 * Fetch subtasks for a parent task.
 */
export function useTaskSubtasks(
  parentId: string,
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.subtasks(parentId),
    queryFn: () => tasksService.getSubtasks(parentId),
    enabled: !!parentId,
    ...options,
  });
}

/**
 * useCreateTask
 * 
 * Create a new task with optimistic update.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksService.create(data),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({ queryKey: taskKeys.myTasks() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());
      const previousMyTasks = queryClient.getQueryData<Task[]>(taskKeys.myTasks());

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        status: 'pending',
        priority: (newTask.priority as Task['priority']) || 'medium',
        category: newTask.category || 'general',
        assignedTo: newTask.assignedTo,
        householdId: newTask.householdId,
        personId: newTask.personId,
        accountId: newTask.accountId,
        dueDate: newTask.dueDate,
        parentTaskId: newTask.parentTaskId,
        tags: newTask.tags || [],
        reminderAt: newTask.reminderAt,
        estimatedMinutes: newTask.estimatedMinutes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(taskKeys.lists(), [optimisticTask, ...previousTasks]);
      }
      if (previousMyTasks) {
        queryClient.setQueryData<Task[]>(taskKeys.myTasks(), [optimisticTask, ...previousMyTasks]);
      }

      return { previousTasks, previousMyTasks };
    },
    onError: (err, _newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      if (context?.previousMyTasks) {
        queryClient.setQueryData(taskKeys.myTasks(), context.previousMyTasks);
      }
      toast.error('Failed to create task');
    },
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" created`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * useUpdateTask
 * 
 * Update a task with optimistic update.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => tasksService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...data,
          status: (data.status as Task['status']) || previousTask.status,
          priority: (data.priority as Task['priority']) || previousTask.priority,
          updatedAt: new Date().toISOString(),
        } as Task);
      }

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.map((t) =>
            t.id === id ? { 
              ...t, 
              ...data, 
              status: (data.status as Task['status']) || t.status,
              priority: (data.priority as Task['priority']) || t.priority,
              updatedAt: new Date().toISOString() 
            } as Task : t
          )
        );
      }

      return { previousTask, previousTasks };
    },
    onError: (err, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast.error('Failed to update task');
    },
    onSuccess: () => {
      toast.success('Task updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * useCompleteTask
 * 
 * Mark a task as complete with optimistic update.
 * Includes celebration toast for user delight.
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, actualMinutes }: { id: string; actualMinutes?: number }) =>
      tasksService.complete(id, actualMinutes),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      const now = new Date().toISOString();

      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        });
      }

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed', completedAt: now, updatedAt: now }
              : t
          )
        );
      }

      return { previousTask, previousTasks };
    },
    onError: (err, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast.error('Failed to complete task');
    },
    onSuccess: (data) => {
      toast.success(`"${data.title}" completed`, {
        duration: 3000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * useDeleteTask
 * 
 * Delete a task with optimistic removal.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.filter((t) => t.id !== id)
        );
      }

      return { previousTasks };
    },
    onError: (err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast.error('Failed to delete task');
    },
    onSuccess: () => {
      toast.success('Task deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * useBulkCreateTasks
 * 
 * Create multiple tasks at once.
 */
export function useBulkCreateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tasks: CreateTaskDto[]) => tasksService.createBulk(tasks),
    onSuccess: (data) => {
      toast.success(`${data.length} tasks created`);
    },
    onError: () => {
      toast.error('Failed to create tasks');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * usePrefetchTask
 * 
 * Prefetch a task on hover for instant navigation.
 */
export function usePrefetchTask() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: taskKeys.detail(id),
      queryFn: () => tasksService.getById(id),
      staleTime: 30 * 1000,
    });
  };
}
