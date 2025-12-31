// Collaboration Service - Team Management, Activity, Comments, Notifications
import api from './api';

// Types
export type TeamRole = 'primary_advisor' | 'secondary_advisor' | 'service_team' | 'specialist' | 'support';
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task_completed' | 'document_added' | 'status_change' | 'assignment_change' | 'milestone' | 'system';
export type NotificationType = 'mention' | 'comment' | 'assignment' | 'reminder' | 'update' | 'alert' | 'system';

export interface HouseholdTeam {
  id: string;
  householdId: string;
  userId: string;
  role: TeamRole;
  isPrimary: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  responsibilities?: string;
  notes?: string;
  assignedAt: string;
  assignedBy: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface ActivityFeed {
  id: string;
  householdId?: string;
  entityType: string;
  entityId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  details?: Record<string, any>;
  userId: string;
  isImportant: boolean;
  isPinned: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  parentId?: string;
  content: string;
  mentions: string[];
  isEdited: boolean;
  isPinned: boolean;
  attachments?: Array<{ name: string; url: string; type?: string }>;
  reactions?: Record<string, string[]>;
  likedBy?: string[];
  likes?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  // Computed/convenience fields
  userName?: string;
  userAvatar?: string;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkType?: string;
  linkId?: string;
  senderId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

// Team Management
export const collaborationService = {
  // Team Members
  getTeamMembers: async (householdId: string): Promise<HouseholdTeam[]> => {
    const response = await api.get(`/collaboration/households/${householdId}/team`);
    return response.data;
  },

  addTeamMember: async (householdId: string, data: {
    userId: string;
    role: TeamRole;
    isPrimary?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    responsibilities?: string;
    notes?: string;
  }): Promise<HouseholdTeam> => {
    const response = await api.post(`/collaboration/households/${householdId}/team`, data);
    return response.data;
  },

  updateTeamMember: async (teamId: string, data: Partial<{
    role: TeamRole;
    isPrimary: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    responsibilities: string;
    notes: string;
  }>): Promise<HouseholdTeam> => {
    const response = await api.patch(`/collaboration/team/${teamId}`, data);
    return response.data;
  },

  removeTeamMember: async (teamId: string): Promise<void> => {
    await api.delete(`/collaboration/team/${teamId}`);
  },

  getMyHouseholds: async (): Promise<HouseholdTeam[]> => {
    const response = await api.get('/collaboration/my-households');
    return response.data;
  },

  // Activity Feed
  getActivityFeed: async (options?: {
    householdId?: string;
    entityType?: string;
    entityId?: string;
    activityType?: ActivityType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ActivityFeed[]> => {
    const response = await api.get('/collaboration/activity', { params: options });
    return response.data;
  },

  logActivity: async (data: {
    householdId?: string;
    entityType: string;
    entityId: string;
    activityType: ActivityType;
    title: string;
    description?: string;
    details?: Record<string, any>;
    isImportant?: boolean;
  }): Promise<ActivityFeed> => {
    const response = await api.post('/collaboration/activity', data);
    return response.data;
  },

  toggleActivityImportant: async (activityId: string): Promise<ActivityFeed> => {
    const response = await api.patch(`/collaboration/activity/${activityId}/important`);
    return response.data;
  },

  toggleActivityPinned: async (activityId: string): Promise<ActivityFeed> => {
    const response = await api.patch(`/collaboration/activity/${activityId}/pinned`);
    return response.data;
  },

  // Comments
  getComments: async (entityType: string, entityId: string): Promise<Comment[]> => {
    const response = await api.get(`/collaboration/comments/${entityType}/${entityId}`);
    return response.data;
  },

  addComment: async (data: {
    entityType: string;
    entityId: string;
    content: string;
    parentId?: string;
    mentions?: string[];
    attachments?: string[];
  }): Promise<Comment> => {
    const response = await api.post('/collaboration/comments', data);
    return response.data;
  },

  updateComment: async (commentId: string, data: {
    content: string;
    mentions?: string[];
    attachments?: string[];
  }): Promise<Comment> => {
    const response = await api.patch(`/collaboration/comments/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/collaboration/comments/${commentId}`);
  },

  toggleCommentPin: async (commentId: string): Promise<Comment> => {
    const response = await api.patch(`/collaboration/comments/${commentId}/pin`);
    return response.data;
  },

  addReaction: async (commentId: string, reaction: string): Promise<Comment> => {
    const response = await api.post(`/collaboration/comments/${commentId}/reactions`, { reaction });
    return response.data;
  },

  // Notifications
  getNotifications: async (options?: {
    type?: NotificationType;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<Notification[]> => {
    const response = await api.get('/collaboration/notifications', { params: options });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/collaboration/notifications/unread/count');
    return response.data.count;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/collaboration/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/collaboration/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/collaboration/notifications/${notificationId}`);
  },

  // Notification Preferences
  getNotificationPreferences: async (): Promise<NotificationPreference[]> => {
    const response = await api.get('/collaboration/notifications/preferences');
    return response.data;
  },

  updateNotificationPreference: async (
    notificationType: NotificationType,
    data: Partial<{
      emailEnabled: boolean;
      pushEnabled: boolean;
      inAppEnabled: boolean;
    }>
  ): Promise<NotificationPreference> => {
    const response = await api.patch(`/collaboration/notifications/preferences/${notificationType}`, data);
    return response.data;
  },

  // Mentions - for @mention autocomplete
  searchMentionableUsers: async (query: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  }>> => {
    const response = await api.get('/collaboration/users/mentionable', { params: { q: query } });
    return response.data;
  },
};

export default collaborationService;
