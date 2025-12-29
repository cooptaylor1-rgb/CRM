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
import { BaseEntity } from '../../../common/entities/base.entity';

export enum IntegrationProvider {
  MICROSOFT = 'microsoft',
  GOOGLE = 'google',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  ERROR = 'error',
}

export enum SyncDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  BIDIRECTIONAL = 'bidirectional',
}

@Entity('user_integrations')
@Index(['userId', 'provider'], { unique: true })
export class UserIntegration extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: IntegrationProvider })
  provider: IntegrationProvider;

  @Column({ type: 'enum', enum: IntegrationStatus, default: IntegrationStatus.ACTIVE })
  status: IntegrationStatus;

  @Column({ type: 'text', nullable: true })
  accessToken?: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  externalUserId?: string;

  @Column({ type: 'varchar', nullable: true })
  externalEmail?: string;

  @Column({ type: 'jsonb', default: {} })
  scopes: string[];

  @Column({ type: 'jsonb', default: {} })
  settings: {
    syncCalendar: boolean;
    syncEmail: boolean;
    syncContacts: boolean;
    defaultCalendarId?: string;
    emailFolderIds?: string[];
    syncDirection: SyncDirection;
    autoArchiveEmails: boolean;
    archiveClientEmailsOnly: boolean;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  lastSyncError?: string;
}

@Entity('synced_calendar_events')
@Index(['userId', 'externalId'], { unique: true })
export class SyncedCalendarEvent extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  externalId: string;

  @Column({ type: 'varchar', nullable: true })
  internalMeetingId?: string;

  @Column({ type: 'enum', enum: IntegrationProvider })
  provider: IntegrationProvider;

  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'boolean', default: false })
  isAllDay: boolean;

  @Column({ type: 'varchar', nullable: true })
  onlineMeetingUrl?: string;

  @Column({ type: 'jsonb', default: [] })
  attendees: {
    email: string;
    name?: string;
    response?: 'accepted' | 'declined' | 'tentative' | 'none';
    isOrganizer?: boolean;
  }[];

  @Column({ type: 'jsonb', default: {} })
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: string[];
    endDate?: string;
    count?: number;
  };

  @Column({ type: 'enum', enum: SyncDirection, default: SyncDirection.INBOUND })
  syncDirection: SyncDirection;

  @Column({ type: 'timestamp' })
  lastSyncedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  rawData: Record<string, any>;

  // Relationship to households/persons
  @Column({ type: 'uuid', nullable: true })
  linkedHouseholdId?: string;

  @Column({ type: 'uuid', nullable: true })
  linkedPersonId?: string;
}

@Entity('synced_emails')
@Index(['userId', 'externalId'], { unique: true })
export class SyncedEmail extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  externalId: string;

  @Column({ type: 'varchar', nullable: true })
  conversationId?: string;

  @Column({ type: 'enum', enum: IntegrationProvider })
  provider: IntegrationProvider;

  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  bodyPreview?: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'varchar', nullable: true })
  bodyContentType?: string;

  @Column({ type: 'jsonb' })
  from: {
    email: string;
    name?: string;
  };

  @Column({ type: 'jsonb', default: [] })
  to: {
    email: string;
    name?: string;
  }[];

  @Column({ type: 'jsonb', default: [] })
  cc: {
    email: string;
    name?: string;
  }[];

  @Column({ type: 'timestamp' })
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'boolean', default: false })
  hasAttachments: boolean;

  @Column({ type: 'jsonb', default: [] })
  attachments: {
    id: string;
    name: string;
    contentType: string;
    size: number;
  }[];

  @Column({ type: 'varchar', nullable: true })
  importance?: 'low' | 'normal' | 'high';

  @Column({ type: 'jsonb', default: [] })
  categories: string[];

  @Column({ type: 'varchar', nullable: true })
  folderName?: string;

  @Column({ type: 'timestamp' })
  lastSyncedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  rawData: Record<string, any>;

  // Relationship to households/persons
  @Column({ type: 'uuid', nullable: true })
  linkedHouseholdId?: string;

  @Column({ type: 'uuid', nullable: true })
  linkedPersonId?: string;

  // Notes added by user
  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'boolean', default: false })
  isClientCommunication: boolean;
}

@Entity('email_threads')
@Index(['userId', 'conversationId'])
export class EmailThread extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  conversationId: string;

  @Column({ type: 'enum', enum: IntegrationProvider })
  provider: IntegrationProvider;

  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'jsonb', default: [] })
  participants: {
    email: string;
    name?: string;
  }[];

  @Column({ type: 'int', default: 1 })
  messageCount: number;

  @Column({ type: 'timestamp' })
  lastMessageAt: Date;

  @Column({ type: 'boolean', default: false })
  hasUnread: boolean;

  // Relationship to households/persons
  @Column({ type: 'uuid', nullable: true })
  linkedHouseholdId?: string;

  @Column({ type: 'uuid', nullable: true })
  linkedPersonId?: string;
}

@Entity('integration_sync_logs')
export class IntegrationSyncLog extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: IntegrationProvider })
  provider: IntegrationProvider;

  @Column({ type: 'varchar' })
  syncType: 'calendar' | 'email' | 'contacts' | 'full';

  @Column({ type: 'varchar' })
  status: 'started' | 'completed' | 'failed';

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  itemsProcessed: number;

  @Column({ type: 'int', default: 0 })
  itemsCreated: number;

  @Column({ type: 'int', default: 0 })
  itemsUpdated: number;

  @Column({ type: 'int', default: 0 })
  itemsDeleted: number;

  @Column({ type: 'int', default: 0 })
  errors: number;

  @Column({ type: 'jsonb', default: [] })
  errorDetails: {
    itemId?: string;
    message: string;
    stack?: string;
  }[];
}
