import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CustodianType } from './custodian.entity';

class CustodianSettingsDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  autoSync?: boolean;

  @ApiPropertyOptional({ default: 60 })
  @IsNumber()
  @IsOptional()
  syncFrequencyMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  syncAccounts?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  syncPositions?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  syncTransactions?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  syncDocuments?: boolean;
}

export class CreateCustodianConnectionDto {
  @ApiProperty({ enum: CustodianType })
  @IsEnum(CustodianType)
  custodianType: CustodianType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientSecret?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => CustodianSettingsDto)
  @IsOptional()
  settings?: CustodianSettingsDto;
}

export class UpdateCustodianConnectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientSecret?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => CustodianSettingsDto)
  @IsOptional()
  settings?: CustodianSettingsDto;
}

export class LinkAccountDto {
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty({ enum: CustodianType })
  @IsEnum(CustodianType)
  custodianType: CustodianType;

  @ApiProperty()
  @IsString()
  custodianAccountId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  custodianAccountNumber?: string;
}

export class SyncRequestDto {
  @ApiProperty({ enum: CustodianType })
  @IsEnum(CustodianType)
  custodianType: CustodianType;

  @ApiPropertyOptional({ enum: ['full', 'incremental', 'accounts', 'positions', 'transactions'] })
  @IsString()
  @IsOptional()
  syncType?: 'full' | 'incremental' | 'accounts' | 'positions' | 'transactions';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountLinkId?: string;
}

// Schwab-specific types
export interface SchwabAccount {
  accountNumber: string;
  accountId: string;
  accountType: string;
  accountStatus: string;
  displayName: string;
  currentBalances: {
    cashBalance: number;
    marketValue: number;
    totalValue: number;
  };
  positions?: SchwabPosition[];
}

export interface SchwabPosition {
  symbol: string;
  cusip?: string;
  description: string;
  quantity: number;
  marketValue: number;
  averageCost: number;
  costBasis: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  assetType: string;
  currentPrice: number;
}

export interface SchwabTransaction {
  transactionId: string;
  transactionDate: string;
  settlementDate: string;
  transactionType: string;
  description: string;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fees?: number;
}

export interface SchwabOAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface CustodianSyncResult {
  success: boolean;
  syncLogId: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
}
