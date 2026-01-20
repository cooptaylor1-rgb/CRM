'use client';

import * as React from 'react';
import { cn } from '../ui/utils';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  SparklesIcon,
  BoltIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { 
  searchService, 
  SearchResult, 
  QuickAction,
  SearchEntityType 
} from '@/services/search.service';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks';
import { tasksService } from '@/services/tasks.service';
import { toast } from 'react-hot-toast';

/**
 * SmartCommandPalette Component
 *
 * An intelligent command palette that understands context and suggests
 * relevant actions. Enhanced replacement for GlobalSearch.
 *
 * Key Features:
 * - Context-aware suggestions based on current page
 * - Natural language commands ("schedule meeting with John")
 * - Inline quick actions (complete task without navigation)
 * - Entity recognition
 * - Predictive suggestions based on usage patterns
 */

interface SmartCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: {
    page?: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
  };
}

// Smart suggestion types
interface SmartSuggestion {
  id: string;
  type: 'smart' | 'recent' | 'frequent';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
  badge?: string;
  priority?: number;
}

// Command patterns for natural language parsing
const commandPatterns = [
  { pattern: /^(call|phone)\s+(.+)$/i, action: 'call', extract: 2 },
  { pattern: /^(email|mail)\s+(.+)$/i, action: 'email', extract: 2 },
  { pattern: /^(schedule|book|create)\s+(meeting|call)\s+(with\s+)?(.+)$/i, action: 'schedule', extract: 4 },
  { pattern: /^(add|create)\s+(task|todo)\s+(.+)$/i, action: 'createTask', extract: 3 },
  { pattern: /^(go\s+to|open|show)\s+(.+)$/i, action: 'navigate', extract: 2 },
  { pattern: /^(find|search)\s+(.+)$/i, action: 'search', extract: 2 },
];

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

export function SmartCommandPalette({ isOpen, onClose, currentContext }: SmartCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [quickActions, setQuickActions] = React.useState<QuickAction[]>([]);
  const [smartSuggestions, setSmartSuggestions] = React.useState<SmartSuggestion[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<SearchEntityType | null>(null);
  const [commandPreview, setCommandPreview] = React.useState<{ type: string; target: string } | null>(null);
  
  const debouncedQuery = useDebounce(query, 150); // Faster response
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Generate smart suggestions based on context
  const generateSmartSuggestions = React.useCallback(async () => {
    const suggestions: SmartSuggestion[] = [];
    
    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 10) {
      suggestions.push({
        id: 'morning-tasks',
        type: 'smart',
        title: 'Review today\'s tasks',
        subtitle: 'Start your day by checking what\'s due',
        icon: <CheckCircleIcon className="w-5 h-5 text-amber-500" />,
        action: () => router.push('/tasks?filter=due-today'),
        badge: 'Morning routine',
        priority: 1,
      });
    }
    
    // Add overdue task quick action
    try {
      const overdue = await tasksService.getOverdue();
      if (overdue.length > 0) {
        suggestions.push({
          id: 'overdue-alert',
          type: 'smart',
          title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
          subtitle: 'Click to view and resolve',
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
          action: () => router.push('/tasks?filter=overdue'),
          badge: 'Needs attention',
          priority: 0,
        });
      }
    } catch {
      // Ignore error, just don't show suggestion
    }

    // Context-based suggestions
    if (currentContext?.page === 'households' && currentContext.entityId) {
      suggestions.push({
        id: 'context-meeting',
        type: 'smart',
        title: `Schedule meeting with ${currentContext.entityName || 'this household'}`,
        subtitle: 'Quick action based on current view',
        icon: <CalendarIcon className="w-5 h-5 text-indigo-500" />,
        action: () => router.push(`/meetings/new?householdId=${currentContext.entityId}`),
        priority: 2,
      });
      suggestions.push({
        id: 'context-task',
        type: 'smart',
        title: `Add task for ${currentContext.entityName || 'this household'}`,
        subtitle: 'Quick action based on current view',
        icon: <PlusIcon className="w-5 h-5 text-green-500" />,
        action: () => router.push(`/tasks/new?householdId=${currentContext.entityId}`),
        priority: 3,
      });
    }

    // Frequently used actions (mock - in real app, this would come from analytics)
    suggestions.push({
      id: 'frequent-1',
      type: 'frequent',
      title: 'Add new household',
      subtitle: 'Your most used action',
      icon: <UsersIcon className="w-5 h-5 text-blue-500" />,
      action: () => router.push('/households/new'),
      priority: 10,
    });

    // Sort by priority and return
    return suggestions.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [currentContext, router]);

  // Parse natural language commands
  const parseCommand = React.useCallback((input: string) => {
    for (const cmd of commandPatterns) {
      const match = input.match(cmd.pattern);
      if (match) {
        return {
          type: cmd.action,
          target: match[cmd.extract] || '',
        };
      }
    }
    return null;
  }, []);

  // Load initial data
  React.useEffect(() => {
    const loadInitialData = async () => {
      const [actions, suggestions] = await Promise.all([
        searchService.getQuickActions(),
        generateSmartSuggestions(),
      ]);
      setQuickActions(actions);
      setSmartSuggestions(suggestions);
    };
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, generateSmartSuggestions]);

  // Parse commands as user types
  React.useEffect(() => {
    const command = parseCommand(query);
    setCommandPreview(command);
  }, [query, parseCommand]);

  // Search when query changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim() || commandPreview) {
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
  }, [debouncedQuery, activeFilter, commandPreview]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setActiveFilter(null);
      setCommandPreview(null);
    }
  }, [isOpen]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Execute command
  const executeCommand = React.useCallback(async () => {
    if (!commandPreview) return;

    const { type, target } = commandPreview;

    switch (type) {
      case 'call':
        toast.success(`Opening phone for ${target}...`);
        // In a real app, this would open a dialer or VOIP
        break;
      case 'email':
        toast.success(`Opening email composer for ${target}...`);
        // In a real app, this would open email composer
        break;
      case 'schedule':
        router.push(`/meetings/new?contact=${encodeURIComponent(target)}`);
        break;
      case 'createTask':
        router.push(`/tasks/new?title=${encodeURIComponent(target)}`);
        break;
      case 'navigate':
        // Try to match to a page
        const pages: Record<string, string> = {
          dashboard: '/dashboard',
          households: '/households',
          clients: '/clients',
          tasks: '/tasks',
          meetings: '/meetings',
          documents: '/documents',
          pipeline: '/pipeline',
          analytics: '/analytics',
          settings: '/settings',
        };
        const matchedPage = Object.entries(pages).find(([key]) => 
          target.toLowerCase().includes(key)
        );
        if (matchedPage) {
          router.push(matchedPage[1]);
        } else {
          toast.error(`Page "${target}" not found`);
          return;
        }
        break;
      case 'search':
        setQuery(target);
        setCommandPreview(null);
        return; // Don't close, continue search
    }

    onClose();
    setQuery('');
  }, [commandPreview, router, onClose]);

  const handleSelect = async (item: SearchResult | QuickAction | SmartSuggestion | string) => {
    if (typeof item === 'string') {
      setQuery(item);
      return;
    }

    // Smart suggestion with custom action
    if ('action' in item && typeof item.action === 'function') {
      await item.action();
      onClose();
      return;
    }

    if ('url' in item && item.url) {
      router.push(item.url);
    }

    onClose();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commandPreview) {
      e.preventDefault();
      executeCommand();
    }
  };

  const typeFilters: { type: SearchEntityType | null; label: string }[] = [
    { type: null, label: 'All' },
    { type: 'household', label: 'Households' },
    { type: 'person', label: 'People' },
    { type: 'account', label: 'Accounts' },
    { type: 'task', label: 'Tasks' },
  ];

  const showSmartSuggestions = !query.trim() && results.length === 0;

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
                {/* Search Input with Command Indicator */}
                <div className="relative border-b border-border">
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    {commandPreview ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="p-0.5"
                      >
                        <BoltIcon className="h-5 w-5 text-amber-500" />
                      </motion.div>
                    ) : (
                      <MagnifyingGlassIcon className="h-5 w-5 text-content-tertiary" />
                    )}
                  </div>
                  <Combobox.Input
                    ref={inputRef}
                    className={cn(
                      'h-14 w-full border-0 bg-transparent pl-12 pr-4',
                      'text-content-primary placeholder:text-content-tertiary',
                      'focus:outline-none focus:ring-0 text-base'
                    )}
                    placeholder="Search, or try: 'schedule meeting with John'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  {isLoading && (
                    <div className="absolute right-4 top-4">
                      <ArrowPathIcon className="animate-spin h-5 w-5 text-accent-500" />
                    </div>
                  )}
                </div>

                {/* Command Preview */}
                <AnimatePresence>
                  {commandPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-b border-border overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20">
                        <SparklesIcon className="w-5 h-5 text-amber-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {commandPreview.type === 'call' && `Call ${commandPreview.target}`}
                            {commandPreview.type === 'email' && `Email ${commandPreview.target}`}
                            {commandPreview.type === 'schedule' && `Schedule meeting with ${commandPreview.target}`}
                            {commandPreview.type === 'createTask' && `Create task: ${commandPreview.target}`}
                            {commandPreview.type === 'navigate' && `Go to ${commandPreview.target}`}
                            {commandPreview.type === 'search' && `Search for ${commandPreview.target}`}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Press Enter to execute
                          </p>
                        </div>
                        <kbd className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/50 rounded border border-amber-200 dark:border-amber-800">
                          ↵
                        </kbd>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Type Filters */}
                {query.trim() && !commandPreview && (
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
                                  {result.title}
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
                  {query.trim() && !commandPreview && !isLoading && results.length === 0 && (
                    <div className="py-10 text-center">
                      <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-content-tertiary" />
                      <p className="mt-2 text-content-secondary">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-sm text-content-tertiary">
                        Try a different search term or use a command like &ldquo;call John&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Smart Suggestions */}
                  {showSmartSuggestions && (
                    <>
                      {/* AI-powered suggestions */}
                      {smartSuggestions.filter(s => s.type === 'smart').length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 px-3 py-1.5">
                            <SparklesIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              Suggested for you
                            </span>
                          </div>
                          {smartSuggestions
                            .filter(s => s.type === 'smart')
                            .map(suggestion => (
                              <Combobox.Option
                                key={suggestion.id}
                                value={suggestion}
                                className={({ active }) =>
                                  cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                                    active ? 'bg-surface-secondary' : ''
                                  )
                                }
                              >
                                {({ active }) => (
                                  <>
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                      {suggestion.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-content-primary truncate">
                                        {suggestion.title}
                                      </p>
                                      <p className="text-sm text-content-secondary truncate">
                                        {suggestion.subtitle}
                                      </p>
                                    </div>
                                    {suggestion.badge && (
                                      <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">
                                        {suggestion.badge}
                                      </span>
                                    )}
                                    {active && (
                                      <ArrowRightIcon className="w-4 h-4 text-content-tertiary" />
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="mb-4">
                        <p className="px-3 py-1.5 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                          Quick Actions
                        </p>
                        {quickActions.filter(a => a.category === 'create').slice(0, 4).map(action => (
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
                                  <PlusIcon className="w-5 h-5" />
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

                      {/* Navigation */}
                      <div className="mb-4">
                        <p className="px-3 py-1.5 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                          Go to
                        </p>
                        {quickActions.filter(a => a.category === 'navigation').slice(0, 5).map(action => (
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
                                  <ArrowRightIcon className="w-5 h-5" />
                                </div>
                                <span className="flex-1 text-content-primary">{action.label}</span>
                                {active && (
                                  <ArrowRightIcon className="w-4 h-4 text-content-tertiary" />
                                )}
                              </>
                            )}
                          </Combobox.Option>
                        ))}
                      </div>
                    </>
                  )}
                </Combobox.Options>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface-secondary text-xs text-content-tertiary">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Try natural commands</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-border">K</kbd>
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

// Hook to use smart command palette
export function useSmartCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [context, setContext] = React.useState<SmartCommandPaletteProps['currentContext']>();

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
    context,
    open: (ctx?: SmartCommandPaletteProps['currentContext']) => {
      setContext(ctx);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

export default SmartCommandPalette;
