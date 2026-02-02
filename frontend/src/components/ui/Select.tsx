'use client';

import * as React from 'react';
import { cn } from './utils';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

/**
 * Select Component
 * 
 * Custom select dropdown using Headless UI for accessibility.
 * Supports single selection with keyboard navigation.
 */

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps<T = string> {
  /** Options array */
  options: SelectOption<T>[];
  /** Current value */
  value?: T;
  /** Change handler */
  onChange?: (value: T) => void;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Helper description */
  description?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Mark as required (visual/ARIA only for now) */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Custom class */
  className?: string;
  containerClassName?: string;
}

const sizeStyles = {
  sm: 'h-7 text-sm pl-2.5 pr-8',
  md: 'h-8 text-sm pl-3 pr-9',
  lg: 'h-10 text-base pl-3.5 pr-10',
};

const chevronSizes = {
  sm: 'w-4 h-4 right-1.5',
  md: 'w-5 h-5 right-2',
  lg: 'w-5 h-5 right-2.5',
};

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  description,
  error,
  disabled,
  required: _required,
  size = 'md',
  fullWidth = true,
  className,
  containerClassName,
}: SelectProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn(fullWidth ? 'w-full' : 'w-auto', containerClassName)}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            {label && (
              <Listbox.Label className="block text-sm font-medium text-content-primary mb-1.5">
                {label}
              </Listbox.Label>
            )}

            <div className="relative">
              <Listbox.Button
                className={cn(
                  'relative w-full rounded-md border bg-surface text-left',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'transition-colors duration-fast',
                  sizeStyles[size],
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
              >
                <span
                  className={cn(
                    'block truncate',
                    !selectedOption && 'text-content-tertiary'
                  )}
                >
                  {selectedOption?.label || placeholder}
                </span>
                <span
                  className={cn(
                    'absolute inset-y-0 flex items-center pointer-events-none',
                    chevronSizes[size]
                  )}
                >
                  <ChevronUpDownIcon
                    className="text-content-tertiary"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  className={cn(
                    'absolute z-dropdown mt-1 w-full max-h-60 overflow-auto',
                    'rounded-md bg-surface border border-border shadow-lg',
                    'py-1 text-sm',
                    'focus:outline-none'
                  )}
                >
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, disabled }) =>
                        cn(
                          'relative cursor-pointer select-none py-2 pl-9 pr-4',
                          active && 'bg-surface-secondary',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={cn(
                              'block truncate',
                              selected ? 'font-medium' : 'font-normal'
                            )}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="block text-xs text-content-tertiary mt-0.5">
                              {option.description}
                            </span>
                          )}
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-accent-600">
                              <CheckIcon className="w-4 h-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>

            {description && !error && (
              <p className="mt-1.5 text-xs text-content-tertiary">{description}</p>
            )}

            {error && (
              <p className="mt-1.5 text-xs text-status-error-text" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </Listbox>
    </div>
  );
}

/**
 * Native Select - For simpler use cases
 */
export interface NativeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      description,
      error,
      size = 'md',
      disabled,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full rounded-md border bg-surface text-content-primary appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-fast',
              sizeStyles[size],
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
          >
            {children}
          </select>
          <span
            className={cn(
              'absolute inset-y-0 flex items-center pointer-events-none',
              chevronSizes[size]
            )}
          >
            <ChevronUpDownIcon
              className="text-content-tertiary w-5 h-5"
              aria-hidden="true"
            />
          </span>
        </div>

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

NativeSelect.displayName = 'NativeSelect';
