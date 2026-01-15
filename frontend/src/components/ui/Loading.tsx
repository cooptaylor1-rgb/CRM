'use client';

import * as React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Spinner Component
// ============================================================================

export interface SpinnerProps {
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'white' | 'current';
  /** Custom className */
  className?: string;
  /** Accessible label */
  label?: string;
}

const spinnerSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors = {
  primary: 'text-accent-500',
  secondary: 'text-neutral-400',
  white: 'text-white',
  current: 'text-current',
};

export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading',
}: SpinnerProps) {
  return (
    <div className={cn('inline-flex items-center justify-center', className)} role="status">
      <svg
        className={cn('animate-spin', spinnerSizes[size], spinnerColors[variant])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ============================================================================
// Dots Loader (Modern style)
// ============================================================================

export interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

const dotColors = {
  primary: 'bg-accent-500',
  secondary: 'bg-neutral-400',
  white: 'bg-white',
};

export function DotsLoader({ size = 'md', variant = 'primary', className }: DotsLoaderProps) {
  const dotVariants: Variants = {
    initial: { y: 0 },
    animate: (i: number) => ({
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.1,
      },
    }),
  };

  return (
    <div className={cn('flex items-center gap-1', className)} role="status">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('rounded-full', dotSizes[size], dotColors[variant])}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          custom={i}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

// ============================================================================
// Progress Bar
// ============================================================================

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Indeterminate state (animated, ignores value) */
  indeterminate?: boolean;
  /** Custom className */
  className?: string;
  /** Accessible label */
  label?: string;
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const progressColors = {
  primary: 'bg-accent-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

export function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  variant = 'primary',
  indeterminate = false,
  className,
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {label && <span className="text-sm font-medium text-content-primary">{label}</span>}
        {showLabel && !indeterminate && (
          <span className="text-sm text-content-secondary">{Math.round(clampedValue)}%</span>
        )}
      </div>
      <div
        className={cn('w-full bg-neutral-800 rounded-full overflow-hidden', progressSizes[size])}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {indeterminate ? (
          <motion.div
            className={cn('h-full rounded-full', progressColors[variant])}
            initial={{ x: '-100%', width: '40%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ) : (
          <motion.div
            className={cn('h-full rounded-full', progressColors[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Full Page Loading
// ============================================================================

export interface PageLoadingProps {
  /** Loading message */
  message?: string;
  /** Show spinner or dots */
  type?: 'spinner' | 'dots' | 'progress';
  /** Progress value (for progress type) */
  progress?: number;
  /** Custom className */
  className?: string;
}

export function PageLoading({
  message = 'Loading...',
  type = 'spinner',
  progress = 0,
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-app/80 backdrop-blur-sm',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-surface border border-neutral-800 shadow-2xl"
      >
        {type === 'spinner' && <Spinner size="xl" />}
        {type === 'dots' && <DotsLoader size="lg" />}
        {type === 'progress' && (
          <div className="w-48">
            <ProgressBar value={progress} showLabel size="md" />
          </div>
        )}
        {message && (
          <p className="text-sm text-content-secondary font-medium">{message}</p>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================================
// Content Loading Wrapper
// ============================================================================

export interface LoadingOverlayProps {
  /** Loading state */
  loading: boolean;
  /** Children content */
  children: React.ReactNode;
  /** Loading message */
  message?: string;
  /** Blur background content */
  blur?: boolean;
  /** Custom className */
  className?: string;
}

export function LoadingOverlay({
  loading,
  children,
  message,
  blur = true,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center bg-surface/80 z-10',
              blur && 'backdrop-blur-sm'
            )}
          >
            <Spinner size="lg" />
            {message && (
              <p className="mt-3 text-sm text-content-secondary">{message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Inline Loading
// ============================================================================

export interface InlineLoadingProps {
  /** Loading text */
  text?: string;
  /** Size */
  size?: 'sm' | 'md';
  /** Custom className */
  className?: string;
}

export function InlineLoading({ text = 'Loading', size = 'sm', className }: InlineLoadingProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Spinner size={size === 'sm' ? 'xs' : 'sm'} variant="current" />
      <span
        className={cn(
          'text-content-secondary',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        {text}
      </span>
    </div>
  );
}

// ============================================================================
// Button Loading State
// ============================================================================

export interface ButtonLoadingProps {
  /** Loading state */
  loading: boolean;
  /** Default content */
  children: React.ReactNode;
  /** Loading text */
  loadingText?: string;
  /** Spinner position */
  spinnerPosition?: 'left' | 'right';
}

export function ButtonLoading({
  loading,
  children,
  loadingText,
  spinnerPosition = 'left',
}: ButtonLoadingProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-2"
        >
          {spinnerPosition === 'left' && <Spinner size="xs" variant="current" />}
          {loadingText || children}
          {spinnerPosition === 'right' && <Spinner size="xs" variant="current" />}
        </motion.span>
      ) : (
        <motion.span
          key="default"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Page Transition Wrapper
// ============================================================================

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Staggered Children Animation
// ============================================================================

export interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation */
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 0.05,
}: StaggeredListProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

// ============================================================================
// Pulse Animation Wrapper
// ============================================================================

export interface PulseProps {
  children: React.ReactNode;
  /** Enable pulse animation */
  animate?: boolean;
  className?: string;
}

export function Pulse({ children, animate = true, className }: PulseProps) {
  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Shimmer Effect
// ============================================================================

export interface ShimmerProps {
  /** Width of shimmer element */
  width?: string | number;
  /** Height of shimmer element */
  height?: string | number;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function Shimmer({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className,
}: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-neutral-800',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// ============================================================================
// Loading Card (Content placeholder with shimmer)
// ============================================================================

export interface LoadingCardProps {
  /** Number of lines */
  lines?: number;
  /** Show avatar */
  showAvatar?: boolean;
  /** Show header */
  showHeader?: boolean;
  className?: string;
}

export function LoadingCard({
  lines = 3,
  showAvatar = false,
  showHeader = true,
  className,
}: LoadingCardProps) {
  return (
    <div className={cn('bg-surface rounded-xl border border-neutral-800 p-5', className)}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          {showAvatar && <Shimmer width={40} height={40} rounded="full" />}
          <div className="flex-1 space-y-2">
            <Shimmer width="60%" height={16} />
            <Shimmer width="40%" height={12} />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            width={i === lines - 1 ? '70%' : '100%'}
            height={14}
          />
        ))}
      </div>
    </div>
  );
}
