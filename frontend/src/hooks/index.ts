/**
 * Custom Hooks
 * 
 * Reusable hooks for the Wealth Management CRM.
 */

import { useState, useEffect } from 'react';

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Keyboard & Accessibility
export {
  useKeyboardNavigation,
  useFocusTrap,
  useRovingTabIndex,
  useHotkey,
  useEscapeKey,
  useClickOutside,
} from './useKeyboard';
export type {
  UseKeyboardNavigationOptions,
  UseFocusTrapOptions,
  UseRovingTabIndexOptions,
  UseHotkeyOptions,
} from './useKeyboard';

// Animation
export {
  useReducedMotion,
  useAnimatedNumber,
  useStaggeredAnimation,
  useTransition,
  useScrollAnimation,
  useSpring,
  easings,
} from './useAnimation';
export type {
  UseAnimatedNumberOptions,
  UseStaggeredAnimationOptions,
  TransitionState,
  UseTransitionOptions,
  UseScrollAnimationOptions,
  UseSpringOptions,
} from './useAnimation';

// React Query Hooks - Data fetching with caching & optimistic updates
export {
  useHouseholds,
  useHousehold,
  useCreateHousehold,
  useUpdateHousehold,
  useDeleteHousehold,
  usePrefetchHousehold,
  householdKeys,
} from './useHouseholds';

export {
  useTasks,
  useMyTasks,
  useOverdueTasks,
  useTasksDueSoon,
  useTaskStats,
  useHouseholdTasks,
  useTask,
  useTaskSubtasks,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,
  useBulkCreateTasks,
  usePrefetchTask,
  taskKeys,
} from './useTasks';
