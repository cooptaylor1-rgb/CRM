import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType, ReviewStatus } from '../entities/compliance-review.entity';

export class CreateComplianceReviewDto {
  @ApiProperty({ enum: ReviewType })
  @IsEnum(ReviewType)
  reviewType: ReviewType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  householdId?: string;

  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiProperty()
  @IsDateString()
  reviewDate: string;

  @ApiProperty()
  @IsString()
  reviewerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
