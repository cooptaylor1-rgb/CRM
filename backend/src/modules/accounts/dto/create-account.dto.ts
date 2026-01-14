import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, AccountStatus, ManagementStyle } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'ACC-123456', description: 'Unique account identifier' })
  @IsString()
  @MinLength(1, { message: 'Account number cannot be empty' })
  @MaxLength(50, { message: 'Account number cannot exceed 50 characters' })
  @Matches(/^[A-Za-z0-9\-_]+$/, { message: 'Account number can only contain alphanumeric characters, hyphens, and underscores' })
  accountNumber: string;

  @ApiProperty({ example: 'John Smith IRA', description: 'Display name for the account' })
  @IsString()
  @MinLength(1, { message: 'Account name cannot be empty' })
  @MaxLength(200, { message: 'Account name cannot exceed 200 characters' })
  accountName: string;

  @ApiProperty({ description: 'UUID of the household this account belongs to' })
  @IsUUID('4', { message: 'householdId must be a valid UUID' })
  householdId: string;

  @ApiPropertyOptional({ description: 'UUID of the person who owns this account' })
  @IsOptional()
  @IsUUID('4', { message: 'ownerPersonId must be a valid UUID' })
  ownerPersonId?: string;

  @ApiPropertyOptional({ description: 'UUID of the entity that owns this account' })
  @IsOptional()
  @IsUUID('4', { message: 'ownerEntityId must be a valid UUID' })
  ownerEntityId?: string;

  @ApiProperty({ enum: AccountType, description: 'Type of investment account' })
  @IsEnum(AccountType, { message: 'Invalid account type' })
  accountType: AccountType;

  @ApiPropertyOptional({ example: 'Schwab', description: 'Custodian name (e.g., Schwab, Fidelity, Pershing)' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Custodian name cannot exceed 100 characters' })
  custodian?: string;

  @ApiPropertyOptional({ enum: AccountStatus, description: 'Current status of the account' })
  @IsOptional()
  @IsEnum(AccountStatus, { message: 'Invalid account status' })
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Current market value of the account', minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Current value must be a number' })
  @Min(0, { message: 'Current value cannot be negative' })
  @Max(999999999999, { message: 'Current value exceeds maximum allowed' })
  currentValue?: number;

  @ApiPropertyOptional({ enum: ManagementStyle, description: 'Investment management approach' })
  @IsOptional()
  @IsEnum(ManagementStyle, { message: 'Invalid management style' })
  managementStyle?: ManagementStyle;

  @ApiPropertyOptional({ description: 'Date when the account was opened (ISO 8601 format)' })
  @IsOptional()
  @IsDateString({}, { message: 'openedDate must be a valid ISO 8601 date string' })
  openedDate?: string;
}
