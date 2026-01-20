'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, formatCurrency, formatDate } from '../ui';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  UserGroupIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  FunnelIcon,
  ArrowRightIcon,
  XMarkIcon,
  LightBulbIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * ConversationalSearch - Natural Language Query Interface
 *
 * Interprets advisor intent from natural language queries.
 * Example: "Show me clients who haven't been contacted in 30 days with over $1M AUM"
 * becomes a structured, actionable query with instant results.
 */

export interface SearchResult {
  id: string;
  type: 'client' | 'household' | 'task' | 'meeting' | 'document' | 'opportunity';
  title: string;
  subtitle: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
  highlights?: string[];
}

export interface ParsedQuery {
  intent: 'find' | 'list' | 'analyze' | 'compare' | 'schedule' | 'unknown';
  entityType: 'clients' | 'households' | 'tasks' | 'meetings' | 'documents' | 'opportunities';
  filters: ParsedFilter[];
  sortBy?: string;
  limit?: number;
  confidence: number;
  naturalRephrasing: string;
}

export interface ParsedFilter {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'between' | 'in';
  value: any;
  displayText: string;
}

export interface ConversationalSearchProps {
  onSearch?: (query: string, parsed: ParsedQuery) => void;
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

// Example natural language query patterns
const QUERY_SUGGESTIONS = [
  'Clients who haven\'t been contacted in 30 days',
  'High net worth households with upcoming birthdays',
  'Tasks due this week that are high priority',
  'Meetings scheduled for next month',
  'Clients with AUM over $1M who haven\'t met in 6 months',
  'Prospects in the pipeline for more than 90 days',
  'Documents expiring in the next 30 days',
  'Clients at risk of leaving',
  'Top 10 clients by AUM growth this year',
  'Households with no recent activity',
];

// Pattern matchers for natural language parsing
const QUERY_PATTERNS = {
  timePatterns: {
    'in the last (\\d+) days?': (n: number) => ({ operator: 'gte', value: new Date(Date.now() - n * 86400000) }),
    'in (\\d+) days?': (n: number) => ({ operator: 'lte', value: new Date(Date.now() + n * 86400000) }),
    'this week': () => ({ operator: 'between', value: [startOfWeek(), endOfWeek()] }),
    'next week': () => ({ operator: 'between', value: [startOfNextWeek(), endOfNextWeek()] }),
    'this month': () => ({ operator: 'between', value: [startOfMonth(), endOfMonth()] }),
    'next month': () => ({ operator: 'between', value: [startOfNextMonth(), endOfNextMonth()] }),
    'haven\'t been contacted in (\\d+) days?': (n: number) => ({ field: 'lastContact', operator: 'lte', value: new Date(Date.now() - n * 86400000) }),
    'more than (\\d+) days?': (n: number) => ({ operator: 'gte', value: n }),
    'less than (\\d+) days?': (n: number) => ({ operator: 'lte', value: n }),
  },
  amountPatterns: {
    'over \\$(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)(k|m|b)?': parseAmount,
    'under \\$(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)(k|m|b)?': parseAmountUnder,
    'more than \\$(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)(k|m|b)?': parseAmount,
    'at least \\$(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)(k|m|b)?': parseAmount,
    'between \\$(\\d+(?:,\\d{3})*)(k|m|b)? and \\$(\\d+(?:,\\d{3})*)(k|m|b)?': parseAmountRange,
    'aum (over|under|above|below) \\$(\\d+(?:,\\d{3})*)(k|m|b)?': parseAumFilter,
  },
  priorityPatterns: {
    'high priority': { field: 'priority', operator: 'eq', value: 'high' },
    'urgent': { field: 'priority', operator: 'eq', value: 'high' },
    'low priority': { field: 'priority', operator: 'eq', value: 'low' },
    'medium priority': { field: 'priority', operator: 'eq', value: 'medium' },
  },
  statusPatterns: {
    'at risk': { field: 'riskStatus', operator: 'eq', value: 'at_risk' },
    'inactive': { field: 'status', operator: 'eq', value: 'inactive' },
    'active': { field: 'status', operator: 'eq', value: 'active' },
    'pending': { field: 'status', operator: 'eq', value: 'pending' },
    'completed': { field: 'status', operator: 'eq', value: 'completed' },
    'overdue': { field: 'status', operator: 'eq', value: 'overdue' },
  },
  sortPatterns: {
    'top (\\d+)': (n: number) => ({ sortBy: 'desc', limit: n }),
    'bottom (\\d+)': (n: number) => ({ sortBy: 'asc', limit: n }),
    'sorted by (\\w+)': (field: string) => ({ sortBy: field }),
    'ordered by (\\w+)': (field: string) => ({ sortBy: field }),
  },
};

// Helper functions
function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  return new Date(d.setDate(d.getDate() - day));
}

function endOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  return new Date(d.setDate(d.getDate() + (6 - day)));
}

function startOfNextWeek(): Date {
  const d = endOfWeek();
  return new Date(d.setDate(d.getDate() + 1));
}

function endOfNextWeek(): Date {
  const d = startOfNextWeek();
  return new Date(d.setDate(d.getDate() + 6));
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfNextMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function endOfNextMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 2, 0);
}

function parseAmount(amount: string, suffix?: string): ParsedFilter {
  let num = parseFloat(amount.replace(/,/g, ''));
  if (suffix === 'k' || suffix === 'K') num *= 1000;
  if (suffix === 'm' || suffix === 'M') num *= 1000000;
  if (suffix === 'b' || suffix === 'B') num *= 1000000000;
  return {
    field: 'aum',
    operator: 'gte',
    value: num,
    displayText: `AUM ≥ ${formatCurrency(num)}`,
  };
}

function parseAmountUnder(amount: string, suffix?: string): ParsedFilter {
  let num = parseFloat(amount.replace(/,/g, ''));
  if (suffix === 'k' || suffix === 'K') num *= 1000;
  if (suffix === 'm' || suffix === 'M') num *= 1000000;
  if (suffix === 'b' || suffix === 'B') num *= 1000000000;
  return {
    field: 'aum',
    operator: 'lte',
    value: num,
    displayText: `AUM ≤ ${formatCurrency(num)}`,
  };
}

function parseAmountRange(min: string, minSuffix: string, max: string, maxSuffix: string): ParsedFilter {
  let minNum = parseFloat(min.replace(/,/g, ''));
  let maxNum = parseFloat(max.replace(/,/g, ''));
  if (minSuffix === 'k' || minSuffix === 'K') minNum *= 1000;
  if (minSuffix === 'm' || minSuffix === 'M') minNum *= 1000000;
  if (maxSuffix === 'k' || maxSuffix === 'K') maxNum *= 1000;
  if (maxSuffix === 'm' || maxSuffix === 'M') maxNum *= 1000000;
  return {
    field: 'aum',
    operator: 'between',
    value: [minNum, maxNum],
    displayText: `AUM between ${formatCurrency(minNum)} and ${formatCurrency(maxNum)}`,
  };
}

function parseAumFilter(comparison: string, amount: string, suffix?: string): ParsedFilter {
  const filter = comparison.includes('under') || comparison.includes('below')
    ? parseAmountUnder(amount, suffix)
    : parseAmount(amount, suffix);
  return filter;
}

// Main query parser
function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase().trim();
  const filters: ParsedFilter[] = [];
  let confidence = 0;
  let entityType: ParsedQuery['entityType'] = 'clients';
  let intent: ParsedQuery['intent'] = 'find';

  // Detect entity type
  if (lowerQuery.includes('client') || lowerQuery.includes('contact')) {
    entityType = 'clients';
    confidence += 15;
  } else if (lowerQuery.includes('household') || lowerQuery.includes('family')) {
    entityType = 'households';
    confidence += 15;
  } else if (lowerQuery.includes('task') || lowerQuery.includes('todo') || lowerQuery.includes('due')) {
    entityType = 'tasks';
    confidence += 15;
  } else if (lowerQuery.includes('meeting') || lowerQuery.includes('appointment') || lowerQuery.includes('scheduled')) {
    entityType = 'meetings';
    confidence += 15;
  } else if (lowerQuery.includes('document') || lowerQuery.includes('file')) {
    entityType = 'documents';
    confidence += 15;
  } else if (lowerQuery.includes('prospect') || lowerQuery.includes('opportunity') || lowerQuery.includes('pipeline')) {
    entityType = 'opportunities';
    confidence += 15;
  }

  // Detect intent
  if (lowerQuery.startsWith('find') || lowerQuery.startsWith('show') || lowerQuery.startsWith('list') || lowerQuery.startsWith('get')) {
    intent = 'find';
    confidence += 10;
  } else if (lowerQuery.includes('analyze') || lowerQuery.includes('analysis')) {
    intent = 'analyze';
    confidence += 10;
  } else if (lowerQuery.includes('compare')) {
    intent = 'compare';
    confidence += 10;
  } else if (lowerQuery.includes('schedule') || lowerQuery.includes('book')) {
    intent = 'schedule';
    confidence += 10;
  }

  // Parse time-based filters
  const timeMatch = lowerQuery.match(/haven't been contacted in (\d+) days?/i);
  if (timeMatch) {
    const days = parseInt(timeMatch[1]);
    filters.push({
      field: 'lastContact',
      operator: 'lte',
      value: new Date(Date.now() - days * 86400000).toISOString(),
      displayText: `No contact in ${days}+ days`,
    });
    confidence += 20;
  }

  // Parse AUM filters
  const aumMatch = lowerQuery.match(/(?:aum\s+)?(?:over|above|more than)\s+\$?([\d,]+)(k|m|b)?/i);
  if (aumMatch) {
    const filter = parseAmount(aumMatch[1], aumMatch[2]);
    filters.push(filter);
    confidence += 20;
  }

  const aumUnderMatch = lowerQuery.match(/(?:aum\s+)?(?:under|below|less than)\s+\$?([\d,]+)(k|m|b)?/i);
  if (aumUnderMatch) {
    const filter = parseAmountUnder(aumUnderMatch[1], aumUnderMatch[2]);
    filters.push(filter);
    confidence += 20;
  }

  // Parse priority
  if (lowerQuery.includes('high priority') || lowerQuery.includes('urgent')) {
    filters.push({
      field: 'priority',
      operator: 'eq',
      value: 'high',
      displayText: 'High priority',
    });
    confidence += 10;
  }

  // Parse status
  if (lowerQuery.includes('at risk')) {
    filters.push({
      field: 'riskStatus',
      operator: 'eq',
      value: 'at_risk',
      displayText: 'At risk',
    });
    confidence += 15;
  }

  if (lowerQuery.includes('this week')) {
    filters.push({
      field: 'dueDate',
      operator: 'between',
      value: [startOfWeek().toISOString(), endOfWeek().toISOString()],
      displayText: 'Due this week',
    });
    confidence += 15;
  }

  if (lowerQuery.includes('upcoming birthday')) {
    filters.push({
      field: 'upcomingBirthday',
      operator: 'eq',
      value: true,
      displayText: 'Birthday in next 30 days',
    });
    confidence += 15;
  }

  // Parse top N
  const topMatch = lowerQuery.match(/top (\d+)/i);
  let limit: number | undefined;
  let sortBy: string | undefined;
  if (topMatch) {
    limit = parseInt(topMatch[1]);
    sortBy = 'desc';
    confidence += 10;
  }

  // Ensure minimum confidence
  confidence = Math.min(100, Math.max(confidence, query.length > 5 ? 30 : 10));

  // Generate natural rephrasing
  let rephrasing = `Searching for ${entityType}`;
  if (filters.length > 0) {
    rephrasing += ' where ' + filters.map(f => f.displayText.toLowerCase()).join(' and ');
  }
  if (limit) {
    rephrasing = `Top ${limit} ${entityType}` + (filters.length ? ' where ' + filters.map(f => f.displayText.toLowerCase()).join(' and ') : '');
  }

  return {
    intent,
    entityType,
    filters,
    sortBy,
    limit,
    confidence,
    naturalRephrasing: rephrasing,
  };
}

// Generate mock results based on parsed query
function generateMockResults(parsed: ParsedQuery): SearchResult[] {
  const results: SearchResult[] = [];
  const count = parsed.limit || 5;

  for (let i = 0; i < count; i++) {
    if (parsed.entityType === 'clients') {
      results.push({
        id: `client-${i}`,
        type: 'client',
        title: ['Sarah Johnson', 'Michael Chen', 'Emily Williams', 'James Rodriguez', 'Amanda Lee'][i % 5],
        subtitle: `Last contact: ${30 + i * 5} days ago • AUM: ${formatCurrency(1500000 - i * 200000)}`,
        relevanceScore: 95 - i * 5,
        metadata: {
          aum: 1500000 - i * 200000,
          lastContact: new Date(Date.now() - (30 + i * 5) * 86400000).toISOString(),
          riskStatus: i < 2 ? 'at_risk' : 'normal',
        },
      });
    } else if (parsed.entityType === 'tasks') {
      results.push({
        id: `task-${i}`,
        type: 'task',
        title: ['Review portfolio allocation', 'Follow up on proposal', 'Schedule quarterly meeting', 'Send compliance docs', 'Update beneficiaries'][i % 5],
        subtitle: `Due: ${formatDate(new Date(Date.now() + i * 86400000).toISOString())} • ${['High', 'Medium', 'Low'][i % 3]} priority`,
        relevanceScore: 95 - i * 5,
        metadata: {
          dueDate: new Date(Date.now() + i * 86400000).toISOString(),
          priority: ['high', 'medium', 'low'][i % 3],
        },
      });
    } else if (parsed.entityType === 'meetings') {
      results.push({
        id: `meeting-${i}`,
        type: 'meeting',
        title: ['Portfolio Review - Johnson', 'New Client Intake', 'Quarterly Check-in', 'Estate Planning Discussion', 'Risk Assessment'][i % 5],
        subtitle: `${formatDate(new Date(Date.now() + (i + 1) * 86400000 * 7).toISOString())} • 1 hour`,
        relevanceScore: 95 - i * 5,
      });
    }
  }

  return results;
}

const entityIcons: Record<SearchResult['type'], React.ReactNode> = {
  client: <UserGroupIcon className="w-4 h-4" />,
  household: <UserGroupIcon className="w-4 h-4" />,
  task: <CheckCircleIcon className="w-4 h-4" />,
  meeting: <CalendarIcon className="w-4 h-4" />,
  document: <DocumentTextIcon className="w-4 h-4" />,
  opportunity: <ArrowTrendingUpIcon className="w-4 h-4" />,
};

export function ConversationalSearch({
  onSearch,
  onResultSelect,
  placeholder = 'Ask anything... "clients not contacted in 30 days with AUM over $1M"',
  className,
  autoFocus = false,
  showSuggestions = true,
}: ConversationalSearchProps) {
  const [query, setQuery] = useState('');
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Parse query in real-time
  useEffect(() => {
    if (query.length > 2) {
      const parsed = parseNaturalLanguageQuery(query);
      setParsed(parsed);
    } else {
      setParsed(null);
    }
  }, [query]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!query.trim() || !parsed) return;

    setIsSearching(true);
    setShowResults(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResults = generateMockResults(parsed);
    setResults(mockResults);
    setIsSearching(false);

    onSearch?.(query, parsed);
  }, [query, parsed, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        onResultSelect?.(results[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }, [results, selectedIndex, handleSearch, onResultSelect]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SparklesIcon className="h-5 w-5 text-amber-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full pl-12 pr-24 py-4 rounded-xl border-2 text-lg',
            'bg-surface border-border-default',
            'focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20',
            'placeholder:text-content-tertiary transition-all',
            parsed && parsed.confidence > 50 && 'border-green-500/50'
          )}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setParsed(null);
                setResults([]);
                setShowResults(false);
              }}
              className="p-1 rounded-full hover:bg-surface-secondary text-content-tertiary"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Query Understanding Feedback */}
      <AnimatePresence>
        {parsed && parsed.confidence > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 px-4"
          >
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                parsed.confidence >= 70 
                  ? 'bg-green-500/10 text-green-600' 
                  : parsed.confidence >= 40 
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-red-500/10 text-red-600'
              )}>
                <SparklesIcon className="w-3 h-3" />
                {parsed.confidence}% understood
              </div>
              <span className="text-content-secondary">{parsed.naturalRephrasing}</span>
            </div>
            {parsed.filters.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <FunnelIcon className="w-4 h-4 text-content-tertiary" />
                {parsed.filters.map((filter, i) => (
                  <Badge key={i} variant="info" size="sm">
                    {filter.displayText}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (results.length > 0 || isSearching) && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="overflow-hidden shadow-xl border-2 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-content-secondary">Searching...</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 bg-surface-secondary border-b border-border text-xs font-medium text-content-tertiary flex items-center justify-between">
                    <span>{results.length} results found</span>
                    <span>Press Enter to select, ↑↓ to navigate</span>
                  </div>
                  {results.map((result, i) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onResultSelect?.(result)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                        'hover:bg-surface-secondary',
                        selectedIndex === i && 'bg-accent-primary/10'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        result.type === 'client' && 'bg-blue-500/10 text-blue-500',
                        result.type === 'task' && 'bg-green-500/10 text-green-500',
                        result.type === 'meeting' && 'bg-purple-500/10 text-purple-500',
                        result.type === 'opportunity' && 'bg-amber-500/10 text-amber-500'
                      )}>
                        {entityIcons[result.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-content-primary truncate">{result.title}</p>
                        <p className="text-sm text-content-secondary truncate">{result.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm">{result.relevanceScore}%</Badge>
                        <ArrowRightIcon className="w-4 h-4 text-content-tertiary" />
                      </div>
                    </motion.button>
                  ))}
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      {showSuggestions && !query && (
        <div className="mt-4">
          <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-2 flex items-center gap-1">
            <LightBulbIcon className="w-3 h-3" />
            Try asking...
          </p>
          <div className="flex flex-wrap gap-2">
            {QUERY_SUGGESTIONS.slice(0, 6).map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm',
                  'bg-surface-secondary hover:bg-surface-tertiary',
                  'text-content-secondary hover:text-content-primary',
                  'transition-colors'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quick Search Bar - Compact version for headers
 */
export function QuickSearchBar({ 
  className,
  onExpand,
}: { 
  className?: string;
  onExpand?: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-surface-secondary hover:bg-surface-tertiary',
        'text-content-tertiary hover:text-content-secondary',
        'transition-all group',
        className
      )}
    >
      <SparklesIcon className="w-4 h-4 text-amber-500" />
      <span className="text-sm">Ask anything...</span>
      <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-xs text-content-tertiary">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
