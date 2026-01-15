import { IsString, IsUUID, IsOptional, IsDateString, IsArray, IsObject } from 'class-validator';
import { TalkingPoint, ActionItem } from '../entities/meeting-brief.entity';

export class GenerateBriefDto {
  @IsUUID()
  householdId: string;

  @IsUUID()
  @IsOptional()
  meetingId?: string;

  @IsDateString()
  meetingDate: string;

  @IsString()
  @IsOptional()
  meetingType?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalTopics?: string[];
}

export class UpdateBriefDto {
  @IsArray()
  @IsOptional()
  talkingPoints?: TalkingPoint[];

  @IsArray()
  @IsOptional()
  actionItems?: ActionItem[];

  @IsObject()
  @IsOptional()
  advisorNote?: { note: string };
}

export class BriefFilterDto {
  @IsUUID()
  @IsOptional()
  householdId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  meetingType?: string;
}
