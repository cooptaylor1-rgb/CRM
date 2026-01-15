'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import {
  SparklesIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellAlertIcon,
  CheckIcon,
  ChevronRightIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  FireIcon,
  LightBulbIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  Square2StackIcon,
  BellSnoozeIcon,
  CalendarIcon,
  InformationCircleIcon,
  ArrowsPointingOutIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

// ============================================================================
// Types
// ============================================================================

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionCategory =
  | 'outreach'
  | 'follow-up'
  | 'compliance'
  | 'opportunity'
  | 'risk'
  | 'milestone'
  | 'task';

export interface SmartAction {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;
  priority: ActionPriority;

  // Context
  client?: {
    id: string;
    name: string;
    tier?: string;
  };

  // Timing
  dueDate?: string;
  timeEstimate?: string;
  suggestedTime?: string;

  // AI insights
  reason: string;
  impact?: string;
  confidence: number; // 0-100

  // Why this matters - NEW
  whyItMatters?: {
    summary: string;
    potentialOutcome: string;
    riskIfIgnored?: string;
    relatedMetrics?: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  };

  // Quick actions
  quickActions?: QuickAction[];

  // Metadata
  source: 'ai' | 'rule' | 'manual' | 'calendar';
  createdAt: string;
  dismissed?: boolean;
  completed?: boolean;
  snoozedUntil?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ActionStats {
  total: number;
  critical: number;
  completed: number;
  dismissed: number;
  avgCompletionTime: string;
}

// ============================================================================
// Snooze Options Configuration
// ============================================================================

interface SnoozeOption {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  getDate: () => Date;
}

const snoozeOptions: SnoozeOption[] = [
  {
    id: '1h',
    label: 'In 1 hour',
    icon: ClockIcon,
    getDate: () => new Date(Date.now() + 60 * 60 * 1000),
  },
  {
    id: '4h',
    label: 'In 4 hours',
    icon: ClockIcon,
    getDate: () => new Date(Date.now() + 4 * 60 * 60 * 1000),
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow morning',
    icon: CalendarIcon,
    getDate: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    },
  },
  {
    id: 'next-week',
    label: 'Next week',
    icon: CalendarIcon,
    getDate: () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;
    },
  },
];

// ============================================================================
// Main Smart Action Center Component
// ============================================================================

export interface SmartActionCenterProps {
  actions: SmartAction[];
  stats?: ActionStats;
  onComplete: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onSnooze: (actionId: string, duration: string) => void;
  onAction: (action: SmartAction, quickAction: QuickAction) => void;
  // Batch operations - NEW
  onBatchComplete?: (actionIds: string[]) => void;
  onBatchDismiss?: (actionIds: string[]) => void;
  onBatchSnooze?: (actionIds: string[], duration: string) => void;
  className?: string;
  /** Compact mode for sidebar */
  compact?: boolean;
  /** Maximum visible actions */
  maxVisible?: number;
}

export function SmartActionCenter({
  actions,
  stats,
  onComplete,
  onDismiss,
  onSnooze,
  onAction,
  onBatchComplete,
  onBatchDismiss,
  onBatchSnooze,
  className,
  compact = false,
  maxVisible = 10,
}: SmartActionCenterProps) {
  const [filter, setFilter] = useState<ActionCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Batch selection state - NEW
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchSnoozeMenu, setShowBatchSnoozeMenu] = useState(false);

  // Filter and sort actions
  const visibleActions = useMemo(() => {
    let filtered = actions.filter(a => !a.dismissed);

    // Filter out snoozed actions
    filtered = filtered.filter(a => {
      if (!a.snoozedUntil) return true;
      return new Date(a.snoozedUntil) <= new Date();
    });

    if (!showCompleted) {
      filtered = filtered.filter(a => !a.completed);
    }

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.category === filter);
    }

    // Sort by priority then by due date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return filtered.slice(0, maxVisible);
  }, [actions, filter, showCompleted, maxVisible]);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<ActionCategory | 'all', number> = {
      all: 0,
      outreach: 0,
      'follow-up': 0,
      compliance: 0,
      opportunity: 0,
      risk: 0,
      milestone: 0,
      task: 0,
    };

    actions.filter(a => !a.dismissed && !a.completed).forEach(a => {
      counts.all++;
      counts[a.category]++;
    });

    return counts;
  }, [actions]);

  // Batch selection handlers - NEW
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(visibleActions.map(a => a.id)));
  }, [visibleActions]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBatchComplete = useCallback(() => {
    if (onBatchComplete && selectedIds.size > 0) {
      onBatchComplete(Array.from(selectedIds));
      clearSelection();
      setSelectionMode(false);
    }
  }, [onBatchComplete, selectedIds, clearSelection]);

  const handleBatchDismiss = useCallback(() => {
    if (onBatchDismiss && selectedIds.size > 0) {
      onBatchDismiss(Array.from(selectedIds));
      clearSelection();
      setSelectionMode(false);
    }
  }, [onBatchDismiss, selectedIds, clearSelection]);

  const handleBatchSnooze = useCallback((duration: string) => {
    if (onBatchSnooze && selectedIds.size > 0) {
      onBatchSnooze(Array.from(selectedIds), duration);
      clearSelection();
      setSelectionMode(false);
      setShowBatchSnoozeMenu(false);
    }
  }, [onBatchSnooze, selectedIds, clearSelection]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    clearSelection();
  }, [clearSelection]);

  // Grouped by priority for better visualization
  const criticalActions = visibleActions.filter(a => a.priority === 'critical');
  const regularActions = visibleActions.filter(a => a.priority !== 'critical');

  if (compact) {
    return (
      <CompactActionCenter
        actions={visibleActions}
        onComplete={onComplete}
        onDismiss={onDismiss}
        onAction={onAction}
        className={className}
      />
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Action Center</h2>
            <p className="text-sm text-neutral-400">
              {categoryCounts.all} actions need your attention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Batch Mode Toggle - NEW */}
          <button
            onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              selectionMode
                ? 'bg-accent-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            )}
          >
            <Square2StackIcon className="w-4 h-4" />
            {selectionMode ? 'Exit Selection' : 'Batch Actions'}
          </button>

          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-semibold text-white">{stats.completed}</p>
                <p className="text-xs text-neutral-500">Completed today</p>
              </div>
              <div className="w-px h-8 bg-neutral-700" />
              <div className="text-center">
                <p className="text-lg font-semibold text-status-success-text">{stats.avgCompletionTime}</p>
                <p className="text-xs text-neutral-500">Avg time</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Action Bar - NEW */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-accent-900/30 border border-accent-500/30 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">
                {selectedIds.size} action{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={selectAll}
                className="text-xs text-accent-400 hover:text-accent-300"
              >
                Select all
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-neutral-400 hover:text-neutral-300"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Batch Snooze */}
              <div className="relative">
                <button
                  onClick={() => setShowBatchSnoozeMenu(!showBatchSnoozeMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm font-medium transition-colors"
                >
                  <BellSnoozeIcon className="w-4 h-4" />
                  Snooze
                </button>
                <AnimatePresence>
                  {showBatchSnoozeMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg overflow-hidden z-dropdown"
                    >
                      {snoozeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleBatchSnooze(option.label)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-neutral-500" />
                            {option.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Batch Dismiss */}
              <button
                onClick={handleBatchDismiss}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-status-error-bg hover:text-status-error-text text-sm font-medium transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                Dismiss
              </button>

              {/* Batch Complete */}
              <button
                onClick={handleBatchComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success-bg text-status-success-text hover:bg-status-success-bg/80 text-sm font-medium transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Complete All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <FilterPill
          label="All"
          count={categoryCounts.all}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterPill
          label="Outreach"
          count={categoryCounts.outreach}
          active={filter === 'outreach'}
          onClick={() => setFilter('outreach')}
          icon={PhoneIcon}
        />
        <FilterPill
          label="Follow-up"
          count={categoryCounts['follow-up']}
          active={filter === 'follow-up'}
          onClick={() => setFilter('follow-up')}
          icon={ArrowPathIcon}
        />
        <FilterPill
          label="Compliance"
          count={categoryCounts.compliance}
          active={filter === 'compliance'}
          onClick={() => setFilter('compliance')}
          icon={ShieldExclamationIcon}
        />
        <FilterPill
          label="Opportunity"
          count={categoryCounts.opportunity}
          active={filter === 'opportunity'}
          onClick={() => setFilter('opportunity')}
          icon={ArrowTrendingUpIcon}
        />
        <FilterPill
          label="Risk"
          count={categoryCounts.risk}
          active={filter === 'risk'}
          onClick={() => setFilter('risk')}
          icon={ExclamationTriangleIcon}
        />
      </div>

      {/* Critical Actions (if any) */}
      {criticalActions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FireIcon className="w-4 h-4 text-status-error-text" />
            <h3 className="text-sm font-semibold text-status-error-text">Requires Immediate Attention</h3>
          </div>
          <div className="space-y-3">
            {criticalActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedId === action.id}
                onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                onComplete={() => onComplete(action.id)}
                onDismiss={() => onDismiss(action.id)}
                onSnooze={(duration) => onSnooze(action.id, duration)}
                onQuickAction={(qa) => onAction(action, qa)}
                selectionMode={selectionMode}
                selected={selectedIds.has(action.id)}
                onToggleSelect={() => toggleSelection(action.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Actions */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {regularActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              expanded={expandedId === action.id}
              onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
              onComplete={() => onComplete(action.id)}
              onDismiss={() => onDismiss(action.id)}
              onSnooze={(duration) => onSnooze(action.id, duration)}
              onQuickAction={(qa) => onAction(action, qa)}
              selectionMode={selectionMode}
              selected={selectedIds.has(action.id)}
              onToggleSelect={() => toggleSelection(action.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {visibleActions.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-status-success-text" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">All caught up!</h3>
          <p className="text-sm text-neutral-400">
            No actions need your attention right now.
          </p>
        </div>
      )}

      {/* Show More */}
      {actions.length > maxVisible && (
        <button className="w-full mt-4 py-3 text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors">
          View {actions.length - maxVisible} more actions
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Action Card Component - Enhanced
// ============================================================================

interface ActionCardProps {
  action: SmartAction;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onDismiss: () => void;
  onSnooze: (duration: string) => void;
  onQuickAction: (action: QuickAction) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

function ActionCard({
  action,
  expanded,
  onToggle,
  onComplete,
  onDismiss,
  onSnooze,
  onQuickAction,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: ActionCardProps) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [showWhyItMatters, setShowWhyItMatters] = useState(false);

  const categoryConfig: Record<ActionCategory, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; bg: string }> = {
    outreach: { icon: PhoneIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'follow-up': { icon: ArrowPathIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    compliance: { icon: ShieldExclamationIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    opportunity: { icon: ArrowTrendingUpIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
    risk: { icon: ExclamationTriangleIcon, color: 'text-red-400', bg: 'bg-red-500/10' },
    milestone: { icon: HeartIcon, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    task: { icon: ClipboardDocumentCheckIcon, color: 'text-neutral-400', bg: 'bg-neutral-500/10' },
  };

  const priorityStyles: Record<ActionPriority, string> = {
    critical: 'border-status-error-border bg-status-error-bg/30',
    high: 'border-status-warning-border bg-status-warning-bg/30',
    medium: 'border-neutral-700',
    low: 'border-neutral-800',
  };

  const config = categoryConfig[action.category];
  const Icon = config.icon;

  // Generate "Why It Matters" content if not provided
  const whyItMatters = action.whyItMatters || generateWhyItMatters(action);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        priorityStyles[action.priority],
        action.completed && 'opacity-50',
        selectionMode && selected && 'ring-2 ring-accent-500 ring-offset-2 ring-offset-neutral-900'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Selection Checkbox - NEW */}
        {selectionMode && (
          <button
            onClick={onToggleSelect}
            className="mt-1 flex-shrink-0"
          >
            {selected ? (
              <CheckCircleSolidIcon className="w-5 h-5 text-accent-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-neutral-600 hover:border-accent-500 transition-colors" />
            )}
          </button>
        )}

        {/* Icon */}
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium text-white">{action.title}</h4>
              {action.client && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {action.client.name} {action.client.tier && `• ${action.client.tier}`}
                </p>
              )}
            </div>

            {/* Priority Badge */}
            {action.priority === 'critical' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-status-error-bg text-status-error-text rounded-full">
                Urgent
              </span>
            )}
            {action.priority === 'high' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-status-warning-bg text-status-warning-text rounded-full">
                High
              </span>
            )}
          </div>

          {/* AI Reason */}
          <div className="flex items-start gap-2 mt-2">
            <SparklesIcon className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />
            <p className="text-xs text-neutral-400">{action.reason}</p>
          </div>

          {/* Why It Matters Button - NEW */}
          <button
            onClick={() => setShowWhyItMatters(!showWhyItMatters)}
            className="flex items-center gap-1.5 mt-2 text-xs text-accent-400 hover:text-accent-300 transition-colors"
          >
            <InformationCircleIcon className="w-3.5 h-3.5" />
            <span>Why this matters</span>
            <ChevronRightIcon className={cn('w-3 h-3 transition-transform', showWhyItMatters && 'rotate-90')} />
          </button>

          {/* Why It Matters Panel - NEW */}
          <AnimatePresence>
            {showWhyItMatters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-accent-900/20 to-purple-900/20 border border-accent-500/20">
                  <p className="text-sm text-neutral-200 mb-3">{whyItMatters.summary}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Potential Outcome */}
                    <div className="p-2 rounded-lg bg-status-success-bg/20 border border-status-success-border/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-status-success-text" />
                        <span className="text-[10px] font-medium uppercase text-status-success-text">If Completed</span>
                      </div>
                      <p className="text-xs text-neutral-300">{whyItMatters.potentialOutcome}</p>
                    </div>

                    {/* Risk if Ignored */}
                    {whyItMatters.riskIfIgnored && (
                      <div className="p-2 rounded-lg bg-status-error-bg/20 border border-status-error-border/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-status-error-text" />
                          <span className="text-[10px] font-medium uppercase text-status-error-text">If Ignored</span>
                        </div>
                        <p className="text-xs text-neutral-300">{whyItMatters.riskIfIgnored}</p>
                      </div>
                    )}
                  </div>

                  {/* Related Metrics */}
                  {whyItMatters.relatedMetrics && whyItMatters.relatedMetrics.length > 0 && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-700">
                      {whyItMatters.relatedMetrics.map((metric, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500">{metric.label}:</span>
                          <span className="text-xs font-medium text-white flex items-center gap-1">
                            {metric.value}
                            {metric.trend === 'up' && <ArrowTrendingUpIcon className="w-3 h-3 text-status-success-text" />}
                            {metric.trend === 'down' && <ArrowTrendingDownIcon className="w-3 h-3 text-status-error-text" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
            {action.dueDate && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />
                {formatDate(action.dueDate)}
              </span>
            )}
            {action.timeEstimate && (
              <span>~{action.timeEstimate}</span>
            )}
            <span className="flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              {action.confidence}% confidence
            </span>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-neutral-800">
                  <p className="text-sm text-neutral-300 mb-4">{action.description}</p>

                  {action.impact && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-neutral-800/50 mb-4">
                      <LightBulbIcon className="w-4 h-4 text-accent-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-neutral-300">Potential Impact</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{action.impact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions Row */}
      {!selectionMode && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {action.quickActions?.slice(0, 3).map((qa) => {
              const QaIcon = qa.icon;
              return (
                <motion.button
                  key={qa.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickAction(qa)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    qa.primary
                      ? 'bg-accent-600 text-white hover:bg-accent-500'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  )}
                >
                  <QaIcon className="w-3.5 h-3.5" />
                  {qa.label}
                </motion.button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <ChevronRightIcon className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
            </button>

            {/* Enhanced Snooze Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Snooze"
              >
                <BellSnoozeIcon className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showSnoozeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 bottom-full mb-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg overflow-hidden z-dropdown"
                  >
                    <div className="px-3 py-2 border-b border-neutral-700">
                      <p className="text-xs font-medium text-neutral-400">Snooze until...</p>
                    </div>
                    {snoozeOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            onSnooze(option.label);
                            setShowSnoozeMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                        >
                          <OptionIcon className="w-4 h-4 text-neutral-500" />
                          <span className="flex-1">{option.label}</span>
                          <span className="text-[10px] text-neutral-500">
                            {formatSnoozeTime(option.getDate())}
                          </span>
                        </button>
                      );
                    })}
                    {/* Custom time option */}
                    <div className="border-t border-neutral-700">
                      <button
                        onClick={() => {
                          // In a real app, this would open a date/time picker
                          onSnooze('Custom');
                          setShowSnoozeMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-accent-400 hover:bg-neutral-700 transition-colors"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        <span>Pick a date & time</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
              title="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            {/* Complete */}
            <button
              onClick={onComplete}
              className="p-2 rounded-lg text-neutral-400 hover:text-status-success-text hover:bg-status-success-bg transition-colors"
              title="Mark complete"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Generate Why It Matters Content
// ============================================================================

function generateWhyItMatters(action: SmartAction): SmartAction['whyItMatters'] {
  const categoryInsights: Record<ActionCategory, { summary: string; outcome: string; risk: string }> = {
    outreach: {
      summary: 'Proactive client outreach builds trust and strengthens relationships, leading to higher retention rates.',
      outcome: 'Increased client satisfaction and potential referral opportunities.',
      risk: 'Client may feel neglected and consider other advisors.',
    },
    'follow-up': {
      summary: 'Timely follow-ups demonstrate professionalism and show clients their business matters to you.',
      outcome: 'Stronger client trust and faster decision-making on their part.',
      risk: 'Momentum lost, client may lose interest or feel undervalued.',
    },
    compliance: {
      summary: 'Regulatory compliance protects both your firm and clients from legal and financial risks.',
      outcome: 'Clean audit trail and protected client assets.',
      risk: 'Potential regulatory penalties and reputational damage.',
    },
    opportunity: {
      summary: 'Acting on opportunities quickly can significantly impact portfolio growth and client wealth.',
      outcome: 'Potential portfolio growth and demonstrated proactive management.',
      risk: 'Missed investment opportunity and potential client disappointment.',
    },
    risk: {
      summary: 'Addressing risks early prevents small issues from becoming major problems.',
      outcome: 'Protected client assets and maintained portfolio stability.',
      risk: 'Escalating losses and damaged client trust.',
    },
    milestone: {
      summary: 'Celebrating milestones creates memorable moments that deepen client relationships.',
      outcome: 'Strengthened personal connection and client loyalty.',
      risk: 'Missed opportunity to show you care about more than just their money.',
    },
    task: {
      summary: 'Completing tasks on time maintains operational efficiency and service quality.',
      outcome: 'Smooth operations and reliable service delivery.',
      risk: 'Backlog buildup and potential service disruptions.',
    },
  };

  const insight = categoryInsights[action.category];

  return {
    summary: insight.summary,
    potentialOutcome: insight.outcome,
    riskIfIgnored: action.priority === 'critical' || action.priority === 'high' ? insight.risk : undefined,
    relatedMetrics: action.client ? [
      { label: 'Client AUM', value: '$12.5M', trend: 'up' as const },
      { label: 'Last Contact', value: '14 days', trend: 'neutral' as const },
    ] : undefined,
  };
}

// ============================================================================
// Compact Action Center (for sidebar)
// ============================================================================

interface CompactActionCenterProps {
  actions: SmartAction[];
  onComplete: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onAction: (action: SmartAction, quickAction: QuickAction) => void;
  className?: string;
}

function CompactActionCenter({
  actions,
  onComplete,
  onDismiss,
  onAction,
  className,
}: CompactActionCenterProps) {
  const categoryConfig: Record<ActionCategory, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }> = {
    outreach: { icon: PhoneIcon, color: 'text-blue-400' },
    'follow-up': { icon: ArrowPathIcon, color: 'text-purple-400' },
    compliance: { icon: ShieldExclamationIcon, color: 'text-amber-400' },
    opportunity: { icon: ArrowTrendingUpIcon, color: 'text-green-400' },
    risk: { icon: ExclamationTriangleIcon, color: 'text-red-400' },
    milestone: { icon: HeartIcon, color: 'text-pink-400' },
    task: { icon: ClipboardDocumentCheckIcon, color: 'text-neutral-400' },
  };

  return (
    <div className={cn('space-y-2', className)}>
      {actions.slice(0, 5).map((action) => {
        const config = categoryConfig[action.category];
        const Icon = config.icon;
        const primaryAction = action.quickActions?.find(qa => qa.primary);

        return (
          <motion.div
            key={action.id}
            layout
            className="p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{action.title}</p>
                {action.client && (
                  <p className="text-xs text-neutral-500 truncate">{action.client.name}</p>
                )}
              </div>
              {primaryAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(action, primaryAction);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-accent-600 text-white transition-opacity"
                >
                  <primaryAction.icon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      {actions.length > 5 && (
        <button className="w-full py-2 text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors">
          View all {actions.length} actions
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Filter Pill Component
// ============================================================================

interface FilterPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function FilterPill({ label, count, active, onClick, icon: Icon }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-accent-600 text-white'
          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      {count > 0 && (
        <span className={cn(
          'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
          active ? 'bg-white/20' : 'bg-neutral-700'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Daily Briefing Widget
// ============================================================================

export interface DailyBriefingProps {
  greeting: string;
  summary: {
    meetings: number;
    tasks: number;
    calls: number;
    emails: number;
  };
  topPriority?: SmartAction;
  insight?: string;
  className?: string;
}

export function DailyBriefing({
  greeting,
  summary,
  topPriority,
  insight,
  className,
}: DailyBriefingProps) {
  return (
    <div className={cn(
      'p-6 rounded-2xl bg-gradient-to-br from-accent-600/20 to-purple-600/20 border border-accent-500/20',
      className
    )}>
      {/* Greeting */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-accent-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{greeting}</h2>
          <p className="text-sm text-neutral-400">Here's your day at a glance</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryItem icon={CalendarDaysIcon} label="Meetings" value={summary.meetings} />
        <SummaryItem icon={ClipboardDocumentCheckIcon} label="Tasks" value={summary.tasks} />
        <SummaryItem icon={PhoneIcon} label="Calls" value={summary.calls} />
        <SummaryItem icon={EnvelopeIcon} label="Emails" value={summary.emails} />
      </div>

      {/* Top Priority */}
      {topPriority && (
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FireIcon className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Top Priority</p>
          </div>
          <p className="text-sm font-medium text-white">{topPriority.title}</p>
          {topPriority.client && (
            <p className="text-xs text-neutral-400 mt-1">{topPriority.client.name}</p>
          )}
        </div>
      )}

      {/* AI Insight */}
      {insight && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-500/10 border border-accent-500/20">
          <LightBulbIcon className="w-5 h-5 text-accent-400 shrink-0" />
          <p className="text-sm text-neutral-300">{insight}</p>
        </div>
      )}
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-5 h-5 text-neutral-400" />
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return 'Yesterday';
    if (absDays < 7) return `${absDays} days ago`;
    return date.toLocaleDateString();
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString();
}

function formatSnoozeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
