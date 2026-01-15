'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  BellSlashIcon,
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
  FunnelIcon,
  ArchiveBoxIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button, Card, Input, Select, StatusBadge, Checkbox, Modal, ModalFooter } from '@/components/ui';
import notificationsService, {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStats
} from '@/services/notifications.service';

const priorityConfig: Record<NotificationPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  normal: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const typeCategories: Record<string, { label: string; types: NotificationType[] }> = {
  tasks: {
    label: 'Tasks',
    types: ['task_due', 'task_overdue', 'task_assigned'],
  },
  meetings: {
    label: 'Meetings',
    types: ['meeting_reminder', 'meeting_scheduled', 'meeting_cancelled'],
  },
  compliance: {
    label: 'Compliance & KYC',
    types: ['kyc_expiring', 'kyc_expired', 'kyc_verified', 'compliance_review', 'compliance_overdue'],
  },
  documents: {
    label: 'Documents',
    types: ['document_uploaded', 'document_expiring', 'signature_required', 'signature_received'],
  },
  billing: {
    label: 'Billing',
    types: ['billing_generated', 'payment_received', 'payment_overdue'],
  },
  accounts: {
    label: 'Accounts & Pipeline',
    types: ['account_opened', 'account_closed', 'prospect_converted', 'prospect_lost'],
  },
  system: {
    label: 'System',
    types: ['system_alert', 'announcement'],
  },
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

interface NotificationCenterProps {
  showHeader?: boolean;
}

export function NotificationCenter({ showHeader = true }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | ''>('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [showUnreadOnly]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifs, statsData] = await Promise.all([
        notificationsService.getAll({ unreadOnly: showUnreadOnly }),
        notificationsService.getStats(),
      ]);
      setNotifications(notifs);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.entityName?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryTypes = typeCategories[selectedCategory]?.types || [];
      filtered = filtered.filter(n => categoryTypes.includes(n.type));
    }

    // Filter by priority
    if (selectedPriority) {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }

    return filtered;
  }, [notifications, searchQuery, selectedCategory, selectedPriority]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    for (const notification of filteredNotifications) {
      const date = new Date(notification.createdAt);
      date.setHours(0, 0, 0, 0);

      let groupKey: string;
      if (date.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else if (date > lastWeek) {
        groupKey = 'This Week';
      } else {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    }

    return groups;
  }, [filteredNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
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
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await notificationsService.archive(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => notificationsService.archive(id)));
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to archive notifications:', error);
    }
  };

  const handleBulkMarkRead = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds)
          .filter(id => !notifications.find(n => n.id === id)?.isRead)
          .map(id => notificationsService.markAsRead(id))
      );
      setNotifications(prev =>
        prev.map(n => selectedIds.has(n.id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <BellIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.unreadCount}</p>
                <p className="text-xs text-content-secondary">Unread</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.byPriority.urgent || 0}</p>
                <p className="text-xs text-content-secondary">Urgent</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <ClockIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.byPriority.high || 0}</p>
                <p className="text-xs text-content-secondary">High Priority</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <SparklesIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.todayCount}</p>
                <p className="text-xs text-content-secondary">Today</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: 'All Categories' },
              ...Object.entries(typeCategories).map(([key, config]) => ({
                value: key,
                label: config.label,
              })),
            ]}
          />
          <Select
            value={selectedPriority}
            onChange={(val) => setSelectedPriority(val as NotificationPriority | '')}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'normal', label: 'Normal' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <Button
            variant={showUnreadOnly ? 'primary' : 'secondary'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? 'Unread Only' : 'All'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-3 bg-accent-50 rounded-lg border border-accent-200"
        >
          <span className="text-sm font-medium text-accent-700">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleBulkMarkRead}>
              <CheckIcon className="w-4 h-4 mr-1" />
              Mark Read
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkArchive}>
              <ArchiveBoxIcon className="w-4 h-4 mr-1" />
              Archive
            </Button>
          </div>
          <button
            className="ml-auto text-sm text-accent-600 hover:text-accent-800"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
        </motion.div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
            onChange={handleSelectAll}
          />
          <span className="text-sm text-content-secondary">
            Select all
          </span>
        </div>
        {stats && stats.unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            <CheckIcon className="w-4 h-4 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-6">
        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-content-secondary">Loading notifications...</p>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <BellSlashIcon className="w-16 h-16 mx-auto text-content-tertiary mb-4" />
            <h3 className="text-lg font-medium text-content-primary">No notifications</h3>
            <p className="text-content-secondary mt-1">
              {showUnreadOnly ? "You're all caught up!" : "No notifications to display."}
            </p>
          </Card>
        ) : (
          Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
            <div key={dateGroup}>
              <h3 className="text-sm font-semibold text-content-secondary mb-3">{dateGroup}</h3>
              <Card className="divide-y divide-border">
                <AnimatePresence>
                  {groupNotifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type);
                    const iconColor = getIconColor(notification.type, notification.priority);
                    const priorityStyle = priorityConfig[notification.priority];

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-start gap-4 p-4 hover:bg-surface-secondary/50 transition-colors ${
                          !notification.isRead ? 'bg-accent-50/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedIds.has(notification.id)}
                            onChange={() => toggleSelect(notification.id)}
                          />
                        </div>

                        {/* Icon */}
                        <div className={`flex-shrink-0 p-2 rounded-lg ${priorityStyle.bgColor}`}>
                          <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={notification.actionUrl || '#'}
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className={`text-sm hover:text-accent-primary ${
                                    !notification.isRead ? 'font-semibold text-content-primary' : 'text-content-secondary'
                                  }`}
                                >
                                  {notification.title}
                                </Link>
                                {notification.priority === 'urgent' && (
                                  <span className="px-1.5 py-0.5 text-2xs font-bold text-red-600 bg-red-100 rounded">
                                    URGENT
                                  </span>
                                )}
                                {notification.priority === 'high' && (
                                  <span className="px-1.5 py-0.5 text-2xs font-bold text-amber-600 bg-amber-100 rounded">
                                    HIGH
                                  </span>
                                )}
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-accent-primary rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-content-tertiary mt-0.5">
                                {notification.message}
                              </p>
                              {notification.entityName && (
                                <p className="text-xs text-content-tertiary mt-1">
                                  Related: {notification.entityName}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-content-tertiary whitespace-nowrap">
                              {notificationsService.formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2">
                            {notification.actionUrl && notification.actionLabel && (
                              <Link
                                href={notification.actionUrl}
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs font-medium text-accent-primary hover:text-accent-dark"
                              >
                                {notification.actionLabel}
                              </Link>
                            )}
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs text-content-tertiary hover:text-content-secondary"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(notification.id)}
                              className="text-xs text-content-tertiary hover:text-content-secondary"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
