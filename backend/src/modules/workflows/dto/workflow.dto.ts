import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowTrigger, WorkflowStatus, WorkflowStep } from '../entities/workflow.entity';

export class CreateWorkflowTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: WorkflowTrigger })
  @IsEnum(WorkflowTrigger)
  trigger: WorkflowTrigger;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  triggerConditions?: Record<string, any>;

  @ApiProperty({ type: 'array' })
  @IsArray()
  steps: WorkflowStep[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedDurationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateWorkflowTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  triggerConditions?: Record<string, any>;

  @ApiPropertyOptional({ type: 'array' })
  @IsOptional()
  @IsArray()
  steps?: WorkflowStep[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedDurationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class StartWorkflowDto {
  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  triggerData?: Record<string, any>;
}

export class UpdateWorkflowInstanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentStep?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  stepStatuses?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CompleteStepDto {
  @ApiProperty()
  @IsString()
  stepId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WorkflowFilterDto {
  @ApiPropertyOptional({ enum: WorkflowTrigger })
  @IsOptional()
  @IsEnum(WorkflowTrigger)
  trigger?: WorkflowTrigger;

  @ApiPropertyOptional({ enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
