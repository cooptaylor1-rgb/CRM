import * as React from 'react';
import { cn } from './utils';

/**
 * Button Component
 * 
 * Variants:
 * - primary: Main CTA, accent color
 * - secondary: Secondary actions, neutral
 * - ghost: Minimal, for inline actions
 * - destructive: Dangerous actions
 * 
 * Sizes:
 * - sm: Compact buttons
 * - md: Default size
 * - lg: Prominent buttons
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonVariants = {
  primary: [
    'bg-interactive-primary text-content-inverse',
    'hover:bg-interactive-primary-hover',
    'focus-visible:ring-border-focus',
    'disabled:bg-neutral-300 disabled:text-neutral-500',
  ].join(' '),
  secondary: [
    'bg-surface border border-border text-content-primary',
    'hover:bg-surface-secondary',
    'focus-visible:ring-border-focus',
    'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200',
  ].join(' '),
  ghost: [
    'bg-transparent text-content-primary',
    'hover:bg-surface-tertiary',
    'focus-visible:ring-border-focus',
    'disabled:text-neutral-400 disabled:bg-transparent',
  ].join(' '),
  destructive: [
    'bg-status-error-bg text-status-error-text border border-status-error-border',
    'hover:bg-[hsl(0_50%_94%)]',
    'focus-visible:ring-status-error-border',
    'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200',
  ].join(' '),
};

const buttonSizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-base gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-md',
          'transition-colors duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none',
          // Variant and size
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <LoadingSpinner className="w-4 h-4" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Loading spinner component
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
  );
}

/**
 * IconButton - Square button for icon-only actions
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const iconSizes = {
      sm: 'h-8 w-8',
      md: 'h-9 w-9',
      lg: 'h-10 w-10',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(iconSizes[size], 'px-0', className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
