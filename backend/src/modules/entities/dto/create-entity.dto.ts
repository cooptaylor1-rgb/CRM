import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsNumber, IsUUID, IsArray, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EntityType, TrustType, EntityStatus, EntityRole } from '../entities/entity.entity';

export class CreateEntityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiProperty({ enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiPropertyOptional({ enum: TrustType })
  @IsOptional()
  @IsEnum(TrustType)
  trustType?: TrustType;

  @ApiProperty({ example: 'Smith Family Trust' })
  @IsString()
  legalName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxIdType?: string;

  // Formation
  @ApiPropertyOptional({ example: 'Delaware' })
  @IsOptional()
  @IsString()
  stateOfFormation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryOfFormation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  formationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiscalYearEnd?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  // Trust-specific
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  trustDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terminationCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  distributionStandard?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  situsState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  governingLaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGrantorTrust?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  gstExempt?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pourOverWill?: boolean;

  // LLC-specific
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  operatingAgreementDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxClassification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registeredAgentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registeredAgentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  principalOfficeAddress?: string;

  // Valuation
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  valuationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valuationMethod?: string;

  // Compliance
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  annualReportDue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requires1099?: boolean;

  // Professional contacts
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attorneyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attorneyFirm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attorneyContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountantFirm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountantContact?: string;

  // Documents
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryDocumentId?: string;

  // Metadata
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Entity relationship DTOs
export class CreateEntityRelationshipDto {
  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  @ApiProperty({ enum: EntityRole })
  @IsEnum(EntityRole)
  role: EntityRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ownershipPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distributionPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capitalContribution?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

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
  @IsNumber()
  successionOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}

export class UpdateEntityRelationshipDto {
  @ApiPropertyOptional({ enum: EntityRole })
  @IsOptional()
  @IsEnum(EntityRole)
  role?: EntityRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ownershipPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distributionPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  successionOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}

// Distribution DTOs
export class CreateDistributionDto {
  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryEntityId?: string;

  @ApiProperty()
  @IsDateString()
  distributionDate: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  distributionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;
}

// Entity document link DTOs
export class LinkEntityDocumentDto {
  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiProperty()
  @IsUUID()
  documentId: string;

  @ApiProperty()
  @IsString()
  documentType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
