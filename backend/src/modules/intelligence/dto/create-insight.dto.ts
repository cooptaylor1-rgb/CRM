import { IsEnum, IsString, IsUUID, IsOptional, IsNumber, IsDateString, IsObject, Min, Max } from 'class-validator';
import { InsightType, InsightPriority } from '../entities/client-insight.entity';

export class CreateInsightDto {
  @IsUUID()
  householdId: string;

  @IsEnum(InsightType)
  type: InsightType;

  @IsEnum(InsightPriority)
  @IsOptional()
  priority?: InsightPriority;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  recommendedAction?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceScore?: number;

  @IsNumber()
  @IsOptional()
  potentialImpact?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UpdateInsightStatusDto {
  @IsString()
  @IsOptional()
  status?: 'viewed' | 'acknowledged' | 'actioned' | 'dismissed';

  @IsString()
  @IsOptional()
  actionNotes?: string;
}

export class InsightFilterDto {
  @IsUUID()
  @IsOptional()
  householdId?: string;

  @IsEnum(InsightType)
  @IsOptional()
  type?: InsightType;

  @IsEnum(InsightPriority)
  @IsOptional()
  priority?: InsightPriority;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
