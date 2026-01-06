'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '../ui';
import {
  LightBulbIcon,
  PhoneIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * NextBestActions - Proactive AI-powered suggestions
 * 
 * Analyzes current context and suggests actionable next steps.
 * Shows why each action is recommended for transparency.
 */

export interface NextBestAction {
  id: string;
  type: 'call' | 'email' | 'document' | 'meeting' | 'review' | 'task' | 'alert' | 'celebration';
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  entityType?: 'household' | 'prospect' | 'task' | 'account';
  entityId?: string;
  entityName?: string;
  dueDate?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export interface NextBestActionsProps {
  /** List of suggested actions */
  actions: NextBestAction[];
  /** Maximum actions to display */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for sidebar/widgets */
  compact?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Title override */
  title?: string;
}

const actionIcons: Record<NextBestAction['type'], React.ReactNode> = {
  call: <PhoneIcon className="w-4 h-4" />,
  email: <DocumentTextIcon className="w-4 h-4" />,
  document: <DocumentTextIcon className="w-4 h-4" />,
  meeting: <CalendarDaysIcon className="w-4 h-4" />,
  review: <ClockIcon className="w-4 h-4" />,
  task: <CheckCircleIcon className="w-4 h-4" />,
  alert: <ExclamationTriangleIcon className="w-4 h-4" />,
  celebration: <SparklesIcon className="w-4 h-4" />,
};

const priorityColors: Record<NextBestAction['priority'], string> = {
  high: 'text-status-error-text bg-status-error-bg',
  medium: 'text-status-warning-text bg-status-warning-bg',
  low: 'text-content-secondary bg-surface-secondary',
};

const actionColors: Record<NextBestAction['type'], string> = {
  call: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  email: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  document: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  meeting: 'bg-green-500/10 text-green-500 border-green-500/20',
  review: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  task: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  alert: 'bg-red-500/10 text-red-500 border-red-500/20',
  celebration: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

function ActionItem({ action, compact }: { action: NextBestAction; compact?: boolean }) {
  const isOverdue = action.dueDate && new Date(action.dueDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-lg border transition-all',
        'hover:shadow-md hover:border-border-default cursor-pointer',
        'bg-surface border-transparent'
      )}
      onClick={action.onAction}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
        actionColors[action.type]
      )}>
        {actionIcons[action.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-content-primary text-sm truncate">
              {action.title}
            </h4>
            {action.entityName && (
              <p className="text-xs text-content-tertiary mt-0.5">
                {action.entityName}
              </p>
            )}
          </div>
          
          {action.priority === 'high' && (
            <Badge variant="error" size="sm">Urgent</Badge>
          )}
        </div>

        {/* Reason - the "why" for transparency */}
        {!compact && (
          <p className="text-xs text-content-secondary mt-1.5 flex items-start gap-1">
            <LightBulbIcon className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>{action.reason}</span>
          </p>
        )}

        {/* Due date */}
        {action.dueDate && (
          <p className={cn(
            'text-xs mt-1.5 flex items-center gap-1',
            isOverdue ? 'text-status-error-text' : 'text-content-tertiary'
          )}>
            <ClockIcon className="w-3 h-3" />
            {isOverdue ? 'Overdue: ' : 'Due: '}
            {new Date(action.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Action button */}
      {action.onAction && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="secondary">
            {action.actionLabel || 'View'}
            <ArrowRightIcon className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-secondary" />
            <div className="h-3 w-1/2 rounded bg-surface-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NextBestActions({
  actions,
  maxItems = 5,
  className,
  compact = false,
  isLoading = false,
  title = 'Next Best Actions',
}: NextBestActionsProps) {
  // Sort by priority (high first) then by due date
  const sortedActions = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...actions]
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, maxItems);
  }, [actions, maxItems]);

  const highPriorityCount = sortedActions.filter(a => a.priority === 'high').length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-content-primary text-sm">{title}</h3>
            <p className="text-xs text-content-tertiary">
              {isLoading ? 'Analyzing...' : `${sortedActions.length} suggested actions`}
            </p>
          </div>
        </div>
        
        {highPriorityCount > 0 && !isLoading && (
          <Badge variant="error" size="sm">
            {highPriorityCount} urgent
          </Badge>
        )}
      </div>

      {/* Actions List */}
      <div className={cn(
        'divide-y divide-border',
        compact ? 'max-h-[300px] overflow-y-auto' : ''
      )}>
        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : sortedActions.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircleIcon className="w-10 h-10 text-status-success-text mx-auto mb-2" />
            <p className="text-sm text-content-secondary">You&apos;re all caught up!</p>
            <p className="text-xs text-content-tertiary mt-1">No urgent actions needed</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActionItem action={action} compact={compact} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer - show when there are more actions */}
      {actions.length > maxItems && (
        <div className="p-3 border-t border-border bg-surface-secondary/50">
          <button className="text-xs text-accent-primary hover:text-accent-primary-hover transition-colors w-full text-center">
            View all {actions.length} suggestions
          </button>
        </div>
      )}
    </Card>
  );
}

/**
 * Hook to generate next best actions from various data sources
 * 
 * This analyzes tasks, meetings, prospects, and households to
 * suggest contextual actions with explanations.
 */
export function useNextBestActions(data: {
  tasks?: Array<{ id: string; title: string; dueDate?: string; status?: string; householdId?: string; householdName?: string }>;
  meetings?: Array<{ id: string; title: string; startTime: string; householdId?: string; householdName?: string }>;
  prospects?: Array<{ id: string; firstName: string; lastName: string; stage: string; nextFollowUpDate?: string; expectedRevenue?: number }>;
  households?: Array<{ id: string; name: string; lastContactDate?: string; nextReviewDate?: string }>;
}): NextBestAction[] {
  return useMemo(() => {
    const actions: NextBestAction[] = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Overdue tasks
    data.tasks?.forEach(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return;
      if (task.dueDate && new Date(task.dueDate) < now) {
        actions.push({
          id: `task-overdue-${task.id}`,
          type: 'alert',
          title: task.title,
          reason: 'This task is past its due date and needs immediate attention.',
          priority: 'high',
          entityType: 'task',
          entityId: task.id,
          entityName: task.householdName,
          dueDate: task.dueDate,
          actionLabel: 'Complete',
        });
      }
    });

    // Upcoming meetings - prep needed
    data.meetings?.forEach(meeting => {
      const meetingTime = new Date(meeting.startTime);
      if (meetingTime > now && meetingTime < tomorrow) {
        actions.push({
          id: `meeting-prep-${meeting.id}`,
          type: 'meeting',
          title: `Prepare for: ${meeting.title}`,
          reason: 'Meeting is within 24 hours. Review client profile and recent activity.',
          priority: 'high',
          entityType: 'household',
          entityId: meeting.householdId,
          entityName: meeting.householdName,
          dueDate: meeting.startTime,
          actionLabel: 'Prep',
        });
      }
    });

    // Prospects needing follow-up
    data.prospects?.forEach(prospect => {
      if (prospect.nextFollowUpDate) {
        const followUp = new Date(prospect.nextFollowUpDate);
        if (followUp < now) {
          actions.push({
            id: `prospect-followup-${prospect.id}`,
            type: 'call',
            title: `Follow up with ${prospect.firstName} ${prospect.lastName}`,
            reason: `Follow-up was scheduled for ${new Date(prospect.nextFollowUpDate).toLocaleDateString()}. Don't let this lead go cold.`,
            priority: 'medium',
            entityType: 'prospect',
            entityId: prospect.id,
            entityName: prospect.expectedRevenue ? `$${prospect.expectedRevenue.toLocaleString()} potential` : undefined,
            dueDate: prospect.nextFollowUpDate,
            actionLabel: 'Call',
          });
        }
      }
    });

    // Households needing review
    data.households?.forEach(household => {
      if (household.nextReviewDate) {
        const reviewDate = new Date(household.nextReviewDate);
        if (reviewDate < nextWeek && reviewDate > now) {
          actions.push({
            id: `household-review-${household.id}`,
            type: 'review',
            title: `Annual review: ${household.name}`,
            reason: 'Annual review is coming up. Schedule and prepare materials.',
            priority: 'medium',
            entityType: 'household',
            entityId: household.id,
            entityName: household.name,
            dueDate: household.nextReviewDate,
            actionLabel: 'Schedule',
          });
        }
      }

      // No contact in 30+ days
      if (household.lastContactDate) {
        const lastContact = new Date(household.lastContactDate);
        const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000));
        if (daysSinceContact > 30) {
          actions.push({
            id: `household-contact-${household.id}`,
            type: 'call',
            title: `Check in with ${household.name}`,
            reason: `No contact in ${daysSinceContact} days. A quick check-in strengthens relationships.`,
            priority: 'low',
            entityType: 'household',
            entityId: household.id,
            entityName: household.name,
            actionLabel: 'Contact',
          });
        }
      }
    });

    return actions;
  }, [data]);
}
