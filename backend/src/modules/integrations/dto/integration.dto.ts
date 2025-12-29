import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IntegrationProvider, SyncDirection } from '../entities/integration.entity';

// ==================== Integration Setup ====================

export class IntegrationSettingsDto {
  @ApiProperty()
  @IsBoolean()
  syncCalendar: boolean;

  @ApiProperty()
  @IsBoolean()
  syncEmail: boolean;

  @ApiProperty()
  @IsBoolean()
  syncContacts: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultCalendarId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailFolderIds?: string[];

  @ApiProperty({ enum: SyncDirection })
  @IsEnum(SyncDirection)
  syncDirection: SyncDirection;

  @ApiProperty()
  @IsBoolean()
  autoArchiveEmails: boolean;

  @ApiProperty()
  @IsBoolean()
  archiveClientEmailsOnly: boolean;
}

export class InitiateOAuthDto {
  @ApiProperty({ enum: IntegrationProvider })
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class CompleteOAuthDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: IntegrationProvider })
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;
}

export class UpdateIntegrationSettingsDto extends PartialType(IntegrationSettingsDto) {}

// ==================== Calendar ====================

export class AttendeeDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateCalendarEventDto {
  @ApiProperty()
  @IsString()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ type: [AttendeeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees?: AttendeeDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  createOnlineMeeting?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedHouseholdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedPersonId?: string;
}

export class UpdateCalendarEventDto extends PartialType(CreateCalendarEventDto) {}

export class CalendarFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedHouseholdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedPersonId?: string;
}

// ==================== Email ====================

export class EmailRecipientDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendEmailDto {
  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyContentType?: 'text' | 'html';

  @ApiProperty({ type: [EmailRecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  to: EmailRecipientDto[];

  @ApiPropertyOptional({ type: [EmailRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  cc?: EmailRecipientDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  importance?: 'low' | 'normal' | 'high';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedHouseholdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedPersonId?: string;
}

export class EmailFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasAttachments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedHouseholdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isClientCommunication?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class LinkEmailDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedHouseholdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isClientCommunication?: boolean;
}

export class ArchiveEmailDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  emailIds: string[];
}

// ==================== Sync ====================

export class ManualSyncDto {
  @ApiProperty()
  @IsString()
  syncType: 'calendar' | 'email' | 'contacts' | 'full';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  since?: string;
}
