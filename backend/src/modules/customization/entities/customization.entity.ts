import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  USER = 'user',
  HOUSEHOLD = 'household',
  ACCOUNT = 'account',
}

export enum EntityTarget {
  HOUSEHOLD = 'household',
  ACCOUNT = 'account',
  PERSON = 'person',
  ENTITY = 'entity',
  TASK = 'task',
  MEETING = 'meeting',
  DOCUMENT = 'document',
}

export enum ViewType {
  TABLE = 'table',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
  LIST = 'list',
}

/**
 * Custom field definitions
 */
@Entity('custom_field_definitions')
@Index(['entityTarget', 'isActive'])
export class CustomFieldDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'field_name' })
  fieldName: string;

  @Column({ type: 'varchar', name: 'field_key', unique: true })
  fieldKey: string;

  @Column({ type: 'enum', enum: FieldType, name: 'field_type' })
  fieldType: FieldType;

  @Column({ type: 'enum', enum: EntityTarget, name: 'entity_target' })
  entityTarget: EntityTarget;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  placeholder?: string;

  @Column({ type: 'text', nullable: true, name: 'default_value' })
  defaultValue?: string;

  @Column({ type: 'boolean', default: false, name: 'is_required' })
  isRequired: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: true, name: 'show_in_list' })
  showInList: boolean;

  @Column({ type: 'boolean', default: true, name: 'show_in_detail' })
  showInDetail: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_searchable' })
  isSearchable: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_filterable' })
  isFilterable: boolean;

  @Column({ type: 'integer', default: 0, name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'varchar', nullable: true, name: 'field_group' })
  fieldGroup?: string;

  @Column({ type: 'jsonb', default: {} })
  options: {
    // For select/multi-select
    choices?: Array<{ value: string; label: string; color?: string }>;
    // For number/currency
    min?: number;
    max?: number;
    precision?: number;
    // For text
    maxLength?: number;
    pattern?: string;
    // For date
    minDate?: string;
    maxDate?: string;
    // Validation
    validationMessage?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Custom field values stored per entity
 */
@Entity('custom_field_values')
@Index(['entityType', 'entityId'])
@Index(['fieldDefinitionId'])
export class CustomFieldValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'field_definition_id' })
  fieldDefinitionId: string;

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'text', nullable: true, name: 'text_value' })
  textValue?: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true, name: 'number_value' })
  numberValue?: number;

  @Column({ type: 'boolean', nullable: true, name: 'boolean_value' })
  booleanValue?: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'date_value' })
  dateValue?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'json_value' })
  jsonValue?: any;

  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Tag definitions with hierarchical support
 */
@Entity('tags')
@Index(['name'], { unique: true })
@Index(['category'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @Column({ type: 'varchar', default: '#6366f1' })
  color: string;

  @Column({ type: 'varchar', nullable: true })
  icon?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Entity-tag relationships
 */
@Entity('entity_tags')
@Index(['entityType', 'entityId'])
@Index(['tagId'])
export class EntityTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => Tag)
  @JoinColumn({ name: 'tag_id' })
  tag?: Tag;

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'uuid', name: 'added_by', nullable: true })
  addedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * Saved views/filters
 */
@Entity('saved_views')
@Index(['userId', 'entityType'])
@Index(['isShared', 'entityType'])
export class SavedView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType: string;

  @Column({ type: 'enum', enum: ViewType, name: 'view_type', default: ViewType.TABLE })
  viewType: ViewType;

  @Column({ type: 'boolean', default: false, name: 'is_shared' })
  isShared: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_pinned' })
  isPinned: boolean;

  @Column({ type: 'jsonb', default: [] })
  columns: Array<{
    key: string;
    label: string;
    width?: number;
    visible: boolean;
    sortable?: boolean;
    filterable?: boolean;
  }>;

  @Column({ type: 'jsonb', default: [] })
  filters: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'isEmpty' | 'isNotEmpty';
    value: any;
  }>;

  @Column({ type: 'jsonb', default: [] })
  sorting: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;

  @Column({ type: 'jsonb', default: {} })
  grouping: {
    enabled: boolean;
    field?: string;
    collapsed?: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  display: {
    density?: 'compact' | 'normal' | 'comfortable';
    showGridLines?: boolean;
    alternateRowColors?: boolean;
    pageSize?: number;
  };

  @Column({ type: 'varchar', nullable: true })
  icon?: string;

  @Column({ type: 'varchar', nullable: true })
  color?: string;

  @Column({ type: 'integer', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * User preferences (UI state, defaults, etc.)
 */
@Entity('user_preferences')
@Index(['userId'], { unique: true })
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', default: 'light' })
  theme: 'light' | 'dark' | 'system';

  @Column({ type: 'varchar', default: 'en' })
  language: string;

  @Column({ type: 'varchar', default: 'America/New_York' })
  timezone: string;

  @Column({ type: 'varchar', default: 'MM/DD/YYYY', name: 'date_format' })
  dateFormat: string;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', default: {} })
  dashboardLayout: {
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number; w: number; h: number };
      config?: Record<string, any>;
    }>;
  };

  @Column({ type: 'jsonb', default: {} })
  tablePreferences: Record<string, {
    pageSize: number;
    density: string;
    columnOrder: string[];
    hiddenColumns: string[];
  }>;

  @Column({ type: 'jsonb', default: {} })
  sidebarState: {
    collapsed: boolean;
    pinnedItems: string[];
    expandedSections: string[];
  };

  @Column({ type: 'jsonb', default: {} })
  recentItems: Array<{
    type: string;
    id: string;
    name: string;
    timestamp: string;
  }>;

  @Column({ type: 'jsonb', default: {} })
  favorites: Array<{
    type: string;
    id: string;
    name: string;
  }>;

  @Column({ type: 'jsonb', default: {} })
  shortcuts: Array<{
    key: string;
    action: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
