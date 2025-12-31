import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CustomFieldDefinition,
  CustomFieldValue,
  Tag,
  EntityTag,
  SavedView,
  UserPreference,
  FieldType,
  EntityTarget,
} from './entities/customization.entity';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  SetFieldValuesDto,
  CreateTagDto,
  UpdateTagDto,
  TagEntityDto,
  CreateSavedViewDto,
  UpdateSavedViewDto,
  UpdateUserPreferencesDto,
  AddRecentItemDto,
} from './customization.dto';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(
    @InjectRepository(CustomFieldDefinition)
    private readonly customFieldRepo: Repository<CustomFieldDefinition>,
    @InjectRepository(CustomFieldValue)
    private readonly fieldValueRepo: Repository<CustomFieldValue>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(EntityTag)
    private readonly entityTagRepo: Repository<EntityTag>,
    @InjectRepository(SavedView)
    private readonly savedViewRepo: Repository<SavedView>,
    @InjectRepository(UserPreference)
    private readonly userPrefRepo: Repository<UserPreference>,
  ) {}

  // ==================== Custom Field Methods ====================

  async createCustomField(createdBy: string, dto: CreateCustomFieldDto): Promise<CustomFieldDefinition> {
    // Check for duplicate field key
    const existing = await this.customFieldRepo.findOne({
      where: { entityTarget: dto.entityTarget, fieldKey: dto.fieldKey },
    });
    if (existing) {
      throw new ConflictException(`Field with key "${dto.fieldKey}" already exists for ${dto.entityTarget}`);
    }

    // Validate field type options
    this.validateFieldOptions(dto.fieldType, dto.options);

    // Get max display order for entity
    const maxOrder = await this.customFieldRepo
      .createQueryBuilder('field')
      .where('field.entityTarget = :target', { target: dto.entityTarget })
      .select('MAX(field.displayOrder)', 'max')
      .getRawOne();

    const field = this.customFieldRepo.create({
      ...dto,
      createdBy,
      displayOrder: dto.displayOrder ?? (maxOrder?.max || 0) + 1,
    });

    const saved = await this.customFieldRepo.save(field);
    this.logger.log(`Created custom field "${dto.fieldName}" for ${dto.entityTarget}`);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getCustomFields(
    entityTarget?: EntityTarget,
    options?: { includeInactive?: boolean; fieldGroup?: string },
  ): Promise<CustomFieldDefinition[]> {
    const query = this.customFieldRepo.createQueryBuilder('field');

    if (entityTarget) {
      query.where('field.entityTarget = :entityTarget', { entityTarget });
    }
    if (!options?.includeInactive) {
      query.andWhere('field.isActive = :active', { active: true });
    }
    if (options?.fieldGroup) {
      query.andWhere('field.fieldGroup = :group', { group: options.fieldGroup });
    }

    return query.orderBy('field.displayOrder', 'ASC').getMany();
  }

  async getCustomField(fieldId: string): Promise<CustomFieldDefinition> {
    const field = await this.customFieldRepo.findOne({
      where: { id: fieldId },
    });
    if (!field) {
      throw new NotFoundException(`Custom field ${fieldId} not found`);
    }
    return field;
  }

  async updateCustomField(
    fieldId: string,
    dto: UpdateCustomFieldDto,
  ): Promise<CustomFieldDefinition> {
    const field = await this.getCustomField(fieldId);

    if (dto.options) {
      this.validateFieldOptions(field.fieldType, dto.options);
    }

    Object.assign(field, dto);
    const saved = await this.customFieldRepo.save(field);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async deleteCustomField(fieldId: string): Promise<void> {
    const field = await this.getCustomField(fieldId);
    
    // Check if field has values
    const valueCount = await this.fieldValueRepo.count({
      where: { fieldDefinitionId: fieldId },
    });

    if (valueCount > 0) {
      // Soft delete by deactivating
      field.isActive = false;
      await this.customFieldRepo.save(field);
      this.logger.log(`Soft-deleted custom field ${fieldId} with ${valueCount} values`);
    } else {
      await this.customFieldRepo.remove(field);
      this.logger.log(`Deleted custom field ${fieldId}`);
    }
  }

  async reorderCustomFields(
    entityTarget: EntityTarget,
    orderedIds: string[],
  ): Promise<CustomFieldDefinition[]> {
    const fields = await this.customFieldRepo.find({
      where: { entityTarget, id: In(orderedIds) },
    });

    for (let i = 0; i < orderedIds.length; i++) {
      const field = fields.find(f => f.id === orderedIds[i]);
      if (field) {
        field.displayOrder = i + 1;
      }
    }

    return this.customFieldRepo.save(fields);
  }

  // ==================== Field Value Methods ====================

  async setFieldValues(dto: SetFieldValuesDto, updatedBy: string): Promise<CustomFieldValue[]> {
    const results: CustomFieldValue[] = [];

    for (const valueDto of dto.values) {
      const field = await this.getCustomField(valueDto.fieldDefinitionId);
      
      // Validate value against field type
      const validatedValue = this.validateAndTransformValue(field, valueDto.value);

      let fieldValue = await this.fieldValueRepo.findOne({
        where: {
          fieldDefinitionId: valueDto.fieldDefinitionId,
          entityType: dto.entityType,
          entityId: dto.entityId,
        },
      });

      if (fieldValue) {
        // Update existing
        Object.assign(fieldValue, validatedValue);
        fieldValue.updatedBy = updatedBy;
      } else {
        // Create new
        fieldValue = this.fieldValueRepo.create({
          fieldDefinitionId: valueDto.fieldDefinitionId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          updatedBy,
          ...validatedValue,
        });
      }

      const saved = await this.fieldValueRepo.save(fieldValue);
      results.push(Array.isArray(saved) ? saved[0] : saved);
    }

    return results;
  }

  async getFieldValues(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, any>> {
    const values = await this.fieldValueRepo.find({
      where: {
        entityType,
        entityId,
      },
    });

    // Transform to key-value format
    const result: Record<string, any> = {};
    for (const value of values) {
      result[value.fieldDefinitionId] = this.extractValue(value);
    }

    return result;
  }

  async getFieldValuesForEntities(
    entityType: string,
    entityIds: string[],
  ): Promise<Map<string, Record<string, any>>> {
    const values = await this.fieldValueRepo.find({
      where: {
        entityType,
        entityId: In(entityIds),
      },
    });

    const result = new Map<string, Record<string, any>>();
    for (const entityId of entityIds) {
      result.set(entityId, {});
    }

    for (const value of values) {
      const entityValues = result.get(value.entityId) || {};
      entityValues[value.fieldDefinitionId] = this.extractValue(value);
      result.set(value.entityId, entityValues);
    }

    return result;
  }

  // ==================== Tag Methods ====================

  async createTag(dto: CreateTagDto, createdBy: string): Promise<Tag> {
    // Check for duplicate name in category
    const existing = await this.tagRepo.findOne({
      where: { name: dto.name, category: dto.category || undefined },
    });
    if (existing) {
      throw new ConflictException(`Tag "${dto.name}" already exists in this category`);
    }

    if (dto.parentId) {
      const parent = await this.tagRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent tag ${dto.parentId} not found`);
      }
    }

    const tag = this.tagRepo.create({
      ...dto,
      createdBy,
    });

    const saved = await this.tagRepo.save(tag);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getTags(
    options?: { category?: string; includeInactive?: boolean; search?: string },
  ): Promise<Tag[]> {
    const query = this.tagRepo.createQueryBuilder('tag')
      .where('tag.parentId IS NULL'); // Only get root tags

    if (options?.category) {
      query.andWhere('tag.category = :category', { category: options.category });
    }
    if (!options?.includeInactive) {
      query.andWhere('tag.isActive = :active', { active: true });
    }
    if (options?.search) {
      query.andWhere('tag.name ILIKE :search', { search: `%${options.search}%` });
    }

    return query.orderBy('tag.category', 'ASC').addOrderBy('tag.name', 'ASC').getMany();
  }

  async getTag(tagId: string): Promise<Tag> {
    const tag = await this.tagRepo.findOne({
      where: { id: tagId },
    });
    if (!tag) {
      throw new NotFoundException(`Tag ${tagId} not found`);
    }
    return tag;
  }

  async updateTag(tagId: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.getTag(tagId);
    Object.assign(tag, dto);
    const saved = await this.tagRepo.save(tag);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async deleteTag(tagId: string): Promise<void> {
    const tag = await this.getTag(tagId);
    
    // Check usage count
    if (tag.usageCount && tag.usageCount > 0) {
      // Soft delete
      tag.isActive = false;
      await this.tagRepo.save(tag);
    } else {
      await this.tagRepo.remove(tag);
    }
  }

  async tagEntity(dto: TagEntityDto): Promise<EntityTag[]> {
    // Remove existing tags for this entity
    await this.entityTagRepo.delete({
      entityType: dto.entityType,
      entityId: dto.entityId,
    });

    // Add new tags
    const entityTags: EntityTag[] = [];
    for (const tagId of dto.tagIds) {
      const entityTag = this.entityTagRepo.create({
        tagId,
        entityType: dto.entityType,
        entityId: dto.entityId,
      });
      entityTags.push(await this.entityTagRepo.save(entityTag));

      // Update usage count
      await this.tagRepo.increment({ id: tagId }, 'usageCount', 1);
    }

    return entityTags;
  }

  async addTagToEntity(tagId: string, entityType: string, entityId: string): Promise<EntityTag> {
    const existing = await this.entityTagRepo.findOne({
      where: { tagId, entityType, entityId },
    });
    if (existing) {
      return existing;
    }

    const entityTag = this.entityTagRepo.create({ tagId, entityType, entityId });
    await this.entityTagRepo.save(entityTag);
    await this.tagRepo.increment({ id: tagId }, 'usageCount', 1);
    return entityTag;
  }

  async removeTagFromEntity(tagId: string, entityType: string, entityId: string): Promise<void> {
    const result = await this.entityTagRepo.delete({ tagId, entityType, entityId });
    if (result.affected && result.affected > 0) {
      await this.tagRepo.decrement({ id: tagId }, 'usageCount', 1);
    }
  }

  async getEntityTags(entityType: string, entityId: string): Promise<Tag[]> {
    const entityTags = await this.entityTagRepo.find({
      where: { entityType, entityId },
      relations: ['tag'],
    });
    return entityTags.map(et => et.tag).filter((tag): tag is Tag => tag !== undefined);
  }

  async getEntitiesByTag(
    tagId: string,
    entityType?: string,
  ): Promise<{ entityType: string; entityId: string }[]> {
    const query = this.entityTagRepo.createQueryBuilder('et')
      .where('et.tagId = :tagId', { tagId });

    if (entityType) {
      query.andWhere('et.entityType = :entityType', { entityType });
    }

    const results = await query.getMany();
    return results.map(r => ({ entityType: r.entityType, entityId: r.entityId }));
  }

  // ==================== Saved View Methods ====================

  async createSavedView(userId: string, dto: CreateSavedViewDto): Promise<SavedView> {
    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.savedViewRepo.update(
        { userId, entityType: dto.entityType, isDefault: true },
        { isDefault: false },
      );
    }

    const view = this.savedViewRepo.create({
      ...dto,
      userId,
    });

    const saved = await this.savedViewRepo.save(view);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getSavedViews(
    userId: string,
    entityType?: string,
  ): Promise<SavedView[]> {
    const query = this.savedViewRepo.createQueryBuilder('view')
      .where('(view.userId = :userId OR view.isShared = :shared)', { userId, shared: true });

    if (entityType) {
      query.andWhere('view.entityType = :entityType', { entityType });
    }

    return query
      .orderBy('view.isPinned', 'DESC')
      .addOrderBy('view.isDefault', 'DESC')
      .addOrderBy('view.lastUsedAt', 'DESC')
      .getMany();
  }

  async getSavedView(userId: string, viewId: string): Promise<SavedView> {
    const view = await this.savedViewRepo.findOne({
      where: [
        { id: viewId, userId },
        { id: viewId, isShared: true },
      ],
    });
    if (!view) {
      throw new NotFoundException(`Saved view ${viewId} not found`);
    }

    // Update last used
    view.lastUsedAt = new Date();
    view.usageCount += 1;
    await this.savedViewRepo.save(view);

    return view;
  }

  async getDefaultView(userId: string, entityType: string): Promise<SavedView | null> {
    return this.savedViewRepo.findOne({
      where: { userId, entityType, isDefault: true },
    });
  }

  async updateSavedView(userId: string, viewId: string, dto: UpdateSavedViewDto): Promise<SavedView> {
    const view = await this.savedViewRepo.findOne({
      where: { id: viewId, userId },
    });
    if (!view) {
      throw new NotFoundException(`Saved view ${viewId} not found or not owned by user`);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault && !view.isDefault) {
      await this.savedViewRepo.update(
        { userId, entityType: view.entityType, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(view, dto);
    const saved = await this.savedViewRepo.save(view);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async deleteSavedView(userId: string, viewId: string): Promise<void> {
    const view = await this.savedViewRepo.findOne({
      where: { id: viewId, userId },
    });
    if (!view) {
      throw new NotFoundException(`Saved view ${viewId} not found or not owned by user`);
    }
    await this.savedViewRepo.remove(view);
  }

  // ==================== User Preferences Methods ====================

  async getUserPreferences(userId: string): Promise<UserPreference> {
    const existingPrefs = await this.userPrefRepo.findOne({
      where: { userId },
    });

    if (existingPrefs) {
      return existingPrefs;
    }

    // Create default preferences
    const newPrefs = this.userPrefRepo.create({
      userId,
      theme: 'system',
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      dashboardLayout: { widgets: [] },
      tablePreferences: {},
      sidebarState: { collapsed: false, pinnedItems: [], expandedSections: [] },
      recentItems: [],
      favorites: [],
      shortcuts: [],
    });
    const saved = await this.userPrefRepo.save(newPrefs);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateUserPreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreference> {
    let prefs = await this.userPrefRepo.findOne({ where: { userId } });

    if (!prefs) {
      prefs = this.userPrefRepo.create({
        userId,
        ...dto,
      });
    } else {
      Object.assign(prefs, dto);
    }

    const saved = await this.userPrefRepo.save(prefs);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async addRecentItem(
    userId: string,
    item: AddRecentItemDto,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);
    
    // Remove if already exists
    prefs.recentItems = prefs.recentItems.filter(
      i => !(i.type === item.type && i.id === item.id),
    );

    // Add to front
    prefs.recentItems.unshift({
      ...item,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 20
    prefs.recentItems = prefs.recentItems.slice(0, 20);

    const saved = await this.userPrefRepo.save(prefs);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async toggleFavorite(
    userId: string,
    item: { type: string; id: string; name: string },
  ): Promise<{ isFavorite: boolean; preferences: UserPreference }> {
    const prefs = await this.getUserPreferences(userId);
    
    const index = prefs.favorites.findIndex(
      f => f.type === item.type && f.id === item.id,
    );

    if (index >= 0) {
      prefs.favorites.splice(index, 1);
    } else {
      prefs.favorites.push(item);
    }

    let saved = await this.userPrefRepo.save(prefs);
    saved = Array.isArray(saved) ? saved[0] : saved;
    return { isFavorite: index < 0, preferences: saved };
  }

  async updateTablePreference(
    userId: string,
    tableName: string,
    preferences: any,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);
    prefs.tablePreferences[tableName] = preferences;
    const saved = await this.userPrefRepo.save(prefs);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  // ==================== Private Helpers ====================

  private validateFieldOptions(fieldType: FieldType, options?: any): void {
    if (!options) return;

    if (fieldType === FieldType.SELECT || fieldType === FieldType.MULTI_SELECT) {
      if (!options.choices || !Array.isArray(options.choices)) {
        throw new BadRequestException('Select fields require choices array');
      }
    }

    if (fieldType === FieldType.NUMBER || fieldType === FieldType.CURRENCY || fieldType === FieldType.PERCENTAGE) {
      if (options.min !== undefined && options.max !== undefined && options.min > options.max) {
        throw new BadRequestException('Min value cannot be greater than max value');
      }
    }
  }

  private validateAndTransformValue(
    field: CustomFieldDefinition,
    value: any,
  ): Partial<CustomFieldValue> {
    const result: Partial<CustomFieldValue> = {
      textValue: undefined,
      numberValue: undefined,
      booleanValue: undefined,
      dateValue: undefined,
      jsonValue: undefined,
    };

    if (value === null || value === undefined) {
      if (field.isRequired) {
        throw new BadRequestException(`Field "${field.fieldName}" is required`);
      }
      return result;
    }

    switch (field.fieldType) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
      case FieldType.EMAIL:
      case FieldType.PHONE:
      case FieldType.URL:
        result.textValue = String(value);
        break;

      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.PERCENTAGE:
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(`Field "${field.fieldName}" must be a number`);
        }
        if (field.options?.min !== undefined && num < field.options.min) {
          throw new BadRequestException(`Field "${field.fieldName}" must be at least ${field.options.min}`);
        }
        if (field.options?.max !== undefined && num > field.options.max) {
          throw new BadRequestException(`Field "${field.fieldName}" must be at most ${field.options.max}`);
        }
        result.numberValue = num;
        break;

      case FieldType.BOOLEAN:
        result.booleanValue = Boolean(value);
        break;

      case FieldType.DATE:
      case FieldType.DATETIME:
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new BadRequestException(`Field "${field.fieldName}" must be a valid date`);
        }
        result.dateValue = date;
        break;

      case FieldType.SELECT:
        if (field.options?.choices) {
          const valid = field.options.choices.some(c => c.value === value);
          if (!valid) {
            throw new BadRequestException(`Invalid value for field "${field.fieldName}"`);
          }
        }
        result.textValue = String(value);
        break;

      case FieldType.MULTI_SELECT:
        if (!Array.isArray(value)) {
          throw new BadRequestException(`Field "${field.fieldName}" must be an array`);
        }
        if (field.options?.choices) {
          const validValues = field.options.choices.map(c => c.value);
          for (const v of value) {
            if (!validValues.includes(v)) {
              throw new BadRequestException(`Invalid value "${v}" for field "${field.fieldName}"`);
            }
          }
        }
        result.jsonValue = value;
        break;

      case FieldType.USER:
      case FieldType.HOUSEHOLD:
      case FieldType.ACCOUNT:
        result.textValue = String(value); // Store as UUID string
        break;

      default:
        result.jsonValue = value;
    }

    return result;
  }

  private extractValue(fieldValue: CustomFieldValue): any {
    // Return whichever value column has data
    if (fieldValue.textValue !== undefined && fieldValue.textValue !== null) {
      return fieldValue.textValue;
    }
    if (fieldValue.numberValue !== undefined && fieldValue.numberValue !== null) {
      return fieldValue.numberValue;
    }
    if (fieldValue.booleanValue !== undefined && fieldValue.booleanValue !== null) {
      return fieldValue.booleanValue;
    }
    if (fieldValue.dateValue !== undefined && fieldValue.dateValue !== null) {
      return fieldValue.dateValue;
    }
    if (fieldValue.jsonValue !== undefined && fieldValue.jsonValue !== null) {
      return fieldValue.jsonValue;
    }
    return null;
  }
}
