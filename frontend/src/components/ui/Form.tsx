'use client';

import * as React from 'react';
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import {
  useForm,
  FormProvider,
  useFormContext,
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
  SubmitHandler,
  DefaultValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import { Input, Textarea } from './Input';
import { Select, SelectOption, NativeSelect } from './Select';
import { Checkbox, Radio, Switch, RadioGroup, CheckboxGroup } from './Checkbox';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/20/solid';

// ============================================================================
// Form Context & Provider
// ============================================================================

interface FormContextValue {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}

const FormStatusContext = createContext<FormContextValue | null>(null);

export function useFormStatus() {
  const context = useContext(FormStatusContext);
  if (!context) {
    throw new Error('useFormStatus must be used within a Form component');
  }
  return context;
}

// ============================================================================
// Main Form Component
// ============================================================================

export interface FormProps<TFieldValues extends FieldValues> {
  /** Form children */
  children: React.ReactNode;
  /** Submit handler */
  onSubmit: SubmitHandler<TFieldValues>;
  /** Zod schema for validation */
  schema?: z.ZodType<TFieldValues>;
  /** Default form values */
  defaultValues?: DefaultValues<TFieldValues>;
  /** Enable autosave functionality */
  autosave?: boolean;
  /** Autosave delay in ms (default: 2000) */
  autosaveDelay?: number;
  /** Autosave callback (called instead of onSubmit for autosave) */
  onAutosave?: (data: TFieldValues) => Promise<void>;
  /** Form mode */
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  /** Show validation errors on blur */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  /** Custom form class */
  className?: string;
  /** Form ID */
  id?: string;
  /** Reset form after successful submit */
  resetOnSuccess?: boolean;
  /** External form instance (for controlled forms) */
  form?: UseFormReturn<TFieldValues>;
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  autosave = false,
  autosaveDelay = 2000,
  onAutosave,
  mode = 'onBlur',
  reValidateMode = 'onChange',
  className,
  id,
  resetOnSuccess = false,
  form: externalForm,
}: FormProps<TFieldValues>) {
  const internalForm = useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
    reValidateMode,
  });

  const form = externalForm || internalForm;
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousValuesRef = useRef<TFieldValues | null>(null);

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty, isValid, errors },
    reset,
    watch,
  } = form;

  // Autosave logic
  useEffect(() => {
    if (!autosave || !onAutosave) return;

    const subscription = watch((values) => {
      // Skip if values haven't changed
      if (JSON.stringify(values) === JSON.stringify(previousValuesRef.current)) {
        return;
      }
      previousValuesRef.current = values as TFieldValues;

      // Clear existing timeout
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      // Set new timeout for autosave
      autosaveTimeoutRef.current = setTimeout(async () => {
        if (!isValid) return;

        setAutosaveStatus('saving');
        try {
          await onAutosave(values as TFieldValues);
          setAutosaveStatus('saved');
          setLastSaved(new Date());
          // Reset to idle after 3 seconds
          setTimeout(() => setAutosaveStatus('idle'), 3000);
        } catch (error) {
          setAutosaveStatus('error');
          console.error('Autosave failed:', error);
        }
      }, autosaveDelay);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [autosave, autosaveDelay, isValid, onAutosave, watch]);

  // Handle form submission
  const handleFormSubmit = useCallback<SubmitHandler<TFieldValues>>(
    async (data) => {
      try {
        await onSubmit(data);
        if (resetOnSuccess) {
          reset();
        }
      } catch (error) {
        throw error;
      }
    },
    [onSubmit, reset, resetOnSuccess]
  );

  const contextValue: FormContextValue = {
    isSubmitting,
    isDirty,
    isValid,
    autosaveStatus,
    lastSaved,
  };

  return (
    <FormStatusContext.Provider value={contextValue}>
      <FormProvider {...form}>
        <form
          id={id}
          onSubmit={handleSubmit(handleFormSubmit)}
          className={cn('space-y-6', className)}
          noValidate
        >
          {children}
        </form>
      </FormProvider>
    </FormStatusContext.Provider>
  );
}

// ============================================================================
// Form Field Wrapper
// ============================================================================

interface FormFieldContextValue {
  name: string;
  error?: string;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const context = useContext(FormFieldContext);
  const { getFieldState, formState } = useFormContext();

  if (!context) {
    return {
      name: '',
      error: undefined,
      invalid: false,
      isDirty: false,
      isTouched: false,
    };
  }

  const fieldState = getFieldState(context.name, formState);

  return {
    name: context.name,
    error: fieldState.error?.message,
    invalid: fieldState.invalid,
    isDirty: fieldState.isDirty,
    isTouched: fieldState.isTouched,
  };
}

// ============================================================================
// Form Field Components
// ============================================================================

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  /** Field label */
  label?: string;
  /** Field description */
  description?: string;
  /** Required indicator */
  required?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Children render function or element */
  children: React.ReactNode | ((field: any) => React.ReactNode);
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  defaultValue,
  rules,
  shouldUnregister,
  label,
  description,
  required,
  className,
  children,
}: FormFieldProps<TFieldValues, TName>) {
  const { control: contextControl, formState } = useFormContext<TFieldValues>();
  const fieldState = formState.errors[name];
  const error = fieldState?.message as string | undefined;

  return (
    <FormFieldContext.Provider value={{ name, error }}>
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label className="block text-sm font-medium text-content-primary">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <Controller
          name={name}
          control={control || contextControl}
          defaultValue={defaultValue}
          rules={rules}
          shouldUnregister={shouldUnregister}
          render={({ field, fieldState }) =>
            typeof children === 'function' ? (
              children({ ...field, error: fieldState.error?.message })
            ) : (
              React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child as React.ReactElement<any>, {
                    ...field,
                    error: fieldState.error?.message,
                  });
                }
                return child;
              })
            )
          }
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-status-error-text flex items-center gap-1"
              role="alert"
            >
              <ExclamationCircleIcon className="w-3.5 h-3.5" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {description && !error && (
          <p className="text-xs text-content-tertiary">{description}</p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

// ============================================================================
// Convenience Field Components
// ============================================================================

export interface FormInputProps extends Omit<React.ComponentProps<typeof Input>, 'name'> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormInput({ name, label, description, required, ...props }: FormInputProps) {
  const { register, formState } = useFormContext();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-content-primary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <Input {...props} {...register(name)} error={error} />
      {description && !error && (
        <p className="text-xs text-content-tertiary">{description}</p>
      )}
    </div>
  );
}

export interface FormTextareaProps extends Omit<React.ComponentProps<typeof Textarea>, 'name'> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormTextarea({ name, label, description, required, ...props }: FormTextareaProps) {
  const { register, formState } = useFormContext();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-content-primary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <Textarea {...props} {...register(name)} error={error} />
      {description && !error && (
        <p className="text-xs text-content-tertiary">{description}</p>
      )}
    </div>
  );
}

export interface FormSelectProps<T extends string = string>
  extends Omit<React.ComponentProps<typeof Select<T>>, 'value' | 'onChange'> {
  name: string;
  required?: boolean;
}

export function FormSelect<T extends string = string>({
  name,
  label,
  description,
  required,
  options,
  ...props
}: FormSelectProps<T>) {
  const { control, formState } = useFormContext();
  const error = formState.errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-1.5">
          {label && (
            <label className="block text-sm font-medium text-content-primary">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          <Select<T>
            {...props}
            options={options}
            value={field.value}
            onChange={field.onChange}
            error={error}
          />
          {description && !error && (
            <p className="text-xs text-content-tertiary">{description}</p>
          )}
        </div>
      )}
    />
  );
}

export interface FormCheckboxProps extends Omit<React.ComponentProps<typeof Checkbox>, 'name'> {
  name: string;
}

export function FormCheckbox({ name, ...props }: FormCheckboxProps) {
  const { register, formState } = useFormContext();
  const error = formState.errors[name]?.message as string | undefined;

  return <Checkbox {...props} {...register(name)} error={error} />;
}

export interface FormSwitchProps extends Omit<React.ComponentProps<typeof Switch>, 'name'> {
  name: string;
}

export function FormSwitch({ name, ...props }: FormSwitchProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Switch
          {...props}
          checked={field.value}
          onChange={(e) => field.onChange(e.target.checked)}
        />
      )}
    />
  );
}

// ============================================================================
// Form Actions & Status Components
// ============================================================================

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  /** Align actions */
  align?: 'left' | 'right' | 'between' | 'center';
  /** Show autosave status */
  showAutosaveStatus?: boolean;
  /** Sticky positioning */
  sticky?: boolean;
}

export function FormActions({
  children,
  className,
  align = 'right',
  showAutosaveStatus = false,
  sticky = false,
}: FormActionsProps) {
  const { autosaveStatus, lastSaved } = useFormStatus();

  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
    center: 'justify-center',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4',
        alignClasses[align],
        sticky && 'sticky bottom-0 bg-surface py-4 border-t border-border -mx-6 px-6 -mb-6',
        className
      )}
    >
      {showAutosaveStatus && (
        <AutosaveStatus status={autosaveStatus} lastSaved={lastSaved} />
      )}
      {children}
    </div>
  );
}

interface AutosaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}

function AutosaveStatus({ status, lastSaved }: AutosaveStatusProps) {
  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2 text-sm"
        >
          {status === 'saving' && (
            <>
              <ArrowPathIcon className="w-4 h-4 text-content-tertiary animate-spin" />
              <span className="text-content-tertiary">Saving...</span>
            </>
          )}
          {status === 'saved' && (
            <>
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-600">
                Saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
              </span>
            </>
          )}
          {status === 'error' && (
            <>
              <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Failed to save</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Form Section Component
// ============================================================================

export interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Children fields */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Collapsible section */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultCollapsed = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section className={cn('space-y-4', className)}>
      {(title || description) && (
        <div
          className={cn(
            'border-b border-border pb-3',
            collapsible && 'cursor-pointer'
          )}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className="flex items-center justify-between">
            {title && (
              <h3 className="text-base font-semibold text-content-primary">
                {title}
              </h3>
            )}
            {collapsible && (
              <motion.div
                animate={{ rotate: isCollapsed ? -90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg
                  className="w-5 h-5 text-content-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.div>
            )}
          </div>
          {description && (
            <p className="text-sm text-content-secondary mt-1">{description}</p>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {(!collapsible || !isCollapsed) && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : undefined}
            animate={{ opacity: 1, height: 'auto' }}
            exit={collapsible ? { opacity: 0, height: 0 } : undefined}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ============================================================================
// Form Row Component
// ============================================================================

export interface FormRowProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
}

export function FormRow({ children, className, columns = 2 }: FormRowProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Form Divider
// ============================================================================

export function FormDivider({ className }: { className?: string }) {
  return <hr className={cn('border-border', className)} />;
}

// ============================================================================
// Submit Button with Loading State
// ============================================================================

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Loading text (shown while submitting) */
  loadingText?: string;
  /** Success text (shown after successful submit) */
  successText?: string;
  /** Show success state duration in ms */
  successDuration?: number;
  /** Variant */
  variant?: 'primary' | 'secondary';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
}

export function SubmitButton({
  children,
  loadingText = 'Saving...',
  successText = 'Saved!',
  successDuration = 2000,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { isSubmitting } = useFormStatus();
  const [showSuccess, setShowSuccess] = useState(false);

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variantClasses = {
    primary: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500',
    secondary: 'bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-neutral-500',
  };

  return (
    <motion.button
      type="submit"
      disabled={disabled || isSubmitting}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-fast',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isSubmitting ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            {loadingText}
          </motion.span>
        ) : showSuccess ? (
          <motion.span
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {successText}
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
    </motion.button>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UseFormReturn,
  SubmitHandler,
  FieldValues,
  FieldPath,
  DefaultValues,
};

export { useForm, useFormContext, Controller };
