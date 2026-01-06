'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import { formatRelativeTime, formatDateTime } from '../ui/utils';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  FunnelIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, Button, Badge, EmptyState, Skeleton } from '../ui';

/**
 * ActivityTimeline Component
 * 
 * A beautiful, interactive timeline showing all touchpoints with a client.
 * This is a "magic" feature that gives advisors instant context about
 * their relationship with any client.
 * 
 * Features:
 * - Grouped by time period (Today, This Week, This Month, etc.)
 * - Filterable by activity type
 * - Expandable details
 * - Relative timestamps
 * - Color-coded activity types
 */

export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'document' | 'task' | 'note' | 'transaction' | 'onboarding' | 'review';
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
  householdId?: string;
  personId?: string;
  accountId?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const activityConfig: Record<Activity['type'], { 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  email: {
    icon: <EnvelopeIcon className="w-4 h-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Email',
  },
  call: {
    icon: <PhoneIcon className="w-4 h-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Call',
  },
  meeting: {
    icon: <CalendarIcon className="w-4 h-4" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    label: 'Meeting',
  },
  document: {
    icon: <DocumentIcon className="w-4 h-4" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    label: 'Document',
  },
  task: {
    icon: <CheckCircleIcon className="w-4 h-4" />,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    label: 'Task',
  },
  note: {
    icon: <ChatBubbleLeftIcon className="w-4 h-4" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    label: 'Note',
  },
  transaction: {
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Transaction',
  },
  onboarding: {
    icon: <UserPlusIcon className="w-4 h-4" />,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    label: 'Onboarding',
  },
  review: {
    icon: <ArrowPathIcon className="w-4 h-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Review',
  },
};

// Group activities by time period
function groupActivitiesByTime(activities: Activity[]): Record<string, Activity[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const groups: Record<string, Activity[]> = {
    'Today': [],
    'This Week': [],
    'This Month': [],
    'Last Month': [],
    'Earlier': [],
  };

  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    
    if (date >= today) {
      groups['Today'].push(activity);
    } else if (date >= thisWeek) {
      groups['This Week'].push(activity);
    } else if (date >= thisMonth) {
      groups['This Month'].push(activity);
    } else if (date >= lastMonth) {
      groups['Last Month'].push(activity);
    } else {
      groups['Earlier'].push(activity);
    }
  });

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, items]) => items.length > 0)
  );
}

function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = activityConfig[activity.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative pl-8"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <span className={config.color}>{config.icon}</span>
      </div>

      {/* Content */}
      <div
        className={cn(
          'pb-6 cursor-pointer group',
          'transition-colors'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-content-primary group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
              {activity.title}
            </p>
            {!isExpanded && activity.description && (
              <p className="text-sm text-content-secondary truncate mt-0.5">
                {activity.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-content-tertiary">
              {formatRelativeTime(activity.timestamp)}
            </span>
            {activity.description && (
              <ChevronDownIcon
                className={cn(
                  'w-4 h-4 text-content-tertiary transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            )}
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && activity.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-surface-secondary rounded-lg text-sm text-content-secondary">
                {activity.description}
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border text-xs text-content-tertiary">
                  {activity.user && (
                    <span>by {activity.user.name}</span>
                  )}
                  <span>{formatDateTime(activity.timestamp)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function ActivityTimeline({
  activities,
  loading = false,
  emptyMessage = 'No activity yet',
  maxItems,
  className,
  onLoadMore,
  hasMore = false,
}: ActivityTimelineProps) {
  const [filter, setFilter] = React.useState<Activity['type'] | 'all'>('all');
  const [showFilters, setShowFilters] = React.useState(false);

  const filteredActivities = React.useMemo(() => {
    let filtered = filter === 'all' 
      ? activities 
      : activities.filter(a => a.type === filter);
    
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }
    
    return filtered;
  }, [activities, filter, maxItems]);

  const groupedActivities = React.useMemo(
    () => groupActivitiesByTime(filteredActivities),
    [filteredActivities]
  );

  const activityCounts = React.useMemo(() => {
    const counts: Partial<Record<Activity['type'], number>> = {};
    activities.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader title="Activity Timeline" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader title="Activity Timeline" />
        <div className="p-4">
          <EmptyState
            icon={<ClockIcon />}
            title="No activity"
            description={emptyMessage}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader 
        title="Activity Timeline"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-4 h-4 mr-1" />
            Filter
          </Button>
        }
      />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  filter === 'all'
                    ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300'
                    : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
                )}
              >
                All ({activities.length})
              </button>
              {Object.entries(activityConfig).map(([type, config]) => {
                const count = activityCounts[type as Activity['type']] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type as Activity['type'])}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                      filter === type
                        ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300'
                        : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
                    )}
                  >
                    {config.label} ({count})
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="p-4">
        {Object.entries(groupedActivities).map(([period, items]) => (
          <div key={period} className="mb-6 last:mb-0">
            <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3">
              {period}
            </h3>
            {items.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === items.length - 1}
              />
            ))}
          </div>
        ))}

        {/* Load More */}
        {hasMore && onLoadMore && (
          <div className="text-center pt-4">
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Load more activity
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// Hook to fetch activities for an entity
export function useActivityTimeline(entityType: string, entityId: string) {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(false);

  const fetchActivities = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // In a real app, this would call an API
      // For now, generate mock data
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'meeting',
          title: 'Quarterly review meeting',
          description: 'Discussed portfolio performance and rebalancing strategy. Client expressed interest in ESG investments.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: { id: '1', name: 'Sarah Chen' },
        },
        {
          id: '2',
          type: 'email',
          title: 'Sent portfolio summary report',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user: { id: '1', name: 'Sarah Chen' },
        },
        {
          id: '3',
          type: 'call',
          title: 'Follow-up call about tax-loss harvesting',
          description: 'Explained the benefits and timing of tax-loss harvesting strategy.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: '2', name: 'Michael Ross' },
        },
        {
          id: '4',
          type: 'document',
          title: 'Uploaded IPS document',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: '1', name: 'Sarah Chen' },
        },
        {
          id: '5',
          type: 'transaction',
          title: 'Processed contribution: $25,000',
          description: 'Annual IRA contribution for tax year 2024',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          type: 'task',
          title: 'Completed beneficiary update',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: '1', name: 'Sarah Chen' },
        },
        {
          id: '7',
          type: 'review',
          title: 'Annual compliance review',
          description: 'Completed annual suitability review and updated risk profile.',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: '3', name: 'Compliance Team' },
        },
        {
          id: '8',
          type: 'onboarding',
          title: 'Client onboarded',
          description: 'Completed all onboarding documentation and account setup.',
          timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: '1', name: 'Sarah Chen' },
        },
      ];

      setActivities(mockActivities);
      setHasMore(false);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    hasMore,
    loadMore: () => fetchActivities(2),
    refetch: fetchActivities,
  };
}

export default ActivityTimeline;
