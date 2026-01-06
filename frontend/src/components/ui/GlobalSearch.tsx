'use client';

import * as React from 'react';
import { cn } from './utils';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentIcon,
  CalendarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ClockIcon,
  PlusIcon,
  HomeIcon,
  CogIcon,
  FolderIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { 
  searchService, 
  SearchResult, 
  QuickAction,
  SearchEntityType 
} from '@/services/search.service';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks';

/**
 * GlobalSearch Component
 * 
 * Enhanced command palette with real-time search across all CRM entities.
 * Features:
 * - Universal search (⌘K / Ctrl+K)
 * - Quick actions and navigation shortcuts
 * - Recent searches
 * - Type filtering
 * - Highlighted search matches
 */

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const entityIcons: Record<SearchEntityType, React.ReactNode> = {
  household: <UsersIcon className="w-5 h-5" />,
  account: <BriefcaseIcon className="w-5 h-5" />,
  person: <UserIcon className="w-5 h-5" />,
  entity: <BriefcaseIcon className="w-5 h-5" />,
  document: <DocumentIcon className="w-5 h-5" />,
  task: <CheckCircleIcon className="w-5 h-5" />,
  meeting: <CalendarIcon className="w-5 h-5" />,
  invoice: <CurrencyDollarIcon className="w-5 h-5" />,
  prospect: <FunnelIcon className="w-5 h-5" />,
  workflow: <ChartBarIcon className="w-5 h-5" />,
};

const entityColors: Record<SearchEntityType, string> = {
  household: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  account: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  person: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  entity: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
  document: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  task: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
  meeting: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  invoice: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  prospect: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  workflow: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
};

const actionIcons: Record<string, React.ReactNode> = {
  home: <HomeIcon className="w-5 h-5" />,
  users: <UsersIcon className="w-5 h-5" />,
  briefcase: <BriefcaseIcon className="w-5 h-5" />,
  user: <UserIcon className="w-5 h-5" />,
  'check-square': <CheckCircleIcon className="w-5 h-5" />,
  'trending-up': <FunnelIcon className="w-5 h-5" />,
  folder: <FolderIcon className="w-5 h-5" />,
  'credit-card': <CurrencyDollarIcon className="w-5 h-5" />,
  'bar-chart': <ChartBarIcon className="w-5 h-5" />,
  plus: <PlusIcon className="w-5 h-5" />,
  calendar: <CalendarIcon className="w-5 h-5" />,
  'user-plus': <UserIcon className="w-5 h-5" />,
  upload: <DocumentIcon className="w-5 h-5" />,
  search: <MagnifyingGlassIcon className="w-5 h-5" />,
  bell: <ClockIcon className="w-5 h-5" />,
  settings: <CogIcon className="w-5 h-5" />,
  'help-circle': <CogIcon className="w-5 h-5" />,
};

function highlightMatch(text: string, highlight?: string): React.ReactNode {
  if (!highlight) return text;
  
  // If highlight contains HTML marks
  if (highlight.includes('<mark>')) {
    const parts = highlight.split(/<mark>|<\/mark>/);
    return parts.map((part, i) => 
      i % 2 === 1 ? (
        <mark key={i} className="bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300 rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  }
  
  return text;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [quickActions, setQuickActions] = React.useState<QuickAction[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<SearchEntityType | null>(null);
  
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load quick actions and recent searches on mount
  React.useEffect(() => {
    const loadInitialData = async () => {
      const actions = await searchService.getQuickActions();
      setQuickActions(actions);
      
      const recent = await searchService.getRecentSearches();
      setRecentSearches(recent.map(r => r.query));
    };
    loadInitialData();
  }, []);

  // Search when query changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchService.search(debouncedQuery, {
          types: activeFilter ? [activeFilter] : undefined,
          limit: 10,
        });
        setResults(response.results);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeFilter]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setActiveFilter(null);
    }
  }, [isOpen]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (item: SearchResult | QuickAction | string) => {
    if (typeof item === 'string') {
      // Recent search
      setQuery(item);
      return;
    }

    if ('url' in item && item.url) {
      router.push(item.url);
    }

    onClose();
    setQuery('');
  };

  const typeFilters: { type: SearchEntityType | null; label: string }[] = [
    { type: null, label: 'All' },
    { type: 'household', label: 'Households' },
    { type: 'person', label: 'People' },
    { type: 'account', label: 'Accounts' },
    { type: 'document', label: 'Documents' },
    { type: 'meeting', label: 'Meetings' },
    { type: 'task', label: 'Tasks' },
    { type: 'invoice', label: 'Invoices' },
  ];

  // Group quick actions
  const groupedActions = React.useMemo(() => {
    const groups: Record<string, QuickAction[]> = {};
    quickActions.forEach(action => {
      const category = action.category === 'navigation' ? 'Go to' 
        : action.category === 'create' ? 'Create' 
        : 'Actions';
      if (!groups[category]) groups[category] = [];
      groups[category].push(action);
    });
    return groups;
  }, [quickActions]);

  const showQuickActions = !query.trim() && results.length === 0;

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Container */}
        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                'mx-auto max-w-2xl transform overflow-hidden rounded-xl',
                'bg-surface-primary shadow-2xl ring-1 ring-border',
                'transition-all'
              )}
            >
              <Combobox onChange={handleSelect}>
                {/* Search Input */}
                <div className="relative border-b border-border">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-content-tertiary"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    ref={inputRef}
                    className={cn(
                      'h-14 w-full border-0 bg-transparent pl-12 pr-4',
                      'text-content-primary placeholder:text-content-tertiary',
                      'focus:outline-none focus:ring-0 text-base'
                    )}
                    placeholder="Search anything or type a command..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {isLoading && (
                    <div className="absolute right-4 top-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Type Filters */}
                {query.trim() && (
                  <div className="flex items-center gap-1.5 p-2 border-b border-border overflow-x-auto">
                    {typeFilters.map(filter => (
                      <button
                        key={filter.label}
                        onClick={() => setActiveFilter(filter.type)}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
                          activeFilter === filter.type
                            ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300'
                            : 'text-content-secondary hover:bg-surface-secondary'
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results */}
                <Combobox.Options static className="max-h-96 overflow-y-auto p-2">
                  {/* Search Results */}
                  {results.length > 0 && (
                    <div className="mb-2">
                      <p className="px-3 py-1.5 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                        Results
                      </p>
                      {results.map(result => (
                        <Combobox.Option
                          key={result.id}
                          value={result}
                          className={({ active }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                              active ? 'bg-surface-secondary' : ''
                            )
                          }
                        >
                          {({ active }) => (
                            <>
                              <div className={cn('p-2 rounded-lg', entityColors[result.type])}>
                                {entityIcons[result.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-content-primary truncate">
                                  {result.highlights?.[0] 
                                    ? highlightMatch(result.title, result.highlights[0].snippet)
                                    : result.title
                                  }
                                </p>
                                <p className="text-sm text-content-secondary truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                              <span className="text-xs text-content-tertiary capitalize px-2 py-0.5 bg-surface-secondary rounded">
                                {result.type}
                              </span>
                              {active && (
                                <ArrowRightIcon className="w-4 h-4 text-content-tertiary" />
                              )}
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {query.trim() && !isLoading && results.length === 0 && (
                    <div className="py-10 text-center">
                      <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-content-tertiary" />
                      <p className="mt-2 text-content-secondary">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-sm text-content-tertiary">Try a different search term</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {showQuickActions && (
                    <>
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div className="mb-4">
                          <p className="px-3 py-1.5 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                            Recent
                          </p>
                          {recentSearches.slice(0, 3).map((search, idx) => (
                            <Combobox.Option
                              key={`recent-${idx}`}
                              value={search}
                              className={({ active }) =>
                                cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
                                  active ? 'bg-surface-secondary' : ''
                                )
                              }
                            >
                              <ClockIcon className="w-4 h-4 text-content-tertiary" />
                              <span className="text-content-secondary">{search}</span>
                            </Combobox.Option>
                          ))}
                        </div>
                      )}

                      {/* Grouped Actions */}
                      {Object.entries(groupedActions).map(([group, actions]) => (
                        <div key={group} className="mb-4">
                          <p className="px-3 py-1.5 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                            {group}
                          </p>
                          {actions.slice(0, 5).map(action => (
                            <Combobox.Option
                              key={action.id}
                              value={action}
                              className={({ active }) =>
                                cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
                                  active ? 'bg-surface-secondary' : ''
                                )
                              }
                            >
                              {({ active }) => (
                                <>
                                  <div className="text-content-secondary">
                                    {actionIcons[action.icon] || <CogIcon className="w-5 h-5" />}
                                  </div>
                                  <span className="flex-1 text-content-primary">{action.label}</span>
                                  {action.shortcut && (
                                    <div className="flex items-center gap-1">
                                      {action.shortcut.split(' ').map((key, i) => (
                                        <kbd
                                          key={i}
                                          className="px-1.5 py-0.5 text-xs font-medium bg-surface-secondary text-content-tertiary rounded border border-border"
                                        >
                                          {key}
                                        </kbd>
                                      ))}
                                    </div>
                                  )}
                                  {active && (
                                    <ArrowRightIcon className="w-4 h-4 text-content-tertiary" />
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </Combobox.Options>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface-secondary text-xs text-content-tertiary">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">↓</kbd>
                      <span className="ml-1">to navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">↵</kbd>
                      <span className="ml-1">to select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">esc</kbd>
                      <span className="ml-1">to close</span>
                    </span>
                  </div>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border ml-0.5">K</kbd>
                    <span className="ml-1">to open</span>
                  </span>
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// Hook to control global search from anywhere
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
