import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType } from '../entities/entity.entity';

export class CreateEntityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  householdId?: string;

  @ApiProperty({ enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ example: 'Smith Family Trust' })
  @IsString()
  legalName: string;

  @ApiPropertyOptional({ example: 'Delaware' })
  @IsOptional()
  @IsString()
  stateOfFormation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  formationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;
}
