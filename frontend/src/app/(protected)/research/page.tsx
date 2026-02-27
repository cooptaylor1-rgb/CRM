'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResearchTag {
  id: string;
  name: string;
  color?: string;
}

interface ResearchSecurity {
  id: string;
  ticker: string;
  name: string;
  sentiment: number | null;
}

interface ResearchSource {
  id: string;
  name: string;
  sourceType: string;
}

interface ResearchItem {
  id: string;
  title: string;
  author?: string;
  summary?: string;
  publishedAt?: string;
  ingestedAt: string;
  status: string;
  source?: ResearchSource;
  tags: ResearchTag[];
  securities: ResearchSecurity[];
  extractedTickers: string[];
  sentimentScores: Record<string, number>;
}

interface PaginatedResponse {
  data: ResearchItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// Sentiment badge helper
// ---------------------------------------------------------------------------

function SentimentBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  if (score > 0.2)
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Bullish
      </span>
    );
  if (score < -0.2)
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Bearish
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
      Neutral
    </span>
  );
}

// ---------------------------------------------------------------------------
// Research Item Card
// ---------------------------------------------------------------------------

function ResearchCard({
  item,
  onAction,
}: {
  item: ResearchItem;
  onAction: (id: string, action: 'bookmarked' | 'shared' | 'read') => Promise<void>;
}) {
  const date = item.publishedAt ?? item.ingestedAt;
  const dominantSentiment =
    item.securities.length > 0
      ? item.securities.reduce(
          (avg, s) => avg + (s.sentiment ?? 0),
          0,
        ) / item.securities.length
      : null;

  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-gray-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/research/${item.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors"
          >
            {item.title}
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            {item.source && (
              <span className="font-medium text-gray-700">{item.source.name}</span>
            )}
            {item.source && <span aria-hidden>·</span>}
            {item.author && <span>{item.author}</span>}
            {item.author && <span aria-hidden>·</span>}
            <time dateTime={date}>{formatDistanceToNow(new Date(date), { addSuffix: true })}</time>
          </div>
        </div>
        <SentimentBadge score={dominantSentiment} />
      </div>

      {/* AI Summary */}
      {item.summary && (
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{item.summary}</p>
      )}

      {/* Securities */}
      {item.securities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.securities.slice(0, 5).map((sec) => (
            <span
              key={sec.id}
              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-medium text-blue-700"
            >
              {sec.ticker}
              <SentimentBadge score={sec.sentiment} />
            </span>
          ))}
          {item.securities.length > 5 && (
            <span className="text-xs text-gray-400">+{item.securities.length - 5} more</span>
          )}
        </div>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
              style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => onAction(item.id, 'bookmarked')}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          aria-label="Bookmark"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Bookmark
        </button>
        <button
          onClick={() => onAction(item.id, 'shared')}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          aria-label="Share"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
        <button
          onClick={() => onAction(item.id, 'read')}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          aria-label="Mark as read"
        >
          Mark read
        </button>
        <Link
          href={`/research/${item.id}`}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          onClick={() => onAction(item.id, 'read')}
        >
          Read more
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Filter sidebar
// ---------------------------------------------------------------------------

interface FilterSidebarProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

function FilterSidebar({ filters, onChange, onClear }: FilterSidebarProps) {
  return (
    <aside className="w-64 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <button onClick={onClear} className="text-xs text-blue-600 hover:underline">
          Clear all
        </button>
      </div>

      {/* Source Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Source Type</label>
        <select
          value={filters.sourceType ?? ''}
          onChange={(e) => onChange('sourceType', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          <option value="email">Email</option>
          <option value="rss">RSS</option>
          <option value="manual">Manual</option>
          <option value="upload">Upload</option>
          <option value="api">API</option>
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Date From</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange('dateFrom', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Date To</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange('dateTo', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
        <select
          value={filters.status ?? ''}
          onChange={(e) => onChange('status', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// New Research Toast
// ---------------------------------------------------------------------------

function NewResearchToast({
  count,
  onDismiss,
  onRefresh,
}: {
  count: number;
  onDismiss: () => void;
  onRefresh: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-blue-600 px-5 py-3 text-sm text-white shadow-lg">
      <span>
        {count} new research item{count > 1 ? 's' : ''} available
      </span>
      <button onClick={onRefresh} className="font-semibold underline underline-offset-2 hover:no-underline">
        Refresh
      </button>
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ResearchPage() {
  const supabase = createClientComponentClient();

  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [newItemCount, setNewItemCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'feed'>('all');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Build query params
  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      return params.toString();
    },
    [debouncedSearch, filters],
  );

  // Fetch research items
  const fetchItems = useCallback(
    async (pageNum: number, replace: boolean) => {
      try {
        if (replace) setLoading(true);
        else setLoadingMore(true);

        const endpoint = activeTab === 'feed' ? '/api/research/feed' : '/api/research';
        const res = await fetch(`${endpoint}?${buildParams(pageNum)}`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: PaginatedResponse = await res.json();
        setItems((prev) => (replace ? json.data : [...prev, ...json.data]));
        setTotal(json.meta.total);
        setHasMore(pageNum < json.meta.totalPages);
      } catch (err) {
        console.error('Failed to fetch research items', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, buildParams],
  );

  // Initial load + reset on filter change
  useEffect(() => {
    setPage(1);
    setNewItemCount(0);
    fetchItems(1, true);
  }, [debouncedSearch, filters, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchItems(nextPage, false);
        }
      },
      { rootMargin: '200px' },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, fetchItems]);

  // Supabase Realtime subscription for new research items
  useEffect(() => {
    const channel = supabase
      .channel('research-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'research_items' },
        () => {
          setNewItemCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Action handler
  const handleAction = useCallback(
    async (id: string, actionType: 'bookmarked' | 'shared' | 'read') => {
      try {
        await fetch(`/api/research/${id}/actions`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType }),
        });
      } catch (err) {
        console.error('Failed to track action', err);
      }
    },
    [],
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleRefreshNew = () => {
    setNewItemCount(0);
    setPage(1);
    fetchItems(1, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New items toast */}
      <NewResearchToast
        count={newItemCount}
        onDismiss={() => setNewItemCount(0)}
        onRefresh={handleRefreshNew}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Research Feed</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-processed research from your team’s forwarded emails and connected sources
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 border-b border-gray-200">
          {(['all', 'feed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? 'All Research' : 'My Feed'}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {total > 0 && `${total.toLocaleString()} items`}
          </span>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Search bar */}
            <div className="mb-6 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search research by title, content, ticker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Items grid */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 h-48" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20">
                <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">No research items found</p>
                <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or forwarding research emails.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <ResearchCard key={item.id} item={item} onAction={handleAction} />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="mt-6 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Loading more...
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <p className="text-xs text-gray-400">You’ve reached the end</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
