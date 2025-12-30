import * as React from 'react';
import { cn } from './utils';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Callout Component
 * 
 * For displaying alerts, notices, and contextual messages.
 * Replaces stacked rainbow banners with a more professional approach.
 */

export type CalloutVariant = 'info' | 'success' | 'warning' | 'error';

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  /** Optional action element */
  action?: React.ReactNode;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Dismissible */
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<CalloutVariant, string> = {
  info: 'bg-status-info-bg border-status-info-border text-status-info-text',
  success: 'bg-status-success-bg border-status-success-border text-status-success-text',
  warning: 'bg-status-warning-bg border-status-warning-border text-status-warning-text',
  error: 'bg-status-error-bg border-status-error-border text-status-error-text',
};

const iconMap: Record<CalloutVariant, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

export function Callout({
  variant = 'info',
  title,
  children,
  action,
  compact = false,
  onDismiss,
  className,
}: CalloutProps) {
  const Icon = iconMap[variant];

  return (
    <div
      role="alert"
      className={cn(
        'border rounded-lg',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('shrink-0', compact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5')} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
              {title}
            </p>
          )}
          <div className={cn('text-sm', title && 'mt-0.5', !title && compact && 'text-sm')}>
            {children}
          </div>
          {action && <div className="mt-2">{action}</div>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ActionItem - Compact row for action center items
 */
export interface ActionItemProps {
  icon?: React.ReactNode;
  label: string;
  count?: number;
  severity?: 'high' | 'medium' | 'low';
  href?: string;
  onClick?: () => void;
}

const severityStyles = {
  high: 'text-status-error-text',
  medium: 'text-status-warning-text',
  low: 'text-content-secondary',
};

export function ActionItem({
  icon,
  label,
  count,
  severity = 'low',
  href,
  onClick,
}: ActionItemProps) {
  const Component = href ? 'a' : 'button';
  const props = href ? { href } : { onClick, type: 'button' as const };

  return (
    <Component
      {...props}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-surface-secondary transition-colors text-left group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="shrink-0 text-content-tertiary">{icon}</span>}
        <span className="text-sm text-content-primary truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {count !== undefined && (
          <span className={cn('text-sm font-medium', severityStyles[severity])}>
            {count}
          </span>
        )}
        <span className="text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </span>
      </div>
    </Component>
  );
}

/**
 * ActionCenter - Consolidated action/alert panel
 */
export interface ActionCenterProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ActionCenter({
  title = 'Action Required',
  children,
  footer,
  className,
}: ActionCenterProps) {
  return (
    <div className={cn('bg-surface rounded-lg border border-border', className)}>
      <div className="px-4 py-3 border-b border-border-secondary">
        <h3 className="text-sm font-semibold text-content-primary">{title}</h3>
      </div>
      <div className="p-2">{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-border-secondary">{footer}</div>
      )}
    </div>
  );
}
