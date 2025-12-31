'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, CheckCheck, X, ExternalLink, Clock,
  MessageCircle, UserPlus, AlertCircle, Settings,
  Filter, ChevronDown, Trash2
} from 'lucide-react';
import collaborationService, { 
  Notification, 
  NotificationType 
} from '@/services/collaboration.service';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  mention: <MessageCircle className="w-4 h-4" />,
  comment: <MessageCircle className="w-4 h-4" />,
  assignment: <UserPlus className="w-4 h-4" />,
  reminder: <Clock className="w-4 h-4" />,
  update: <Bell className="w-4 h-4" />,
  alert: <AlertCircle className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
};

const notificationColors: Record<NotificationType, string> = {
  mention: 'bg-blue-500',
  comment: 'bg-purple-500',
  assignment: 'bg-emerald-500',
  reminder: 'bg-amber-500',
  update: 'bg-indigo-500',
  alert: 'bg-red-500',
  system: 'bg-gray-500',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}) => {
  const colorClass = notificationColors[notification.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        group relative flex gap-3 p-4 cursor-pointer transition-colors
        ${notification.isRead 
          ? 'bg-white dark:bg-gray-900' 
          : 'bg-blue-50/50 dark:bg-blue-900/10'
        }
        hover:bg-gray-50 dark:hover:bg-gray-800/50
        border-b border-gray-100 dark:border-gray-800 last:border-0
      `}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${colorClass}`}>
        {notificationIcons[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 dark:text-white font-medium'}`}>
              {notification.title}
            </p>
            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
              {notification.message}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
      </div>

      {/* Actions (show on hover) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (type: string, id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType | 'all' | 'unread'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, filter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await collaborationService.getNotifications({
        type: filter !== 'all' && filter !== 'unread' ? filter as NotificationType : undefined,
        unreadOnly: filter === 'unread',
      });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await collaborationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await collaborationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await collaborationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkRead(notification.id);
    }
    if (notification.linkType && notification.linkId && onNavigate) {
      onNavigate(notification.linkType, notification.linkId);
    }
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="capitalize">
                {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : filter}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10"
                >
                  {['all', 'unread', ...Object.keys(notificationIcons)].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setFilter(type as any); setShowFilterMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm capitalize hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        filter === type ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type !== 'all' && type !== 'unread' && notificationIcons[type as NotificationType]}
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notifications</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => handleMarkRead(notification.id)}
                onDelete={() => handleDelete(notification.id)}
                onClick={() => handleClick(notification)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all notifications
        </button>
      </div>
    </motion.div>
  );
};

// Notification Bell Button with badge
interface NotificationBellProps {
  onOpenChange?: (isOpen: boolean) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await collaborationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`
          relative p-2.5 rounded-xl transition-colors
          ${isOpen 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <NotificationCenter
            isOpen={isOpen}
            onClose={() => { setIsOpen(false); onOpenChange?.(false); }}
            onNavigate={(type, id) => {
              // Handle navigation
              console.log('Navigate to:', type, id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
