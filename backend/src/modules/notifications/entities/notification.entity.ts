import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum NotificationType {
  // Task notifications
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',

  // Meeting notifications
  MEETING_REMINDER = 'meeting_reminder',
  MEETING_SCHEDULED = 'meeting_scheduled',
  MEETING_CANCELLED = 'meeting_cancelled',
  MEETING_RESCHEDULED = 'meeting_rescheduled',

  // KYC/Compliance notifications
  KYC_EXPIRING = 'kyc_expiring',
  KYC_EXPIRED = 'kyc_expired',
  KYC_VERIFIED = 'kyc_verified',
  COMPLIANCE_REVIEW = 'compliance_review',
  COMPLIANCE_OVERDUE = 'compliance_overdue',

  // Document notifications
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_EXPIRING = 'document_expiring',
  SIGNATURE_REQUIRED = 'signature_required',
  SIGNATURE_RECEIVED = 'signature_received',

  // Billing notifications
  BILLING_GENERATED = 'billing_generated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',

  // Account notifications
  ACCOUNT_OPENED = 'account_opened',
  ACCOUNT_CLOSED = 'account_closed',
  ACCOUNT_TRANSFER = 'account_transfer',

  // Pipeline notifications
  PROSPECT_CONVERTED = 'prospect_converted',
  PROSPECT_LOST = 'prospect_lost',
  PROSPECT_STALE = 'prospect_stale',

  // Intelligence notifications
  RISK_ALERT = 'risk_alert',
  LIFE_EVENT_DETECTED = 'life_event_detected',
  INSIGHT_GENERATED = 'insight_generated',

  // System notifications
  SYSTEM_ALERT = 'system_alert',
  ANNOUNCEMENT = 'announcement',
  SECURITY_ALERT = 'security_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export enum EntityType {
  HOUSEHOLD = 'household',
  ACCOUNT = 'account',
  PERSON = 'person',
  TASK = 'task',
  MEETING = 'meeting',
  DOCUMENT = 'document',
  INVOICE = 'invoice',
  PROSPECT = 'prospect',
  WORKFLOW = 'workflow',
}

@Entity('notifications')
@Index(['recipientId', 'isRead', 'createdAt'])
@Index(['recipientId', 'isArchived'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    name: 'notification_type',
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  // Recipient
  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  // Related entity (optional)
  @Column({
    type: 'enum',
    enum: EntityType,
    name: 'entity_type',
    nullable: true,
  })
  entityType: EntityType | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'entity_name', nullable: true })
  entityName: string | null;

  // Action
  @Column({ name: 'action_url', nullable: true })
  actionUrl: string | null;

  @Column({ name: 'action_label', nullable: true })
  actionLabel: string | null;

  // Status
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true })
  archivedAt: Date | null;

  // Delivery channels used
  @Column({ type: 'simple-array', name: 'channels_sent', nullable: true })
  channelsSent: NotificationChannel[] | null;

  // Delivery status per channel
  @Column({ type: 'jsonb', name: 'delivery_status', nullable: true })
  deliveryStatus: Record<NotificationChannel, {
    sent: boolean;
    sentAt?: Date;
    delivered?: boolean;
    deliveredAt?: Date;
    error?: string;
  }> | null;

  // Expiration
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  // Metadata for extensibility
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Audit
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  // Global channel preferences
  @Column({ type: 'jsonb', name: 'channel_settings' })
  channelSettings: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // Per-type preferences
  @Column({ type: 'jsonb', name: 'type_settings' })
  typeSettings: Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;

  // Quiet hours
  @Column({ type: 'jsonb', name: 'quiet_hours' })
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
    daysOfWeek: number[]; // 0-6, Sunday = 0
  };

  // Email digest settings
  @Column({ type: 'jsonb', name: 'digest_settings' })
  digestSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    dayOfWeek?: number; // For weekly, 0-6
    time: string; // HH:mm
    timezone: string;
  };

  // Push notification token
  @Column({ name: 'push_token', nullable: true })
  pushToken: string | null;

  @Column({ name: 'push_token_updated_at', type: 'timestamp', nullable: true })
  pushTokenUpdatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
