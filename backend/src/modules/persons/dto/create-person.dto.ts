import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycStatus } from '../entities/person.entity';

export class CreatePersonDto {
  @ApiProperty({ description: 'UUID of the household this person belongs to' })
  @IsUUID('4', { message: 'householdId must be a valid UUID' })
  householdId: string;

  @ApiProperty({ example: 'John', description: 'Legal first name' })
  @IsString()
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Legal last name' })
  @IsString()
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  lastName: string;

  @ApiPropertyOptional({ example: 'Michael', description: 'Middle name or initial' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Middle name cannot exceed 100 characters' })
  middleName?: string;

  @ApiPropertyOptional({ description: 'Date of birth in ISO 8601 format' })
  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO 8601 date string' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'john.smith@example.com', description: 'Primary email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567', description: 'Primary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone number cannot exceed 30 characters' })
  @Matches(/^[+\d\s\-().]+$/, { message: 'Phone number contains invalid characters' })
  phonePrimary?: string;

  @ApiPropertyOptional({ description: 'Full mailing address' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  address?: string;

  @ApiPropertyOptional({
    example: '123-45-6789',
    description: 'Social Security Number (will be encrypted). Format: XXX-XX-XXXX or XXXXXXXXX',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{3}-\d{2}-\d{4}|\d{9})$/, {
    message: 'SSN must be in format XXX-XX-XXXX or XXXXXXXXX',
  })
  ssn?: string;

  @ApiPropertyOptional({ default: false, description: 'Whether this person is the primary contact for the household' })
  @IsOptional()
  @IsBoolean()
  isPrimaryContact?: boolean;

  @ApiPropertyOptional({ enum: KycStatus, description: 'KYC verification status' })
  @IsOptional()
  @IsEnum(KycStatus, { message: 'Invalid KYC status' })
  kycStatus?: KycStatus;
}
