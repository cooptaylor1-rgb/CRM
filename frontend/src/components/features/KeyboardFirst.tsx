'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';

/**
 * KeyboardFirst - Vim-inspired Navigation System
 * 
 * Power users don't touch the mouse. This system provides:
 * - Vim-style navigation (j/k for up/down, h/l for sections)
 * - Quick jump shortcuts (g + key to go to pages)
 * - Action shortcuts (a + key for actions)
 * - Fuzzy search command palette (/)
 * - Visual keyboard hints
 */

export type KeyboardMode = 'normal' | 'insert' | 'command' | 'search' | 'action';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
  category: 'navigation' | 'action' | 'view' | 'edit' | 'search' | 'system';
  mode?: KeyboardMode;
  sequence?: string; // For multi-key shortcuts like "gg" or "gc"
}

export interface NavigableItem {
  id: string;
  type: string;
  element?: HTMLElement;
  onSelect?: () => void;
  onAction?: (action: string) => void;
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
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}

// Default shortcuts
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { key: 'j', description: 'Move down', action: () => {}, category: 'navigation' },
  { key: 'k', description: 'Move up', action: () => {}, category: 'navigation' },
  { key: 'h', description: 'Move left / Previous section', action: () => {}, category: 'navigation' },
  { key: 'l', description: 'Move right / Next section', action: () => {}, category: 'navigation' },
  { key: 'Enter', description: 'Select / Open', action: () => {}, category: 'navigation' },
  { key: 'Escape', description: 'Cancel / Back', action: () => {}, category: 'navigation' },
  
  // Go-to shortcuts (g prefix)
  { key: 'g', sequence: 'gd', description: 'Go to Dashboard', action: () => {}, category: 'navigation' },
  { key: 'g', sequence: 'gc', description: 'Go to Clients', action: () => {}, category: 'navigation' },
  { key: 'g', sequence: 'gh', description: 'Go to Households', action: () => {}, category: 'navigation' },
  { key: 'g', sequence: 'gt', description: 'Go to Tasks', action: () => {}, category: 'navigation' },
  { key: 'g', sequence: 'gp', description: 'Go to Pipeline', action: () => {}, category: 'navigation' },
  { key: 'g', sequence: 'gm', description: 'Go to Meetings', action: () => {}, category: 'navigation' },
  { key: 'g', sequence: 'gg', description: 'Go to top', action: () => {}, category: 'navigation' },
  { key: 'G', description: 'Go to bottom', action: () => {}, category: 'navigation' },
  
  // Action shortcuts (a prefix)
  { key: 'a', sequence: 'an', description: 'New item', action: () => {}, category: 'action' },
  { key: 'a', sequence: 'ae', description: 'Edit selected', action: () => {}, category: 'action' },
  { key: 'a', sequence: 'ad', description: 'Delete selected', action: () => {}, category: 'action' },
  { key: 'a', sequence: 'ac', description: 'Complete task', action: () => {}, category: 'action' },
  { key: 'a', sequence: 'as', description: 'Schedule meeting', action: () => {}, category: 'action' },
  { key: 'a', sequence: 'am', description: 'Send email', action: () => {}, category: 'action' },
  
  // Search & Command
  { key: '/', description: 'Search', action: () => {}, category: 'search' },
  { key: ':', description: 'Command palette', action: () => {}, category: 'system' },
  { key: 'p', modifiers: ['ctrl'], description: 'Quick open', action: () => {}, category: 'search' },
  { key: 'k', modifiers: ['ctrl'], description: 'Command palette', action: () => {}, category: 'system' },
  
  // View shortcuts
  { key: '?', description: 'Show keyboard shortcuts', action: () => {}, category: 'system' },
  { key: 'r', description: 'Refresh', action: () => {}, category: 'view' },
  { key: '[', description: 'Previous page', action: () => {}, category: 'navigation' },
  { key: ']', description: 'Next page', action: () => {}, category: 'navigation' },
];

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<KeyboardMode>('normal');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<NavigableItem[]>([]);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [showHints, setShowHints] = useState(false);
  const [pendingSequence, setPendingSequence] = useState('');
  const sequenceTimeoutRef = useRef<NodeJS.Timeout>();

  const registerItem = useCallback((item: NavigableItem) => {
    setItems(prev => [...prev.filter(i => i.id !== item.id), item]);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev.filter(s => s.key !== shortcut.key || s.sequence !== shortcut.sequence), shortcut]);
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  const executeAction = useCallback((actionKey: string) => {
    const selectedItem = items[selectedIndex];
    selectedItem?.onAction?.(actionKey);
  }, [items, selectedIndex]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        // But still handle Escape to exit input
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setMode('normal');
        }
        return;
      }

      const key = e.key;
      const hasCtrl = e.ctrlKey || e.metaKey;
      const hasAlt = e.altKey;
      const hasShift = e.shiftKey;

      // Handle sequences (like 'gg', 'gc', etc.)
      if (pendingSequence) {
        const fullSequence = pendingSequence + key;
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
          sequenceTimeoutRef.current = setTimeout(() => setPendingSequence(''), 1000);
          return;
        }
        
        // No match, reset
        setPendingSequence('');
      }

      // Check for sequence starters
      if (key === 'g' || key === 'a') {
        const sequenceShortcuts = shortcuts.filter(s => s.sequence?.startsWith(key));
        if (sequenceShortcuts.length > 0) {
          e.preventDefault();
          setPendingSequence(key);
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = setTimeout(() => setPendingSequence(''), 1000);
          return;
        }
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(s => {
        if (s.key.toLowerCase() !== key.toLowerCase()) return false;
        if (s.sequence) return false; // Skip sequence shortcuts
        
        const requiresCtrl = s.modifiers?.includes('ctrl') || s.modifiers?.includes('meta');
        const requiresAlt = s.modifiers?.includes('alt');
        const requiresShift = s.modifiers?.includes('shift');
        
        if (requiresCtrl !== hasCtrl) return false;
        if (requiresAlt !== hasAlt) return false;
        if (requiresShift !== hasShift) return false;
        
        return true;
      });

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();
        return;
      }

      // Default vim-like navigation
      switch (key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
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
          break;
        case '?':
          if (!hasShift) return;
          e.preventDefault();
          setShowHints(prev => !prev);
          break;
        case '/':
          e.preventDefault();
          setMode('search');
          break;
        case ':':
          e.preventDefault();
          setMode('command');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, items, selectedIndex, pendingSequence]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = items[selectedIndex];
    selectedItem?.element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedIndex, items]);

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
    }}>
      {children}
    </KeyboardContext.Provider>
  );
}

/**
 * Keyboard Hints Overlay - Shows available shortcuts
 */
export function KeyboardHints() {
  const { showHints, setShowHints, shortcuts, mode, pendingSequence } = useKeyboard();

  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [shortcuts]);

  return (
    <AnimatePresence>
      {showHints && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHints(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⌨️</span>
                <h2 className="text-lg font-semibold text-content-primary">Keyboard Shortcuts</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-content-tertiary bg-surface-secondary px-2 py-1 rounded">
                  Mode: <span className="font-mono text-accent-primary">{mode}</span>
                </span>
                <button
                  onClick={() => setShowHints(false)}
                  className="p-1 rounded hover:bg-surface-secondary text-content-tertiary"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <span className="text-sm text-content-secondary">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.modifiers?.map(mod => (
                              <kbd
                                key={mod}
                                className="px-2 py-0.5 bg-surface-secondary rounded text-xs font-mono text-content-primary"
                              >
                                {mod === 'ctrl' ? '⌃' : mod === 'meta' ? '⌘' : mod === 'alt' ? '⌥' : '⇧'}
                              </kbd>
                            ))}
                            <kbd className="px-2 py-0.5 bg-surface-secondary rounded text-xs font-mono text-content-primary">
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

            <div className="p-4 border-t border-border bg-surface-secondary/30 text-center">
              <p className="text-xs text-content-tertiary">
                Press <kbd className="px-1.5 py-0.5 bg-surface rounded text-xs font-mono">?</kbd> to toggle this panel
                • Vim-style navigation enabled
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Mode Indicator - Shows current keyboard mode
 */
export function KeyboardModeIndicator({ className }: { className?: string }) {
  const { mode, pendingSequence } = useKeyboard();

  const modeColors: Record<KeyboardMode, string> = {
    normal: 'bg-green-500',
    insert: 'bg-blue-500',
    command: 'bg-purple-500',
    search: 'bg-amber-500',
    action: 'bg-red-500',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', modeColors[mode])} />
      <span className="text-xs font-mono text-content-tertiary uppercase">{mode}</span>
      {pendingSequence && (
        <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
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
  className,
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  onSelect?: () => void;
  onAction?: (action: string) => void;
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
    });
    return () => unregisterItem(id);
  }, [id, type, onSelect, onAction, registerItem, unregisterItem]);

  const isSelected = items[selectedIndex]?.id === id;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        isSelected && 'ring-2 ring-accent-primary ring-offset-2 ring-offset-surface',
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
  const hints = [
    { key: 'gd', label: 'Dashboard' },
    { key: 'gc', label: 'Clients' },
    { key: 'gh', label: 'Households' },
    { key: 'gt', label: 'Tasks' },
    { key: 'gp', label: 'Pipeline' },
    { key: 'gm', label: 'Meetings' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full shadow-lg">
            <span className="text-xs text-content-tertiary">Jump to:</span>
            {hints.map(hint => (
              <div
                key={hint.key}
                className="flex items-center gap-1 px-2 py-1 rounded bg-surface-secondary"
              >
                <kbd className="text-xs font-mono text-accent-primary">{hint.key}</kbd>
                <span className="text-xs text-content-secondary">{hint.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
          {i > 0 && <span className="text-content-tertiary text-xs mx-0.5">+</span>}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary text-[10px] font-mono text-content-tertiary">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
