'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
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
} from '@heroicons/react/24/outline';

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

  // Quick actions
  quickActions?: QuickAction[];

  // Metadata
  source: 'ai' | 'rule' | 'manual' | 'calendar';
  createdAt: string;
  dismissed?: boolean;
  completed?: boolean;
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
// Main Smart Action Center Component
// ============================================================================

export interface SmartActionCenterProps {
  actions: SmartAction[];
  stats?: ActionStats;
  onComplete: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onSnooze: (actionId: string, duration: string) => void;
  onAction: (action: SmartAction, quickAction: QuickAction) => void;
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
  className,
  compact = false,
  maxVisible = 10,
}: SmartActionCenterProps) {
  const [filter, setFilter] = useState<ActionCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter and sort actions
  const visibleActions = useMemo(() => {
    let filtered = actions.filter(a => !a.dismissed);

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

        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{stats.completed}</p>
              <p className="text-xs text-neutral-500">Completed today</p>
            </div>
            <div className="w-px h-8 bg-neutral-700" />
            <div className="text-center">
              <p className="text-lg font-semibold text-green-400">{stats.avgCompletionTime}</p>
              <p className="text-xs text-neutral-500">Avg time</p>
            </div>
          </div>
        )}
      </div>

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
            <FireIcon className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Requires Immediate Attention</h3>
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
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {visibleActions.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-green-400" />
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
// Action Card Component
// ============================================================================

interface ActionCardProps {
  action: SmartAction;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onDismiss: () => void;
  onSnooze: (duration: string) => void;
  onQuickAction: (action: QuickAction) => void;
}

function ActionCard({
  action,
  expanded,
  onToggle,
  onComplete,
  onDismiss,
  onSnooze,
  onQuickAction,
}: ActionCardProps) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

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
    critical: 'border-red-500/30 bg-red-500/5',
    high: 'border-amber-500/30 bg-amber-500/5',
    medium: 'border-neutral-700',
    low: 'border-neutral-800',
  };

  const config = categoryConfig[action.category];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        priorityStyles[action.priority],
        action.completed && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-4">
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
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 rounded-full">
                Urgent
              </span>
            )}
            {action.priority === 'high' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded-full">
                High
              </span>
            )}
          </div>

          {/* AI Reason */}
          <div className="flex items-start gap-2 mt-2">
            <SparklesIcon className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />
            <p className="text-xs text-neutral-400">{action.reason}</p>
          </div>

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

          {/* Snooze */}
          <div className="relative">
            <button
              onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Snooze"
            >
              <ClockIcon className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showSnoozeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 bottom-full mb-2 w-40 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-10"
                >
                  {['1 hour', '4 hours', 'Tomorrow', 'Next week'].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => {
                        onSnooze(duration);
                        setShowSnoozeMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                    >
                      {duration}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          {/* Complete */}
          <button
            onClick={onComplete}
            className="p-2 rounded-lg text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            title="Mark complete"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
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
