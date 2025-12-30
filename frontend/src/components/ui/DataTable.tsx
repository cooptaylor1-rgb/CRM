'use client';

import * as React from 'react';
import { cn } from './utils';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';

/**
 * DataTable Component
 * 
 * Full-featured data table with sorting, filtering, and pagination.
 * Designed for large datasets with virtualization-ready architecture.
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  /** Unique column ID */
  id: string;
  /** Header display text */
  header: string;
  /** Access data value */
  accessorKey?: keyof T;
  /** Custom accessor function */
  accessorFn?: (row: T) => unknown;
  /** Cell renderer */
  cell?: (props: { value: unknown; row: T; index: number }) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Min width */
  minWidth?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Sticky column */
  sticky?: 'left' | 'right';
  /** Hide on mobile */
  hiddenOnMobile?: boolean;
}

export interface DataTableProps<T extends { id: string | number }> {
  /** Data array */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row IDs */
  selectedIds?: Set<string | number>;
  /** Selection change handler */
  onSelectionChange?: (ids: Set<string | number>) => void;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Pagination */
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  /** Enable search */
  searchable?: boolean;
  /** Search value */
  searchValue?: string;
  /** Search handler */
  onSearchChange?: (value: string) => void;
  /** Sort state */
  sortState?: { column: string; direction: SortDirection };
  /** Sort change handler */
  onSortChange?: (column: string, direction: SortDirection) => void;
  /** Compact variant */
  compact?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrollable */
  maxHeight?: string;
  /** Custom class */
  className?: string;
  /** Custom row class */
  rowClassName?: (row: T, index: number) => string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  selectable = false,
  selectedIds,
  onSelectionChange,
  onRowClick,
  loading = false,
  emptyState,
  pagination,
  searchable = false,
  searchValue = '',
  onSearchChange,
  sortState,
  onSortChange,
  compact = false,
  striped = false,
  stickyHeader = false,
  maxHeight,
  className,
  rowClassName,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds?.size === data.length;
  const someSelected = selectedIds && selectedIds.size > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map((row) => row.id)));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange?.(newSelected);
  };

  const handleSort = (columnId: string) => {
    if (!onSortChange) return;

    let newDirection: SortDirection = 'asc';
    if (sortState?.column === columnId) {
      if (sortState.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortState.direction === 'desc') {
        newDirection = null;
      }
    }
    onSortChange(columnId, newDirection);
  };

  const getCellValue = (row: T, column: Column<T>): unknown => {
    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return null;
  };

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      {(searchable || pagination) && (
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          {searchable && (
            <div className="relative max-w-sm flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-2 text-sm rounded-md',
                  'bg-surface border border-border-input',
                  'text-content-primary placeholder:text-content-tertiary',
                  'focus:outline-none focus:ring-2 focus:ring-border-focus/20 focus:border-border-focus',
                  'transition-colors duration-fast'
                )}
              />
            </div>
          )}

          {/* Selection info */}
          {selectable && selectedIds && selectedIds.size > 0 && (
            <span className="text-sm text-content-secondary">
              {selectedIds.size} selected
            </span>
          )}

          {/* Page size */}
          {pagination?.onPageSizeChange && (
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
              className={cn(
                'px-3 py-2 text-sm rounded-md',
                'bg-surface border border-border-input',
                'text-content-primary',
                'focus:outline-none focus:ring-2 focus:ring-border-focus/20'
              )}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Table */}
      <div
        className={cn(
          'overflow-auto border border-border rounded-lg',
          maxHeight && 'max-h-[var(--table-max-height)]'
        )}
        style={{ '--table-max-height': maxHeight } as React.CSSProperties}
      >
        <table className="w-full border-collapse">
          <thead
            className={cn(
              'bg-surface-secondary/50',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {/* Select all checkbox */}
              {selectable && (
                <th className={cn('w-10', headerPadding)}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !!someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-border-input text-accent-600 focus:ring-accent-500"
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'text-xs font-semibold text-content-secondary uppercase tracking-wider',
                    'text-left border-b border-border',
                    headerPadding,
                    column.hiddenOnMobile && 'hidden md:table-cell',
                    column.sortable && 'cursor-pointer select-none hover:bg-surface-secondary/80',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.header}
                    {column.sortable && (
                      <span className="ml-1">
                        {sortState?.column === column.id ? (
                          sortState.direction === 'asc' ? (
                            <ChevronUpIcon className="w-4 h-4 text-accent-600" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-accent-600" />
                          )
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4 text-content-tertiary" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-surface divide-y divide-border">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className={cellPadding}>
                      <div className="w-4 h-4 bg-surface-secondary rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.id} className={cn(cellPadding, col.hiddenOnMobile && 'hidden md:table-cell')}>
                      <div className="h-4 bg-surface-secondary rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-16 text-center"
                >
                  {emptyState || (
                    <div className="text-content-tertiary">
                      <p className="text-sm">No data available</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors duration-fast',
                    onRowClick && 'cursor-pointer',
                    striped && index % 2 === 1 && 'bg-surface-secondary/30',
                    selectedIds?.has(row.id) && 'bg-accent-50/50 dark:bg-accent-950/30',
                    onRowClick && 'hover:bg-surface-secondary',
                    rowClassName?.(row, index)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Row checkbox */}
                  {selectable && (
                    <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(row.id) ?? false}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-border-input text-accent-600 focus:ring-accent-500"
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {columns.map((column) => {
                    const value = getCellValue(row, column);
                    return (
                      <td
                        key={column.id}
                        className={cn(
                          'text-sm text-content-primary',
                          cellPadding,
                          column.hiddenOnMobile && 'hidden md:table-cell',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.cell
                          ? column.cell({ value, row, index })
                          : String(value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

/**
 * Pagination Component
 */

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-content-secondary">
        Showing <span className="font-medium text-content-primary">{startItem}</span> to{' '}
        <span className="font-medium text-content-primary">{endItem}</span> of{' '}
        <span className="font-medium text-content-primary">{totalItems.toLocaleString()}</span> results
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className={cn(
            'p-2 rounded-md transition-colors duration-fast',
            canGoPrev
              ? 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              : 'text-content-tertiary cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-content-tertiary">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[2rem] h-8 px-2 rounded-md transition-colors duration-fast',
                page === currentPage
                  ? 'bg-accent-600 text-white'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={cn(
            'p-2 rounded-md transition-colors duration-fast',
            canGoNext
              ? 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              : 'text-content-tertiary cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}
