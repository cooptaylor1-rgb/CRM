'use client';

import * as React from 'react';
import { cn } from './utils';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

/**
 * CommandPalette Component
 * 
 * Global command palette (⌘K) for quick navigation and actions.
 * Inspired by VS Code, Linear, and Raycast.
 */

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  group?: string;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  /** Open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Command items */
  items: CommandItem[];
  /** Placeholder text */
  placeholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Called when item selected */
  onSelect?: (item: CommandItem) => void;
  /** Custom class */
  className?: string;
  /** Show recent items */
  recentItems?: CommandItem[];
}

export function CommandPalette({
  isOpen,
  onClose,
  items,
  placeholder = 'Search commands...',
  emptyMessage = 'No results found.',
  onSelect,
  className,
  recentItems = [],
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');

  // Filter items based on query
  const filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          const searchText = `${item.label} ${item.description || ''} ${item.group || ''}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });

  // Group items
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};

    filteredItems.forEach((item) => {
      const groupName = item.group || 'Actions';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    });

    return groups;
  }, [filteredItems]);

  const handleSelect = (item: CommandItem | null) => {
    if (!item || item.disabled) return;

    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      window.location.href = item.href;
    }

    onSelect?.(item);
    onClose();
    setQuery('');
  };

  // Reset query when closed
  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-modal" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-fast"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-fast"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Container */}
        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-fast"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-fast"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                'mx-auto max-w-xl transform overflow-hidden rounded-lg',
                'bg-surface shadow-lg ring-1 ring-border',
                'divide-y divide-border',
                'transition-all',
                className
              )}
            >
              <Combobox onChange={handleSelect}>
                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-content-tertiary"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className={cn(
                      'h-12 w-full border-0 bg-transparent pl-11 pr-4',
                      'text-content-primary placeholder:text-content-tertiary',
                      'focus:outline-none focus:ring-0',
                      'text-sm'
                    )}
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd
                    className={cn(
                      'absolute right-4 top-3.5 hidden sm:block',
                      'px-2 py-0.5 text-xs font-medium',
                      'text-content-tertiary bg-surface-secondary rounded',
                      'border border-border'
                    )}
                  >
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                {(filteredItems.length > 0 || query === '') && (
                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 overflow-y-auto py-2"
                  >
                    {/* Recent Items */}
                    {query === '' && recentItems.length > 0 && (
                      <div className="px-2 pb-2">
                        <h3 className="px-3 py-1.5 text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                          Recent
                        </h3>
                        {recentItems.map((item) => (
                          <CommandOption key={`recent-${item.id}`} item={item} />
                        ))}
                      </div>
                    )}

                    {/* Grouped Items */}
                    {Object.entries(groupedItems).map(([group, groupItems]) => (
                      <div key={group} className="px-2 py-2">
                        <h3 className="px-3 py-1.5 text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                          {group}
                        </h3>
                        {groupItems.map((item) => (
                          <CommandOption key={item.id} item={item} />
                        ))}
                      </div>
                    ))}
                  </Combobox.Options>
                )}

                {/* Empty State */}
                {query !== '' && filteredItems.length === 0 && (
                  <div className="py-14 px-6 text-center">
                    <p className="text-sm text-content-tertiary">{emptyMessage}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 text-xs text-content-tertiary bg-surface-secondary/50">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border font-medium">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border font-medium">↓</kbd>
                      <span className="ml-1">to navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border font-medium">↵</kbd>
                      <span className="ml-1">to select</span>
                    </span>
                  </div>
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * CommandOption Component (internal)
 */
function CommandOption({ item }: { item: CommandItem }) {
  return (
    <Combobox.Option
      value={item}
      disabled={item.disabled}
      className={({ active }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer',
          'transition-colors duration-fast',
          active && 'bg-accent-50 dark:bg-accent-950',
          item.disabled && 'opacity-50 cursor-not-allowed'
        )
      }
    >
      {({ active }) => (
        <>
          {item.icon && (
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5',
                active ? 'text-accent-600' : 'text-content-tertiary'
              )}
            >
              {item.icon}
            </span>
          )}

          <span className="flex-1 min-w-0">
            <span
              className={cn(
                'block text-sm font-medium truncate',
                active ? 'text-accent-900 dark:text-accent-100' : 'text-content-primary'
              )}
            >
              {item.label}
            </span>
            {item.description && (
              <span
                className={cn(
                  'block text-xs truncate mt-0.5',
                  active ? 'text-accent-700 dark:text-accent-300' : 'text-content-tertiary'
                )}
              >
                {item.description}
              </span>
            )}
          </span>

          {item.shortcut && (
            <span className="flex-shrink-0 flex items-center gap-1">
              {item.shortcut.map((key, i) => (
                <kbd
                  key={i}
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-medium rounded',
                    'border',
                    active
                      ? 'bg-accent-100 border-accent-200 text-accent-700 dark:bg-accent-900 dark:border-accent-800 dark:text-accent-300'
                      : 'bg-surface-secondary border-border text-content-tertiary'
                  )}
                >
                  {key}
                </kbd>
              ))}
            </span>
          )}
        </>
      )}
    </Combobox.Option>
  );
}

/**
 * useCommandPalette Hook
 * 
 * Hook to manage command palette state and keyboard shortcuts.
 */

export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
