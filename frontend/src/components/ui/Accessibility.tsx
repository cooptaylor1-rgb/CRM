'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Skip Links Component
// ============================================================================

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-nav', label: 'Skip to navigation', targetId: 'main-nav' },
  { id: 'skip-search', label: 'Skip to search', targetId: 'global-search' },
];

export interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

export function SkipLinks({ links = defaultSkipLinks, className }: SkipLinksProps) {
  return (
    <nav className={cn('sr-only focus-within:not-sr-only', className)} aria-label="Skip links">
      <ul className="fixed top-0 left-0 z-max flex flex-col gap-1 p-2">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.targetId}`}
              className={cn(
                'block px-4 py-2 text-sm font-medium rounded-lg',
                'bg-accent-600 text-white',
                'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2',
                'transition-transform -translate-y-full focus:translate-y-0'
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============================================================================
// Focus Trap Component
// ============================================================================

export interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  /** Return focus to trigger element on deactivation */
  returnFocus?: boolean;
  /** Initial element to focus (selector or ref) */
  initialFocus?: string | React.RefObject<HTMLElement>;
  /** Allow focus to escape with Escape key */
  escapeDeactivates?: boolean;
  onEscape?: () => void;
}

export function FocusTrap({
  children,
  active = true,
  returnFocus = true,
  initialFocus,
  escapeDeactivates = true,
  onEscape,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store previous active element
    previousActiveElement.current = document.activeElement;

    // Focus initial element or first focusable
    const container = containerRef.current;
    if (!container) return;

    const focusInitial = () => {
      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          const el = container.querySelector<HTMLElement>(initialFocus);
          el?.focus();
        } else if (initialFocus.current) {
          initialFocus.current.focus();
        }
      } else {
        const firstFocusable = getFocusableElements(container)[0];
        firstFocusable?.focus();
      }
    };

    // Delay focus to ensure DOM is ready
    requestAnimationFrame(focusInitial);

    // Handle tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeDeactivates) {
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, initialFocus, returnFocus, escapeDeactivates, onEscape]);

  return <div ref={containerRef}>{children}</div>;
}

// ============================================================================
// Focus Ring Component (Visual focus indicator)
// ============================================================================

export interface FocusRingProps {
  children: React.ReactNode;
  /** Focus ring color */
  color?: 'accent' | 'white' | 'error';
  /** Ring offset */
  offset?: 'none' | 'sm' | 'md';
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const focusRingColors = {
  accent: 'focus-within:ring-accent-500',
  white: 'focus-within:ring-white',
  error: 'focus-within:ring-red-500',
};

const focusRingOffsets = {
  none: 'focus-within:ring-offset-0',
  sm: 'focus-within:ring-offset-1',
  md: 'focus-within:ring-offset-2',
};

const focusRingRounded = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function FocusRing({
  children,
  color = 'accent',
  offset = 'md',
  rounded = 'md',
  className,
}: FocusRingProps) {
  return (
    <div
      className={cn(
        'focus-within:ring-2',
        focusRingColors[color],
        focusRingOffsets[offset],
        focusRingRounded[rounded],
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Announce Component (Screen reader announcements)
// ============================================================================

interface AnnounceContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

export function useAnnounce() {
  const context = useContext(AnnounceContext);
  if (!context) {
    throw new Error('useAnnounce must be used within an AnnounceProvider');
  }
  return context;
}

export interface AnnounceProviderProps {
  children: React.ReactNode;
}

export function AnnounceProvider({ children }: AnnounceProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage(message);
      // Clear after announcement
      setTimeout(() => setAssertiveMessage(''), 1000);
    } else {
      setPoliteMessage(message);
      setTimeout(() => setPoliteMessage(''), 1000);
    }
  }, []);

  return (
    <AnnounceContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}

// ============================================================================
// Visually Hidden Component
// ============================================================================

export interface VisuallyHiddenProps {
  children: React.ReactNode;
  /** Show content when focused (for skip links) */
  focusable?: boolean;
}

export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  return (
    <span className={focusable ? 'sr-only focus:not-sr-only' : 'sr-only'}>
      {children}
    </span>
  );
}

// ============================================================================
// Roving Focus Group
// ============================================================================

interface RovingFocusContextValue {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  itemsCount: number;
  registerItem: () => number;
  unregisterItem: (index: number) => void;
  orientation: 'horizontal' | 'vertical';
}

const RovingFocusContext = createContext<RovingFocusContextValue | null>(null);

export interface RovingFocusGroupProps {
  children: React.ReactNode;
  /** Initial active index */
  defaultIndex?: number;
  /** Controlled active index */
  activeIndex?: number;
  /** Callback when active index changes */
  onActiveIndexChange?: (index: number) => void;
  /** Orientation for arrow key navigation */
  orientation?: 'horizontal' | 'vertical';
  /** Loop navigation */
  loop?: boolean;
  className?: string;
}

export function RovingFocusGroup({
  children,
  defaultIndex = 0,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  orientation = 'horizontal',
  loop = true,
  className,
}: RovingFocusGroupProps) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const [itemsCount, setItemsCount] = useState(0);
  const itemsRef = useRef(new Set<number>());

  const activeIndex = controlledIndex ?? internalIndex;

  const setActiveIndex = useCallback(
    (index: number) => {
      setInternalIndex(index);
      onActiveIndexChange?.(index);
    },
    [onActiveIndexChange]
  );

  const registerItem = useCallback(() => {
    const index = itemsRef.current.size;
    itemsRef.current.add(index);
    setItemsCount(itemsRef.current.size);
    return index;
  }, []);

  const unregisterItem = useCallback((index: number) => {
    itemsRef.current.delete(index);
    setItemsCount(itemsRef.current.size);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

    if (e.key === prevKey) {
      e.preventDefault();
      const newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? itemsCount - 1 : activeIndex;
      setActiveIndex(newIndex);
    } else if (e.key === nextKey) {
      e.preventDefault();
      const newIndex = activeIndex < itemsCount - 1 ? activeIndex + 1 : loop ? 0 : activeIndex;
      setActiveIndex(newIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(itemsCount - 1);
    }
  };

  return (
    <RovingFocusContext.Provider
      value={{
        activeIndex,
        setActiveIndex,
        itemsCount,
        registerItem,
        unregisterItem,
        orientation,
      }}
    >
      <div
        role="group"
        className={className}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </RovingFocusContext.Provider>
  );
}

export interface RovingFocusItemProps {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RovingFocusItem({ children, disabled, className }: RovingFocusItemProps) {
  const context = useContext(RovingFocusContext);
  const indexRef = useRef(-1);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!context) return;

    indexRef.current = context.registerItem();

    return () => {
      context.unregisterItem(indexRef.current);
    };
  }, [context]);

  useEffect(() => {
    if (!context || disabled) return;

    if (context.activeIndex === indexRef.current) {
      itemRef.current?.focus();
    }
  }, [context?.activeIndex, disabled]);

  if (!context) return <>{children}</>;

  const isActive = context.activeIndex === indexRef.current;

  return (
    <div
      ref={itemRef}
      tabIndex={isActive ? 0 : -1}
      className={className}
      data-active={isActive}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Focus Visible Hook
// ============================================================================

export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const hadKeyboardEvent = useRef(false);

  useEffect(() => {
    const handleKeyDown = () => {
      hadKeyboardEvent.current = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEvent.current = false;
    };

    const handleFocus = () => {
      if (hadKeyboardEvent.current) {
        setIsFocusVisible(true);
      }
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocusVisible;
}

// ============================================================================
// Reduced Motion Hook
// ============================================================================

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

// ============================================================================
// Live Region Component
// ============================================================================

export interface LiveRegionProps {
  children: React.ReactNode;
  /** Politeness level */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether the entire region should be read */
  atomic?: boolean;
  /** What types of changes should be announced */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Screen Reader Only Text
// ============================================================================

export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
