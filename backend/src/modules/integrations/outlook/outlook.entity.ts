import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OutlookConnectionStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  EXPIRED = 'expired',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

export enum SyncDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  BIDIRECTIONAL = 'bidirectional',
}

export enum EmailImportance {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum MeetingResponseStatus {
  NONE = 'none',
  ORGANIZER = 'organizer',
  TENTATIVE = 'tentative',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

/**
 * Microsoft Outlook/365 connection credentials
 */
@Entity('outlook_connections')
@Index(['userId'], { unique: true })
export class OutlookConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'firm_id' })
  firmId: string;

  @Column({ type: 'varchar', nullable: true, name: 'microsoft_user_id' })
  microsoftUserId?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', name: 'display_name', nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true, name: 'access_token' })
  accessToken?: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'token_expires_at' })
  tokenExpiresAt?: Date;

  @Column({ 
    type: 'enum', 
    enum: OutlookConnectionStatus, 
    default: OutlookConnectionStatus.PENDING 
  })
  status: OutlookConnectionStatus;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  // Sync settings
  @Column({ type: 'boolean', default: true, name: 'sync_emails' })
  syncEmails: boolean;

  @Column({ type: 'boolean', default: true, name: 'sync_calendar' })
  syncCalendar: boolean;

  @Column({ type: 'boolean', default: true, name: 'sync_contacts' })
  syncContacts: boolean;

  @Column({ type: 'boolean', default: true, name: 'auto_tag_entities' })
  autoTagEntities: boolean;

  @Column({ type: 'boolean', default: true, name: 'create_activities' })
  createActivities: boolean;

  @Column({ 
    type: 'enum', 
    enum: SyncDirection, 
    default: SyncDirection.BIDIRECTIONAL,
    name: 'sync_direction'
  })
  syncDirection: SyncDirection;

  // Sync state
  @Column({ type: 'timestamp', nullable: true, name: 'last_email_sync' })
  lastEmailSync?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_calendar_sync' })
  lastCalendarSync?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_contact_sync' })
  lastContactSync?: Date;

  @Column({ type: 'varchar', nullable: true, name: 'email_delta_token' })
  emailDeltaToken?: string;

  @Column({ type: 'varchar', nullable: true, name: 'calendar_delta_token' })
  calendarDeltaToken?: string;

  // Filter settings
  @Column({ type: 'jsonb', default: {}, name: 'email_filters' })
  emailFilters: {
    folders?: string[];           // Specific folders to sync
    excludeFolders?: string[];    // Folders to exclude
    onlyWithAttachments?: boolean;
    importanceFilter?: EmailImportance[];
    syncSentItems?: boolean;
    daysToSync?: number;          // How many days back to sync
  };

  @Column({ type: 'jsonb', default: {}, name: 'calendar_filters' })
  calendarFilters: {
    calendars?: string[];         // Specific calendars to sync
    excludeAllDay?: boolean;
    excludePrivate?: boolean;
    daysAhead?: number;
    daysBehind?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Synced email records
 */
@Entity('outlook_emails')
@Index(['connectionId', 'outlookMessageId'], { unique: true })
@Index(['householdId'])
@Index(['accountId'])
@Index(['personId'])
@Index(['receivedAt'])
export class OutlookEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'connection_id' })
  connectionId: string;

  @Column({ type: 'varchar', name: 'outlook_message_id' })
  outlookMessageId: string;

  @Column({ type: 'varchar', name: 'conversation_id', nullable: true })
  conversationId?: string;

  @Column({ type: 'varchar', name: 'internet_message_id', nullable: true })
  internetMessageId?: string;

  // Email metadata
  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  preview?: string;

  @Column({ type: 'text', nullable: true, name: 'body_preview' })
  bodyPreview?: string;

  @Column({ type: 'varchar', name: 'from_address' })
  fromAddress: string;

  @Column({ type: 'varchar', name: 'from_name', nullable: true })
  fromName?: string;

  @Column({ type: 'jsonb', default: [], name: 'to_recipients' })
  toRecipients: Array<{ address: string; name?: string }>;

  @Column({ type: 'jsonb', default: [], name: 'cc_recipients' })
  ccRecipients: Array<{ address: string; name?: string }>;

  @Column({ type: 'jsonb', default: [], name: 'bcc_recipients' })
  bccRecipients: Array<{ address: string; name?: string }>;

  @Column({ type: 'timestamp', name: 'received_at' })
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_draft' })
  isDraft: boolean;

  @Column({ type: 'boolean', default: false, name: 'has_attachments' })
  hasAttachments: boolean;

  @Column({ 
    type: 'enum', 
    enum: EmailImportance, 
    default: EmailImportance.NORMAL 
  })
  importance: EmailImportance;

  @Column({ type: 'varchar', nullable: true, name: 'folder_id' })
  folderId?: string;

  @Column({ type: 'varchar', nullable: true, name: 'folder_name' })
  folderName?: string;

  @Column({ type: 'jsonb', default: [], name: 'categories' })
  categories: string[];

  // CRM entity associations (auto-tagged)
  @Column({ type: 'uuid', nullable: true, name: 'household_id' })
  householdId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  accountId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'person_id' })
  personId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'activity_id' })
  activityId?: string;

  // Matching metadata
  @Column({ type: 'jsonb', default: {}, name: 'match_metadata' })
  matchMetadata: {
    matchedBy?: 'email' | 'domain' | 'name' | 'manual' | 'ai';
    confidence?: number;
    matchedEntities?: Array<{
      type: 'household' | 'account' | 'person';
      id: string;
      name: string;
      confidence: number;
    }>;
  };

  @Column({ type: 'boolean', default: false, name: 'manually_tagged' })
  manuallyTagged: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_archived' })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Synced calendar events/meetings
 */
@Entity('outlook_events')
@Index(['connectionId', 'outlookEventId'], { unique: true })
@Index(['householdId'])
@Index(['accountId'])
@Index(['personId'])
@Index(['startTime'])
export class OutlookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'connection_id' })
  connectionId: string;

  @Column({ type: 'varchar', name: 'outlook_event_id' })
  outlookEventId: string;

  @Column({ type: 'varchar', name: 'ical_uid', nullable: true })
  iCalUId?: string;

  @Column({ type: 'varchar', name: 'series_master_id', nullable: true })
  seriesMasterId?: string;

  // Event details
  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'varchar', name: 'body_content_type', nullable: true })
  bodyContentType?: string;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'varchar', nullable: true })
  timezone?: string;

  @Column({ type: 'boolean', default: false, name: 'is_all_day' })
  isAllDay: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_cancelled' })
  isCancelled: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_online_meeting' })
  isOnlineMeeting: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'online_meeting_url' })
  onlineMeetingUrl?: string;

  @Column({ type: 'varchar', nullable: true, name: 'online_meeting_provider' })
  onlineMeetingProvider?: string;

  // Location
  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'location_details' })
  locationDetails?: {
    displayName?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Organizer & Attendees
  @Column({ type: 'varchar', name: 'organizer_email' })
  organizerEmail: string;

  @Column({ type: 'varchar', name: 'organizer_name', nullable: true })
  organizerName?: string;

  @Column({ type: 'jsonb', default: [] })
  attendees: Array<{
    email: string;
    name?: string;
    type: 'required' | 'optional' | 'resource';
    responseStatus: MeetingResponseStatus;
  }>;

  @Column({ 
    type: 'enum', 
    enum: MeetingResponseStatus, 
    default: MeetingResponseStatus.NONE,
    name: 'response_status'
  })
  responseStatus: MeetingResponseStatus;

  // Recurrence
  @Column({ type: 'boolean', default: false, name: 'is_recurring' })
  isRecurring: boolean;

  @Column({ type: 'jsonb', nullable: true })
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      month?: number;
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };

  // Categories & sensitivity
  @Column({ type: 'jsonb', default: [] })
  categories: string[];

  @Column({ type: 'varchar', default: 'normal' })
  sensitivity: 'normal' | 'personal' | 'private' | 'confidential';

  @Column({ type: 'varchar', default: 'free', name: 'show_as' })
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';

  // CRM entity associations
  @Column({ type: 'uuid', nullable: true, name: 'household_id' })
  householdId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  accountId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'person_id' })
  personId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'crm_meeting_id' })
  crmMeetingId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'activity_id' })
  activityId?: string;

  // Matching metadata
  @Column({ type: 'jsonb', default: {}, name: 'match_metadata' })
  matchMetadata: {
    matchedBy?: 'email' | 'domain' | 'name' | 'manual' | 'ai';
    confidence?: number;
    matchedEntities?: Array<{
      type: 'household' | 'account' | 'person';
      id: string;
      name: string;
      confidence: number;
    }>;
  };

  @Column({ type: 'boolean', default: false, name: 'manually_tagged' })
  manuallyTagged: boolean;

  @Column({ type: 'boolean', default: false, name: 'sync_to_crm_meetings' })
  syncToCrmMeetings: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Email-to-entity matching rules
 */
@Entity('outlook_matching_rules')
@Index(['firmId', 'isActive'])
export class OutlookMatchingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'firm_id' })
  firmId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', name: 'rule_type' })
  ruleType: 'email_domain' | 'email_address' | 'name_pattern' | 'subject_pattern' | 'custom';

  @Column({ type: 'varchar' })
  pattern: string;

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType: 'household' | 'account' | 'person';

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'integer', default: 100 })
  priority: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Contact sync mapping between Outlook and CRM
 */
@Entity('outlook_contacts')
@Index(['connectionId', 'outlookContactId'], { unique: true })
@Index(['personId'])
export class OutlookContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'connection_id' })
  connectionId: string;

  @Column({ type: 'varchar', name: 'outlook_contact_id' })
  outlookContactId: string;

  @Column({ type: 'varchar', name: 'display_name' })
  displayName: string;

  @Column({ type: 'varchar', nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ type: 'jsonb', default: [], name: 'email_addresses' })
  emailAddresses: Array<{ address: string; name?: string }>;

  @Column({ type: 'jsonb', default: [], name: 'phone_numbers' })
  phoneNumbers: Array<{ number: string; type?: string }>;

  @Column({ type: 'varchar', nullable: true, name: 'company_name' })
  companyName?: string;

  @Column({ type: 'varchar', nullable: true, name: 'job_title' })
  jobTitle?: string;

  // CRM mapping
  @Column({ type: 'uuid', nullable: true, name: 'person_id' })
  personId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'household_id' })
  householdId?: string;

  @Column({ 
    type: 'varchar', 
    name: 'sync_direction',
    default: 'bidirectional'
  })
  syncDirection: 'outlook_to_crm' | 'crm_to_outlook' | 'bidirectional';

  @Column({ type: 'timestamp', nullable: true, name: 'last_synced_at' })
  lastSyncedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
