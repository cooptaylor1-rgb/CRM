import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, AccountStatus, ManagementStyle } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'ACC-123456' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'John Smith IRA' })
  @IsString()
  accountName: string;

  @ApiProperty()
  @IsString()
  householdId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerEntityId?: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ example: 'Schwab' })
  @IsOptional()
  @IsString()
  custodian?: string;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @ApiPropertyOptional({ enum: ManagementStyle })
  @IsOptional()
  @IsEnum(ManagementStyle)
  managementStyle?: ManagementStyle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  openedDate?: string;
}
