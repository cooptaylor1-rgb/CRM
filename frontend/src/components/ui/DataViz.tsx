'use client';

import * as React from 'react';
import { cn } from './utils';

/**
 * Data Visualization Components
 * 
 * Lightweight data viz primitives for dashboards.
 * Built for performance and accessibility.
 */

/**
 * Sparkline Component
 * 
 * Inline micro chart for showing trends.
 */

export interface SparklineProps {
  /** Data points */
  data: number[];
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Line color */
  color?: string;
  /** Fill under line */
  fill?: boolean;
  /** Show dots on hover */
  interactive?: boolean;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom class */
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = 'currentColor',
  fill = true,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  const areaPath = fill
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
    : '';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('flex-shrink-0', className)}
      aria-hidden="true"
    >
      {fill && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * TrendIndicator Component
 * 
 * Shows trend direction with percentage.
 */

export interface TrendIndicatorProps {
  /** Percentage change */
  value: number;
  /** Show arrow icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class */
  className?: string;
  /** Invert colors (positive = bad) */
  inverted?: boolean;
}

const trendSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TrendIndicator({
  value,
  showIcon = true,
  size = 'md',
  className,
  inverted = false,
}: TrendIndicatorProps) {
  const isPositive = value >= 0;
  const isGood = inverted ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium',
        trendSizes[size],
        isGood ? 'text-status-success-text' : 'text-status-error-text',
        className
      )}
    >
      {showIcon && (
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn(
            iconSizes[size],
            !isPositive && 'rotate-180'
          )}
        >
          <path
            fillRule="evenodd"
            d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

/**
 * MiniBarChart Component
 * 
 * Horizontal bar for single metric comparison.
 */

export interface MiniBarChartProps {
  /** Current value */
  value: number;
  /** Maximum value (for scale) */
  max: number;
  /** Target/goal line */
  target?: number;
  /** Label text */
  label?: string;
  /** Show value text */
  showValue?: boolean;
  /** Bar color */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Height in pixels */
  height?: number;
  /** Custom class */
  className?: string;
}

const barColors = {
  primary: 'bg-accent-600',
  success: 'bg-status-success-text',
  warning: 'bg-status-warning-text',
  error: 'bg-status-error-text',
};

export function MiniBarChart({
  value,
  max,
  target,
  label,
  showValue = true,
  color = 'primary',
  height = 8,
  className,
}: MiniBarChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const targetPercentage = target ? Math.min((target / max) * 100, 100) : null;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          {label && <span className="text-content-secondary">{label}</span>}
          {showValue && (
            <span className="font-medium text-content-primary">
              {value.toLocaleString()}
            </span>
          )}
        </div>
      )}

      <div
        className="relative w-full bg-surface-secondary rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-default',
            barColors[color]
          )}
          style={{ width: `${percentage}%` }}
        />

        {targetPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-content-primary/50"
            style={{ left: `${targetPercentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * DonutChart Component
 * 
 * Simple donut/ring chart for showing percentages.
 */

export interface DonutChartProps {
  /** Percentage value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Primary color */
  color?: string;
  /** Background track color */
  trackColor?: string;
  /** Show center value */
  showValue?: boolean;
  /** Center label */
  label?: string;
  /** Custom class */
  className?: string;
}

export function DonutChart({
  value,
  size = 80,
  strokeWidth = 8,
  color = 'var(--accent-600)',
  trackColor = 'var(--surface-secondary)',
  showValue = true,
  label,
  className,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Value */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-slow"
        />
      </svg>

      {(showValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className="text-lg font-semibold text-content-primary">
              {Math.round(value)}%
            </span>
          )}
          {label && (
            <span className="text-xs text-content-tertiary">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SegmentedDonutChart Component
 * 
 * Multi-segment donut chart for showing data distribution.
 */

export interface SegmentedDonutChartData {
  label: string;
  value: number;
  color: string;
}

export interface SegmentedDonutChartProps {
  /** Data segments */
  data: SegmentedDonutChartData[];
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Inner label (displayed in center) */
  innerLabel?: string;
  /** Inner sublabel (displayed below inner label) */
  innerSubLabel?: string;
  /** Custom class */
  className?: string;
}

export function SegmentedDonutChart({
  data,
  size = 160,
  strokeWidth = 24,
  innerLabel,
  innerSubLabel,
  className,
}: SegmentedDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  
  // Calculate segments
  let cumulativePercent = 0;
  const segments = data.map(segment => {
    const percent = total > 0 ? segment.value / total : 0;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    return {
      ...segment,
      percent,
      dashArray: percent * circumference,
      dashOffset: -((cumulativePercent - percent) * circumference),
      rotation: startAngle,
    };
  });

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-secondary)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((segment, index) => (
          <circle
            key={segment.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.dashArray} ${circumference - segment.dashArray}`}
            strokeDashoffset={segment.dashOffset}
            className="transition-all duration-slow"
            style={{ transformOrigin: 'center' }}
          />
        ))}
      </svg>

      {(innerLabel || innerSubLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          {innerLabel && (
            <span className="text-lg font-semibold text-content-primary">
              {innerLabel}
            </span>
          )}
          {innerSubLabel && (
            <span className="text-xs text-content-tertiary">{innerSubLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ComparisonBar Component
 * 
 * Side-by-side comparison visualization.
 */

export interface ComparisonBarProps {
  /** Left value */
  leftValue: number;
  /** Right value */
  rightValue: number;
  /** Left label */
  leftLabel?: string;
  /** Right label */
  rightLabel?: string;
  /** Left color */
  leftColor?: string;
  /** Right color */
  rightColor?: string;
  /** Custom class */
  className?: string;
}

export function ComparisonBar({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  leftColor = 'bg-accent-600',
  rightColor = 'bg-emerald-600',
  className,
}: ComparisonBarProps) {
  const total = leftValue + rightValue;
  const leftPercent = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPercent = total > 0 ? (rightValue / total) * 100 : 50;

  return (
    <div className={cn('w-full', className)}>
      {/* Labels */}
      <div className="flex justify-between text-sm mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('w-3 h-3 rounded-sm', leftColor)} />
          <span className="text-content-secondary">{leftLabel}</span>
          <span className="font-medium text-content-primary">{leftValue.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-content-primary">{rightValue.toLocaleString()}</span>
          <span className="text-content-secondary">{rightLabel}</span>
          <span className={cn('w-3 h-3 rounded-sm', rightColor)} />
        </div>
      </div>

      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-default', leftColor)}
          style={{ width: `${leftPercent}%` }}
        />
        <div
          className={cn('h-full transition-all duration-default', rightColor)}
          style={{ width: `${rightPercent}%` }}
        />
      </div>
    </div>
  );
}
