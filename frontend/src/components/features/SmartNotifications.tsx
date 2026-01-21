'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, formatCurrency, formatDate } from '../ui';
import {
  BellIcon,
  BellAlertIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HeartIcon,
  AdjustmentsHorizontalIcon,
  EyeSlashIcon,
  StarIcon,
  TrashIcon,
  ArchiveBoxIcon,
  BellSlashIcon,
  FunnelIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '../ui/utils';

/**
 * SmartNotifications - Intelligent Alert System
 * 
 * Goes beyond simple notifications to provide:
 * - Smart prioritization based on advisor patterns
 * - Grouped notifications to reduce noise
 * - Action suggestions for each notification
 * - Learning what matters to each advisor
 */

export type NotificationType =
  | 'client_update'
  | 'task_due'
  | 'meeting_reminder'
  | 'portfolio_alert'
  | 'compliance'
  | 'milestone'
  | 'life_event'
  | 'market_alert'
  | 'document'
  | 'risk_alert'
  | 'opportunity'
  | 'system';

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  groupId?: string; // For grouping related notifications
  
  // Smart features
  aiSummary?: string; // AI-generated summary for complex notifications
  suggestedActions?: {
    label: string;
    action: string;
    primary?: boolean;
  }[];
  relatedEntity?: {
    type: 'client' | 'household' | 'task' | 'meeting' | 'document';
    id: string;
    name: string;
  };
  
  // Learning/preference features
  snoozedUntil?: string;
  importance?: number; // Learned importance 0-100
  interactionHistory?: {
    action: 'dismissed' | 'snoozed' | 'acted' | 'viewed';
    timestamp: string;
  }[];
  
  // Visual
  icon?: string;
  color?: string;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;
  title: string;
  notifications: SmartNotification[];
  count: number;
  latestTimestamp: string;
}

export interface NotificationPreferences {
  mutedTypes: NotificationType[];
  priorityOverrides: Record<string, NotificationPriority>;
  quietHours: { start: string; end: string } | null;
  groupSimilar: boolean;
  showAiSummaries: boolean;
}

export interface SmartNotificationsProps {
  notifications: SmartNotification[];
  preferences?: NotificationPreferences;
  isLoading?: boolean;
  className?: string;
  onNotificationClick?: (notification: SmartNotification) => void;
  onDismiss?: (notificationId: string) => void;
  onDismissAll?: () => void;
  onMarkRead?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onSnooze?: (notificationId: string, until: string) => void;
  onAction?: (notification: SmartNotification, action: string) => void;
  onUpdatePreferences?: (prefs: Partial<NotificationPreferences>) => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  client_update: <UserGroupIcon className="w-4 h-4" />,
  task_due: <ClockIcon className="w-4 h-4" />,
  meeting_reminder: <CalendarIcon className="w-4 h-4" />,
  portfolio_alert: <ChartBarIcon className="w-4 h-4" />,
  compliance: <ExclamationTriangleIcon className="w-4 h-4" />,
  milestone: <StarIcon className="w-4 h-4" />,
  life_event: <HeartIcon className="w-4 h-4" />,
  market_alert: <ArrowTrendingUpIcon className="w-4 h-4" />,
  document: <DocumentTextIcon className="w-4 h-4" />,
  risk_alert: <ExclamationTriangleIcon className="w-4 h-4" />,
  opportunity: <SparklesIcon className="w-4 h-4" />,
  system: <BellIcon className="w-4 h-4" />,
};

const notificationColors: Record<NotificationType, { bg: string; icon: string }> = {
  client_update: { bg: 'bg-blue-500/10', icon: 'text-blue-500' },
  task_due: { bg: 'bg-amber-500/10', icon: 'text-amber-500' },
  meeting_reminder: { bg: 'bg-purple-500/10', icon: 'text-purple-500' },
  portfolio_alert: { bg: 'bg-indigo-500/10', icon: 'text-indigo-500' },
  compliance: { bg: 'bg-red-500/10', icon: 'text-red-500' },
  milestone: { bg: 'bg-amber-500/10', icon: 'text-amber-500' },
  life_event: { bg: 'bg-pink-500/10', icon: 'text-pink-500' },
  market_alert: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
  document: { bg: 'bg-slate-500/10', icon: 'text-slate-500' },
  risk_alert: { bg: 'bg-red-500/10', icon: 'text-red-500' },
  opportunity: { bg: 'bg-green-500/10', icon: 'text-green-500' },
  system: { bg: 'bg-slate-500/10', icon: 'text-slate-500' },
};

const priorityStyles: Record<NotificationPriority, string> = {
  urgent: 'border-l-4 border-l-red-500 bg-red-500/5',
  high: 'border-l-4 border-l-amber-500 bg-amber-500/5',
  normal: 'border-l-4 border-l-transparent',
  low: 'border-l-4 border-l-transparent opacity-75',
};

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

function NotificationCard({
  notification,
  onDismiss,
  onMarkRead,
  onSnooze,
  onClick,
  onAction,
}: {
  notification: SmartNotification;
  onDismiss?: () => void;
  onMarkRead?: () => void;
  onSnooze?: (until: string) => void;
  onClick?: () => void;
  onAction?: (action: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const colors = notificationColors[notification.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={cn(
        'relative p-4 rounded-lg transition-all cursor-pointer',
        'hover:bg-surface-secondary/50',
        priorityStyles[notification.priority],
        !notification.read && 'bg-accent-primary/5'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          colors.bg, colors.icon
        )}>
          {notificationIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-medium text-sm',
                notification.read ? 'text-content-secondary' : 'text-content-primary'
              )}>
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-accent-primary" />
              )}
              {notification.priority === 'urgent' && (
                <Badge variant="error" size="sm">Urgent</Badge>
              )}
            </div>
            <span className="text-xs text-content-tertiary flex-shrink-0">
              {formatTimeAgo(notification.timestamp)}
            </span>
          </div>

          <p className={cn(
            'text-sm mt-1',
            notification.read ? 'text-content-tertiary' : 'text-content-secondary'
          )}>
            {notification.message}
          </p>

          {/* AI Summary */}
          {notification.aiSummary && (
            <div className="mt-2 p-2 rounded bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center gap-1 text-xs text-purple-500 mb-1">
                <SparklesIcon className="w-3 h-3" />
                AI Summary
              </div>
              <p className="text-xs text-content-secondary">{notification.aiSummary}</p>
            </div>
          )}

          {/* Related Entity */}
          {notification.relatedEntity && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-secondary text-xs text-content-secondary">
              <UserGroupIcon className="w-3 h-3" />
              {notification.relatedEntity.name}
            </div>
          )}

          {/* Suggested Actions */}
          {notification.suggestedActions && notification.suggestedActions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {notification.suggestedActions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={action.primary ? 'primary' : 'secondary'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(action.action);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Learned importance indicator */}
          {notification.importance !== undefined && notification.importance > 80 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
              <StarIcon className="w-3 h-3" />
              High importance based on your activity
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-2 right-2 flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              {!notification.read && (
                <button
                  onClick={onMarkRead}
                  className="p-1.5 rounded-md hover:bg-surface-secondary text-content-tertiary hover:text-content-primary transition-colors"
                  title="Mark as read"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onSnooze?.(new Date(Date.now() + 3600000).toISOString())}
                className="p-1.5 rounded-md hover:bg-surface-secondary text-content-tertiary hover:text-content-primary transition-colors"
                title="Snooze 1 hour"
              >
                <ClockIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-content-tertiary hover:text-red-500 transition-colors"
                title="Dismiss"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function NotificationGroupCard({
  group,
  onExpand,
}: {
  group: NotificationGroup;
  onExpand: () => void;
}) {
  const colors = notificationColors[group.type];
  const unreadCount = group.notifications.filter(n => !n.read).length;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onExpand}
      className={cn(
        'w-full p-4 rounded-lg text-left transition-all',
        'bg-surface-secondary/50 hover:bg-surface-secondary',
        'border border-border-default'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center relative',
          colors.bg, colors.icon
        )}>
          {notificationIcons[group.type]}
          {group.count > 1 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-primary text-white text-xs flex items-center justify-center font-medium">
              {group.count}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-content-primary">
              {group.title}
            </h4>
            {unreadCount > 0 && (
              <Badge variant="info" size="sm">{unreadCount} new</Badge>
            )}
          </div>
          <p className="text-xs text-content-tertiary mt-0.5">
            {group.count} notification{group.count > 1 ? 's' : ''} • Latest {formatTimeAgo(group.latestTimestamp)}
          </p>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-content-tertiary" />
      </div>
    </motion.button>
  );
}

type FilterValue = 'all' | NotificationPriority | NotificationType;

export function SmartNotifications({
  notifications,
  preferences = {
    mutedTypes: [],
    priorityOverrides: {},
    quietHours: null,
    groupSimilar: true,
    showAiSummaries: true,
  },
  isLoading = false,
  className,
  onNotificationClick,
  onDismiss,
  onDismissAll,
  onMarkRead,
  onMarkAllRead,
  onSnooze,
  onAction,
  onUpdatePreferences,
}: SmartNotificationsProps) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  // Filter out muted and dismissed notifications
  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.dismissed) return false;
      if (preferences.mutedTypes.includes(n.type)) return false;
      if (n.snoozedUntil && new Date(n.snoozedUntil) > new Date()) return false;
      if (filter === 'all') return true;
      if (['urgent', 'high', 'normal', 'low'].includes(filter)) return n.priority === filter;
      return n.type === filter;
    });
  }, [notifications, preferences, filter]);

  // Group similar notifications
  const groupedNotifications = useMemo(() => {
    if (!preferences.groupSimilar) {
      return { groups: [], ungrouped: visibleNotifications };
    }

    const groups: NotificationGroup[] = [];
    const ungrouped: SmartNotification[] = [];
    const groupMap = new Map<string, SmartNotification[]>();

    visibleNotifications.forEach(n => {
      if (n.groupId) {
        const existing = groupMap.get(n.groupId) || [];
        groupMap.set(n.groupId, [...existing, n]);
      } else {
        ungrouped.push(n);
      }
    });

    groupMap.forEach((notifs, groupId) => {
      if (notifs.length > 1) {
        groups.push({
          id: groupId,
          type: notifs[0].type,
          title: `${notifs.length} ${notifs[0].type.replace('_', ' ')} updates`,
          notifications: notifs,
          count: notifs.length,
          latestTimestamp: notifs.reduce((latest, n) => 
            new Date(n.timestamp) > new Date(latest) ? n.timestamp : latest, 
            notifs[0].timestamp
          ),
        });
      } else {
        ungrouped.push(...notifs);
      }
    });

    return { groups, ungrouped };
  }, [visibleNotifications, preferences.groupSimilar]);

  const unreadCount = visibleNotifications.filter(n => !n.read).length;
  const urgentCount = visibleNotifications.filter(n => n.priority === 'urgent').length;

  const handleToggleMute = useCallback((type: NotificationType) => {
    const newMuted = preferences.mutedTypes.includes(type)
      ? preferences.mutedTypes.filter(t => t !== type)
      : [...preferences.mutedTypes, type];
    onUpdatePreferences?.({ mutedTypes: newMuted });
  }, [preferences.mutedTypes, onUpdatePreferences]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-surface-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface-secondary rounded" />
                <div className="h-3 w-48 bg-surface-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <BellSolidIcon className={cn(
                'w-5 h-5',
                urgentCount > 0 ? 'text-red-500' : 'text-content-primary'
              )} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-primary text-white text-[10px] flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <h3 className="font-semibold text-content-primary">Notifications</h3>
            {urgentCount > 0 && (
              <Badge variant="error" size="sm">{urgentCount} urgent</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showPreferences ? 'bg-accent-primary/10 text-accent-primary' : 'text-content-tertiary hover:text-content-primary hover:bg-surface-secondary'
              )}
              title="Preferences"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
            </button>
            {onMarkAllRead && unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FunnelIcon className="w-4 h-4 text-content-tertiary flex-shrink-0" />
          {(['all', 'urgent', 'high'] as FilterValue[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors',
                filter === f
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Preferences Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content-secondary">Group similar notifications</span>
                  <button
                    onClick={() => onUpdatePreferences?.({ groupSimilar: !preferences.groupSimilar })}
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      preferences.groupSimilar ? 'bg-accent-primary' : 'bg-surface-tertiary'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      preferences.groupSimilar ? 'translate-x-5' : 'translate-x-1'
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content-secondary">Show AI summaries</span>
                  <button
                    onClick={() => onUpdatePreferences?.({ showAiSummaries: !preferences.showAiSummaries })}
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      preferences.showAiSummaries ? 'bg-accent-primary' : 'bg-surface-tertiary'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      preferences.showAiSummaries ? 'translate-x-5' : 'translate-x-1'
                    )} />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-content-secondary mb-2">Muted notification types</p>
                  <div className="flex flex-wrap gap-2">
                    {(['client_update', 'task_due', 'meeting_reminder', 'market_alert'] as NotificationType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => handleToggleMute(type)}
                        className={cn(
                          'px-2 py-1 rounded text-xs transition-colors',
                          preferences.mutedTypes.includes(type)
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
                        )}
                      >
                        {preferences.mutedTypes.includes(type) && <BellSlashIcon className="w-3 h-3 inline mr-1" />}
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {visibleNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellSlashIcon className="w-12 h-12 mx-auto text-content-tertiary opacity-50 mb-3" />
            <p className="text-content-secondary">All caught up!</p>
            <p className="text-xs text-content-tertiary mt-1">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Groups */}
            {groupedNotifications.groups.map(group => (
              <div key={group.id}>
                {expandedGroup === group.id ? (
                  <div className="p-2 space-y-2">
                    <button
                      onClick={() => setExpandedGroup(null)}
                      className="w-full p-2 text-left text-xs text-content-tertiary hover:text-content-secondary"
                    >
                      ← Back to grouped view
                    </button>
                    {group.notifications.map(notification => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onDismiss={() => onDismiss?.(notification.id)}
                        onMarkRead={() => onMarkRead?.(notification.id)}
                        onSnooze={(until) => onSnooze?.(notification.id, until)}
                        onClick={() => onNotificationClick?.(notification)}
                        onAction={(action) => onAction?.(notification, action)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-2">
                    <NotificationGroupCard
                      group={group}
                      onExpand={() => setExpandedGroup(group.id)}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Ungrouped */}
            {groupedNotifications.ungrouped.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={() => onDismiss?.(notification.id)}
                onMarkRead={() => onMarkRead?.(notification.id)}
                onSnooze={(until) => onSnooze?.(notification.id, until)}
                onClick={() => onNotificationClick?.(notification)}
                onAction={(action) => onAction?.(notification, action)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {visibleNotifications.length > 0 && (
        <div className="p-3 border-t border-border bg-surface-secondary/30 flex items-center justify-between">
          <button className="text-xs text-content-tertiary hover:text-content-secondary">
            <ArchiveBoxIcon className="w-4 h-4 inline mr-1" />
            View archived
          </button>
          {onDismissAll && (
            <button
              onClick={onDismissAll}
              className="text-xs text-red-500 hover:text-red-600"
            >
              <TrashIcon className="w-4 h-4 inline mr-1" />
              Clear all
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Notification Bell Button for header
 */
export function NotificationBell({
  count,
  urgentCount,
  onClick,
  className,
}: {
  count: number;
  urgentCount?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      data-testid="notification-bell"
      className={cn(
        'relative p-2 rounded-lg transition-colors',
        'hover:bg-surface-secondary text-content-secondary hover:text-content-primary',
        urgentCount && urgentCount > 0 && 'animate-pulse',
        className
      )}
    >
      {urgentCount && urgentCount > 0 ? (
        <BellAlertIcon className="w-5 h-5 text-red-500" />
      ) : (
        <BellIcon className="w-5 h-5" />
      )}
      {count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          data-testid="notification-badge"
          className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-medium px-1',
            urgentCount && urgentCount > 0
              ? 'bg-red-500 text-white'
              : 'bg-accent-primary text-white'
          )}
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </button>
  );
}

/**
 * Generate mock notifications for demo
 */
export function generateMockNotifications(): SmartNotification[] {
  return [
    {
      id: '1',
      type: 'risk_alert',
      priority: 'urgent',
      title: 'Client At Risk: Sarah Johnson',
      message: 'No contact in 45 days and portfolio down 8%. Immediate outreach recommended.',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      read: false,
      dismissed: false,
      aiSummary: 'Based on historical patterns, clients with similar profiles have 60% higher churn risk. A personal call could significantly improve retention.',
      suggestedActions: [
        { label: 'Call Now', action: 'call', primary: true },
        { label: 'Schedule Meeting', action: 'schedule' },
      ],
      relatedEntity: { type: 'client', id: '1', name: 'Sarah Johnson' },
      importance: 95,
    },
    {
      id: '2',
      type: 'meeting_reminder',
      priority: 'high',
      title: 'Upcoming: Portfolio Review',
      message: 'Meeting with Michael Chen in 1 hour. Meeting prep brief ready.',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      read: false,
      dismissed: false,
      suggestedActions: [
        { label: 'View Prep Brief', action: 'view_prep', primary: true },
        { label: 'Reschedule', action: 'reschedule' },
      ],
      relatedEntity: { type: 'meeting', id: '1', name: 'Michael Chen Review' },
    },
    {
      id: '3',
      type: 'opportunity',
      priority: 'normal',
      title: 'Referral Opportunity Detected',
      message: 'James Rodriguez mentioned his brother is looking for a financial advisor in last meeting notes.',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: false,
      dismissed: false,
      aiSummary: 'Cross-referencing with CRM data shows the brother is a tech executive. Potential AUM opportunity of $500K+.',
      suggestedActions: [
        { label: 'Request Introduction', action: 'request_intro', primary: true },
      ],
      importance: 78,
    },
    {
      id: '4',
      type: 'task_due',
      priority: 'high',
      title: '3 Tasks Due Today',
      message: 'Compliance review, document signing, and client follow-up are due.',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      read: true,
      dismissed: false,
      groupId: 'tasks_due',
    },
    {
      id: '5',
      type: 'life_event',
      priority: 'normal',
      title: 'Birthday Coming Up',
      message: "Emily Williams' birthday is in 5 days. Consider sending a card or calling.",
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      read: true,
      dismissed: false,
      suggestedActions: [
        { label: 'Send Card', action: 'send_card' },
        { label: 'Add Reminder', action: 'add_reminder' },
      ],
    },
    {
      id: '6',
      type: 'compliance',
      priority: 'high',
      title: 'Documents Expiring Soon',
      message: '2 client agreements expire within 30 days. Action required.',
      timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      read: false,
      dismissed: false,
      suggestedActions: [
        { label: 'View Documents', action: 'view_docs', primary: true },
      ],
    },
  ];
}
