'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';
import {
  InboxIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PlusCircleIcon,
  ExclamationCircleIcon,
  WifiIcon,
  ArrowPathIcon,
  SparklesIcon,
  RocketLaunchIcon,
  FaceFrownIcon,
  DocumentMagnifyingGlassIcon,
  UserPlusIcon,
  FunnelIcon,
  BriefcaseIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export type EmptyStatePreset =
  | 'no-data'
  | 'no-results'
  | 'no-households'
  | 'no-accounts'
  | 'no-tasks'
  | 'no-meetings'
  | 'no-documents'
  | 'no-pipeline'
  | 'no-notifications'
  | 'search-empty'
  | 'filter-empty'
  | 'error'
  | 'offline'
  | 'welcome'
  | 'coming-soon';

export interface EmptyStateProps {
  /** Preset configuration */
  preset?: EmptyStatePreset;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show illustration animation */
  animated?: boolean;
  /** Custom className */
  className?: string;
  /** Children content (additional elements) */
  children?: React.ReactNode;
}

// ============================================================================
// Preset Configurations
// ============================================================================

interface PresetConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

const presetConfigs: Record<EmptyStatePreset, PresetConfig> = {
  'no-data': {
    icon: <InboxIcon className="w-full h-full" />,
    title: 'No data yet',
    description: 'Get started by adding your first item.',
    actionLabel: 'Add item',
    actionIcon: <PlusCircleIcon className="w-5 h-5" />,
  },
  'no-results': {
    icon: <DocumentMagnifyingGlassIcon className="w-full h-full" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  'no-households': {
    icon: <UserGroupIcon className="w-full h-full" />,
    title: 'No households yet',
    description: 'Start building your client relationships by adding your first household.',
    actionLabel: 'Add household',
    actionIcon: <UserPlusIcon className="w-5 h-5" />,
  },
  'no-accounts': {
    icon: <BriefcaseIcon className="w-full h-full" />,
    title: 'No accounts',
    description: 'Accounts will appear here once you add them to a household.',
    actionLabel: 'Add account',
    actionIcon: <PlusCircleIcon className="w-5 h-5" />,
  },
  'no-tasks': {
    icon: <ClipboardDocumentCheckIcon className="w-full h-full" />,
    title: 'All caught up!',
    description: 'You have no pending tasks. Create a new task to stay organized.',
    actionLabel: 'Create task',
    actionIcon: <PlusCircleIcon className="w-5 h-5" />,
  },
  'no-meetings': {
    icon: <CalendarIcon className="w-full h-full" />,
    title: 'No meetings scheduled',
    description: 'Your calendar is clear. Schedule a meeting to get started.',
    actionLabel: 'Schedule meeting',
    actionIcon: <PlusCircleIcon className="w-5 h-5" />,
  },
  'no-documents': {
    icon: <DocumentIcon className="w-full h-full" />,
    title: 'No documents',
    description: 'Upload documents to keep everything organized in one place.',
    actionLabel: 'Upload document',
    actionIcon: <PlusCircleIcon className="w-5 h-5" />,
  },
  'no-pipeline': {
    icon: <FunnelIcon className="w-full h-full" />,
    title: 'Empty pipeline',
    description: 'Add prospects to start tracking your sales pipeline.',
    actionLabel: 'Add prospect',
    actionIcon: <UserPlusIcon className="w-5 h-5" />,
  },
  'no-notifications': {
    icon: <EnvelopeIcon className="w-full h-full" />,
    title: 'No notifications',
    description: 'You\'re all caught up! New notifications will appear here.',
  },
  'search-empty': {
    icon: <MagnifyingGlassIcon className="w-full h-full" />,
    title: 'No matches found',
    description: 'We couldn\'t find anything matching your search. Try different keywords.',
  },
  'filter-empty': {
    icon: <FunnelIcon className="w-full h-full" />,
    title: 'No results match your filters',
    description: 'Try adjusting or clearing your filters to see more results.',
    actionLabel: 'Clear filters',
  },
  error: {
    icon: <ExclamationCircleIcon className="w-full h-full" />,
    title: 'Something went wrong',
    description: 'We encountered an error loading this content. Please try again.',
    actionLabel: 'Try again',
    actionIcon: <ArrowPathIcon className="w-5 h-5" />,
  },
  offline: {
    icon: <WifiIcon className="w-full h-full" />,
    title: 'You\'re offline',
    description: 'Please check your internet connection and try again.',
    actionLabel: 'Retry',
    actionIcon: <ArrowPathIcon className="w-5 h-5" />,
  },
  welcome: {
    icon: <RocketLaunchIcon className="w-full h-full" />,
    title: 'Welcome aboard!',
    description: 'Let\'s get you started with setting up your workspace.',
    actionLabel: 'Get started',
    actionIcon: <SparklesIcon className="w-5 h-5" />,
  },
  'coming-soon': {
    icon: <SparklesIcon className="w-full h-full" />,
    title: 'Coming soon',
    description: 'We\'re working hard to bring you this feature. Stay tuned!',
  },
};

// ============================================================================
// Size Configurations
// ============================================================================

const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    icon: 'w-10 h-10',
    iconWrapper: 'w-16 h-16 p-3',
    title: 'text-base',
    description: 'text-sm',
    gap: 'gap-3',
    maxWidth: 'max-w-xs',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'w-12 h-12',
    iconWrapper: 'w-20 h-20 p-4',
    title: 'text-lg',
    description: 'text-sm',
    gap: 'gap-4',
    maxWidth: 'max-w-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-16 h-16',
    iconWrapper: 'w-24 h-24 p-5',
    title: 'text-xl',
    description: 'text-base',
    gap: 'gap-5',
    maxWidth: 'max-w-md',
  },
};

// ============================================================================
// Animated Icon Wrapper
// ============================================================================

interface AnimatedIconProps {
  children: React.ReactNode;
  animate: boolean;
  size: keyof typeof sizeConfig;
}

function AnimatedIcon({ children, animate, size }: AnimatedIconProps) {
  const config = sizeConfig[size];

  const content = (
    <div
      className={cn(
        'rounded-2xl bg-neutral-800/50 border border-neutral-700/50',
        'flex items-center justify-center text-neutral-400',
        config.iconWrapper
      )}
    >
      {children}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

export function EmptyState({
  preset,
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  animated = true,
  className,
  children,
}: EmptyStateProps) {
  // Get preset config or use custom props
  const presetConfig = preset ? presetConfigs[preset] : null;

  const finalIcon = icon ?? presetConfig?.icon ?? <InboxIcon className="w-full h-full" />;
  const finalTitle = title ?? presetConfig?.title ?? 'No data';
  const finalDescription = description ?? presetConfig?.description;
  const finalActionLabel = action?.label ?? presetConfig?.actionLabel;
  const finalActionIcon = action?.icon ?? presetConfig?.actionIcon;

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.container,
        className
      )}
    >
      <div className={cn('flex flex-col items-center', config.gap, config.maxWidth)}>
        {/* Icon */}
        <AnimatedIcon animate={animated} size={size}>
          {finalIcon}
        </AnimatedIcon>

        {/* Text Content */}
        <div className="space-y-2">
          <motion.h3
            initial={animated ? { opacity: 0, y: 10 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn('font-semibold text-content-primary', config.title)}
          >
            {finalTitle}
          </motion.h3>
          {finalDescription && (
            <motion.p
              initial={animated ? { opacity: 0, y: 10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn('text-content-secondary', config.description)}
            >
              {finalDescription}
            </motion.p>
          )}
        </div>

        {/* Actions */}
        {(finalActionLabel || secondaryAction) && (
          <motion.div
            initial={animated ? { opacity: 0, y: 10 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 mt-2"
          >
            {finalActionLabel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action?.onClick}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg',
                  'bg-accent-600 text-white font-medium',
                  'hover:bg-accent-700 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-app'
                )}
              >
                {finalActionIcon}
                {finalActionLabel}
              </motion.button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className={cn(
                  'px-4 py-2.5 rounded-lg',
                  'text-content-secondary font-medium',
                  'hover:text-content-primary hover:bg-neutral-800 transition-colors'
                )}
              >
                {secondaryAction.label}
              </button>
            )}
          </motion.div>
        )}

        {/* Custom children */}
        {children && (
          <motion.div
            initial={animated ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Specialized Empty States
// ============================================================================

export function NoHouseholdsEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      preset="no-households"
      action={{ label: 'Add household', onClick: onAdd }}
      size="lg"
    >
      <div className="flex items-center gap-2 text-xs text-content-tertiary mt-4">
        <span>Pro tip:</span>
        <span>Import households from a CSV file for bulk uploads</span>
      </div>
    </EmptyState>
  );
}

export function NoTasksEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      preset="no-tasks"
      action={{ label: 'Create task', onClick: onAdd }}
      icon={
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ClipboardDocumentCheckIcon className="w-full h-full" />
        </motion.div>
      }
    />
  );
}

export function NoSearchResultsEmpty({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      preset="search-empty"
      title={`No results for "${query}"`}
      description="Try checking your spelling or using different keywords."
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

export function ErrorEmpty({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      preset="error"
      description={message || 'We encountered an unexpected error. Please try again.'}
      action={{ label: 'Try again', onClick: onRetry }}
    />
  );
}

export function OfflineEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      preset="offline"
      action={{ label: 'Retry connection', onClick: onRetry }}
    />
  );
}

export function WelcomeEmpty({
  userName,
  onGetStarted,
}: {
  userName?: string;
  onGetStarted: () => void;
}) {
  return (
    <EmptyState
      preset="welcome"
      title={userName ? `Welcome, ${userName}!` : 'Welcome aboard!'}
      description="Let's set up your workspace and get you started with your first client."
      action={{ label: 'Get started', onClick: onGetStarted }}
      size="lg"
    />
  );
}

// ============================================================================
// Inline Empty (For smaller contexts like dropdowns, popovers)
// ============================================================================

export interface InlineEmptyProps {
  icon?: React.ReactNode;
  text: string;
  className?: string;
}

export function InlineEmpty({ icon, text, className }: InlineEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-8 h-8 text-neutral-500 mb-2">{icon}</div>
      )}
      <p className="text-sm text-content-tertiary">{text}</p>
    </div>
  );
}

// ============================================================================
// Table Empty Row
// ============================================================================

export interface TableEmptyRowProps {
  colSpan: number;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TableEmptyRow({
  colSpan,
  message = 'No data available',
  action,
}: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 px-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <FolderIcon className="w-10 h-10 text-neutral-500" />
          <p className="text-sm text-content-secondary">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm text-accent-400 hover:text-accent-300 font-medium"
            >
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
