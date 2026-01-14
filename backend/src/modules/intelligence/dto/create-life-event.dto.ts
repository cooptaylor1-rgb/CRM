import { IsEnum, IsString, IsUUID, IsOptional, IsNumber, IsDateString, IsObject, IsArray, Min, Max } from 'class-validator';
import { LifeEventType, EventSource, EventImpact } from '../entities/life-event.entity';

export class CreateLifeEventDto {
  @IsUUID()
  householdId: string;

  @IsUUID()
  @IsOptional()
  personId?: string;

  @IsEnum(LifeEventType)
  eventType: LifeEventType;

  @IsEnum(EventSource)
  @IsOptional()
  source?: EventSource;

  @IsEnum(EventImpact)
  @IsOptional()
  impact?: EventImpact;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  eventDate: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendedActions?: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceScore?: number;
}

export class AcknowledgeLifeEventDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class LifeEventFilterDto {
  @IsUUID()
  @IsOptional()
  householdId?: string;

  @IsEnum(LifeEventType)
  @IsOptional()
  eventType?: LifeEventType;

  @IsEnum(EventSource)
  @IsOptional()
  source?: EventSource;

  @IsString()
  @IsOptional()
  acknowledged?: 'true' | 'false';

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
