import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum TeamRole {
  PRIMARY_ADVISOR = 'primary_advisor',
  SECONDARY_ADVISOR = 'secondary_advisor',
  CLIENT_SERVICE = 'client_service',
  PARAPLANNER = 'paraplanner',
  OPERATIONS = 'operations',
  COMPLIANCE = 'compliance',
  VIEWER = 'viewer',
}

export enum ActivityType {
  // Client activities
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_STATUS_CHANGED = 'client_status_changed',
  
  // Account activities
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_UPDATED = 'account_updated',
  ACCOUNT_LINKED = 'account_linked',
  POSITIONS_SYNCED = 'positions_synced',
  
  // Meeting activities
  MEETING_SCHEDULED = 'meeting_scheduled',
  MEETING_COMPLETED = 'meeting_completed',
  MEETING_CANCELLED = 'meeting_cancelled',
  
  // Task activities
  TASK_CREATED = 'task_created',
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  
  // Document activities
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_SIGNED = 'document_signed',
  
  // Communication
  NOTE_ADDED = 'note_added',
  EMAIL_SENT = 'email_sent',
  CALL_LOGGED = 'call_logged',
  
  // Workflow
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_STEP_COMPLETED = 'workflow_step_completed',
  WORKFLOW_COMPLETED = 'workflow_completed',
  
  // System
  COMMENT_ADDED = 'comment_added',
  MENTION = 'mention',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',
}

export enum NotificationType {
  MENTION = 'mention',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due',
  MEETING_REMINDER = 'meeting_reminder',
  COMMENT_REPLY = 'comment_reply',
  WORKFLOW_ACTION = 'workflow_action',
  CLIENT_UPDATE = 'client_update',
  DOCUMENT_ACTION = 'document_action',
  SYSTEM = 'system',
}

/**
 * Team assignments for households
 */
@Entity('household_teams')
@Index(['householdId', 'userId'], { unique: true })
export class HouseholdTeam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'household_id' })
  householdId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: TeamRole, name: 'team_role' })
  teamRole: TeamRole;

  @Column({ type: 'boolean', default: true, name: 'receives_notifications' })
  receivesNotifications: boolean;

  @Column({ type: 'jsonb', default: {} })
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canManageTeam: boolean;
    canViewFinancials: boolean;
    canTrade: boolean;
  };

  @Column({ type: 'timestamp', nullable: true, name: 'assigned_at' })
  assignedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  assignedBy?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Activity feed entries
 */
@Entity('activity_feed')
@Index(['householdId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['activityType', 'createdAt'])
export class ActivityFeed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityType, name: 'activity_type' })
  activityType: ActivityType;

  @Column({ type: 'uuid', nullable: true, name: 'household_id' })
  householdId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  accountId?: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', name: 'user_name' })
  userName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    entityType?: string;
    entityId?: string;
    entityName?: string;
    previousValue?: any;
    newValue?: any;
    changes?: Record<string, { old: any; new: any }>;
  };

  @Column({ type: 'uuid', nullable: true, name: 'related_entity_id' })
  relatedEntityId?: string;

  @Column({ type: 'varchar', nullable: true, name: 'related_entity_type' })
  relatedEntityType?: string;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * Comments on any entity (households, accounts, tasks, etc.)
 */
@Entity('comments')
@Index(['entityType', 'entityId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType: 'household' | 'account' | 'task' | 'meeting' | 'document' | 'workflow';

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId?: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', name: 'user_name' })
  userName: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  mentions: Array<{
    userId: string;
    userName: string;
    position: number;
  }>;

  @Column({ type: 'jsonb', default: [] })
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;

  @Column({ type: 'boolean', default: false, name: 'is_edited' })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'edited_at' })
  editedAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * User notifications
 */
@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, name: 'notification_type' })
  notificationType: NotificationType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  link?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    entityType?: string;
    entityId?: string;
    mentionedBy?: string;
    mentionedByName?: string;
  };

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'email_sent' })
  emailSent: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'triggered_by' })
  triggeredBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * User notification preferences
 */
@Entity('notification_preferences')
@Index(['userId'], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'jsonb', default: {} })
  emailPreferences: {
    mentions: boolean;
    taskAssigned: boolean;
    taskDue: boolean;
    meetingReminders: boolean;
    commentReplies: boolean;
    clientUpdates: boolean;
    dailyDigest: boolean;
    weeklyDigest: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  inAppPreferences: {
    mentions: boolean;
    taskAssigned: boolean;
    taskDue: boolean;
    meetingReminders: boolean;
    commentReplies: boolean;
    clientUpdates: boolean;
    workflowActions: boolean;
  };

  @Column({ type: 'boolean', default: true, name: 'sound_enabled' })
  soundEnabled: boolean;

  @Column({ type: 'boolean', default: true, name: 'desktop_enabled' })
  desktopEnabled: boolean;

  @Column({ type: 'varchar', default: '09:00', name: 'quiet_hours_start' })
  quietHoursStart: string;

  @Column({ type: 'varchar', default: '18:00', name: 'quiet_hours_end' })
  quietHoursEnd: string;

  @Column({ type: 'boolean', default: false, name: 'quiet_hours_enabled' })
  quietHoursEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
