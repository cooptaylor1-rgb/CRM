import { IsEnum, IsOptional, IsString, IsBoolean, IsUUID, IsArray, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TeamRole, ActivityType, NotificationType } from './entities/collaboration.entity';

// ==================== Team DTOs ====================

class TeamPermissionsDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  canManageTeam?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  canViewFinancials?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  canTrade?: boolean;
}

export class AddTeamMemberDto {
  @ApiProperty()
  @IsUUID()
  householdId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: TeamRole })
  @IsEnum(TeamRole)
  teamRole: TeamRole;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  receivesNotifications?: boolean;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => TeamPermissionsDto)
  @IsOptional()
  permissions?: TeamPermissionsDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ enum: TeamRole })
  @IsEnum(TeamRole)
  @IsOptional()
  teamRole?: TeamRole;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  receivesNotifications?: boolean;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => TeamPermissionsDto)
  @IsOptional()
  permissions?: TeamPermissionsDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

// ==================== Activity DTOs ====================

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  householdId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  relatedEntityType?: string;
}

export class ActivityFilterDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  householdId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: ActivityType })
  @IsEnum(ActivityType)
  @IsOptional()
  activityType?: ActivityType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  offset?: number;
}

// ==================== Comment DTOs ====================

export class CreateCommentDto {
  @ApiProperty({ enum: ['household', 'account', 'task', 'meeting', 'document', 'workflow'] })
  @IsString()
  entityType: 'household' | 'account' | 'task' | 'meeting' | 'document' | 'workflow';

  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  mentions?: Array<{
    userId: string;
    userName: string;
    position: number;
  }>;
}

export class UpdateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  mentions?: Array<{
    userId: string;
    userName: string;
    position: number;
  }>;
}

// ==================== Notification DTOs ====================

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  triggeredBy?: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  emailPreferences?: {
    mentions?: boolean;
    taskAssigned?: boolean;
    taskDue?: boolean;
    meetingReminders?: boolean;
    commentReplies?: boolean;
    clientUpdates?: boolean;
    dailyDigest?: boolean;
    weeklyDigest?: boolean;
  };

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  inAppPreferences?: {
    mentions?: boolean;
    taskAssigned?: boolean;
    taskDue?: boolean;
    meetingReminders?: boolean;
    commentReplies?: boolean;
    clientUpdates?: boolean;
    workflowActions?: boolean;
  };

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  soundEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  desktopEnabled?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quietHoursEnd?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  quietHoursEnabled?: boolean;
}
