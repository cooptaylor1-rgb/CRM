import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  IsObject,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum ResearchSourceType {
  EMAIL = 'email',
  RSS = 'rss',
  MANUAL = 'manual',
  API = 'api',
  UPLOAD = 'upload',
}

export enum ResearchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

export enum ActionType {
  READ = 'read',
  BOOKMARKED = 'bookmarked',
  SHARED = 'shared',
  ACTED_ON = 'acted_on',
  DISMISSED = 'dismissed',
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export class ResearchFilters {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: ResearchSourceType, description: 'Filter by source type' })
  @IsOptional()
  @IsEnum(ResearchSourceType)
  sourceType?: ResearchSourceType;

  @ApiPropertyOptional({ type: [String], description: 'Filter by tag IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(20)
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ResearchStatus, description: 'Filter by processing status' })
  @IsOptional()
  @IsEnum(ResearchStatus)
  status?: ResearchStatus;

  @ApiPropertyOptional({ description: 'Filter by associated security ID' })
  @IsOptional()
  @IsUUID('4')
  securityId?: string;

  @ApiPropertyOptional({ default: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateAnnotationDto {
  @ApiProperty({ description: 'Annotation content / comment' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'The highlighted text this annotation refers to' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  highlightedText?: string;
}

export class TrackActionDto {
  @ApiProperty({ enum: ActionType, description: 'Type of user action' })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiPropertyOptional({ description: 'Additional metadata for the action' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateTagsDto {
  @ApiProperty({ type: [String], description: 'Array of tag UUIDs to assign to the research item' })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  tagIds: string[];
}

// ---------------------------------------------------------------------------
// Response shapes (not strictly class-validated but strongly typed)
// ---------------------------------------------------------------------------

export interface ResearchSourceSummary {
  id: string;
  name: string;
  sourceType: ResearchSourceType;
}

export interface ResearchTagSummary {
  id: string;
  name: string;
  color?: string;
}

export interface ResearchSecuritySummary {
  id: string;
  ticker: string;
  name: string;
  sentiment: number | null; // -1.0 to 1.0
}

export interface ResearchAttachmentSummary {
  id: string;
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface ResearchAnnotationSummary {
  id: string;
  content: string;
  highlightedText?: string;
  createdAt: Date;
}

export interface ResearchItemResponse {
  id: string;
  title: string;
  author?: string;
  summary?: string;
  contentText?: string;
  contentHtml?: string;
  originalUrl?: string;
  publishedAt?: Date;
  ingestedAt: Date;
  processedAt?: Date;
  status: ResearchStatus;
  source?: ResearchSourceSummary;
  tags: ResearchTagSummary[];
  securities: ResearchSecuritySummary[];
  attachments: ResearchAttachmentSummary[];
  annotations: ResearchAnnotationSummary[];
  extractedTickers: string[];
  sentimentScores: Record<string, number>;
}

export interface ResearchFeedItem extends ResearchItemResponse {
  relevanceScore: number; // how relevant to the requesting user
  isNew: boolean;
}

export interface ResearchStats {
  totalItems: number;
  pendingItems: number;
  processedItems: number;
  failedItems: number;
  itemsBySourceType: Record<string, number>;
  itemsByStatus: Record<ResearchStatus, number>;
  topTags: { tagId: string; tagName: string; count: number }[];
  topSecurities: { securityId: string; ticker: string; count: number }[];
  itemsThisWeek: number;
  itemsThisMonth: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
