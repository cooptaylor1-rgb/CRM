import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString, IsArray, IsObject, IsEmail, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PipelineStage, LeadSource, LostReason } from '../entities/prospect.entity';

export class CreateProspectDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  leadSource?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referrerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedAum?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedAdvisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateProspectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ enum: PipelineStage })
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probabilityPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedAum?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedAdvisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ChangeStageDto {
  @ApiProperty({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  newStage: PipelineStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkLostDto {
  @ApiProperty({ enum: LostReason })
  @IsEnum(LostReason)
  lostReason: LostReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostToCompetitor?: string;
}

export class ConvertToClientDto {
  @ApiProperty()
  @IsString()
  householdName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LogActivityDto {
  @ApiProperty({ enum: ['call', 'email', 'meeting', 'note', 'document_sent'] })
  @IsString()
  activityType: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProspectFilterDto {
  @ApiPropertyOptional({ enum: PipelineStage })
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  leadSource?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedAdvisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpBefore?: string;
}
