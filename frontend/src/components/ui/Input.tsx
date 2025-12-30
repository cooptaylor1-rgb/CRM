'use client';

import * as React from 'react';
import { cn } from './utils';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/20/solid';

/**
 * Input Component
 * 
 * A polished text input with support for:
 * - Labels, descriptions, and error messages
 * - Left/right addons and icons
 * - Loading and validation states
 * - Proper focus management
 */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Helper text below input */
  description?: string;
  /** Error message */
  error?: string;
  /** Success state */
  success?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Left icon or element */
  leftIcon?: React.ReactNode;
  /** Right icon or element */
  rightIcon?: React.ReactNode;
  /** Left addon (e.g., "$") */
  leftAddon?: string;
  /** Right addon (e.g., ".com") */
  rightAddon?: string;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Container className */
  containerClassName?: string;
}

const sizeStyles = {
  sm: 'h-7 text-sm px-2.5',
  md: 'h-8 text-sm px-3',
  lg: 'h-10 text-base px-3.5',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = 'text',
      label,
      description,
      error,
      success,
      size = 'md',
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      loading,
      fullWidth = true,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    const hasLeftElement = leftIcon || leftAddon;
    const hasRightElement = rightIcon || rightAddon || error || success || loading;

    return (
      <div className={cn(fullWidth ? 'w-full' : 'w-auto', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left addon */}
          {leftAddon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-content-tertiary text-sm pointer-events-none">
              {leftAddon}
            </span>
          )}

          {/* Left icon */}
          {leftIcon && !leftAddon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-content-tertiary pointer-events-none">
              <span className={iconSizes[size]}>{leftIcon}</span>
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled || loading}
            aria-describedby={
              error ? errorId : description ? descriptionId : undefined
            }
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              // Base
              'w-full rounded-md border bg-surface text-content-primary',
              'placeholder:text-content-tertiary',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Transitions
              'transition-colors duration-fast',
              // Size
              sizeStyles[size],
              // State styles
              !error && !success && [
                'border-border-input',
                'hover:border-border-input-hover',
                'focus:border-border-focus focus:ring-border-focus/20',
              ],
              error && [
                'border-status-error-border',
                'focus:border-status-error-text focus:ring-status-error-text/20',
              ],
              success && [
                'border-status-success-border',
                'focus:border-status-success-text focus:ring-status-success-text/20',
              ],
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed bg-surface-secondary',
              // Padding adjustments for icons/addons
              hasLeftElement && 'pl-9',
              hasRightElement && 'pr-9',
              leftAddon && 'pl-7',
              className
            )}
            {...props}
          />

          {/* Right elements */}
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1.5">
            {loading && (
              <LoadingSpinner className={cn(iconSizes[size], 'text-content-tertiary')} />
            )}
            {error && !loading && (
              <ExclamationCircleIcon className={cn(iconSizes[size], 'text-status-error-text')} />
            )}
            {success && !error && !loading && (
              <CheckCircleIcon className={cn(iconSizes[size], 'text-status-success-text')} />
            )}
            {rightIcon && !error && !success && !loading && (
              <span className={cn(iconSizes[size], 'text-content-tertiary')}>{rightIcon}</span>
            )}
            {rightAddon && (
              <span className="text-content-tertiary text-sm">{rightAddon}</span>
            )}
          </span>
        </div>

        {/* Description */}
        {description && !error && (
          <p id={descriptionId} className="mt-1.5 text-xs text-content-tertiary">
            {description}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-status-error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  /** Auto-resize based on content */
  autoResize?: boolean;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      label,
      description,
      error,
      autoResize = false,
      disabled,
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Handle auto-resize
    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      textarea.addEventListener('input', adjustHeight);
      adjustHeight();

      return () => textarea.removeEventListener('input', adjustHeight);
    }, [autoResize]);

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            {label}
          </label>
        )}

        <textarea
          ref={(node) => {
            textareaRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full rounded-md border bg-surface text-content-primary',
            'placeholder:text-content-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'transition-colors duration-fast',
            'px-3 py-2 text-sm',
            autoResize && 'resize-none overflow-hidden',
            !autoResize && 'resize-y min-h-[80px]',
            !error && [
              'border-border-input',
              'hover:border-border-input-hover',
              'focus:border-border-focus focus:ring-border-focus/20',
            ],
            error && [
              'border-status-error-border',
              'focus:border-status-error-text focus:ring-status-error-text/20',
            ],
            disabled && 'opacity-50 cursor-not-allowed bg-surface-secondary',
            className
          )}
          {...props}
        />

        {description && !error && (
          <p className="mt-1.5 text-xs text-content-tertiary">{description}</p>
        )}

        {error && (
          <p className="mt-1.5 text-xs text-status-error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Form Group - Groups form fields with consistent spacing
 */
export function FormGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

/**
 * Form Row - Horizontal layout for form fields
 */
export function FormRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}>
      {children}
    </div>
  );
}

/**
 * Loading spinner for inputs
 */
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
