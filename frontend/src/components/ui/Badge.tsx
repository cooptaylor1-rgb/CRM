import * as React from 'react';
import { cn } from './utils';

/**
 * Badge/StatusPill Component
 * 
 * For displaying status, labels, and counts.
 * Uses muted semantic colors for a professional appearance.
 */

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Optional dot indicator */
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-tertiary text-content-secondary border-border-secondary',
  secondary: 'bg-surface-tertiary text-content-secondary border-border-secondary',
  success: 'bg-status-success-bg text-status-success-text border-status-success-border',
  warning: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
  error: 'bg-status-error-bg text-status-error-text border-status-error-border',
  info: 'bg-status-info-bg text-status-info-text border-status-info-border',
};

const badgeSizes: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-sm',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-400',
  secondary: 'bg-neutral-400',
  success: 'bg-status-success-text',
  warning: 'bg-status-warning-text',
  error: 'bg-status-error-text',
  info: 'bg-status-info-text',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded border',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * StatusBadge - Pre-configured badges for common statuses
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'pending' | 'overdue' | 'expired' | 'completed' | 'draft' | 'verified' | 'success' | 'warning' | 'error' | 'info' | 'default';
  label?: string;
}

const statusConfig: Record<StatusBadgeProps['status'], { variant: BadgeVariant; defaultLabel: string }> = {
  active: { variant: 'success', defaultLabel: 'Active' },
  pending: { variant: 'warning', defaultLabel: 'Pending' },
  overdue: { variant: 'error', defaultLabel: 'Overdue' },
  expired: { variant: 'error', defaultLabel: 'Expired' },
  completed: { variant: 'success', defaultLabel: 'Completed' },
  draft: { variant: 'default', defaultLabel: 'Draft' },
  verified: { variant: 'success', defaultLabel: 'Verified' },
  // Direct variant mappings
  success: { variant: 'success', defaultLabel: 'Success' },
  warning: { variant: 'warning', defaultLabel: 'Warning' },
  error: { variant: 'error', defaultLabel: 'Error' },
  info: { variant: 'info', defaultLabel: 'Info' },
  default: { variant: 'default', defaultLabel: '' },
};

export function StatusBadge({ status, label, children, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot {...props}>
      {children || label || config.defaultLabel}
    </Badge>
  );
}

/**
 * CountBadge - For displaying counts (notifications, items, etc.)
 */
export interface CountBadgeProps extends Omit<BadgeProps, 'dot'> {
  count: number;
  max?: number;
}

export function CountBadge({ count, max = 99, variant = 'default', ...props }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString();
  return (
    <Badge variant={variant} size="sm" {...props}>
      {displayCount}
    </Badge>
  );
}
