import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AssetClass,
  AllocationEntityType,
  FeeType,
  FeeFrequency,
  BillingMethod,
} from './entities/allocation.entity';

// ==================== Asset Allocation DTOs ====================

export class AllocationLineItemDto {
  @IsEnum(AssetClass)
  assetClass: AssetClass;

  @IsOptional()
  @IsString()
  customAssetClass?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercentage: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateTargetAllocationDto {
  @IsEnum(AllocationEntityType)
  entityType: AllocationEntityType;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationLineItemDto)
  lineItems: AllocationLineItemDto[];
}

export class UpdateTargetAllocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationLineItemDto)
  lineItems?: AllocationLineItemDto[];
}

export class GetAllocationsQueryDto {
  @IsOptional()
  @IsEnum(AllocationEntityType)
  entityType?: AllocationEntityType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

// ==================== Fee Schedule DTOs ====================

export class FeeTierDto {
  @IsEnum(FeeType)
  feeType: FeeType;

  @IsEnum(FeeFrequency)
  feeFrequency: FeeFrequency;

  @IsOptional()
  @IsString()
  tierName?: string;

  @IsNumber()
  @Min(0)
  minAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flatAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateFeeScheduleDto {
  @IsEnum(AllocationEntityType)
  entityType: AllocationEntityType;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(BillingMethod)
  billingMethod?: BillingMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumFee?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeTierDto)
  tiers: FeeTierDto[];
}

export class UpdateFeeScheduleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(BillingMethod)
  billingMethod?: BillingMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumFee?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeTierDto)
  tiers?: FeeTierDto[];
}

export class GetFeeSchedulesQueryDto {
  @IsOptional()
  @IsEnum(AllocationEntityType)
  entityType?: AllocationEntityType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class CalculateFeeDto {
  @IsUUID()
  feeScheduleId: string;

  @IsNumber()
  @Min(0)
  billableAmount: number;

  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}

export class RecordFeeHistoryDto {
  @IsOptional()
  @IsUUID()
  feeScheduleId?: string;

  @IsEnum(AllocationEntityType)
  entityType: AllocationEntityType;

  @IsUUID()
  entityId: string;

  @IsDateString()
  billingPeriodStart: string;

  @IsDateString()
  billingPeriodEnd: string;

  @IsNumber()
  @Min(0)
  billableAmount: number;

  @IsNumber()
  @Min(0)
  feeAmount: number;

  @IsOptional()
  @IsNumber()
  effectiveRate?: number;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
