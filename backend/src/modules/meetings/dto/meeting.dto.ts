import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsArray, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeetingType, MeetingStatus } from '../entities/meeting.entity';

export class CreateMeetingDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MeetingType })
  @IsEnum(MeetingType)
  meetingType: MeetingType;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  personIds?: string[];

  @ApiProperty()
  @IsUUID()
  advisorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendeeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  externalAttendees?: { name: string; email: string; role?: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prepNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MeetingStatus })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  personIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendeeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prepNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateMeetingNotesDto {
  @ApiProperty()
  @IsUUID()
  meetingId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  decisionsMade?: { decision: string; context?: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  actionItems?: {
    description: string;
    assignedTo?: string;
    dueDate?: string;
    priority?: string;
  }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicsDiscussed?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;
}

export class UpdateMeetingNotesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  decisionsMade?: { decision: string; context?: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  actionItems?: {
    description: string;
    assignedTo?: string;
    dueDate?: string;
    priority?: string;
    taskId?: string;
  }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  followUpTopics?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clientConcerns?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  complianceItems?: { item: string; action?: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresDocumentation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  documentationCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientSentiment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicsDiscussed?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;
}

export class GenerateAiSummaryDto {
  @ApiProperty()
  @IsString()
  rawNotes: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientContext?: string;
}

export class MeetingFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  advisorId?: string;

  @ApiPropertyOptional({ enum: MeetingStatus })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @ApiPropertyOptional({ enum: MeetingType })
  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
