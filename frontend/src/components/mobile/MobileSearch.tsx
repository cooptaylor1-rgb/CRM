'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  FolderIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'household' | 'account' | 'document' | 'task' | 'meeting' | 'person';
  title: string;
  subtitle?: string;
  href: string;
}

const typeConfig: Record<SearchResult['type'], { icon: React.ElementType; color: string }> = {
  household: { icon: UserGroupIcon, color: 'text-blue-500' },
  account: { icon: FolderIcon, color: 'text-green-500' },
  document: { icon: DocumentTextIcon, color: 'text-amber-500' },
  task: { icon: ClockIcon, color: 'text-purple-500' },
  meeting: { icon: CalendarIcon, color: 'text-pink-500' },
  person: { icon: UserGroupIcon, color: 'text-cyan-500' },
};

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

export function MobileSearch({
  isOpen,
  onClose,
  onSearch,
  recentSearches = [],
  onClearRecent,
}: MobileSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Clear state when closed
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        if (onSearch) {
          const searchResults = await onSearch(query);
          setResults(searchResults);
        } else {
          // Mock search results
          setResults([
            { id: '1', type: 'household', title: 'Anderson Family', subtitle: '$12.5M AUM', href: '/households/1' },
            { id: '2', type: 'account', title: 'Anderson IRA', subtitle: 'Traditional IRA • $2.1M', href: '/accounts/1' },
            { id: '3', type: 'document', title: 'Anderson IMA 2024', subtitle: 'Investment Management Agreement', href: '/documents/1' },
          ].filter(r => r.title.toLowerCase().includes(query.toLowerCase())));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, onSearch]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    // Navigation handled by Link
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        {/* Search panel */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 -translate-y-full"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-full"
        >
          <Dialog.Panel className="fixed inset-x-0 top-0 bg-surface-primary safe-area-top rounded-b-2xl shadow-xl max-h-[85vh] overflow-hidden">
            {/* Search input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search clients, accounts, documents..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-secondary rounded-xl text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-tertiary"
                  >
                    <XMarkIcon className="w-4 h-4 text-content-tertiary" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-content-secondary mt-2">Searching...</p>
                </div>
              ) : query && results.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                    Results
                  </p>
                  {results.map((result) => {
                    const config = typeConfig[result.type];
                    return (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary active:bg-surface-tertiary transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                          <config.icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-content-secondary truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-content-tertiary" />
                      </Link>
                    );
                  })}
                </div>
              ) : query && results.length === 0 ? (
                <div className="p-8 text-center">
                  <MagnifyingGlassIcon className="w-12 h-12 text-content-tertiary mx-auto mb-2" />
                  <p className="text-sm text-content-secondary">No results found</p>
                  <p className="text-xs text-content-tertiary mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="py-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
                      Recent Searches
                    </p>
                    {onClearRecent && (
                      <button
                        onClick={onClearRecent}
                        className="text-xs text-accent-primary"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-secondary active:bg-surface-tertiary transition-colors text-left"
                    >
                      <ClockIcon className="w-5 h-5 text-content-tertiary" />
                      <span className="text-sm text-content-secondary">{search}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MagnifyingGlassIcon className="w-12 h-12 text-content-tertiary mx-auto mb-2" />
                  <p className="text-sm text-content-secondary">
                    Start typing to search
                  </p>
                </div>
              )}
            </div>

            {/* Cancel button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={onClose}
                className="w-full py-3 text-sm font-medium text-content-secondary bg-surface-secondary rounded-xl active:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
