'use client';

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'notification';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  actionUrl?: string;
  actionLabel?: string;
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({ children, maxToasts = 5, position = 'top-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      dismissible: toast.dismissible ?? true,
    };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <div className={`fixed z-[100] flex flex-col gap-2 ${positionClasses[position]}`}>
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onDismiss, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onDismiss]);

  const icons: Record<ToastType, React.ElementType> = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    notification: BellIcon,
  };

  const colors: Record<ToastType, { bg: string; icon: string; border: string }> = {
    success: {
      bg: 'bg-green-50',
      icon: 'text-green-500',
      border: 'border-green-200',
    },
    error: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      border: 'border-red-200',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      border: 'border-amber-200',
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      border: 'border-blue-200',
    },
    notification: {
      bg: 'bg-purple-50',
      icon: 'text-purple-500',
      border: 'border-purple-200',
    },
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`w-80 md:w-96 rounded-lg shadow-lg border ${color.bg} ${color.border} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color.icon}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            )}
            {toast.actionUrl && toast.actionLabel && (
              <Link
                href={toast.actionUrl}
                className="inline-block mt-2 text-sm font-medium text-accent-primary hover:text-accent-dark"
                onClick={onDismiss}
              >
                {toast.actionLabel}
              </Link>
            )}
          </div>
          {toast.dismissible && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className="h-1 bg-current origin-left opacity-20"
          style={{ color: color.icon.replace('text-', '') }}
        />
      )}
    </motion.div>
  );
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),

    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message, duration: 8000 }),

    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),

    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),

    notification: (title: string, message?: string, actionUrl?: string, actionLabel?: string) =>
      addToast({ type: 'notification', title, message, actionUrl, actionLabel, duration: 10000 }),
  };
}
