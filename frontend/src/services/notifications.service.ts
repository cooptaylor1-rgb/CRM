/**
 * Notifications Service
 * Real-time alerts, notification preferences, and notification center
 */
import api from './api';

// Types
export type NotificationType = 
  | 'task_due' | 'task_overdue' | 'task_assigned'
  | 'meeting_reminder' | 'meeting_scheduled' | 'meeting_cancelled'
  | 'kyc_expiring' | 'kyc_expired' | 'kyc_verified'
  | 'document_uploaded' | 'document_expiring' | 'signature_required' | 'signature_received'
  | 'compliance_review' | 'compliance_overdue'
  | 'billing_generated' | 'payment_received' | 'payment_overdue'
  | 'account_opened' | 'account_closed'
  | 'prospect_converted' | 'prospect_lost'
  | 'system_alert' | 'announcement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  
  // Entity reference
  entityType?: 'household' | 'account' | 'person' | 'task' | 'meeting' | 'document' | 'invoice' | 'prospect';
  entityId?: string;
  entityName?: string;
  
  // Action
  actionUrl?: string;
  actionLabel?: string;
  
  // Status
  isRead: boolean;
  isArchived: boolean;
  readAt?: string;
  
  // Timing
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  types: Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:mm
  };
}

export interface NotificationStats {
  unreadCount: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  todayCount: number;
}

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  actionUrl?: string;
  actionLabel?: string;
  recipientIds?: string[];
  expiresAt?: string;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'task_overdue',
    title: 'Overdue Task',
    message: 'Annual review for Anderson Family is overdue by 3 days',
    priority: 'high',
    entityType: 'task',
    entityId: 't1',
    entityName: 'Annual Review - Anderson Family',
    actionUrl: '/tasks?id=t1',
    actionLabel: 'View Task',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n2',
    type: 'kyc_expiring',
    title: 'KYC Expiring Soon',
    message: 'KYC verification for Elena Martinez expires in 5 days',
    priority: 'high',
    entityType: 'person',
    entityId: 'p5',
    entityName: 'Elena Martinez',
    actionUrl: '/clients?id=p5',
    actionLabel: 'Update KYC',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    type: 'meeting_reminder',
    title: 'Meeting in 1 Hour',
    message: 'Portfolio review with Chen Family at 2:00 PM',
    priority: 'normal',
    entityType: 'meeting',
    entityId: 'm1',
    entityName: 'Portfolio Review - Chen Family',
    actionUrl: '/meetings?id=m1',
    actionLabel: 'View Meeting',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment of $31,250 received from Anderson Family',
    priority: 'normal',
    entityType: 'invoice',
    entityId: 'inv1',
    entityName: 'INV-2024-001',
    actionUrl: '/billing?id=inv1',
    actionLabel: 'View Invoice',
    isRead: true,
    isArchived: false,
    readAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n5',
    type: 'prospect_converted',
    title: 'New Client!',
    message: 'Williams Household converted from prospect to client',
    priority: 'normal',
    entityType: 'household',
    entityId: 'h3',
    entityName: 'Williams Household',
    actionUrl: '/households/h3',
    actionLabel: 'View Household',
    isRead: true,
    isArchived: false,
    readAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n6',
    type: 'compliance_review',
    title: 'Compliance Review Due',
    message: 'Quarterly compliance review due in 7 days',
    priority: 'normal',
    entityType: 'household',
    entityId: 'h2',
    entityName: 'Chen Family Trust',
    actionUrl: '/compliance',
    actionLabel: 'Start Review',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n7',
    type: 'document_uploaded',
    title: 'Document Uploaded',
    message: 'Q3 Performance Report uploaded for Chen Family Trust',
    priority: 'low',
    entityType: 'document',
    entityId: 'd3',
    entityName: 'Q3 2024 Performance Report',
    actionUrl: '/documents?id=d3',
    actionLabel: 'View Document',
    isRead: true,
    isArchived: false,
    readAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n8',
    type: 'payment_overdue',
    title: 'Overdue Payment',
    message: 'Invoice INV-2024-003 for Williams Household is 16 days overdue',
    priority: 'urgent',
    entityType: 'invoice',
    entityId: 'inv3',
    entityName: 'INV-2024-003',
    actionUrl: '/billing?id=inv3',
    actionLabel: 'View Invoice',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

const mockPreferences: NotificationPreferences = {
  channels: {
    in_app: true,
    email: true,
    push: true,
    sms: false,
  },
  types: {
    task_due: { enabled: true, channels: ['in_app', 'email'] },
    task_overdue: { enabled: true, channels: ['in_app', 'email', 'push'] },
    task_assigned: { enabled: true, channels: ['in_app', 'email'] },
    meeting_reminder: { enabled: true, channels: ['in_app', 'push'] },
    meeting_scheduled: { enabled: true, channels: ['in_app', 'email'] },
    meeting_cancelled: { enabled: true, channels: ['in_app', 'email', 'push'] },
    kyc_expiring: { enabled: true, channels: ['in_app', 'email'] },
    kyc_expired: { enabled: true, channels: ['in_app', 'email', 'push'] },
    kyc_verified: { enabled: true, channels: ['in_app'] },
    document_uploaded: { enabled: true, channels: ['in_app'] },
    document_expiring: { enabled: true, channels: ['in_app', 'email'] },
    signature_required: { enabled: true, channels: ['in_app', 'email'] },
    signature_received: { enabled: true, channels: ['in_app', 'email'] },
    compliance_review: { enabled: true, channels: ['in_app', 'email'] },
    compliance_overdue: { enabled: true, channels: ['in_app', 'email', 'push'] },
    billing_generated: { enabled: true, channels: ['in_app'] },
    payment_received: { enabled: true, channels: ['in_app'] },
    payment_overdue: { enabled: true, channels: ['in_app', 'email', 'push'] },
    account_opened: { enabled: true, channels: ['in_app', 'email'] },
    account_closed: { enabled: true, channels: ['in_app', 'email'] },
    prospect_converted: { enabled: true, channels: ['in_app', 'email'] },
    prospect_lost: { enabled: true, channels: ['in_app'] },
    system_alert: { enabled: true, channels: ['in_app', 'push'] },
    announcement: { enabled: true, channels: ['in_app', 'email'] },
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    timezone: 'America/New_York',
  },
  digest: {
    enabled: true,
    frequency: 'daily',
    time: '08:00',
  },
};

export const notificationsService = {
  // Get all notifications
  async getAll(options?: { 
    unreadOnly?: boolean; 
    type?: NotificationType;
    limit?: number;
  }): Promise<Notification[]> {
    try {
      const response = await api.get('/api/notifications', { params: options });
      return response.data;
    } catch {
      let notifications = [...mockNotifications]
        .filter(n => !n.isArchived)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (options?.unreadOnly) {
        notifications = notifications.filter(n => !n.isRead);
      }
      
      if (options?.type) {
        notifications = notifications.filter(n => n.type === options.type);
      }
      
      if (options?.limit) {
        notifications = notifications.slice(0, options.limit);
      }
      
      return notifications;
    }
  },

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await api.get('/api/notifications/stats');
      return response.data;
    } catch {
      const unread = mockNotifications.filter(n => !n.isRead && !n.isArchived);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return {
        unreadCount: unread.length,
        byType: unread.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<NotificationType, number>),
        byPriority: unread.reduce((acc, n) => {
          acc[n.priority] = (acc[n.priority] || 0) + 1;
          return acc;
        }, {} as Record<NotificationPriority, number>),
        todayCount: mockNotifications.filter(n => 
          new Date(n.createdAt) >= today
        ).length,
      };
    }
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    try {
      const response = await api.patch(`/api/notifications/${id}/read`);
      return response.data;
    } catch {
      const notification = mockNotifications.find(n => n.id === id);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      }
      return notification!;
    }
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/api/notifications/mark-all-read');
    } catch {
      mockNotifications.forEach(n => {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        }
      });
    }
  },

  // Archive notification
  async archive(id: string): Promise<void> {
    try {
      await api.patch(`/api/notifications/${id}/archive`);
    } catch {
      const notification = mockNotifications.find(n => n.id === id);
      if (notification) {
        notification.isArchived = true;
      }
    }
  },

  // Delete notification
  async delete(id: string): Promise<void> {
    await api.delete(`/api/notifications/${id}`);
  },

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await api.get('/api/notifications/preferences');
      return response.data;
    } catch {
      return mockPreferences;
    }
  },

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await api.patch('/api/notifications/preferences', preferences);
      return response.data;
    } catch {
      Object.assign(mockPreferences, preferences);
      return mockPreferences;
    }
  },

  // Create notification (admin/system use)
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const response = await api.post('/api/notifications', dto);
    return response.data;
  },

  // Subscribe to push notifications
  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    await api.post('/api/notifications/push/subscribe', subscription);
  },

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<void> {
    await api.post('/api/notifications/push/unsubscribe');
  },

  // Get notification type display info
  getTypeInfo(type: NotificationType): { label: string; icon: string; color: string } {
    const typeMap: Record<NotificationType, { label: string; icon: string; color: string }> = {
      task_due: { label: 'Task Due', icon: 'clock', color: 'warning' },
      task_overdue: { label: 'Task Overdue', icon: 'exclamation', color: 'error' },
      task_assigned: { label: 'Task Assigned', icon: 'user', color: 'info' },
      meeting_reminder: { label: 'Meeting Reminder', icon: 'calendar', color: 'info' },
      meeting_scheduled: { label: 'Meeting Scheduled', icon: 'calendar', color: 'success' },
      meeting_cancelled: { label: 'Meeting Cancelled', icon: 'calendar', color: 'error' },
      kyc_expiring: { label: 'KYC Expiring', icon: 'shield', color: 'warning' },
      kyc_expired: { label: 'KYC Expired', icon: 'shield', color: 'error' },
      kyc_verified: { label: 'KYC Verified', icon: 'shield', color: 'success' },
      document_uploaded: { label: 'Document Uploaded', icon: 'document', color: 'info' },
      document_expiring: { label: 'Document Expiring', icon: 'document', color: 'warning' },
      signature_required: { label: 'Signature Required', icon: 'pencil', color: 'warning' },
      signature_received: { label: 'Signature Received', icon: 'check', color: 'success' },
      compliance_review: { label: 'Compliance Review', icon: 'clipboard', color: 'info' },
      compliance_overdue: { label: 'Compliance Overdue', icon: 'clipboard', color: 'error' },
      billing_generated: { label: 'Invoice Generated', icon: 'currency', color: 'info' },
      payment_received: { label: 'Payment Received', icon: 'currency', color: 'success' },
      payment_overdue: { label: 'Payment Overdue', icon: 'currency', color: 'error' },
      account_opened: { label: 'Account Opened', icon: 'building', color: 'success' },
      account_closed: { label: 'Account Closed', icon: 'building', color: 'default' },
      prospect_converted: { label: 'New Client', icon: 'user-plus', color: 'success' },
      prospect_lost: { label: 'Prospect Lost', icon: 'user-minus', color: 'error' },
      system_alert: { label: 'System Alert', icon: 'bell', color: 'warning' },
      announcement: { label: 'Announcement', icon: 'megaphone', color: 'info' },
    };
    
    return typeMap[type] || { label: type, icon: 'bell', color: 'default' };
  },

  // Format relative time
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
};

export default notificationsService;
