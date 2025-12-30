'use client';

import * as React from 'react';
import { cn } from './utils';

/**
 * Checkbox Component
 * 
 * Custom checkbox with label support and multiple visual variants.
 * Built for accessibility with proper ARIA attributes.
 */

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label text displayed next to checkbox */
  label?: string;
  /** Description text below label */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state */
  error?: string;
  /** Indeterminate state (partial selection) */
  indeterminate?: boolean;
  /** Custom class for container */
  containerClassName?: string;
}

const sizeConfig = {
  sm: {
    checkbox: 'w-3.5 h-3.5',
    icon: 'w-2.5 h-2.5',
    label: 'text-sm',
    gap: 'gap-2',
  },
  md: {
    checkbox: 'w-4 h-4',
    icon: 'w-3 h-3',
    label: 'text-sm',
    gap: 'gap-2.5',
  },
  lg: {
    checkbox: 'w-5 h-5',
    icon: 'w-3.5 h-3.5',
    label: 'text-base',
    gap: 'gap-3',
  },
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      containerClassName,
      label,
      description,
      size = 'md',
      error,
      indeterminate,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const internalRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    React.useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, resolvedRef]);

    const config = sizeConfig[size];

    return (
      <div className={cn('relative flex', config.gap, containerClassName)}>
        <div className="flex items-center h-5">
          <input
            ref={resolvedRef}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'rounded border bg-surface',
              'text-accent-600 focus:ring-accent-500',
              'focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-fast',
              'cursor-pointer',
              config.checkbox,
              !error && 'border-border-input hover:border-border-input-hover',
              error && 'border-status-error-border',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'font-medium text-content-primary cursor-pointer',
                  config.label,
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-content-tertiary mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="absolute -bottom-5 left-0 text-xs text-status-error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Radio Component
 * 
 * Custom radio button with label support.
 * Use within a RadioGroup for proper grouping.
 */

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  containerClassName?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      containerClassName,
      label,
      description,
      size = 'md',
      error,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;
    const config = sizeConfig[size];

    return (
      <div className={cn('relative flex', config.gap, containerClassName)}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            disabled={disabled}
            className={cn(
              'border bg-surface',
              'text-accent-600 focus:ring-accent-500',
              'focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-fast',
              'cursor-pointer',
              config.checkbox,
              !error && 'border-border-input hover:border-border-input-hover',
              error && 'border-status-error-border',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'font-medium text-content-primary cursor-pointer',
                  config.label,
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-content-tertiary mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * RadioGroup Component
 * 
 * Container for grouping radio buttons.
 */

export interface RadioGroupProps {
  /** Group label */
  label?: string;
  /** Description */
  description?: string;
  /** Error message */
  error?: string;
  /** Children (Radio components) */
  children: React.ReactNode;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom class */
  className?: string;
}

export function RadioGroup({
  label,
  description,
  error,
  children,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-content-primary mb-2">
          {label}
        </legend>
      )}
      {description && (
        <p className="text-xs text-content-tertiary mb-3">{description}</p>
      )}

      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col space-y-3' : 'flex-row space-x-6'
        )}
        role="radiogroup"
      >
        {children}
      </div>

      {error && (
        <p className="mt-2 text-xs text-status-error-text" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * CheckboxGroup Component
 * 
 * Container for grouping checkboxes.
 */

export interface CheckboxGroupProps {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function CheckboxGroup({
  label,
  description,
  error,
  children,
  orientation = 'vertical',
  className,
}: CheckboxGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-content-primary mb-2">
          {label}
        </legend>
      )}
      {description && (
        <p className="text-xs text-content-tertiary mb-3">{description}</p>
      )}

      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col space-y-3' : 'flex-row space-x-6'
        )}
        role="group"
      >
        {children}
      </div>

      {error && (
        <p className="mt-2 text-xs text-status-error-text" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Switch Component
 * 
 * Toggle switch for boolean values.
 */

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

const switchSizes = {
  sm: {
    track: 'w-7 h-4',
    thumb: 'w-3 h-3 peer-checked:translate-x-3',
    label: 'text-sm',
  },
  md: {
    track: 'w-9 h-5',
    thumb: 'w-4 h-4 peer-checked:translate-x-4',
    label: 'text-sm',
  },
  lg: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5 peer-checked:translate-x-5',
    label: 'text-base',
  },
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      containerClassName,
      label,
      description,
      size = 'md',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;
    const config = switchSizes[size];

    return (
      <div className={cn('flex items-start gap-3', containerClassName)}>
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={switchId}
            disabled={disabled}
            className={cn('peer sr-only', className)}
            {...props}
          />
          <div
            className={cn(
              'rounded-full transition-colors duration-fast cursor-pointer',
              'bg-border peer-checked:bg-accent-600',
              'peer-focus:ring-2 peer-focus:ring-accent-500/20 peer-focus:ring-offset-0',
              config.track,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <div
            className={cn(
              'absolute left-0.5 rounded-full bg-white shadow-sm',
              'transition-transform duration-fast pointer-events-none',
              config.thumb
            )}
          />
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'font-medium text-content-primary cursor-pointer',
                  config.label,
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-content-tertiary mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
