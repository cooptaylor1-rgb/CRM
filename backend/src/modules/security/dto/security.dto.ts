import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsArray, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentType, IncidentSeverity, IncidentStatus, DataClassification } from '../entities/security-incident.entity';
import { KycStatus, RiskLevel } from '../entities/kyc.entity';

// Security Incident DTOs
export class CreateSecurityIncidentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  incidentType: IncidentType;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiProperty()
  @IsDateString()
  discoveredAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discoveryMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedSystems?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedUsers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedClients?: string[];

  @ApiPropertyOptional({ enum: DataClassification, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DataClassification, { each: true })
  dataTypesAffected?: DataClassification[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

export class UpdateSecurityIncidentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  containmentActions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remediationActions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  recordsAffectedCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedFinancialImpact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresNotification?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  notificationDeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  responseTeam?: string[];
}

export class AddTimelineEntryDto {
  @ApiProperty()
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// KYC DTOs
export class CreateKycVerificationDto {
  @ApiProperty()
  @IsUUID()
  personId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identityDocumentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identityDocumentNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  identityDocumentExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceOfFunds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceOfWealth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedActivity?: string;
}

export class UpdateKycVerificationDto {
  @ApiPropertyOptional({ enum: KycStatus })
  @IsOptional()
  @IsEnum(KycStatus)
  status?: KycStatus;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  identityVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  addressVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPep?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pepType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pepCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sanctionsCheckPassed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accreditedInvestor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  qualifiedClient?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewFrequencyMonths?: number;
}

export class RunScreeningDto {
  @ApiProperty()
  @IsUUID()
  personId: string;

  @ApiProperty({ enum: ['sanctions', 'pep', 'adverse_media', 'all'] })
  @IsString()
  screeningType: string;
}

export class CreateSarDto {
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

  @ApiProperty()
  @IsDateString()
  activityDate: string;

  @ApiProperty()
  @IsString()
  activityType: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountInvolved?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redFlags?: string[];
}
