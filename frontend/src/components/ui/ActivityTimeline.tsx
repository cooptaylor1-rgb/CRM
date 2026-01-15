'use client';

import * as React from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  | 'email_sent'
  | 'email_received'
  | 'call_outbound'
  | 'call_inbound'
  | 'meeting'
  | 'video_call'
  | 'note'
  | 'task_created'
  | 'task_completed'
  | 'document_uploaded'
  | 'document_signed'
  | 'trade_executed'
  | 'account_opened'
  | 'account_funded'
  | 'transfer'
  | 'withdrawal'
  | 'fee_charged'
  | 'review_completed'
  | 'compliance_alert'
  | 'milestone'
  | 'birthday'
  | 'anniversary'
  | 'life_event'
  | 'status_change'
  | 'comment'
  | 'system';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    initials?: string;
  };
  client?: {
    id: string;
    name: string;
  };
  metadata?: {
    duration?: number; // For calls/meetings in minutes
    amount?: number; // For financial activities
    status?: string;
    attachments?: Array<{ name: string; url: string; type: string }>;
    participants?: Array<{ name: string; email?: string }>;
    link?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    aiSummary?: string;
    tags?: string[];
  };
  isRead?: boolean;
  isPinned?: boolean;
  threadId?: string; // For grouping related activities
}

export interface ActivityFilter {
  types?: ActivityType[];
  dateRange?: { start: Date; end: Date };
  users?: string[];
  clients?: string[];
  search?: string;
  isPinned?: boolean;
  hasAttachments?: boolean;
}

// ============================================================================
// Activity Timeline Component
// ============================================================================

export interface ActivityTimelineProps {
  activities: ActivityItem[];
  onActivityClick?: (activity: ActivityItem) => void;
  onActivityPin?: (activityId: string, pinned: boolean) => void;
  onActivityDelete?: (activityId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  filter?: ActivityFilter;
  onFilterChange?: (filter: ActivityFilter) => void;
  groupBy?: 'none' | 'day' | 'week' | 'month' | 'type';
  showFilters?: boolean;
  showSearch?: boolean;
  compactMode?: boolean;
  maxHeight?: string | number;
  className?: string;
}

export function ActivityTimeline({
  activities,
  onActivityClick,
  onActivityPin,
  onActivityDelete,
  onLoadMore,
  hasMore = false,
  loading = false,
  filter,
  onFilterChange,
  groupBy = 'day',
  showFilters = true,
  showSearch = true,
  compactMode = false,
  maxHeight,
  className,
}: ActivityTimelineProps) {
  const [searchQuery, setSearchQuery] = useState(filter?.search || '');
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter((a) => a.type === activeFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.user?.name.toLowerCase().includes(query) ||
          a.client?.name.toLowerCase().includes(query)
      );
    }

    // Apply custom filter
    if (filter) {
      if (filter.types?.length) {
        result = result.filter((a) => filter.types!.includes(a.type));
      }
      if (filter.dateRange) {
        result = result.filter(
          (a) =>
            a.timestamp >= filter.dateRange!.start &&
            a.timestamp <= filter.dateRange!.end
        );
      }
      if (filter.users?.length) {
        result = result.filter((a) => a.user && filter.users!.includes(a.user.id));
      }
      if (filter.clients?.length) {
        result = result.filter((a) => a.client && filter.clients!.includes(a.client.id));
      }
      if (filter.isPinned !== undefined) {
        result = result.filter((a) => a.isPinned === filter.isPinned);
      }
      if (filter.hasAttachments) {
        result = result.filter((a) => a.metadata?.attachments?.length);
      }
    }

    return result;
  }, [activities, activeFilter, searchQuery, filter]);

  // Group activities
  const groupedActivities = useMemo(() => {
    if (groupBy === 'none') {
      return [{ label: '', activities: filteredActivities }];
    }

    const groups: Map<string, ActivityItem[]> = new Map();

    filteredActivities.forEach((activity) => {
      let groupKey: string;

      switch (groupBy) {
        case 'day':
          groupKey = formatDateGroup(activity.timestamp, 'day');
          break;
        case 'week':
          groupKey = formatDateGroup(activity.timestamp, 'week');
          break;
        case 'month':
          groupKey = formatDateGroup(activity.timestamp, 'month');
          break;
        case 'type':
          groupKey = getActivityTypeLabel(activity.type);
          break;
        default:
          groupKey = '';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(activity);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      activities: items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }));
  }, [filteredActivities, groupBy]);

  // Infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, loading]);

  // Activity type counts for filters
  const typeCounts = useMemo(() => {
    const counts: Map<ActivityType, number> = new Map();
    activities.forEach((a) => {
      counts.set(a.type, (counts.get(a.type) || 0) + 1);
    });
    return counts;
  }, [activities]);

  return (
    <div className={cn('flex flex-col bg-neutral-900', className)}>
      {/* Header with Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="p-4 border-b border-neutral-800 space-y-3">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2 text-sm rounded-lg',
                  'bg-neutral-800 border border-neutral-700',
                  'text-white placeholder-neutral-500',
                  'focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-neutral-700"
                >
                  <CloseIcon className="w-3 h-3 text-neutral-400" />
                </button>
              )}
            </div>
          )}

          {/* Quick Filters */}
          {showFilters && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <FilterButton
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                count={activities.length}
              >
                All
              </FilterButton>
              {activityCategories.map((category) => {
                const count = category.types.reduce(
                  (sum, type) => sum + (typeCounts.get(type) || 0),
                  0
                );
                if (count === 0) return null;
                return (
                  <FilterButton
                    key={category.label}
                    active={category.types.includes(activeFilter as ActivityType)}
                    onClick={() => setActiveFilter(category.types[0])}
                    icon={category.icon}
                    count={count}
                  >
                    {category.label}
                  </FilterButton>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Timeline Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <EmptyIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No activities found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-accent-400 hover:text-accent-300"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-800" />

            {groupedActivities.map((group) => (
              <div key={group.label} className="relative">
                {/* Group Header */}
                {group.label && groupBy !== 'none' && (
                  <div className="sticky top-0 z-10 px-4 py-2 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                )}

                {/* Activities */}
                <div className="py-2">
                  {group.activities.map((activity, index) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      isExpanded={expandedActivity === activity.id}
                      onClick={() => {
                        setExpandedActivity(
                          expandedActivity === activity.id ? null : activity.id
                        );
                        onActivityClick?.(activity);
                      }}
                      onPin={onActivityPin}
                      onDelete={onActivityDelete}
                      compact={compactMode}
                      isLast={index === group.activities.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="px-4 py-4 text-center">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <LoadingSpinner className="w-4 h-4" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                ) : (
                  <button
                    onClick={onLoadMore}
                    className="text-sm text-accent-400 hover:text-accent-300"
                  >
                    Load more activities
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Card
// ============================================================================

interface ActivityCardProps {
  activity: ActivityItem;
  isExpanded: boolean;
  onClick: () => void;
  onPin?: (activityId: string, pinned: boolean) => void;
  onDelete?: (activityId: string) => void;
  compact?: boolean;
  isLast?: boolean;
}

function ActivityCard({
  activity,
  isExpanded,
  onClick,
  onPin,
  onDelete,
  compact = false,
  isLast = false,
}: ActivityCardProps) {
  const [showActions, setShowActions] = useState(false);
  const activityConfig = getActivityConfig(activity.type);

  return (
    <div
      className={cn(
        'relative pl-12 pr-4 py-2',
        'hover:bg-neutral-800/30 cursor-pointer transition-colors',
        !activity.isRead && 'bg-accent-900/10'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-4 top-3 w-4 h-4 rounded-full border-2 z-10',
          'bg-neutral-900',
          activityConfig.dotColor
        )}
      >
        {activity.isPinned && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            activityConfig.bgColor
          )}
        >
          <activityConfig.icon className={cn('w-4 h-4', activityConfig.iconColor)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white truncate">
              {activity.title}
            </span>
            {activity.metadata?.sentiment && (
              <SentimentBadge sentiment={activity.metadata.sentiment} />
            )}
          </div>

          {/* Description */}
          {activity.description && !compact && (
            <p className="text-sm text-neutral-400 line-clamp-2 mb-1">
              {activity.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>{formatTimeAgo(activity.timestamp)}</span>
            {activity.user && (
              <span className="flex items-center gap-1">
                {activity.user.avatar ? (
                  <img
                    src={activity.user.avatar}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center">
                    <span className="text-[8px] text-white">
                      {activity.user.initials || activity.user.name[0]}
                    </span>
                  </div>
                )}
                {activity.user.name}
              </span>
            )}
            {activity.client && (
              <span className="truncate">• {activity.client.name}</span>
            )}
            {activity.metadata?.duration && (
              <span>• {activity.metadata.duration} min</span>
            )}
            {activity.metadata?.amount && (
              <span className="text-green-400">
                • ${activity.metadata.amount.toLocaleString()}
              </span>
            )}
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-neutral-800 space-y-3">
                  {/* AI Summary */}
                  {activity.metadata?.aiSummary && (
                    <div className="p-3 bg-accent-900/20 border border-accent-800/30 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AIIcon className="w-3.5 h-3.5 text-accent-400" />
                        <span className="text-xs font-medium text-accent-400">
                          AI Summary
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300">
                        {activity.metadata.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* Participants */}
                  {activity.metadata?.participants &&
                    activity.metadata.participants.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-neutral-400 mb-1.5 block">
                          Participants
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activity.metadata.participants.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs bg-neutral-800 text-neutral-300 rounded"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Attachments */}
                  {activity.metadata?.attachments &&
                    activity.metadata.attachments.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-neutral-400 mb-1.5 block">
                          Attachments
                        </span>
                        <div className="space-y-1">
                          {activity.metadata.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded hover:bg-neutral-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AttachmentIcon className="w-4 h-4 text-neutral-400" />
                              <span className="text-sm text-neutral-300 truncate">
                                {att.name}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Tags */}
                  {activity.metadata?.tags && activity.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activity.metadata.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Link */}
                  {activity.metadata?.link && (
                    <a
                      href={activity.metadata.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View details
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {onPin && (
                <button
                  onClick={() => onPin(activity.id, !activity.isPinned)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    activity.isPinned
                      ? 'bg-accent-600/20 text-accent-400'
                      : 'hover:bg-neutral-700 text-neutral-400'
                  )}
                  title={activity.isPinned ? 'Unpin' : 'Pin'}
                >
                  <PinIcon className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(activity.id)}
                  className="p-1.5 rounded-lg hover:bg-red-600/20 text-neutral-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// Mini Timeline (for embedding in other components)
// ============================================================================

export interface MiniTimelineProps {
  activities: ActivityItem[];
  limit?: number;
  onViewAll?: () => void;
  className?: string;
}

export function MiniTimeline({
  activities,
  limit = 5,
  onViewAll,
  className,
}: MiniTimelineProps) {
  const displayActivities = activities.slice(0, limit);

  return (
    <div className={cn('bg-neutral-800/50 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Recent Activity</h3>
        {onViewAll && activities.length > limit && (
          <button
            onClick={onViewAll}
            className="text-xs text-accent-400 hover:text-accent-300"
          >
            View all ({activities.length})
          </button>
        )}
      </div>

      {displayActivities.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {displayActivities.map((activity) => {
            const config = getActivityConfig(activity.type);
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
                    config.bgColor
                  )}
                >
                  <config.icon className={cn('w-3.5 h-3.5', config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.title}</p>
                  <p className="text-xs text-neutral-500">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Button
// ============================================================================

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.FC<{ className?: string }>;
  count?: number;
}

function FilterButton({
  children,
  active,
  onClick,
  icon: Icon,
  count,
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap',
        'transition-all duration-200',
        active
          ? 'bg-accent-600 text-white'
          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.5 text-[10px] rounded-full',
            active ? 'bg-white/20' : 'bg-neutral-700'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Sentiment Badge
// ============================================================================

function SentimentBadge({
  sentiment,
}: {
  sentiment: 'positive' | 'neutral' | 'negative';
}) {
  const configs = {
    positive: { color: 'bg-green-900/50 text-green-400', icon: '↑' },
    neutral: { color: 'bg-neutral-700 text-neutral-400', icon: '→' },
    negative: { color: 'bg-red-900/50 text-red-400', icon: '↓' },
  };

  const config = configs[sentiment];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded',
        config.color
      )}
    >
      {config.icon}
    </span>
  );
}

// ============================================================================
// Configuration
// ============================================================================

const activityCategories = [
  {
    label: 'Communications',
    types: ['email_sent', 'email_received', 'call_outbound', 'call_inbound'] as ActivityType[],
    icon: EmailIcon,
  },
  {
    label: 'Meetings',
    types: ['meeting', 'video_call', 'review_completed'] as ActivityType[],
    icon: CalendarIcon,
  },
  {
    label: 'Tasks',
    types: ['task_created', 'task_completed', 'note', 'comment'] as ActivityType[],
    icon: TaskIcon,
  },
  {
    label: 'Documents',
    types: ['document_uploaded', 'document_signed'] as ActivityType[],
    icon: DocumentIcon,
  },
  {
    label: 'Financial',
    types: ['trade_executed', 'account_opened', 'account_funded', 'transfer', 'withdrawal', 'fee_charged'] as ActivityType[],
    icon: FinancialIcon,
  },
  {
    label: 'Life Events',
    types: ['milestone', 'birthday', 'anniversary', 'life_event'] as ActivityType[],
    icon: CelebrationIcon,
  },
];

function getActivityConfig(type: ActivityType) {
  const configs: Record<
    ActivityType,
    {
      icon: React.FC<{ className?: string }>;
      bgColor: string;
      iconColor: string;
      dotColor: string;
    }
  > = {
    email_sent: {
      icon: EmailIcon,
      bgColor: 'bg-blue-900/30',
      iconColor: 'text-blue-400',
      dotColor: 'border-blue-500',
    },
    email_received: {
      icon: EmailIcon,
      bgColor: 'bg-blue-900/30',
      iconColor: 'text-blue-400',
      dotColor: 'border-blue-500',
    },
    call_outbound: {
      icon: PhoneIcon,
      bgColor: 'bg-green-900/30',
      iconColor: 'text-green-400',
      dotColor: 'border-green-500',
    },
    call_inbound: {
      icon: PhoneIcon,
      bgColor: 'bg-green-900/30',
      iconColor: 'text-green-400',
      dotColor: 'border-green-500',
    },
    meeting: {
      icon: CalendarIcon,
      bgColor: 'bg-purple-900/30',
      iconColor: 'text-purple-400',
      dotColor: 'border-purple-500',
    },
    video_call: {
      icon: VideoIcon,
      bgColor: 'bg-purple-900/30',
      iconColor: 'text-purple-400',
      dotColor: 'border-purple-500',
    },
    note: {
      icon: NoteIcon,
      bgColor: 'bg-yellow-900/30',
      iconColor: 'text-yellow-400',
      dotColor: 'border-yellow-500',
    },
    task_created: {
      icon: TaskIcon,
      bgColor: 'bg-orange-900/30',
      iconColor: 'text-orange-400',
      dotColor: 'border-orange-500',
    },
    task_completed: {
      icon: CheckIcon,
      bgColor: 'bg-green-900/30',
      iconColor: 'text-green-400',
      dotColor: 'border-green-500',
    },
    document_uploaded: {
      icon: DocumentIcon,
      bgColor: 'bg-cyan-900/30',
      iconColor: 'text-cyan-400',
      dotColor: 'border-cyan-500',
    },
    document_signed: {
      icon: SignatureIcon,
      bgColor: 'bg-emerald-900/30',
      iconColor: 'text-emerald-400',
      dotColor: 'border-emerald-500',
    },
    trade_executed: {
      icon: TradeIcon,
      bgColor: 'bg-indigo-900/30',
      iconColor: 'text-indigo-400',
      dotColor: 'border-indigo-500',
    },
    account_opened: {
      icon: AccountIcon,
      bgColor: 'bg-teal-900/30',
      iconColor: 'text-teal-400',
      dotColor: 'border-teal-500',
    },
    account_funded: {
      icon: FinancialIcon,
      bgColor: 'bg-green-900/30',
      iconColor: 'text-green-400',
      dotColor: 'border-green-500',
    },
    transfer: {
      icon: TransferIcon,
      bgColor: 'bg-blue-900/30',
      iconColor: 'text-blue-400',
      dotColor: 'border-blue-500',
    },
    withdrawal: {
      icon: WithdrawalIcon,
      bgColor: 'bg-red-900/30',
      iconColor: 'text-red-400',
      dotColor: 'border-red-500',
    },
    fee_charged: {
      icon: FeeIcon,
      bgColor: 'bg-neutral-700',
      iconColor: 'text-neutral-400',
      dotColor: 'border-neutral-500',
    },
    review_completed: {
      icon: ReviewIcon,
      bgColor: 'bg-accent-900/30',
      iconColor: 'text-accent-400',
      dotColor: 'border-accent-500',
    },
    compliance_alert: {
      icon: AlertIcon,
      bgColor: 'bg-red-900/30',
      iconColor: 'text-red-400',
      dotColor: 'border-red-500',
    },
    milestone: {
      icon: MilestoneIcon,
      bgColor: 'bg-pink-900/30',
      iconColor: 'text-pink-400',
      dotColor: 'border-pink-500',
    },
    birthday: {
      icon: CelebrationIcon,
      bgColor: 'bg-pink-900/30',
      iconColor: 'text-pink-400',
      dotColor: 'border-pink-500',
    },
    anniversary: {
      icon: HeartIcon,
      bgColor: 'bg-pink-900/30',
      iconColor: 'text-pink-400',
      dotColor: 'border-pink-500',
    },
    life_event: {
      icon: StarIcon,
      bgColor: 'bg-amber-900/30',
      iconColor: 'text-amber-400',
      dotColor: 'border-amber-500',
    },
    status_change: {
      icon: StatusIcon,
      bgColor: 'bg-neutral-700',
      iconColor: 'text-neutral-400',
      dotColor: 'border-neutral-500',
    },
    comment: {
      icon: CommentIcon,
      bgColor: 'bg-neutral-700',
      iconColor: 'text-neutral-400',
      dotColor: 'border-neutral-500',
    },
    system: {
      icon: SystemIcon,
      bgColor: 'bg-neutral-800',
      iconColor: 'text-neutral-500',
      dotColor: 'border-neutral-600',
    },
  };

  return configs[type] || configs.system;
}

function getActivityTypeLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    email_sent: 'Emails Sent',
    email_received: 'Emails Received',
    call_outbound: 'Outbound Calls',
    call_inbound: 'Inbound Calls',
    meeting: 'Meetings',
    video_call: 'Video Calls',
    note: 'Notes',
    task_created: 'Tasks Created',
    task_completed: 'Tasks Completed',
    document_uploaded: 'Documents',
    document_signed: 'Signatures',
    trade_executed: 'Trades',
    account_opened: 'Accounts Opened',
    account_funded: 'Funding',
    transfer: 'Transfers',
    withdrawal: 'Withdrawals',
    fee_charged: 'Fees',
    review_completed: 'Reviews',
    compliance_alert: 'Compliance',
    milestone: 'Milestones',
    birthday: 'Birthdays',
    anniversary: 'Anniversaries',
    life_event: 'Life Events',
    status_change: 'Status Changes',
    comment: 'Comments',
    system: 'System',
  };
  return labels[type] || type;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatDateGroup(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (groupBy === 'day') {
    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  if (groupBy === 'week') {
    const weekStart = new Date(dateOnly);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return `Week of ${weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  }

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ============================================================================
// Icons
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SignatureIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TradeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function FinancialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TransferIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function WithdrawalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function FeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function MilestoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function CelebrationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function StatusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function AttachmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export default ActivityTimeline;
