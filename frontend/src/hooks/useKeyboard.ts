'use client';

import * as React from 'react';

/**
 * Keyboard Navigation Hooks
 * 
 * Utilities for accessible keyboard navigation patterns.
 */

/**
 * useKeyboardNavigation Hook
 * 
 * Manages keyboard navigation within a list of items.
 */

export interface UseKeyboardNavigationOptions {
  /** Total number of items */
  itemCount: number;
  /** Initially focused index */
  initialIndex?: number;
  /** Loop when reaching end */
  loop?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
  /** Callback when item is selected */
  onSelect?: (index: number) => void;
  /** Custom key handlers */
  customHandlers?: Record<string, (index: number) => void>;
}

export function useKeyboardNavigation({
  itemCount,
  initialIndex = 0,
  loop = true,
  orientation = 'vertical',
  onIndexChange,
  onSelect,
  customHandlers,
}: UseKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = React.useState(initialIndex);

  const getNextIndex = React.useCallback(
    (direction: 1 | -1): number => {
      const nextIndex = focusedIndex + direction;

      if (nextIndex < 0) {
        return loop ? itemCount - 1 : 0;
      }
      if (nextIndex >= itemCount) {
        return loop ? 0 : itemCount - 1;
      }
      return nextIndex;
    },
    [focusedIndex, itemCount, loop]
  );

  const moveFocus = React.useCallback(
    (direction: 1 | -1) => {
      const nextIndex = getNextIndex(direction);
      setFocusedIndex(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [getNextIndex, onIndexChange]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const key = event.key;

      // Custom handlers first
      if (customHandlers?.[key]) {
        event.preventDefault();
        customHandlers[key](focusedIndex);
        return;
      }

      // Standard navigation
      switch (key) {
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            moveFocus(-1);
          }
          break;

        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            moveFocus(1);
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            moveFocus(-1);
          }
          break;

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            moveFocus(1);
          }
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          onIndexChange?.(0);
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = itemCount - 1;
          setFocusedIndex(lastIndex);
          onIndexChange?.(lastIndex);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(focusedIndex);
          break;
      }
    },
    [focusedIndex, itemCount, moveFocus, onIndexChange, onSelect, orientation, customHandlers]
  );

  const setIndex = React.useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(itemCount - 1, index));
      setFocusedIndex(clampedIndex);
      onIndexChange?.(clampedIndex);
    },
    [itemCount, onIndexChange]
  );

  return {
    focusedIndex,
    setFocusedIndex: setIndex,
    handleKeyDown,
    moveFocus,
  };
}

/**
 * useFocusTrap Hook
 * 
 * Traps focus within a container element.
 */

export interface UseFocusTrapOptions {
  /** Whether the trap is active */
  isActive?: boolean;
  /** Return focus to trigger element on close */
  returnFocus?: boolean;
  /** Element to receive initial focus */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive = true,
  returnFocus = true,
  initialFocusRef,
}: UseFocusTrapOptions = {}) {
  const containerRef = React.useRef<T>(null);
  const previousActiveElement = React.useRef<Element | null>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    previousActiveElement.current = document.activeElement;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus initial element
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, returnFocus, initialFocusRef]);

  return containerRef;
}

/**
 * useRovingTabIndex Hook
 * 
 * Implements roving tabindex pattern for widget navigation.
 */

export interface UseRovingTabIndexOptions<T extends HTMLElement> {
  /** Refs to focusable items */
  itemRefs: React.RefObject<T>[];
  /** Initial focused index */
  initialIndex?: number;
  /** Loop navigation */
  loop?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

export function useRovingTabIndex<T extends HTMLElement>({
  itemRefs,
  initialIndex = 0,
  loop = true,
  orientation = 'horizontal',
}: UseRovingTabIndexOptions<T>) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  const focusItem = React.useCallback(
    (index: number) => {
      const item = itemRefs[index]?.current;
      if (item) {
        item.focus();
        setActiveIndex(index);
      }
    },
    [itemRefs]
  );

  const getTabIndex = (index: number): number => {
    return index === activeIndex ? 0 : -1;
  };

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      const count = itemRefs.length;

      const getNextIndex = (direction: 1 | -1): number => {
        const next = currentIndex + direction;
        if (loop) {
          return (next + count) % count;
        }
        return Math.max(0, Math.min(count - 1, next));
      };

      switch (event.key) {
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            event.preventDefault();
            focusItem(getNextIndex(1));
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            event.preventDefault();
            focusItem(getNextIndex(-1));
          }
          break;
        case 'ArrowDown':
          if (orientation === 'vertical') {
            event.preventDefault();
            focusItem(getNextIndex(1));
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            event.preventDefault();
            focusItem(getNextIndex(-1));
          }
          break;
        case 'Home':
          event.preventDefault();
          focusItem(0);
          break;
        case 'End':
          event.preventDefault();
          focusItem(count - 1);
          break;
      }
    },
    [focusItem, itemRefs.length, loop, orientation]
  );

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex,
    handleKeyDown,
    focusItem,
  };
}

/**
 * useHotkey Hook
 * 
 * Register a global hotkey handler.
 */

export interface UseHotkeyOptions {
  /** Whether the hotkey is enabled */
  enabled?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

export function useHotkey(
  keys: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: UseHotkeyOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const keyList = Array.isArray(keys) ? keys : [keys];

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifiers = {
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
      };

      for (const hotkey of keyList) {
        const parts = hotkey.toLowerCase().split('+');
        const mainKey = parts[parts.length - 1];
        const requiredMods = parts.slice(0, -1);

        const modMatch =
          (!requiredMods.includes('ctrl') || modifiers.ctrl) &&
          (!requiredMods.includes('meta') || modifiers.meta) &&
          (!requiredMods.includes('cmd') || modifiers.meta) &&
          (!requiredMods.includes('shift') || modifiers.shift) &&
          (!requiredMods.includes('alt') || modifiers.alt);

        const extraMods =
          (modifiers.ctrl && !requiredMods.includes('ctrl')) ||
          (modifiers.meta && !requiredMods.includes('meta') && !requiredMods.includes('cmd')) ||
          (modifiers.shift && !requiredMods.includes('shift')) ||
          (modifiers.alt && !requiredMods.includes('alt'));

        if (key === mainKey && modMatch && !extraMods) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback(event);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback, enabled, preventDefault]);
}

/**
 * useEscapeKey Hook
 * 
 * Handle escape key press.
 */

export function useEscapeKey(callback: () => void, enabled = true) {
  useHotkey('escape', callback, { enabled });
}

/**
 * useClickOutside Hook
 * 
 * Detect clicks outside an element.
 */

export function useClickOutside<T extends HTMLElement>(
  callback: (event: MouseEvent | TouchEvent) => void,
  enabled = true
) {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [callback, enabled]);

  return ref;
}
