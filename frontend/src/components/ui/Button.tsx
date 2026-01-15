'use client';

import * as React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Button Component with Microinteractions
// ============================================================================

/**
 * Button Component
 *
 * Variants:
 * - primary: Main CTA, accent color with glow effect
 * - secondary: Secondary actions, neutral dark theme
 * - ghost: Minimal, for inline actions
 * - destructive: Dangerous actions with warning colors
 * - outline: Bordered button with transparent bg
 *
 * Features:
 * - Smooth hover/tap animations via Framer Motion
 * - Loading state with animated spinner
 * - Icon support (left/right)
 * - Ripple effect on click
 * - Dark mode optimized
 */

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Enable ripple effect on click */
  ripple?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Pill shape (fully rounded) */
  pill?: boolean;
  children?: React.ReactNode;
}

const buttonVariants = {
  primary: [
    'bg-accent-600 text-white',
    'hover:bg-accent-500',
    'active:bg-accent-700',
    'shadow-sm shadow-accent-600/20',
    'hover:shadow-md hover:shadow-accent-500/30',
    'disabled:bg-neutral-700 disabled:text-neutral-500 disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-neutral-800 text-white',
    'hover:bg-neutral-700',
    'active:bg-neutral-800',
    'border border-neutral-700',
    'hover:border-neutral-600',
    'disabled:bg-neutral-900 disabled:text-neutral-600 disabled:border-neutral-800',
  ].join(' '),
  ghost: [
    'bg-transparent text-neutral-300',
    'hover:bg-neutral-800/50 hover:text-white',
    'active:bg-neutral-800',
    'disabled:text-neutral-600 disabled:bg-transparent',
  ].join(' '),
  destructive: [
    'bg-red-600/10 text-red-400 border border-red-600/30',
    'hover:bg-red-600/20 hover:text-red-300',
    'active:bg-red-600/30',
    'disabled:bg-neutral-900 disabled:text-neutral-600 disabled:border-neutral-800',
  ].join(' '),
  outline: [
    'bg-transparent text-white border border-neutral-600',
    'hover:bg-neutral-800/50 hover:border-neutral-500',
    'active:bg-neutral-800',
    'disabled:text-neutral-600 disabled:border-neutral-800 disabled:bg-transparent',
  ].join(' '),
};

const buttonSizes = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-base gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-5 h-5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      disabled,
      leftIcon,
      rightIcon,
      ripple = true,
      fullWidth = false,
      pill = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x, y }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      }
      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={handleClick}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center font-medium overflow-hidden',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app',
          'disabled:pointer-events-none',
          // Rounded corners
          pill ? 'rounded-full' : 'rounded-lg',
          // Full width
          fullWidth && 'w-full',
          // Variant and size
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            initial={{ width: 0, height: 0, x: r.x, y: r.y, opacity: 0.5 }}
            animate={{ width: 200, height: 200, x: r.x - 100, y: r.y - 100, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* Content */}
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <LoadingSpinner className={iconSizes[size]} />
              {loadingText && <span>{loadingText}</span>}
            </motion.span>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {leftIcon && (
                <span className={cn('shrink-0', iconSizes[size])}>{leftIcon}</span>
              )}
              {children}
              {rightIcon && (
                <span className={cn('shrink-0', iconSizes[size])}>{rightIcon}</span>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// Loading Spinner
// ============================================================================

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
    </motion.svg>
  );
}

// ============================================================================
// Icon Button
// ============================================================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  'aria-label': string;
  icon: React.ReactNode;
}

const iconButtonSizes = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', icon, variant = 'ghost', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          'relative inline-flex items-center justify-center',
          'rounded-lg transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app',
          'disabled:pointer-events-none disabled:opacity-50',
          iconButtonSizes[size],
          buttonVariants[variant],
          'px-0', // Override padding
          className
        )}
        {...props}
      >
        <span className={iconSizes[size]}>{icon}</span>
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// Button Group
// ============================================================================

export interface ButtonGroupProps {
  children: React.ReactNode;
  /** Attached buttons (no gap) */
  attached?: boolean;
  /** Vertical orientation */
  vertical?: boolean;
  className?: string;
}

export function ButtonGroup({
  children,
  attached = false,
  vertical = false,
  className,
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        vertical ? 'flex-col' : 'flex-row',
        !attached && (vertical ? 'gap-2' : 'gap-2'),
        attached && [
          '[&>*:not(:first-child):not(:last-child)]:rounded-none',
          vertical
            ? '[&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none'
            : '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none',
          '[&>*:not(:last-child)]:border-r-0',
        ],
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}

// ============================================================================
// Floating Action Button (FAB)
// ============================================================================

export interface FABProps extends Omit<ButtonProps, 'size' | 'pill'> {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'md' | 'lg';
  icon: React.ReactNode;
  label?: string;
  extended?: boolean;
}

const fabPositions = {
  'bottom-right': 'fixed bottom-6 right-6',
  'bottom-left': 'fixed bottom-6 left-6',
  'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
};

const fabSizes = {
  md: 'h-14 min-w-14',
  lg: 'h-16 min-w-16',
};

export function FAB({
  position = 'bottom-right',
  size = 'md',
  icon,
  label,
  extended = false,
  className,
  ...props
}: FABProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'z-50 inline-flex items-center justify-center gap-2',
        'rounded-full shadow-lg font-medium',
        'bg-accent-600 text-white',
        'hover:bg-accent-500 hover:shadow-xl hover:shadow-accent-500/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
        'transition-shadow duration-200',
        fabPositions[position],
        fabSizes[size],
        extended && 'px-6',
        className
      )}
      {...props}
    >
      <span className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}>{icon}</span>
      {extended && label && <span>{label}</span>}
    </motion.button>
  );
}

// ============================================================================
// Split Button
// ============================================================================

export interface SplitButtonProps {
  children: React.ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  onClick?: () => void;
  menuContent: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SplitButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  menuContent,
  disabled,
  className,
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        className="rounded-r-none border-r-0"
      >
        {children}
      </Button>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-l-none px-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full right-0 mt-1 z-50',
              'min-w-[160px] p-1',
              'bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl'
            )}
          >
            {menuContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Menu Item (for SplitButton menu)
// ============================================================================

export interface MenuItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function MenuItem({
  children,
  icon,
  onClick,
  destructive,
  disabled,
}: MenuItemProps) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md',
        'transition-colors duration-150',
        destructive
          ? 'text-red-400 hover:bg-red-600/10'
          : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
