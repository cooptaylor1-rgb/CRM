import * as React from 'react';
import { cn } from './utils';

/**
 * Skeleton Components
 * 
 * Loading placeholders that match the shape of content.
 * Use to prevent layout shift during loading states.
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pulse animation */
  animate?: boolean;
}

export function Skeleton({ className, animate = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-neutral-200 rounded',
        animate && 'animate-skeleton',
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonText - Text placeholder
 */
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card placeholder
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-surface rounded-lg border border-border p-5 space-y-4', className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * SkeletonTable - Table rows placeholder
 */
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn('h-4 flex-1', colIndex === 0 && 'w-40')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Circular avatar placeholder
 */
export interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton className={cn('rounded-full', sizes[size], className)} />;
}

/**
 * SkeletonDashboard - Full dashboard skeleton
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <SkeletonTable rows={4} columns={3} />
        </div>

        {/* Right column */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-md">
                <SkeletonAvatar size="sm" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
