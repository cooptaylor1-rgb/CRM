import * as React from 'react';
import { cn } from './utils';
import { Button } from './Button';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * ErrorState - Graceful error display with retry functionality
 * 
 * Use this to display errors in a user-friendly way with actionable retry.
 * Supports different variants for different error severities.
 */

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error description or message */
  message?: string;
  /** Retry callback - shows retry button when provided */
  onRetry?: () => void;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Style variant */
  variant?: 'default' | 'inline' | 'compact';
  /** Additional CSS classes */
  className?: string;
  /** Show technical details for debugging */
  details?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this data. Please try again.',
  onRetry,
  icon,
  variant = 'default',
  className,
  details,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 bg-status-error-bg rounded-md text-sm',
        className
      )}>
        <ExclamationTriangleIcon className="w-4 h-4 text-status-error-text flex-shrink-0" />
        <span className="text-status-error-text">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-status-error-text hover:text-status-error-text/80 underline text-sm"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center justify-between p-4 bg-status-error-bg border border-status-error rounded-lg',
        className
      )}>
        <div className="flex items-center gap-3">
          {icon || <ExclamationTriangleIcon className="w-5 h-5 text-status-error-text" />}
          <div>
            <p className="font-medium text-status-error-text">{title}</p>
            <p className="text-sm text-status-error-text/80">{message}</p>
          </div>
        </div>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Default full-page error state
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-4',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-status-error-bg flex items-center justify-center mb-6">
        {icon || <ExclamationTriangleIcon className="w-8 h-8 text-status-error-text" />}
      </div>
      
      <h3 className="text-lg font-semibold text-content-primary mb-2">{title}</h3>
      <p className="text-content-secondary text-center max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          leftIcon={<ArrowPathIcon className="w-4 h-4" />}
        >
          Try Again
        </Button>
      )}

      {details && (
        <div className="mt-6 w-full max-w-md">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-content-tertiary hover:text-content-secondary underline"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-surface-secondary rounded-md text-xs text-content-tertiary overflow-auto max-h-32">
              {details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * DataFreshness - Shows when data was last updated
 * 
 * Builds trust by showing users when data was refreshed.
 */
export interface DataFreshnessProps {
  /** Last updated timestamp */
  lastUpdated?: Date | string | null;
  /** Manual refresh callback */
  onRefresh?: () => void;
  /** Is currently refreshing */
  isRefreshing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function DataFreshness({
  lastUpdated,
  onRefresh,
  isRefreshing,
  className,
}: DataFreshnessProps) {
  const formatRelativeTime = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className={cn(
      'flex items-center gap-2 text-xs text-content-tertiary',
      className
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
      )} />
      <span>
        {isRefreshing 
          ? 'Updating...' 
          : lastUpdated 
            ? `Updated ${formatRelativeTime(lastUpdated)}`
            : 'Live'
        }
      </span>
      {onRefresh && !isRefreshing && (
        <button
          onClick={onRefresh}
          className="hover:text-content-secondary transition-colors"
          title="Refresh data"
        >
          <ArrowPathIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
