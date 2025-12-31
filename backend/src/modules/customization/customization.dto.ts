import { IsEnum, IsOptional, IsString, IsBoolean, IsUUID, IsArray, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FieldType, EntityTarget, ViewType } from './entities/customization.entity';

// ==================== Custom Field DTOs ====================

class FieldOptionsDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  choices?: Array<{ value: string; label: string; color?: string }>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  min?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  max?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  precision?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxLength?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pattern?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  validationMessage?: string;
}

export class CreateCustomFieldDto {
  @ApiProperty()
  @IsString()
  fieldName: string;

  @ApiProperty()
  @IsString()
  fieldKey: string;

  @ApiProperty({ enum: FieldType })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiProperty({ enum: EntityTarget })
  @IsEnum(EntityTarget)
  entityTarget: EntityTarget;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  showInList?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  showInDetail?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isSearchable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isFilterable?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fieldGroup?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => FieldOptionsDto)
  @IsOptional()
  options?: FieldOptionsDto;
}

export class UpdateCustomFieldDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fieldName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showInList?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showInDetail?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fieldGroup?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => FieldOptionsDto)
  @IsOptional()
  options?: FieldOptionsDto;
}

export class SetFieldValueDto {
  @ApiProperty()
  @IsUUID()
  fieldDefinitionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  value: any;
}

export class SetFieldValuesDto {
  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiProperty({ type: [SetFieldValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetFieldValueDto)
  values: SetFieldValueDto[];
}

// ==================== Tag DTOs ====================

export class CreateTagDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ default: '#6366f1' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TagEntityDto {
  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds: string[];
}

// ==================== Saved View DTOs ====================

class ColumnConfigDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  visible: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  sortable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  filterable?: boolean;
}

class FilterConfigDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty({ enum: ['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'in', 'between', 'isEmpty', 'isNotEmpty'] })
  @IsString()
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'isEmpty' | 'isNotEmpty';

  @ApiProperty()
  value: any;
}

class SortConfigDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  @IsString()
  direction: 'asc' | 'desc';
}

export class CreateSavedViewDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiPropertyOptional({ enum: ViewType, default: ViewType.TABLE })
  @IsEnum(ViewType)
  @IsOptional()
  viewType?: ViewType;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ type: [ColumnConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnConfigDto)
  @IsOptional()
  columns?: ColumnConfigDto[];

  @ApiPropertyOptional({ type: [FilterConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConfigDto)
  @IsOptional()
  filters?: FilterConfigDto[];

  @ApiPropertyOptional({ type: [SortConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortConfigDto)
  @IsOptional()
  sorting?: SortConfigDto[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  grouping?: {
    enabled: boolean;
    field?: string;
    collapsed?: boolean;
  };

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  display?: {
    density?: 'compact' | 'normal' | 'comfortable';
    showGridLines?: boolean;
    alternateRowColors?: boolean;
    pageSize?: number;
  };

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateSavedViewDto extends CreateSavedViewDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}

// ==================== User Preferences DTOs ====================

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'] })
  @IsString()
  @IsOptional()
  theme?: 'light' | 'dark' | 'system';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dateFormat?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  dashboardLayout?: any;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  tablePreferences?: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  sidebarState?: any;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  favorites?: Array<{ type: string; id: string; name: string }>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  shortcuts?: Array<{ key: string; action: string }>;
}

export class AddRecentItemDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;
}
