import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { SyncDirection, EmailImportance } from './outlook.entity';

// ==================== Connection DTOs ====================

export class InitiateOutlookConnectionDto {
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class CompleteOutlookConnectionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class UpdateOutlookConnectionDto {
  @IsOptional()
  @IsBoolean()
  syncEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  syncCalendar?: boolean;

  @IsOptional()
  @IsBoolean()
  syncContacts?: boolean;

  @IsOptional()
  @IsBoolean()
  autoTagEntities?: boolean;

  @IsOptional()
  @IsBoolean()
  createActivities?: boolean;

  @IsOptional()
  @IsEnum(SyncDirection)
  syncDirection?: SyncDirection;

  @IsOptional()
  emailFilters?: {
    folders?: string[];
    excludeFolders?: string[];
    onlyWithAttachments?: boolean;
    importanceFilter?: EmailImportance[];
    syncSentItems?: boolean;
    daysToSync?: number;
  };

  @IsOptional()
  calendarFilters?: {
    calendars?: string[];
    excludeAllDay?: boolean;
    excludePrivate?: boolean;
    daysAhead?: number;
    daysBehind?: number;
  };
}

// ==================== Email DTOs ====================

export class GetEmailsQueryDto {
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  untaggedOnly?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class TagEmailDto {
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;
}

export class BulkTagEmailsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  emailIds: string[];

  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;
}

// ==================== Calendar/Event DTOs ====================

export class GetEventsQueryDto {
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  untaggedOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  includeRecurring?: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class TagEventDto {
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsBoolean()
  syncToCrmMeetings?: boolean;
}

export class CreateOutlookEventDto {
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  attendees?: Array<{
    email: string;
    name?: string;
    type?: 'required' | 'optional';
  }>;

  @IsOptional()
  @IsBoolean()
  isOnlineMeeting?: boolean;

  @IsOptional()
  @IsString()
  onlineMeetingProvider?: string;

  // CRM tagging
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;
}

export class UpdateOutlookEventDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  attendees?: Array<{
    email: string;
    name?: string;
    type?: 'required' | 'optional';
  }>;
}

// ==================== Matching Rules DTOs ====================

export class CreateMatchingRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['email_domain', 'email_address', 'name_pattern', 'subject_pattern', 'custom'])
  ruleType: string;

  @IsString()
  pattern: string;

  @IsEnum(['household', 'account', 'person'])
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateMatchingRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Sync DTOs ====================

export class TriggerSyncDto {
  @IsOptional()
  @IsBoolean()
  emails?: boolean;

  @IsOptional()
  @IsBoolean()
  calendar?: boolean;

  @IsOptional()
  @IsBoolean()
  contacts?: boolean;

  @IsOptional()
  @IsBoolean()
  fullSync?: boolean;
}

export class SyncStatusDto {
  isConnected: boolean;
  connectionStatus: string;
  lastEmailSync?: Date;
  lastCalendarSync?: Date;
  lastContactSync?: Date;
  emailCount: number;
  eventCount: number;
  contactCount: number;
  untaggedEmailCount: number;
  untaggedEventCount: number;
  syncInProgress: boolean;
  errors: string[];
}

// ==================== Contact DTOs ====================

export class LinkContactDto {
  @IsUUID()
  personId: string;

  @IsOptional()
  @IsUUID()
  householdId?: string;

  @IsOptional()
  @IsEnum(['outlook_to_crm', 'crm_to_outlook', 'bidirectional'])
  syncDirection?: string;
}

// ==================== Analytics DTOs ====================

export class EmailAnalyticsDto {
  totalEmails: number;
  taggedEmails: number;
  untaggedEmails: number;
  byHousehold: Array<{ householdId: string; householdName: string; count: number }>;
  byPerson: Array<{ personId: string; personName: string; count: number }>;
  byFolder: Array<{ folder: string; count: number }>;
  emailsPerDay: Array<{ date: string; sent: number; received: number }>;
  topContacts: Array<{ email: string; name: string; count: number }>;
}

export class CalendarAnalyticsDto {
  totalEvents: number;
  taggedEvents: number;
  untaggedEvents: number;
  upcomingMeetings: number;
  byHousehold: Array<{ householdId: string; householdName: string; count: number }>;
  byPerson: Array<{ personId: string; personName: string; count: number }>;
  meetingsPerWeek: Array<{ week: string; count: number; totalHours: number }>;
  averageMeetingDuration: number;
}
