'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  icon?: React.ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  // Convenience methods
  success: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  error: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  info: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => Promise<T>;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Position of toast container */
  position?: ToastPosition;
  /** Maximum number of visible toasts */
  maxToasts?: number;
  /** Default duration in ms */
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const removeToast = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = generateId();
      const duration = toast.duration ?? defaultDuration;

      setToasts((prev) => {
        // Remove oldest if at max
        const updated = prev.length >= maxToasts ? prev.slice(1) : prev;
        return [...updated, { ...toast, id, dismissible: toast.dismissible ?? true }];
      });

      // Set auto-dismiss timeout
      if (duration > 0) {
        const timeout = setTimeout(() => removeToast(id), duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [defaultDuration, maxToasts, removeToast]
  );

  const removeAllToasts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
      addToast({ type: 'success', title, ...options }),
    [addToast]
  );

  const error = useCallback(
    (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
      addToast({ type: 'error', title, duration: 0, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
      addToast({ type: 'warning', title, ...options }),
    [addToast]
  );

  const info = useCallback(
    (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
      addToast({ type: 'info', title, ...options }),
    [addToast]
  );

  const promiseToast = useCallback(
    async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      }
    ): Promise<T> => {
      const id = addToast({
        type: 'info',
        title: options.loading,
        duration: 0,
        dismissible: false,
      });

      try {
        const result = await promise;
        removeToast(id);
        const successMessage =
          typeof options.success === 'function' ? options.success(result) : options.success;
        success(successMessage);
        return result;
      } catch (err) {
        removeToast(id);
        const errorMessage =
          typeof options.error === 'function' ? options.error(err) : options.error;
        error(errorMessage);
        throw err;
      }
    },
    [addToast, removeToast, success, error]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts,
        success,
        error,
        warning,
        info,
        promise: promiseToast,
      }}
    >
      {children}
      <ToastContainer position={position} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

interface ToastContainerProps {
  position: ToastPosition;
}

function ToastContainer({ position }: ToastContainerProps) {
  const { toasts, removeToast } = useToast();

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const isTop = position.startsWith('top');

  return (
    <div
      className={cn(
        'fixed z-toast flex flex-col gap-2 pointer-events-none max-w-sm w-full',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {(isTop ? toasts : [...toasts].reverse()).map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Toast Item
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { type, title, message, action, dismissible, icon } = toast;

  const typeConfig: Record<ToastType, { icon: React.ReactNode; className: string; iconClassName: string }> = {
    success: {
      icon: icon || <CheckCircleIcon className="w-5 h-5" />,
      className: 'bg-status-success-bg/50 border-status-success-border',
      iconClassName: 'text-status-success-text',
    },
    error: {
      icon: icon || <ExclamationCircleIcon className="w-5 h-5" />,
      className: 'bg-status-error-bg/50 border-status-error-border',
      iconClassName: 'text-status-error-text',
    },
    warning: {
      icon: icon || <ExclamationTriangleIcon className="w-5 h-5" />,
      className: 'bg-status-warning-bg/50 border-status-warning-border',
      iconClassName: 'text-status-warning-text',
    },
    info: {
      icon: icon || <InformationCircleIcon className="w-5 h-5" />,
      className: 'bg-status-info-bg/50 border-status-info-border',
      iconClassName: 'text-status-info-text',
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto w-full',
        'rounded-lg border backdrop-blur-xl shadow-lg',
        'bg-neutral-900/95 border-neutral-700/50',
        config.className
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn('shrink-0 mt-0.5', config.iconClassName)}>{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            className="shrink-0 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="h-0.5 bg-white/20 rounded-full mx-4 mb-2 origin-left"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// Standalone Toast Function (for use outside React components)
// ============================================================================

let globalToast: ToastContextValue | null = null;

export function setGlobalToast(toast: ToastContextValue) {
  globalToast = toast;
}

export const toast = {
  success: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    if (!globalToast) {
      console.warn('Toast provider not initialized');
      return '';
    }
    return globalToast.success(title, options);
  },
  error: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    if (!globalToast) {
      console.warn('Toast provider not initialized');
      return '';
    }
    return globalToast.error(title, options);
  },
  warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    if (!globalToast) {
      console.warn('Toast provider not initialized');
      return '';
    }
    return globalToast.warning(title, options);
  },
  info: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    if (!globalToast) {
      console.warn('Toast provider not initialized');
      return '';
    }
    return globalToast.info(title, options);
  },
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    if (!globalToast) {
      console.warn('Toast provider not initialized');
      return promise;
    }
    return globalToast.promise(promise, options);
  },
  dismiss: (id?: string) => {
    if (!globalToast) {
      console.warn('Toast provider not initialized');
      return;
    }
    if (id) {
      globalToast.removeToast(id);
    } else {
      globalToast.removeAllToasts();
    }
  },
};

// ============================================================================
// Toast Provider Wrapper (auto-initializes global toast)
// ============================================================================

export function ToastProviderWithGlobal(props: ToastProviderProps) {
  return (
    <ToastProvider {...props}>
      <ToastInitializer />
      {props.children}
    </ToastProvider>
  );
}

function ToastInitializer() {
  const toastContext = useToast();

  React.useEffect(() => {
    setGlobalToast(toastContext);
  }, [toastContext]);

  return null;
}

// ============================================================================
// Sonner-like API Compatibility
// ============================================================================

export const Toaster = ToastProvider;
export { toast as sonner };
