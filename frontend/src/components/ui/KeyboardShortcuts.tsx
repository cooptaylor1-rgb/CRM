'use client';

import * as React from 'react';
import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key combination (e.g., 'cmd+k', 'ctrl+shift+p') */
  keys: string;
  /** Description for help dialog */
  description: string;
  /** Handler function */
  handler: (e: KeyboardEvent) => void;
  /** Category for grouping in help dialog */
  category?: string;
  /** Whether this shortcut is global (works even in inputs) */
  global?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Enabled state */
  enabled?: boolean;
}

export interface KeyboardShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcutsContextValue {
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  unregisterShortcut: (id: string) => void;
  shortcuts: KeyboardShortcut[];
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
}

// ============================================================================
// Context
// ============================================================================

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  /** Default shortcuts to register */
  defaultShortcuts?: KeyboardShortcut[];
}

export function KeyboardShortcutsProvider({
  children,
  defaultShortcuts = [],
}: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(defaultShortcuts);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Register shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Replace if exists, otherwise add
      const exists = prev.findIndex((s) => s.id === shortcut.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = shortcut;
        return updated;
      }
      return [...prev, shortcut];
    });

    // Return unregister function
    return () => {
      setShortcuts((prev) => prev.filter((s) => s.id !== shortcut.id));
    };
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Help dialog controls
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input element
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        if (!shortcut.global && isInput) continue;

        if (matchesShortcut(e, shortcut.keys)) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  // Register default help shortcut
  useEffect(() => {
    const unregister = registerShortcut({
      id: 'keyboard-help',
      keys: '?',
      description: 'Show keyboard shortcuts',
      handler: toggleHelp,
      category: 'General',
      global: false,
    });

    return unregister;
  }, [registerShortcut, toggleHelp]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        shortcuts,
        isHelpOpen,
        openHelp,
        closeHelp,
        toggleHelp,
      }}
    >
      {children}
      <KeyboardShortcutsHelp />
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================================================
// Keyboard Shortcuts Help Dialog
// ============================================================================

function KeyboardShortcutsHelp() {
  const { shortcuts, isHelpOpen, closeHelp } = useKeyboardShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};

    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });

    return Object.entries(groups).map(([name, items]) => ({
      name,
      shortcuts: items,
    }));
  }, [shortcuts]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHelpOpen) {
        closeHelp();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isHelpOpen, closeHelp]);

  return (
    <AnimatePresence>
      {isHelpOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeHelp}
            className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-popover w-full sm:max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                <button
                  onClick={closeHelp}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {groupedShortcuts.map((group) => (
                  <div key={group.name}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                      {group.name}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-800/50"
                        >
                          <span className="text-sm text-neutral-300">{shortcut.description}</span>
                          <KeyboardKey keys={shortcut.keys} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-800 text-center">
                <span className="text-xs text-neutral-500">
                  Press <KeyboardKey keys="?" size="sm" /> to toggle this dialog
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Keyboard Key Display Component
// ============================================================================

export interface KeyboardKeyProps {
  keys: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function KeyboardKey({ keys, size = 'md', className }: KeyboardKeyProps) {
  const parsedKeys = parseShortcutKeys(keys);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[18px]',
    md: 'text-xs px-2 py-1 min-w-[24px]',
    lg: 'text-sm px-2.5 py-1 min-w-[28px]',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {parsedKeys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd
            className={cn(
              'inline-flex items-center justify-center rounded font-mono',
              'bg-neutral-800 border border-neutral-700 text-neutral-300',
              'shadow-sm',
              sizeClasses[size]
            )}
          >
            {formatKeyDisplay(key)}
          </kbd>
          {index < parsedKeys.length - 1 && (
            <span className="text-neutral-600 text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// useShortcut Hook
// ============================================================================

export interface UseShortcutOptions {
  /** Key combination */
  keys: string;
  /** Handler function */
  handler: (e: KeyboardEvent) => void;
  /** Description for help dialog */
  description?: string;
  /** Category for grouping */
  category?: string;
  /** Whether this shortcut is global */
  global?: boolean;
  /** Prevent default behavior */
  preventDefault?: boolean;
  /** Enabled state */
  enabled?: boolean;
}

export function useShortcut(options: UseShortcutOptions) {
  const { registerShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const id = `shortcut-${options.keys}-${Date.now()}`;
    const unregister = registerShortcut({
      id,
      keys: options.keys,
      description: options.description || options.keys,
      handler: options.handler,
      category: options.category,
      global: options.global,
      preventDefault: options.preventDefault,
      enabled: options.enabled,
    });

    return unregister;
  }, [
    registerShortcut,
    options.keys,
    options.handler,
    options.description,
    options.category,
    options.global,
    options.preventDefault,
    options.enabled,
  ]);
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseShortcutKeys(keys: string): string[] {
  return keys.toLowerCase().split('+').map((k) => k.trim());
}

function matchesShortcut(e: KeyboardEvent, keys: string): boolean {
  const parsedKeys = parseShortcutKeys(keys);

  // Check modifier keys
  const modifiers = {
    cmd: e.metaKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
  };

  // Extract key and modifiers from shortcut
  const requiredModifiers: string[] = [];
  let mainKey = '';

  for (const key of parsedKeys) {
    if (key in modifiers) {
      requiredModifiers.push(key);
    } else {
      mainKey = key;
    }
  }

  // Check if required modifiers are pressed
  for (const mod of requiredModifiers) {
    if (!modifiers[mod as keyof typeof modifiers]) {
      return false;
    }
  }

  // Check if unwanted modifiers are pressed
  const allModifiers = ['cmd', 'ctrl', 'alt', 'shift', 'meta'] as const;
  for (const mod of allModifiers) {
    const isRequired = requiredModifiers.includes(mod);
    const isPressed = modifiers[mod];
    // Special case: cmd and meta are the same
    if (mod === 'meta' && requiredModifiers.includes('cmd')) continue;
    if (mod === 'cmd' && requiredModifiers.includes('meta')) continue;
    if (!isRequired && isPressed) {
      return false;
    }
  }

  // Check main key
  const pressedKey = e.key.toLowerCase();

  // Handle special keys
  const keyAliases: Record<string, string[]> = {
    space: [' ', 'spacebar'],
    enter: ['enter', 'return'],
    escape: ['escape', 'esc'],
    up: ['arrowup'],
    down: ['arrowdown'],
    left: ['arrowleft'],
    right: ['arrowright'],
    '?': ['?', '/'], // ? requires shift on most keyboards
  };

  if (keyAliases[mainKey]) {
    return keyAliases[mainKey].includes(pressedKey);
  }

  return pressedKey === mainKey;
}

function formatKeyDisplay(key: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const keyMap: Record<string, string> = {
    cmd: isMac ? '⌘' : 'Ctrl',
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: isMac ? '⇧' : 'Shift',
    meta: isMac ? '⌘' : 'Win',
    enter: '↵',
    escape: 'Esc',
    space: 'Space',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    backspace: '⌫',
    delete: 'Del',
    tab: '⇥',
  };

  return keyMap[key] || key.toUpperCase();
}

// ============================================================================
// Common Shortcuts Presets
// ============================================================================

export const commonShortcuts = {
  save: { keys: 'cmd+s', description: 'Save' },
  search: { keys: 'cmd+k', description: 'Search' },
  newItem: { keys: 'cmd+n', description: 'New item' },
  close: { keys: 'escape', description: 'Close' },
  help: { keys: '?', description: 'Show help' },
  undo: { keys: 'cmd+z', description: 'Undo' },
  redo: { keys: 'cmd+shift+z', description: 'Redo' },
  selectAll: { keys: 'cmd+a', description: 'Select all' },
  copy: { keys: 'cmd+c', description: 'Copy' },
  paste: { keys: 'cmd+v', description: 'Paste' },
  cut: { keys: 'cmd+x', description: 'Cut' },
  refresh: { keys: 'cmd+r', description: 'Refresh' },
  goBack: { keys: 'cmd+[', description: 'Go back' },
  goForward: { keys: 'cmd+]', description: 'Go forward' },
};

// ============================================================================
// Shortcut Hint Component (Inline hint)
// ============================================================================

export interface ShortcutHintProps {
  keys: string;
  className?: string;
}

export function ShortcutHint({ keys, className }: ShortcutHintProps) {
  return (
    <span className={cn('text-neutral-500 text-xs ml-auto', className)}>
      <KeyboardKey keys={keys} size="sm" />
    </span>
  );
}
