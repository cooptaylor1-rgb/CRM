import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus, ReviewType } from '../entities/compliance-review.entity';

export class ListComplianceReviewsDto {
  @ApiPropertyOptional({ description: 'Filter by householdId', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional({ enum: ReviewStatus, description: 'Filter by review status' })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ enum: ReviewType, description: 'Filter by review type' })
  @IsOptional()
  @IsEnum(ReviewType)
  type?: ReviewType;

  @ApiPropertyOptional({ description: 'Filter reviews with reviewDate >= startDate (ISO date)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter reviews with reviewDate <= endDate (ISO date)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
