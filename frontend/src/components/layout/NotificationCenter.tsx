'use client';

import * as React from 'react';
import { Fragment, useState, useEffect } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { cn } from '@/components/ui/utils';
import { 
  BellIcon, 
  CheckIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  DocumentIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { notificationsService, Notification, NotificationType, NotificationPriority, NotificationStats } from '@/services/notifications.service';

const priorityStyles: Record<NotificationPriority, string> = {
  low: 'border-l-content-tertiary',
  normal: 'border-l-accent-500',
  high: 'border-l-status-warning-text',
  urgent: 'border-l-status-error-text',
};

const priorityBadge: Record<NotificationPriority, string> = {
  low: '',
  normal: '',
  high: 'bg-status-warning-bg text-status-warning-text',
  urgent: 'bg-status-error-bg text-status-error-text',
};

const typeIcons: Partial<Record<NotificationType, React.ReactNode>> = {
  task_assigned: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
  task_due: <ExclamationTriangleIcon className="w-5 h-5" />,
  task_overdue: <ExclamationCircleIcon className="w-5 h-5" />,
  meeting_reminder: <CalendarIcon className="w-5 h-5" />,
  meeting_scheduled: <CalendarIcon className="w-5 h-5" />,
  meeting_cancelled: <CalendarIcon className="w-5 h-5" />,
  document_uploaded: <DocumentIcon className="w-5 h-5" />,
  document_expiring: <DocumentIcon className="w-5 h-5" />,
  signature_required: <DocumentIcon className="w-5 h-5" />,
  signature_received: <DocumentIcon className="w-5 h-5" />,
  kyc_expiring: <ShieldCheckIcon className="w-5 h-5" />,
  kyc_expired: <ShieldCheckIcon className="w-5 h-5" />,
  kyc_verified: <CheckCircleIcon className="w-5 h-5" />,
  compliance_review: <ExclamationCircleIcon className="w-5 h-5" />,
  compliance_overdue: <ExclamationCircleIcon className="w-5 h-5" />,
  billing_generated: <CurrencyDollarIcon className="w-5 h-5" />,
  payment_received: <CurrencyDollarIcon className="w-5 h-5" />,
  payment_overdue: <CurrencyDollarIcon className="w-5 h-5" />,
  account_opened: <UserPlusIcon className="w-5 h-5" />,
  account_closed: <UserPlusIcon className="w-5 h-5" />,
  prospect_converted: <CheckCircleIcon className="w-5 h-5" />,
  prospect_lost: <ExclamationTriangleIcon className="w-5 h-5" />,
  system_alert: <InformationCircleIcon className="w-5 h-5" />,
  announcement: <InformationCircleIcon className="w-5 h-5" />,
};

const typeColors: Partial<Record<NotificationType, string>> = {
  task_assigned: 'bg-accent-100 text-accent-600',
  task_due: 'bg-status-warning-bg text-status-warning-text',
  task_overdue: 'bg-status-error-bg text-status-error-text',
  meeting_reminder: 'bg-status-info-bg text-status-info-text',
  meeting_scheduled: 'bg-status-info-bg text-status-info-text',
  meeting_cancelled: 'bg-status-warning-bg text-status-warning-text',
  document_uploaded: 'bg-accent-100 text-accent-600',
  document_expiring: 'bg-status-warning-bg text-status-warning-text',
  signature_required: 'bg-status-info-bg text-status-info-text',
  signature_received: 'bg-status-success-bg text-status-success-text',
  kyc_expiring: 'bg-status-warning-bg text-status-warning-text',
  kyc_expired: 'bg-status-error-bg text-status-error-text',
  kyc_verified: 'bg-status-success-bg text-status-success-text',
  compliance_review: 'bg-status-warning-bg text-status-warning-text',
  compliance_overdue: 'bg-status-error-bg text-status-error-text',
  billing_generated: 'bg-status-info-bg text-status-info-text',
  payment_received: 'bg-status-success-bg text-status-success-text',
  payment_overdue: 'bg-status-error-bg text-status-error-text',
  account_opened: 'bg-status-success-bg text-status-success-text',
  account_closed: 'bg-status-warning-bg text-status-warning-text',
  prospect_converted: 'bg-status-success-bg text-status-success-text',
  prospect_lost: 'bg-status-warning-bg text-status-warning-text',
  system_alert: 'bg-accent-100 text-accent-600',
  announcement: 'bg-accent-100 text-accent-600',
};

export interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [data, statsData] = await Promise.all([
          notificationsService.getAll({ unreadOnly: false }),
          notificationsService.getStats(),
        ]);
        setNotifications(data);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = stats?.unreadCount ?? 0;
  const hasUrgent = (stats?.byPriority?.urgent ?? 0) > 0;

  const displayNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleMarkAsRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setStats(prev => prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : null);
  };

  const handleMarkAllAsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setStats(prev => prev ? { ...prev, unreadCount: 0 } : null);
  };

  const handleArchive = async (id: string) => {
    await notificationsService.archive(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.isRead) {
      setStats(prev => prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : null);
    }
  };

  return (
    <Popover className={cn('relative', className)}>
      {({ open }) => (
        <>
          <Popover.Button
            className={cn(
              'relative p-2 rounded-md transition-colors',
              'text-content-secondary hover:text-content-primary',
              'hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent-500',
              open && 'bg-surface-secondary text-content-primary'
            )}
          >
            {open ? (
              <BellIconSolid className="w-5 h-5" />
            ) : (
              <BellIcon className="w-5 h-5" />
            )}
            {unreadCount > 0 && (
              <span 
                className={cn(
                  'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-xs font-medium flex items-center justify-center',
                  hasUrgent 
                    ? 'bg-status-error-text text-white animate-pulse' 
                    : 'bg-accent-600 text-white'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-dropdown mt-2 w-96 origin-top-right">
              <div className="rounded-lg bg-surface-primary shadow-xl ring-1 ring-border overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border bg-surface-secondary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-content-primary">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-accent-100 text-accent-700 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary rounded-md transition-colors"
                          title="Mark all as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary rounded-md transition-colors"
                        title="Settings"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-4 mt-3">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={cn(
                        'text-xs font-medium pb-1 border-b-2 transition-colors',
                        activeTab === 'all'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-content-tertiary hover:text-content-secondary'
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab('unread')}
                      className={cn(
                        'text-xs font-medium pb-1 border-b-2 transition-colors',
                        activeTab === 'unread'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-content-tertiary hover:text-content-secondary'
                      )}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-600 mx-auto"></div>
                    </div>
                  ) : displayNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <BellIcon className="w-12 h-12 mx-auto text-content-tertiary mb-3" />
                      <p className="text-sm text-content-secondary">
                        {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {displayNotifications.slice(0, 10).map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onArchive={handleArchive}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                  <button className="w-full text-center text-sm text-accent-600 hover:text-accent-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onArchive }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const icon = typeIcons[notification.type] || <InformationCircleIcon className="w-5 h-5" />;
  const colorClass = typeColors[notification.type] || 'bg-surface-secondary text-content-secondary';

  return (
    <div
      className={cn(
        'relative px-4 py-3 hover:bg-surface-secondary transition-colors cursor-pointer',
        'border-l-4',
        priorityStyles[notification.priority],
        !notification.isRead && 'bg-accent-50/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      }}
    >
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0 p-2 rounded-lg', colorClass)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm',
              notification.isRead ? 'text-content-secondary' : 'text-content-primary font-medium'
            )}>
              {notification.title}
            </p>
            {notification.priority === 'urgent' || notification.priority === 'high' ? (
              <span className={cn(
                'flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded',
                priorityBadge[notification.priority]
              )}>
                {notification.priority}
              </span>
            ) : null}
          </div>
          {notification.message && (
            <p className="text-xs text-content-tertiary mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-content-tertiary mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Action buttons on hover */}
      <Transition
        show={isHovered}
        enter="transition-opacity duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute right-2 top-2 flex items-center gap-1 bg-surface-primary rounded-md shadow-sm border border-border p-0.5">
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-1 text-content-tertiary hover:text-accent-600 hover:bg-surface-secondary rounded transition-colors"
              title="Mark as read"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(notification.id);
            }}
            className="p-1 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary rounded transition-colors"
            title="Archive"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
          </button>
        </div>
      </Transition>

      {/* Unread indicator */}
      {!notification.isRead && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent-600 rounded-full" />
      )}
    </div>
  );
}

export default NotificationCenter;
