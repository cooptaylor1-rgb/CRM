import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HouseholdStatus, RiskTolerance, InvestmentObjective } from '../entities/household.entity';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Smith Family' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  primaryContactPersonId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  advisorId?: string;

  @ApiPropertyOptional({ enum: RiskTolerance })
  @IsOptional()
  @IsEnum(RiskTolerance)
  riskTolerance?: RiskTolerance;

  @ApiPropertyOptional({ enum: InvestmentObjective })
  @IsOptional()
  @IsEnum(InvestmentObjective)
  investmentObjective?: InvestmentObjective;

  @ApiPropertyOptional({ enum: HouseholdStatus })
  @IsOptional()
  @IsEnum(HouseholdStatus)
  status?: HouseholdStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  onboardingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastReviewDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;
}
