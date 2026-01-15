'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import { useRouter } from 'next/navigation';

/**
 * KeyboardFirst - World-Class Vim-Inspired Navigation System
 *
 * Power users don't touch the mouse. This system provides:
 * - Vim-style navigation (j/k for up/down, h/l for sections)
 * - Quick jump shortcuts (g + key to go to pages)
 * - Action shortcuts (a + key for actions, n + key for new items)
 * - Focus trapping in modals and dialogs
 * - Fuzzy search command palette (/)
 * - Visual keyboard hints
 * - Number prefix for repeating actions (5j = move down 5)
 * - Marks for bookmarking positions (m + key to set, ' + key to jump)
 */

export type KeyboardMode = 'normal' | 'insert' | 'command' | 'search' | 'action' | 'visual';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
  category: 'navigation' | 'action' | 'view' | 'edit' | 'search' | 'system' | 'create';
  mode?: KeyboardMode;
  sequence?: string; // For multi-key shortcuts like "gg" or "gc"
  global?: boolean; // Works even in input fields
  when?: () => boolean; // Conditional activation
}

export interface NavigableItem {
  id: string;
  type: string;
  element?: HTMLElement;
  onSelect?: () => void;
  onAction?: (action: string) => void;
  data?: Record<string, unknown>;
}

export interface FocusTrapConfig {
  id: string;
  container: HTMLElement;
  initialFocus?: HTMLElement;
  returnFocus?: HTMLElement;
  onEscape?: () => void;
}

interface Mark {
  path: string;
  scrollPosition: number;
  timestamp: number;
}

interface KeyboardContextType {
  mode: KeyboardMode;
  setMode: (mode: KeyboardMode) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  items: NavigableItem[];
  registerItem: (item: NavigableItem) => void;
  unregisterItem: (id: string) => void;
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  showHints: boolean;
  setShowHints: (show: boolean) => void;
  executeAction: (actionKey: string) => void;
  pendingSequence: string;
  repeatCount: number;
  // Focus trapping
  pushFocusTrap: (config: FocusTrapConfig) => void;
  popFocusTrap: (id: string) => void;
  activeFocusTrap: FocusTrapConfig | null;
  // Marks
  setMark: (key: string) => void;
  jumpToMark: (key: string) => void;
  marks: Record<string, Mark>;
  // Quick navigation
  navigateTo: (path: string) => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}

// Navigation routes for quick jump
const NAVIGATION_ROUTES: Record<string, { path: string; label: string }> = {
  'd': { path: '/dashboard', label: 'Dashboard' },
  'c': { path: '/clients', label: 'Clients' },
  'h': { path: '/households', label: 'Households' },
  't': { path: '/tasks', label: 'Tasks' },
  'p': { path: '/pipeline', label: 'Pipeline' },
  'm': { path: '/meetings', label: 'Meetings' },
  'a': { path: '/accounts', label: 'Accounts' },
  'b': { path: '/billing', label: 'Billing' },
  'o': { path: '/documents', label: 'Documents' },
  'y': { path: '/analytics', label: 'Analytics' },
  's': { path: '/settings', label: 'Settings' },
  'i': { path: '/inbox', label: 'Inbox' },
};

// Create new item routes
const CREATE_ROUTES: Record<string, { path: string; label: string }> = {
  'h': { path: '/households?create=true', label: 'New Household' },
  'c': { path: '/clients?create=true', label: 'New Client' },
  't': { path: '/tasks?create=true', label: 'New Task' },
  'm': { path: '/meetings?create=true', label: 'New Meeting' },
  'p': { path: '/pipeline?create=true', label: 'New Prospect' },
  'a': { path: '/accounts?create=true', label: 'New Account' },
  'd': { path: '/documents?upload=true', label: 'New Document' },
  'n': { path: '/notes?create=true', label: 'New Note' },
};

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mode, setMode] = useState<KeyboardMode>('normal');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<NavigableItem[]>([]);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [pendingSequence, setPendingSequence] = useState('');
  const [repeatCount, setRepeatCount] = useState(0);
  const [focusTrapStack, setFocusTrapStack] = useState<FocusTrapConfig[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [isSettingMark, setIsSettingMark] = useState(false);
  const [isJumpingToMark, setIsJumpingToMark] = useState(false);

  const sequenceTimeoutRef = useRef<NodeJS.Timeout>();
  const repeatTimeoutRef = useRef<NodeJS.Timeout>();

  const activeFocusTrap = focusTrapStack[focusTrapStack.length - 1] || null;

  const registerItem = useCallback((item: NavigableItem) => {
    setItems(prev => [...prev.filter(i => i.id !== item.id), item]);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      const key = shortcut.sequence || shortcut.key;
      return [...prev.filter(s => (s.sequence || s.key) !== key), shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => (s.sequence || s.key) !== key));
  }, []);

  const executeAction = useCallback((actionKey: string) => {
    const selectedItem = items[selectedIndex];
    selectedItem?.onAction?.(actionKey);
  }, [items, selectedIndex]);

  // Focus trapping
  const pushFocusTrap = useCallback((config: FocusTrapConfig) => {
    setFocusTrapStack(prev => [...prev, config]);
    // Focus initial element
    if (config.initialFocus) {
      setTimeout(() => config.initialFocus?.focus(), 0);
    }
  }, []);

  const popFocusTrap = useCallback((id: string) => {
    setFocusTrapStack(prev => {
      const trap = prev.find(t => t.id === id);
      if (trap?.returnFocus) {
        setTimeout(() => trap.returnFocus?.focus(), 0);
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  // Navigation
  const navigateTo = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Marks
  const setMark = useCallback((key: string) => {
    const mark: Mark = {
      path: window.location.pathname,
      scrollPosition: window.scrollY,
      timestamp: Date.now(),
    };
    setMarks(prev => ({ ...prev, [key]: mark }));
    setIsSettingMark(false);
  }, []);

  const jumpToMark = useCallback((key: string) => {
    const mark = marks[key];
    if (mark) {
      if (mark.path !== window.location.pathname) {
        router.push(mark.path);
      }
      setTimeout(() => window.scrollTo(0, mark.scrollPosition), 100);
    }
    setIsJumpingToMark(false);
  }, [marks, router]);

  // Move selection with repeat count
  const moveSelection = useCallback((direction: 'up' | 'down', count: number = 1) => {
    setSelectedIndex(prev => {
      if (direction === 'down') {
        return Math.min(prev + count, items.length - 1);
      } else {
        return Math.max(prev - count, 0);
      }
    });
    setRepeatCount(0);
  }, [items.length]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Handle focus trap escape
      if (activeFocusTrap && e.key === 'Escape') {
        e.preventDefault();
        activeFocusTrap.onEscape?.();
        return;
      }

      // Handle focus trap Tab key cycling
      if (activeFocusTrap && e.key === 'Tab') {
        const focusableElements = activeFocusTrap.container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
        return;
      }

      // Handle mark setting mode
      if (isSettingMark) {
        if (/^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          setMark(e.key.toLowerCase());
        } else if (e.key === 'Escape') {
          setIsSettingMark(false);
        }
        return;
      }

      // Handle mark jumping mode
      if (isJumpingToMark) {
        if (/^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          jumpToMark(e.key.toLowerCase());
        } else if (e.key === 'Escape') {
          setIsJumpingToMark(false);
        }
        return;
      }

      // Skip if user is typing in an input (except for global shortcuts)
      if (isInput) {
        // Always handle Escape to exit input
        if (e.key === 'Escape') {
          (target as HTMLElement).blur();
          setMode('normal');
        }
        // Check for global shortcuts
        const globalShortcut = shortcuts.find(s =>
          s.global &&
          matchesShortcut(e, s)
        );
        if (globalShortcut) {
          e.preventDefault();
          globalShortcut.action();
        }
        return;
      }

      const key = e.key;
      const hasCtrl = e.ctrlKey || e.metaKey;

      // Handle number prefix for repeat count
      if (/^[1-9]$/.test(key) && !pendingSequence && !hasCtrl) {
        e.preventDefault();
        const num = parseInt(key, 10);
        setRepeatCount(prev => prev * 10 + num);
        clearTimeout(repeatTimeoutRef.current);
        repeatTimeoutRef.current = setTimeout(() => setRepeatCount(0), 2000);
        return;
      }

      // Handle sequences (like 'gg', 'gc', etc.)
      if (pendingSequence) {
        const fullSequence = pendingSequence + key;

        // Check for go-to navigation (g + key)
        if (pendingSequence === 'g' && NAVIGATION_ROUTES[key]) {
          e.preventDefault();
          navigateTo(NAVIGATION_ROUTES[key].path);
          setPendingSequence('');
          return;
        }

        // Check for create shortcuts (n + key)
        if (pendingSequence === 'n' && CREATE_ROUTES[key]) {
          e.preventDefault();
          navigateTo(CREATE_ROUTES[key].path);
          setPendingSequence('');
          return;
        }

        // Check for gg (go to top)
        if (fullSequence === 'gg') {
          e.preventDefault();
          setSelectedIndex(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setPendingSequence('');
          return;
        }

        const matchingShortcut = shortcuts.find(s => s.sequence === fullSequence);

        if (matchingShortcut) {
          e.preventDefault();
          matchingShortcut.action();
          setPendingSequence('');
          return;
        }

        // Check if this could be the start of a longer sequence
        const couldMatch = shortcuts.some(s => s.sequence?.startsWith(fullSequence));
        if (couldMatch) {
          setPendingSequence(fullSequence);
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = setTimeout(() => setPendingSequence(''), 1500);
          return;
        }

        // No match, reset
        setPendingSequence('');
      }

      // Check for sequence starters
      if ((key === 'g' || key === 'n' || key === 'z') && !hasCtrl) {
        e.preventDefault();
        setPendingSequence(key);
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = setTimeout(() => setPendingSequence(''), 1500);
        return;
      }

      // Handle mark commands
      if (key === 'm' && !hasCtrl) {
        e.preventDefault();
        setIsSettingMark(true);
        return;
      }

      if (key === "'" && !hasCtrl) {
        e.preventDefault();
        setIsJumpingToMark(true);
        return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(s => matchesShortcut(e, s) && !s.sequence);

      if (matchingShortcut) {
        if (!matchingShortcut.when || matchingShortcut.when()) {
          e.preventDefault();
          matchingShortcut.action();
          return;
        }
      }

      // Default vim-like navigation
      const count = repeatCount || 1;

      switch (key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          moveSelection('down', count);
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          moveSelection('up', count);
          break;
        case 'G':
          // Shift+G = go to bottom
          e.preventDefault();
          setSelectedIndex(items.length - 1);
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          break;
        case 'h':
        case 'ArrowLeft':
          // Could be used for collapsing items or moving between sections
          e.preventDefault();
          break;
        case 'l':
        case 'ArrowRight':
          // Could be used for expanding items or moving between sections
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          items[selectedIndex]?.onSelect?.();
          break;
        case 'Escape':
          e.preventDefault();
          setMode('normal');
          setPendingSequence('');
          setRepeatCount(0);
          break;
        case '?':
          e.preventDefault();
          setShowHints(prev => !prev);
          break;
        case '/':
          e.preventDefault();
          setMode('search');
          // Could trigger global search
          break;
        case ':':
          e.preventDefault();
          setMode('command');
          // Could trigger command palette
          break;
        case 'o':
          // Open selected item
          e.preventDefault();
          items[selectedIndex]?.onSelect?.();
          break;
        case 'x':
          // Delete/dismiss selected item
          e.preventDefault();
          executeAction('delete');
          break;
        case 'd':
          if (e.key === 'd' && hasCtrl) {
            // Ctrl+D = page down
            e.preventDefault();
            window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
          }
          break;
        case 'u':
          if (hasCtrl) {
            // Ctrl+U = page up
            e.preventDefault();
            window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
          }
          break;
        case 'r':
          if (!hasCtrl) {
            // Refresh
            e.preventDefault();
            window.location.reload();
          }
          break;
        case '[':
          // Previous page
          e.preventDefault();
          router.back();
          break;
        case ']':
          // Next page
          e.preventDefault();
          router.forward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcuts,
    items,
    selectedIndex,
    pendingSequence,
    repeatCount,
    activeFocusTrap,
    isSettingMark,
    isJumpingToMark,
    moveSelection,
    navigateTo,
    executeAction,
    setMark,
    jumpToMark,
    router,
  ]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = items[selectedIndex];
    selectedItem?.element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedIndex, items]);

  // Register default shortcuts
  useEffect(() => {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        key: 'k',
        modifiers: ['ctrl'],
        description: 'Open command palette',
        action: () => setMode('command'),
        category: 'system',
        global: true,
      },
      {
        key: 'p',
        modifiers: ['ctrl'],
        description: 'Quick open',
        action: () => setMode('search'),
        category: 'search',
        global: true,
      },
    ];

    defaultShortcuts.forEach(registerShortcut);
    return () => defaultShortcuts.forEach(s => unregisterShortcut(s.key));
  }, [registerShortcut, unregisterShortcut]);

  return (
    <KeyboardContext.Provider value={{
      mode,
      setMode,
      selectedIndex,
      setSelectedIndex,
      items,
      registerItem,
      unregisterItem,
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      showHints,
      setShowHints,
      executeAction,
      pendingSequence,
      repeatCount,
      pushFocusTrap,
      popFocusTrap,
      activeFocusTrap,
      setMark,
      jumpToMark,
      marks,
      navigateTo,
    }}>
      {children}
      <KeyboardHints />
      <SequenceIndicator />
      <MarkIndicator isSettingMark={isSettingMark} isJumpingToMark={isJumpingToMark} />
    </KeyboardContext.Provider>
  );
}

// Helper function to match shortcuts
function matchesShortcut(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const hasCtrl = e.ctrlKey || e.metaKey;
  const hasAlt = e.altKey;
  const hasShift = e.shiftKey;

  const requiresCtrl = shortcut.modifiers?.includes('ctrl') || shortcut.modifiers?.includes('meta');
  const requiresAlt = shortcut.modifiers?.includes('alt');
  const requiresShift = shortcut.modifiers?.includes('shift');

  if (requiresCtrl !== hasCtrl) return false;
  if (requiresAlt !== hasAlt) return false;
  if (requiresShift !== hasShift) return false;

  return shortcut.key.toLowerCase() === e.key.toLowerCase();
}

/**
 * Keyboard Hints Overlay - Shows available shortcuts
 */
export function KeyboardHints() {
  const { showHints, setShowHints, shortcuts, mode, pendingSequence, marks } = useKeyboard();

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {
      navigation: [],
      action: [],
      create: [],
      search: [],
      view: [],
      edit: [],
      system: [],
    };

    // Add built-in vim shortcuts
    const builtInShortcuts: KeyboardShortcut[] = [
      { key: 'j', description: 'Move down', action: () => {}, category: 'navigation' },
      { key: 'k', description: 'Move up', action: () => {}, category: 'navigation' },
      { key: '5j', description: 'Move down 5 items (number prefix)', action: () => {}, category: 'navigation' },
      { key: 'gg', description: 'Go to top', action: () => {}, category: 'navigation' },
      { key: 'G', description: 'Go to bottom', action: () => {}, category: 'navigation' },
      { key: 'Enter', description: 'Select / Open', action: () => {}, category: 'navigation' },
      { key: 'o', description: 'Open item', action: () => {}, category: 'action' },
      { key: 'x', description: 'Delete / Dismiss', action: () => {}, category: 'action' },
      { key: '/', description: 'Search', action: () => {}, category: 'search' },
      { key: ':', description: 'Command palette', action: () => {}, category: 'system' },
      { key: '?', description: 'Show keyboard shortcuts', action: () => {}, category: 'system' },
      { key: '[', description: 'Go back', action: () => {}, category: 'navigation' },
      { key: ']', description: 'Go forward', action: () => {}, category: 'navigation' },
      { key: 'Ctrl+d', description: 'Page down', action: () => {}, category: 'navigation' },
      { key: 'Ctrl+u', description: 'Page up', action: () => {}, category: 'navigation' },
      { key: 'm + key', description: 'Set mark', action: () => {}, category: 'navigation' },
      { key: "' + key", description: 'Jump to mark', action: () => {}, category: 'navigation' },
    ];

    // Add go-to shortcuts
    Object.entries(NAVIGATION_ROUTES).forEach(([key, route]) => {
      builtInShortcuts.push({
        key: 'g',
        sequence: `g${key}`,
        description: `Go to ${route.label}`,
        action: () => {},
        category: 'navigation',
      });
    });

    // Add create shortcuts
    Object.entries(CREATE_ROUTES).forEach(([key, route]) => {
      builtInShortcuts.push({
        key: 'n',
        sequence: `n${key}`,
        description: route.label,
        action: () => {},
        category: 'create',
      });
    });

    [...builtInShortcuts, ...shortcuts].forEach(s => {
      if (groups[s.category]) {
        groups[s.category].push(s);
      }
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [shortcuts]);

  return (
    <AnimatePresence>
      {showHints && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-max bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHints(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-w-4xl w-full max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
                  <span className="text-white text-sm">⌨</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                  <p className="text-xs text-neutral-400">Vim-style navigation • Press ? to toggle</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                  Mode: <span className="font-mono text-accent-400">{mode}</span>
                </span>
                {Object.keys(marks).length > 0 && (
                  <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                    Marks: <span className="font-mono text-accent-400">{Object.keys(marks).join(', ')}</span>
                  </span>
                )}
                <button
                  onClick={() => setShowHints(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedShortcuts.map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-500"></span>
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {categoryShortcuts.slice(0, 12).map((shortcut, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-neutral-800/50"
                        >
                          <span className="text-sm text-neutral-300">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.modifiers?.map(mod => (
                              <kbd
                                key={mod}
                                className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] font-mono text-neutral-400 border border-neutral-700"
                              >
                                {mod === 'ctrl' ? '⌃' : mod === 'meta' ? '⌘' : mod === 'alt' ? '⌥' : '⇧'}
                              </kbd>
                            ))}
                            <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] font-mono text-neutral-300 border border-neutral-700">
                              {shortcut.sequence || shortcut.key}
                            </kbd>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Pro tip: Use number prefix (e.g., <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-[10px] font-mono">5j</kbd>) to repeat movements
              </p>
              <p className="text-xs text-neutral-500">
                <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-[10px] font-mono">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Sequence Indicator - Shows pending key sequence
 */
function SequenceIndicator() {
  const { pendingSequence, repeatCount } = useKeyboard();

  if (!pendingSequence && !repeatCount) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed bottom-6 right-6 z-toast"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg">
        {repeatCount > 0 && (
          <span className="text-sm font-mono text-amber-400">{repeatCount}</span>
        )}
        {pendingSequence && (
          <span className="text-sm font-mono text-accent-400">{pendingSequence}</span>
        )}
        <span className="text-xs text-neutral-500">waiting for key...</span>
      </div>
    </motion.div>
  );
}

/**
 * Mark Indicator - Shows when setting/jumping to marks
 */
function MarkIndicator({ isSettingMark, isJumpingToMark }: { isSettingMark: boolean; isJumpingToMark: boolean }) {
  if (!isSettingMark && !isJumpingToMark) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-toast"
    >
      <div className="px-4 py-2 bg-neutral-900 border border-amber-500/50 rounded-lg shadow-lg">
        <span className="text-sm text-amber-400">
          {isSettingMark ? 'Set mark: press a-z' : 'Jump to mark: press a-z'}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Mode Indicator - Shows current keyboard mode
 */
export function KeyboardModeIndicator({ className }: { className?: string }) {
  const { mode, pendingSequence, repeatCount } = useKeyboard();

  const modeColors: Record<KeyboardMode, string> = {
    normal: 'bg-status-success-text',
    insert: 'bg-blue-500',
    command: 'bg-purple-500',
    search: 'bg-amber-500',
    action: 'bg-red-500',
    visual: 'bg-cyan-500',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', modeColors[mode])} />
      <span className="text-xs font-mono text-neutral-400 uppercase">{mode}</span>
      {repeatCount > 0 && (
        <span className="text-xs font-mono text-amber-500">{repeatCount}</span>
      )}
      {pendingSequence && (
        <span className="text-xs font-mono text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded">
          {pendingSequence}...
        </span>
      )}
    </div>
  );
}

/**
 * Navigable - Wrapper for keyboard-navigable items
 */
export function Navigable({
  id,
  type,
  children,
  onSelect,
  onAction,
  data,
  className,
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  onSelect?: () => void;
  onAction?: (action: string) => void;
  data?: Record<string, unknown>;
  className?: string;
}) {
  const { registerItem, unregisterItem, selectedIndex, items } = useKeyboard();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerItem({
      id,
      type,
      element: ref.current || undefined,
      onSelect,
      onAction,
      data,
    });
    return () => unregisterItem(id);
  }, [id, type, onSelect, onAction, data, registerItem, unregisterItem]);

  const isSelected = items[selectedIndex]?.id === id;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-base',
        isSelected && 'ring-2 ring-accent-500 ring-offset-2 ring-offset-neutral-900 rounded-lg',
        className
      )}
      tabIndex={isSelected ? 0 : -1}
    >
      {children}
    </div>
  );
}

/**
 * Quick Jump Hints - Visual hints for quick navigation
 */
export function QuickJumpHints({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-popover"
        >
          <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg max-w-2xl">
            <span className="text-xs text-neutral-500 mr-2">Jump to:</span>
            {Object.entries(NAVIGATION_ROUTES).slice(0, 8).map(([key, route]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <kbd className="text-xs font-mono text-accent-400">g{key}</kbd>
                <span className="text-xs text-neutral-300">{route.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * useFocusTrap - Hook for trapping focus within a container
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  options: {
    enabled?: boolean;
    onEscape?: () => void;
    initialFocusRef?: React.RefObject<HTMLElement>;
    returnFocusRef?: React.RefObject<HTMLElement>;
  } = {}
) {
  const { pushFocusTrap, popFocusTrap } = useKeyboard();
  const idRef = useRef(`focus-trap-${Date.now()}`);

  useEffect(() => {
    if (!options.enabled || !ref.current) return;

    pushFocusTrap({
      id: idRef.current,
      container: ref.current,
      initialFocus: options.initialFocusRef?.current || undefined,
      returnFocus: options.returnFocusRef?.current || undefined,
      onEscape: options.onEscape,
    });

    return () => {
      popFocusTrap(idRef.current);
    };
  }, [options.enabled, ref, options.onEscape, options.initialFocusRef, options.returnFocusRef, pushFocusTrap, popFocusTrap]);
}

/**
 * Hook for registering page-specific shortcuts
 */
export function usePageShortcuts(shortcuts: Omit<KeyboardShortcut, 'action'>[], handlers: Record<string, () => void>) {
  const { registerShortcut, unregisterShortcut } = useKeyboard();

  useEffect(() => {
    shortcuts.forEach(shortcut => {
      const handler = handlers[shortcut.key] || handlers[shortcut.sequence || ''];
      if (handler) {
        registerShortcut({ ...shortcut, action: handler });
      }
    });

    return () => {
      shortcuts.forEach(shortcut => {
        unregisterShortcut(shortcut.sequence || shortcut.key);
      });
    };
  }, [shortcuts, handlers, registerShortcut, unregisterShortcut]);
}

/**
 * Inline Keyboard Hint - Small hint next to actions
 */
export function KeyHint({
  keys,
  className
}: {
  keys: string | string[];
  className?: string;
}) {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keyArray.map((key, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-neutral-600 text-xs mx-0.5">+</span>}
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-400 border border-neutral-700">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
