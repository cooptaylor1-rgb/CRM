import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import { MoneyMovementStatus, MoneyMovementType } from '../entities/money-movement.entity';

export class CreateMoneyMovementRequestDto {
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
  accountId?: string;

  @ApiProperty({ enum: MoneyMovementType, default: MoneyMovementType.OTHER })
  @IsEnum(MoneyMovementType)
  type: MoneyMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'ISO date (YYYY-MM-DD) requested completion date' })
  @IsOptional()
  @IsDateString()
  neededByDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Checklist JSON (temporary, will be formalized later)' })
  @IsOptional()
  @IsObject()
  checklist?: any;
}

export class UpdateMoneyMovementRequestDto extends PartialType(CreateMoneyMovementRequestDto) {
  @ApiPropertyOptional({ enum: MoneyMovementStatus })
  @IsOptional()
  @IsEnum(MoneyMovementStatus)
  status?: MoneyMovementStatus;
}

export class MoneyMovementFilterDto {
  @ApiPropertyOptional({ enum: MoneyMovementStatus })
  @IsOptional()
  @IsEnum(MoneyMovementStatus)
  status?: MoneyMovementStatus;

  @ApiPropertyOptional({ enum: MoneyMovementType })
  @IsOptional()
  @IsEnum(MoneyMovementType)
  type?: MoneyMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;
}

export class InitiateMoneyMovementDto {
  @ApiPropertyOptional({ description: 'Optional initiation notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Artifacts metadata to record (package, Schwab forms, etc.)' })
  @IsOptional()
  @IsObject()
  initiationArtifacts?: any;
}
