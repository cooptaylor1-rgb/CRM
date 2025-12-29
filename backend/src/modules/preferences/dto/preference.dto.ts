import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsArray, IsObject, IsNumber, IsDateString, IsEmail, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { ContactMethod, ContactFrequency, MeetingPreference } from '../entities/client-preference.entity';
import { RelationshipType, RelationshipStatus } from '../entities/client-relationship.entity';

// Client Preferences DTOs
export class CreateClientPreferenceDto {
  @ApiProperty()
  @IsUUID()
  householdId: string;

  @ApiPropertyOptional({ enum: ContactMethod })
  @IsOptional()
  @IsEnum(ContactMethod)
  preferredContactMethod?: ContactMethod;

  @ApiPropertyOptional({ enum: ContactFrequency })
  @IsOptional()
  @IsEnum(ContactFrequency)
  preferredContactFrequency?: ContactFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bestTimeToCall?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailOptIn?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newsletterOptIn?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  @ApiPropertyOptional({ enum: MeetingPreference })
  @IsOptional()
  @IsEnum(MeetingPreference)
  meetingTimePreference?: MeetingPreference;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredMeetingLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  virtualMeetingPreference?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteSportsTeams?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  charitableInterests?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  almaMater?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  weddingAnniversary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  retirementDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  importantDates?: { date: string; description: string; recurring: boolean }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  giftPreferences?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  childrenInfo?: { name: string; birthdate: string; school?: string; interests?: string[] }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  petInfo?: { name: string; type: string; breed?: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateClientPreferenceDto extends PartialType(CreateClientPreferenceDto) {}

// Client Relationship DTOs
export class CreateClientRelationshipDto {
  @ApiProperty()
  @IsUUID()
  householdId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @ApiProperty()
  @IsString()
  contactName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  relationshipSince?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  introducedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasReleaseOnFile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  releaseExpiration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collaborationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateClientRelationshipDto {
  @ApiPropertyOptional({ enum: RelationshipType })
  @IsOptional()
  @IsEnum(RelationshipType)
  relationshipType?: RelationshipType;

  @ApiPropertyOptional({ enum: RelationshipStatus })
  @IsOptional()
  @IsEnum(RelationshipStatus)
  status?: RelationshipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasReleaseOnFile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  releaseExpiration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastContactDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collaborationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
