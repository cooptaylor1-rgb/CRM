import * as React from 'react';
import { cn } from './utils';

/**
 * Progress Component
 * 
 * Linear progress indicator with optional label and value display.
 * Supports different sizes and semantic colors.
 */

export interface ProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label instead of percentage */
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  default: 'bg-accent-500',
  success: 'bg-status-success-text',
  warning: 'bg-status-warning-text',
  error: 'bg-status-error-text',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-content-secondary">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium text-content-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn('w-full bg-surface-tertiary rounded-full overflow-hidden', sizeStyles[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-slow',
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * GoalProgress - Progress with actual/target display
 */
export interface GoalProgressProps {
  label: string;
  actual: number | string;
  target: number | string;
  progress: number;
  variant?: ProgressProps['variant'];
  formatValue?: (value: number | string) => string;
}

export function GoalProgress({
  label,
  actual,
  target,
  progress,
  variant = 'default',
  formatValue = (v) => String(v),
}: GoalProgressProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-content-secondary">{label}</span>
        <span className="text-sm font-medium text-content-primary">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress value={progress} size="md" variant={variant} />
      <p className="text-xs text-content-tertiary">
        {formatValue(actual)} / {formatValue(target)}
      </p>
    </div>
  );
}
