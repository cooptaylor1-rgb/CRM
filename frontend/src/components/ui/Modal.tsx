'use client';

import * as React from 'react';
import { cn } from './utils';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal Component
 * 
 * Accessible modal dialog using Headless UI.
 * Supports multiple sizes and variants.
 */

export interface ModalProps {
  /** Open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Description below title */
  description?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Show close button */
  showCloseButton?: boolean;
  /** Allow closing on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Center vertically */
  centered?: boolean;
  /** Custom class for panel */
  className?: string;
  /** Initial focus element ref */
  initialFocus?: React.RefObject<HTMLElement>;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  centered = true,
  className,
  initialFocus,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-modal"
        onClose={closeOnBackdropClick ? onClose : () => {}}
        initialFocus={initialFocus}
      >
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-default"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-fast"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={cn(
              'flex min-h-full p-4',
              centered ? 'items-center justify-center' : 'items-start justify-center pt-16'
            )}
          >
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-default"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-fast"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform rounded-lg bg-surface shadow-xl transition-all',
                  'border border-border',
                  sizeStyles[size],
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-content-primary">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-content-secondary">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>

                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className={cn(
                          'rounded-md p-1.5 -m-1.5',
                          'text-content-tertiary hover:text-content-secondary',
                          'hover:bg-surface-secondary',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                          'transition-colors duration-fast'
                        )}
                      >
                        <XMarkIcon className="w-5 h-5" />
                        <span className="sr-only">Close</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="px-6 py-5">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * ModalFooter Component
 * 
 * Footer area for modal actions.
 */

export interface ModalFooterProps {
  children: React.ReactNode;
  /** Align buttons */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Add border top */
  bordered?: boolean;
  className?: string;
}

export function ModalFooter({
  children,
  align = 'right',
  bordered = true,
  className,
}: ModalFooterProps) {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-6 py-4 -mx-6 -mb-5',
        bordered && 'border-t border-border bg-surface-secondary/50',
        alignStyles[align],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * ConfirmModal Component
 * 
 * Pre-styled confirmation dialog.
 */

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  const variantStyles = {
    danger: 'bg-status-error-bg text-status-error-text hover:bg-status-error-text hover:text-white',
    warning: 'bg-status-warning-bg text-status-warning-text hover:bg-status-warning-text hover:text-white',
    info: 'bg-accent-100 text-accent-700 hover:bg-accent-600 hover:text-white',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      initialFocus={confirmRef}
    >
      <div className="text-sm text-content-secondary">{message}</div>

      <ModalFooter align="right" bordered={false} className="mt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'text-content-secondary hover:text-content-primary',
            'hover:bg-surface-secondary',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            'transition-colors duration-fast',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {cancelText}
        </button>
        <button
          ref={confirmRef}
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          disabled={loading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'transition-colors duration-fast',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variantStyles[variant]
          )}
        >
          {loading ? 'Loading...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * SlideOver Component
 * 
 * Slide-out panel for detailed views.
 */

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  className?: string;
}

const slideOverSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function SlideOver({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  className,
}: SlideOverProps) {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-modal" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-default"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-fast"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={cn(
                'pointer-events-none fixed inset-y-0 flex max-w-full',
                side === 'right' ? 'right-0 pl-10' : 'left-0 pr-10'
              )}
            >
              <Transition.Child
                as={React.Fragment}
                enter="transform transition ease-out duration-default"
                enterFrom={side === 'right' ? 'translate-x-full' : '-translate-x-full'}
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-fast"
                leaveFrom="translate-x-0"
                leaveTo={side === 'right' ? 'translate-x-full' : '-translate-x-full'}
              >
                <Dialog.Panel
                  className={cn(
                    'pointer-events-auto w-screen',
                    slideOverSizes[size],
                    className
                  )}
                >
                  <div className="flex h-full flex-col bg-surface shadow-xl">
                    {/* Header */}
                    {(title || showCloseButton) && (
                      <div className="flex items-start justify-between px-6 py-4 border-b border-border">
                        <div>
                          {title && (
                            <Dialog.Title className="text-lg font-semibold text-content-primary">
                              {title}
                            </Dialog.Title>
                          )}
                          {description && (
                            <Dialog.Description className="mt-1 text-sm text-content-secondary">
                              {description}
                            </Dialog.Description>
                          )}
                        </div>

                        {showCloseButton && (
                          <button
                            type="button"
                            onClick={onClose}
                            className={cn(
                              'rounded-md p-1.5 -m-1.5',
                              'text-content-tertiary hover:text-content-secondary',
                              'hover:bg-surface-secondary',
                              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                              'transition-colors duration-fast'
                            )}
                          >
                            <XMarkIcon className="w-5 h-5" />
                            <span className="sr-only">Close</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
