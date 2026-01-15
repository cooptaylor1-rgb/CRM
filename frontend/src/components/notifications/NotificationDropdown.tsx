'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  CheckIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import notificationsService, {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStats
} from '@/services/notifications.service';

const priorityColors: Record<NotificationPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-600',
  urgent: 'bg-red-100 text-red-600',
};

const getNotificationIcon = (type: NotificationType): React.ElementType => {
  const iconMap: Partial<Record<NotificationType, React.ElementType>> = {
    task_due: ClockIcon,
    task_overdue: ExclamationTriangleIcon,
    task_assigned: UserIcon,
    meeting_reminder: CalendarIcon,
    meeting_scheduled: CalendarIcon,
    meeting_cancelled: CalendarIcon,
    kyc_expiring: ShieldExclamationIcon,
    kyc_expired: ShieldExclamationIcon,
    kyc_verified: CheckCircleIcon,
    document_uploaded: DocumentIcon,
    document_expiring: DocumentIcon,
    signature_required: DocumentIcon,
    signature_received: CheckCircleIcon,
    compliance_review: ShieldExclamationIcon,
    compliance_overdue: ExclamationTriangleIcon,
    billing_generated: CurrencyDollarIcon,
    payment_received: CheckCircleIcon,
    payment_overdue: ExclamationTriangleIcon,
    account_opened: SparklesIcon,
    account_closed: XMarkIcon,
    prospect_converted: SparklesIcon,
    prospect_lost: XMarkIcon,
    system_alert: BellIcon,
    announcement: BellIcon,
  };
  return iconMap[type] || BellIcon;
};

const getIconColor = (type: NotificationType, priority: NotificationPriority): string => {
  if (priority === 'urgent') return 'text-red-500';
  if (priority === 'high') return 'text-amber-500';

  const successTypes: NotificationType[] = ['kyc_verified', 'signature_received', 'payment_received', 'prospect_converted', 'account_opened'];
  if (successTypes.includes(type)) return 'text-green-500';

  const warningTypes: NotificationType[] = ['task_overdue', 'kyc_expiring', 'document_expiring', 'compliance_overdue', 'payment_overdue'];
  if (warningTypes.includes(type)) return 'text-amber-500';

  return 'text-blue-500';
};

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [notifs, statsData] = await Promise.all([
        notificationsService.getAll({ limit: 10 }),
        notificationsService.getStats(),
      ]);
      setNotifications(notifs);
      setStats(statsData);
      setHasNew(statsData.unreadCount > 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await notificationsService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      setStats(prev => prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : null);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setStats(prev => prev ? { ...prev, unreadCount: 0 } : null);
      setHasNew(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await notificationsService.archive(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  return (
    <Popover className={`relative ${className}`}>
      {({ open }) => (
        <>
          <Popover.Button className="relative p-2 rounded-lg hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors">
            {hasNew ? (
              <BellAlertIcon className="w-6 h-6 text-accent-primary" />
            ) : (
              <BellIcon className="w-6 h-6 text-content-secondary" />
            )}
            {stats && stats.unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
              >
                {stats.unreadCount > 9 ? '9+' : stats.unreadCount}
              </motion.span>
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
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-96 origin-top-right">
              <div className="overflow-hidden rounded-xl bg-surface-primary shadow-xl ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-semibold text-content-primary">Notifications</h3>
                    {stats && stats.unreadCount > 0 && (
                      <p className="text-xs text-content-secondary">{stats.unreadCount} unread</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {stats && stats.unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-accent-primary hover:text-accent-dark font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <Link
                      href="/settings/notifications"
                      className="p-1 rounded hover:bg-surface-secondary transition-colors"
                    >
                      <Cog6ToothIcon className="w-4 h-4 text-content-tertiary" />
                    </Link>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <BellIcon className="w-12 h-12 mx-auto text-content-tertiary mb-2" />
                      <p className="text-sm text-content-secondary">No notifications</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {notifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const iconColor = getIconColor(notification.type, notification.priority);

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              href={notification.actionUrl || '#'}
                              onClick={() => handleMarkAsRead(notification)}
                              className={`block px-4 py-3 hover:bg-surface-secondary transition-colors border-b border-border/50 ${
                                !notification.isRead ? 'bg-accent-50/30' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Icon */}
                                <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-surface-secondary`}>
                                  <Icon className={`w-4 h-4 ${iconColor}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-content-primary' : 'text-content-secondary'}`}>
                                      {notification.title}
                                    </p>
                                    {notification.priority === 'urgent' && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 text-2xs font-bold text-red-600 bg-red-100 rounded">
                                        URGENT
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-content-tertiary mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-2xs text-content-tertiary">
                                      {notificationsService.formatRelativeTime(notification.createdAt)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {notification.actionLabel && (
                                        <span className="text-2xs text-accent-primary font-medium">
                                          {notification.actionLabel}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => handleArchive(notification.id, e)}
                                        className="p-0.5 rounded hover:bg-surface-tertiary transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <XMarkIcon className="w-3 h-3 text-content-tertiary" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Unread indicator */}
                                {!notification.isRead && (
                                  <div className="flex-shrink-0 mt-2">
                                    <div className="w-2 h-2 bg-accent-primary rounded-full" />
                                  </div>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-border bg-surface-secondary/50">
                    <Link
                      href="/notifications"
                      className="flex items-center justify-center gap-1 text-sm font-medium text-accent-primary hover:text-accent-dark transition-colors"
                    >
                      View all notifications
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
