import * as React from 'react';
import { cn, formatCurrency } from './utils';
import {
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

/**
 * MetricCard Component
 * 
 * Standardized KPI display with consistent typography and layout.
 * Institutional design with subtle icons and muted colors.
 */

export type MetricIconType =
  | 'households'
  | 'currency'
  | 'revenue'
  | 'pipeline'
  | 'documents'
  | 'calendar'
  | 'tasks'
  | 'growth';

export interface MetricCardProps {
  /** Label/title for the metric */
  label: string;
  /** The metric value (can be number or formatted string) */
  value: string | number;
  /** Optional subtext/description */
  subtext?: string;
  /** Change indicator (positive, negative, or neutral) */
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  /** Icon type */
  icon?: MetricIconType;
  /** Format value as currency */
  formatAsCurrency?: boolean;
  /** Loading state */
  loading?: boolean;
  className?: string;
}

const iconMap: Record<MetricIconType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  households: BuildingOffice2Icon,
  currency: CurrencyDollarIcon,
  revenue: ChartBarIcon,
  pipeline: ArrowTrendingUpIcon,
  documents: DocumentCheckIcon,
  calendar: CalendarIcon,
  tasks: ClipboardDocumentCheckIcon,
  growth: UserGroupIcon,
};

export function MetricCard({
  label,
  value,
  subtext,
  change,
  icon,
  formatAsCurrency = false,
  loading = false,
  className,
}: MetricCardProps) {
  const Icon = icon ? iconMap[icon] : null;
  
  const displayValue = React.useMemo(() => {
    if (typeof value === 'number' && formatAsCurrency) {
      return formatCurrency(value);
    }
    return value;
  }, [value, formatAsCurrency]);

  if (loading) {
    return (
      <div className={cn('bg-surface rounded-lg border border-border p-5', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-24 bg-neutral-200 rounded animate-skeleton" />
            <div className="h-8 w-32 bg-neutral-200 rounded animate-skeleton" />
            <div className="h-3 w-20 bg-neutral-200 rounded animate-skeleton" />
          </div>
          <div className="h-10 w-10 bg-neutral-200 rounded-lg animate-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-surface rounded-lg border border-border p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Label */}
          <p className="text-overline mb-1">{label}</p>
          
          {/* Value */}
          <p className="text-2xl font-semibold text-content-primary tracking-tight">
            {displayValue}
          </p>
          
          {/* Subtext and Change */}
          <div className="flex items-center gap-2 mt-1">
            {change && (
              <span
                className={cn(
                  'text-sm font-medium',
                  change.trend === 'up' && 'text-status-success-text',
                  change.trend === 'down' && 'text-status-error-text',
                  change.trend === 'neutral' && 'text-content-tertiary'
                )}
              >
                {change.trend === 'up' && '↑ '}
                {change.trend === 'down' && '↓ '}
                {change.value}
              </span>
            )}
            {subtext && (
              <span className="text-sm text-content-tertiary truncate">
                {subtext}
              </span>
            )}
          </div>
        </div>

        {/* Icon */}
        {Icon && (
          <div className="shrink-0 p-2.5 bg-surface-secondary rounded-lg">
            <Icon className="w-5 h-5 text-content-tertiary" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MetricGrid - Container for MetricCards with responsive layout
 */
export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ children, columns = 4, className }: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
