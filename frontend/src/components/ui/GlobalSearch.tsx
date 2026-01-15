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
  XMarkIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import {
  searchService,
  SearchResult,
  QuickAction,
  SearchEntityType
} from '@/services/search.service';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlobalSearch Component - Enhanced Edition
 *
 * World-class command palette with real-time search across all CRM entities.
 * Features:
 * - Universal search (⌘K / Ctrl+K)
 * - Quick actions and navigation shortcuts
 * - Persistent recent searches (localStorage)
 * - Filter chips with facet counts
 * - Rich preview cards with contextual information
 * - Type filtering with visual indicators
 * - Smart result grouping
 * - Highlighted search matches
 */

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// Storage key for recent searches
const RECENT_SEARCHES_KEY = 'crm_recent_searches';
const MAX_RECENT_SEARCHES = 10;

interface StoredSearch {
  query: string;
  timestamp: number;
  resultCount: number;
  topResultType?: SearchEntityType;
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

const entityLabels: Record<SearchEntityType, string> = {
  household: 'Households',
  account: 'Accounts',
  person: 'People',
  entity: 'Entities',
  document: 'Documents',
  task: 'Tasks',
  meeting: 'Meetings',
  invoice: 'Invoices',
  prospect: 'Prospects',
  workflow: 'Workflows',
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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Rich Preview Card Component
function SearchResultCard({
  result,
  isActive,
  onSelect
}: {
  result: SearchResult;
  isActive: boolean;
  onSelect: () => void;
}) {
  const metadata = result.metadata || {};

  // Render different preview content based on type
  const renderPreviewContent = () => {
    switch (result.type) {
      case 'household':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {metadata.tier && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  metadata.tier === 'platinum' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                  metadata.tier === 'gold' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                  metadata.tier === 'silver' && 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                )}>
                  {metadata.tier.charAt(0).toUpperCase() + metadata.tier.slice(1)}
                </span>
              )}
              {metadata.aum && (
                <span className="text-sm font-medium text-status-success-text">
                  ${(metadata.aum / 1000000).toFixed(1)}M AUM
                </span>
              )}
            </div>
            {result.description && (
              <p className="text-sm text-content-secondary">{result.description}</p>
            )}
          </div>
        );

      case 'person':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              {metadata.isPrimaryContact && (
                <span className="flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400">
                  <StarSolidIcon className="w-3 h-3" />
                  Primary
                </span>
              )}
              <span className="text-sm text-content-secondary">{result.subtitle}</span>
            </div>
            {result.description && (
              <div className="flex items-center gap-2 text-sm text-content-tertiary">
                <EnvelopeIcon className="w-4 h-4" />
                <span>{result.description.split('•')[1]?.trim() || result.description}</span>
              </div>
            )}
          </div>
        );

      case 'account':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-content-secondary">{result.subtitle}</span>
            </div>
            {result.description && (
              <p className="text-sm text-content-tertiary flex items-center gap-1">
                <BriefcaseIcon className="w-4 h-4" />
                {result.description}
              </p>
            )}
          </div>
        );

      case 'meeting':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-content-secondary">{result.subtitle}</span>
            </div>
            {result.description && (
              <p className="text-sm text-content-tertiary">{result.description}</p>
            )}
          </div>
        );

      case 'invoice':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {result.subtitle?.includes('Paid') && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-status-success-bg text-status-success-text">
                  Paid
                </span>
              )}
              {result.subtitle?.includes('Overdue') && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-status-error-bg text-status-error-text">
                  Overdue
                </span>
              )}
              {result.subtitle?.includes('Pending') && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-status-warning-bg text-status-warning-text">
                  Pending
                </span>
              )}
              <span className="text-sm font-medium text-content-primary">
                {result.subtitle?.split('•')[1]?.trim()}
              </span>
            </div>
            {result.description && (
              <p className="text-sm text-content-tertiary">{result.description}</p>
            )}
          </div>
        );

      case 'task':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-rose-500" />
              <span className="text-sm text-content-secondary">{result.subtitle}</span>
            </div>
            {result.description && (
              <p className="text-sm text-content-tertiary">{result.description}</p>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                result.subtitle?.includes('Signed')
                  ? 'bg-status-success-bg text-status-success-text'
                  : 'bg-surface-secondary text-content-secondary'
              )}>
                {result.subtitle?.split('•')[0]?.trim()}
              </span>
              <span className="text-sm text-content-tertiary">
                {result.subtitle?.split('•')[1]?.trim()}
              </span>
            </div>
            {result.description && (
              <p className="text-sm text-content-tertiary">{result.description}</p>
            )}
          </div>
        );

      default:
        return result.subtitle && (
          <p className="text-sm text-content-secondary">{result.subtitle}</p>
        );
    }
  };

  return (
    <Combobox.Option
      value={result}
      className={({ active }) =>
        cn(
          'flex flex-col gap-2 px-3 py-3 rounded-lg cursor-pointer transition-colors',
          active ? 'bg-surface-secondary' : ''
        )
      }
    >
      {({ active }) => (
        <>
          {/* Header Row */}
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg flex-shrink-0', entityColors[result.type])}>
              {entityIcons[result.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-content-primary truncate">
                {result.highlights?.[0]
                  ? highlightMatch(result.title, result.highlights[0].snippet)
                  : result.title
                }
              </p>
            </div>
            <span className="text-xs text-content-tertiary capitalize px-2 py-0.5 bg-surface-secondary rounded flex-shrink-0">
              {result.type}
            </span>
            {active && (
              <ArrowRightIcon className="w-4 h-4 text-content-tertiary flex-shrink-0" />
            )}
          </div>

          {/* Preview Content */}
          <div className="ml-12">
            {renderPreviewContent()}
          </div>
        </>
      )}
    </Combobox.Option>
  );
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [quickActions, setQuickActions] = React.useState<QuickAction[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<StoredSearch[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<SearchEntityType | null>(null);
  const [facetCounts, setFacetCounts] = React.useState<Record<SearchEntityType, number>>({} as Record<SearchEntityType, number>);

  const debouncedQuery = useDebounce(query, 200);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredSearch[];
        setRecentSearches(parsed);
      } catch {
        // Invalid data, clear it
        localStorage.removeItem(RECENT_SEARCHES_KEY);
      }
    }
  }, []);

  // Load quick actions on mount
  React.useEffect(() => {
    const actions = searchService.getQuickActions();
    setQuickActions(actions);
  }, []);

  // Search when query changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setFacetCounts({} as Record<SearchEntityType, number>);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchService.search(debouncedQuery, {
          types: activeFilter ? [activeFilter] : undefined,
          limit: 10,
        });
        setResults(response.results);
        if (response.facets?.type) {
          setFacetCounts(response.facets.type);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeFilter]);

  // Save search to recent when results are shown
  React.useEffect(() => {
    if (debouncedQuery.trim() && results.length > 0 && !isLoading) {
      saveRecentSearch(debouncedQuery, results.length, results[0]?.type);
    }
  }, [results, debouncedQuery, isLoading]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setActiveFilter(null);
      setFacetCounts({} as Record<SearchEntityType, number>);
    }
  }, [isOpen]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const saveRecentSearch = (searchQuery: string, resultCount: number, topResultType?: SearchEntityType) => {
    const newSearch: StoredSearch = {
      query: searchQuery,
      timestamp: Date.now(),
      resultCount,
      topResultType,
    };

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.query.toLowerCase() !== searchQuery.toLowerCase());
      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      // Persist to localStorage
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (queryToRemove: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.query !== queryToRemove);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelect = (item: SearchResult | QuickAction | StoredSearch | string) => {
    if (typeof item === 'string') {
      // Recent search query string
      setQuery(item);
      return;
    }

    if ('timestamp' in item && 'query' in item) {
      // StoredSearch - populate the search
      setQuery(item.query);
      return;
    }

    if ('url' in item && item.url) {
      router.push(item.url);
    }

    onClose();
    setQuery('');
  };

  // Filter chips with all types that have results
  const availableFilters = React.useMemo(() => {
    const filters: { type: SearchEntityType | null; label: string; count?: number }[] = [
      { type: null, label: 'All', count: results.length },
    ];

    // Add filters for types with results
    Object.entries(facetCounts).forEach(([type, count]) => {
      if (count > 0) {
        filters.push({
          type: type as SearchEntityType,
          label: entityLabels[type as SearchEntityType] || type,
          count,
        });
      }
    });

    return filters;
  }, [facetCounts, results.length]);

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
      <Dialog as="div" className="relative z-modal" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-moderate"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-base"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Container */}
        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-moderate"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-base"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                'mx-auto max-w-2xl transform overflow-hidden rounded-lg',
                'bg-surface-primary shadow-lg ring-1 ring-border',
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
                  {query && !isLoading && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-4 top-4 p-0.5 rounded hover:bg-surface-secondary transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 text-content-tertiary" />
                    </button>
                  )}
                </div>

                {/* Filter Chips with Counts */}
                {query.trim() && availableFilters.length > 1 && (
                  <div className="flex items-center gap-1.5 p-2 border-b border-border overflow-x-auto">
                    {availableFilters.map(filter => (
                      <button
                        key={filter.label}
                        onClick={() => setActiveFilter(filter.type)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
                          activeFilter === filter.type
                            ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300'
                            : 'text-content-secondary hover:bg-surface-secondary'
                        )}
                      >
                        {filter.type && (
                          <span className={cn('w-4 h-4', entityColors[filter.type])}>
                            {entityIcons[filter.type]}
                          </span>
                        )}
                        <span>{filter.label}</span>
                        {filter.count !== undefined && (
                          <span className={cn(
                            'ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full',
                            activeFilter === filter.type
                              ? 'bg-accent-200 dark:bg-accent-800'
                              : 'bg-surface-tertiary'
                          )}>
                            {filter.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results */}
                <Combobox.Options static className="max-h-[60vh] overflow-y-auto p-2">
                  {/* Search Results with Rich Preview */}
                  {results.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
                          Results
                        </p>
                        <p className="text-xs text-content-tertiary">
                          {results.length} found
                        </p>
                      </div>
                      <AnimatePresence>
                        {results.map((result, idx) => (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <SearchResultCard
                              result={result}
                              isActive={false}
                              onSelect={() => handleSelect(result)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* No Results */}
                  {query.trim() && !isLoading && results.length === 0 && (
                    <div className="py-10 text-center">
                      <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-content-tertiary" />
                      <p className="mt-2 text-content-secondary">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-sm text-content-tertiary">Try a different search term or filter</p>
                      {activeFilter && (
                        <button
                          onClick={() => setActiveFilter(null)}
                          className="mt-3 text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400"
                        >
                          Clear filter and search all
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  {showQuickActions && (
                    <>
                      {/* Recent Searches with Rich UI */}
                      {recentSearches.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between px-3 py-1.5">
                            <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
                              Recent Searches
                            </p>
                            <button
                              onClick={clearRecentSearches}
                              className="text-xs text-content-tertiary hover:text-content-secondary transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                          {recentSearches.slice(0, 5).map((search, idx) => (
                            <Combobox.Option
                              key={`recent-${idx}`}
                              value={search}
                              className={({ active }) =>
                                cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group',
                                  active ? 'bg-surface-secondary' : ''
                                )
                              }
                            >
                              {({ active }) => (
                                <>
                                  <ClockIcon className="w-4 h-4 text-content-tertiary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-content-primary">{search.query}</span>
                                    <span className="ml-2 text-xs text-content-tertiary">
                                      {search.resultCount} results
                                    </span>
                                  </div>
                                  {search.topResultType && (
                                    <span className={cn(
                                      'px-2 py-0.5 text-xs rounded-full',
                                      entityColors[search.topResultType]
                                    )}>
                                      {entityLabels[search.topResultType]}
                                    </span>
                                  )}
                                  <span className="text-xs text-content-tertiary">
                                    {formatRelativeTime(new Date(search.timestamp).toISOString())}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeRecentSearch(search.query);
                                    }}
                                    className={cn(
                                      'p-1 rounded hover:bg-surface-tertiary transition-opacity',
                                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    )}
                                  >
                                    <XMarkIcon className="w-3 h-3 text-content-tertiary" />
                                  </button>
                                </>
                              )}
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
                      <span className="ml-1">navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">↵</kbd>
                      <span className="ml-1">select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">Tab</kbd>
                      <span className="ml-1">filter</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">esc</kbd>
                      <span className="ml-1">close</span>
                    </span>
                  </div>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border ml-0.5">K</kbd>
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
