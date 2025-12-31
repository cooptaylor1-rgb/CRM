import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomizationService } from './customization.service';
import { EntityTarget } from './entities/customization.entity';
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

@ApiTags('Customization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customization')
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  // ==================== Custom Fields ====================

  @Post('fields')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a custom field definition' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Custom field created' })
  async createCustomField(
    @CurrentUser() user: any,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.customizationService.createCustomField(user.id, dto);
  }

  @Get('fields')
  @ApiOperation({ summary: 'Get all custom field definitions' })
  @ApiQuery({ name: 'entityTarget', required: false, enum: EntityTarget })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'fieldGroup', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of custom fields' })
  async getCustomFields(
    @CurrentUser() user: any,
    @Query('entityTarget') entityTarget?: EntityTarget,
    @Query('includeInactive') includeInactive?: string,
    @Query('fieldGroup') fieldGroup?: string,
  ) {
    return this.customizationService.getCustomFields(entityTarget, {
      includeInactive: includeInactive === 'true',
      fieldGroup,
    });
  }

  @Get('fields/:id')
  @ApiOperation({ summary: 'Get a custom field by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Custom field details' })
  async getCustomField(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customizationService.getCustomField(id);
  }

  @Put('fields/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a custom field' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Custom field updated' })
  async updateCustomField(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.customizationService.updateCustomField(id, dto);
  }

  @Delete('fields/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a custom field' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Custom field deleted' })
  async deleteCustomField(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.customizationService.deleteCustomField(id);
  }

  @Patch('fields/reorder/:entityTarget')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Reorder custom fields' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fields reordered' })
  async reorderCustomFields(
    @CurrentUser() user: any,
    @Param('entityTarget') entityTarget: EntityTarget,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.customizationService.reorderCustomFields(entityTarget, body.orderedIds);
  }

  // ==================== Field Values ====================

  @Post('field-values')
  @ApiOperation({ summary: 'Set field values for an entity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Field values saved' })
  async setFieldValues(
    @CurrentUser() user: any,
    @Body() dto: SetFieldValuesDto,
  ) {
    return this.customizationService.setFieldValues(dto, user.id);
  }

  @Get('field-values/:entityType/:entityId')
  @ApiOperation({ summary: 'Get field values for an entity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Field values' })
  async getFieldValues(
    @CurrentUser() user: any,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.customizationService.getFieldValues(entityType, entityId);
  }

  @Post('field-values/bulk')
  @ApiOperation({ summary: 'Get field values for multiple entities' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bulk field values' })
  async getFieldValuesForEntities(
    @CurrentUser() user: any,
    @Body() body: { entityType: string; entityIds: string[] },
  ) {
    const result = await this.customizationService.getFieldValuesForEntities(
      body.entityType,
      body.entityIds,
    );
    return Object.fromEntries(result);
  }

  // ==================== Tags ====================

  @Post('tags')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a tag' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tag created' })
  async createTag(
    @CurrentUser() user: any,
    @Body() dto: CreateTagDto,
  ) {
    return this.customizationService.createTag(dto, user.id);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of tags' })
  async getTags(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
  ) {
    return this.customizationService.getTags({
      category,
      includeInactive: includeInactive === 'true',
      search,
    });
  }

  @Get('tags/:id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tag details' })
  async getTag(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customizationService.getTag(id);
  }

  @Put('tags/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tag updated' })
  async updateTag(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.customizationService.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Tag deleted' })
  async deleteTag(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.customizationService.deleteTag(id);
  }

  @Post('tags/entity')
  @ApiOperation({ summary: 'Tag an entity with multiple tags' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity tagged' })
  async tagEntity(
    @CurrentUser() user: any,
    @Body() dto: TagEntityDto,
  ) {
    return this.customizationService.tagEntity(dto);
  }

  @Post('tags/:tagId/add/:entityType/:entityId')
  @ApiOperation({ summary: 'Add a single tag to an entity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tag added' })
  async addTagToEntity(
    @CurrentUser() user: any,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.customizationService.addTagToEntity(tagId, entityType, entityId);
  }

  @Delete('tags/:tagId/remove/:entityType/:entityId')
  @ApiOperation({ summary: 'Remove a tag from an entity' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Tag removed' })
  async removeTagFromEntity(
    @CurrentUser() user: any,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    await this.customizationService.removeTagFromEntity(tagId, entityType, entityId);
  }

  @Get('entity-tags/:entityType/:entityId')
  @ApiOperation({ summary: 'Get all tags for an entity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity tags' })
  async getEntityTags(
    @CurrentUser() user: any,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.customizationService.getEntityTags(entityType, entityId);
  }

  @Get('tags/:tagId/entities')
  @ApiOperation({ summary: 'Get all entities with a specific tag' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tagged entities' })
  async getEntitiesByTag(
    @CurrentUser() user: any,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.customizationService.getEntitiesByTag(tagId, entityType);
  }

  // ==================== Saved Views ====================

  @Post('views')
  @ApiOperation({ summary: 'Create a saved view' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'View created' })
  async createSavedView(
    @CurrentUser() user: any,
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.customizationService.createSavedView(user.id, dto);
  }

  @Get('views')
  @ApiOperation({ summary: 'Get all saved views for user' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of saved views' })
  async getSavedViews(
    @CurrentUser() user: any,
    @Query('entityType') entityType?: string,
  ) {
    return this.customizationService.getSavedViews(user.id, entityType);
  }

  @Get('views/:id')
  @ApiOperation({ summary: 'Get a saved view by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Saved view details' })
  async getSavedView(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customizationService.getSavedView(user.id, id);
  }

  @Get('views/default/:entityType')
  @ApiOperation({ summary: 'Get default view for entity type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Default view' })
  async getDefaultView(
    @CurrentUser() user: any,
    @Param('entityType') entityType: string,
  ) {
    return this.customizationService.getDefaultView(user.id, entityType);
  }

  @Put('views/:id')
  @ApiOperation({ summary: 'Update a saved view' })
  @ApiResponse({ status: HttpStatus.OK, description: 'View updated' })
  async updateSavedView(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSavedViewDto,
  ) {
    return this.customizationService.updateSavedView(user.id, id, dto);
  }

  @Delete('views/:id')
  @ApiOperation({ summary: 'Delete a saved view' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'View deleted' })
  async deleteSavedView(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.customizationService.deleteSavedView(user.id, id);
  }

  // ==================== User Preferences ====================

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User preferences' })
  async getUserPreferences(@CurrentUser() user: any) {
    return this.customizationService.getUserPreferences(user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preferences updated' })
  async updateUserPreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.customizationService.updateUserPreferences(user.id, dto);
  }

  @Post('preferences/recent')
  @ApiOperation({ summary: 'Add a recent item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recent item added' })
  async addRecentItem(
    @CurrentUser() user: any,
    @Body() dto: AddRecentItemDto,
  ) {
    return this.customizationService.addRecentItem(user.id, dto);
  }

  @Post('preferences/favorite')
  @ApiOperation({ summary: 'Toggle favorite item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Favorite toggled' })
  async toggleFavorite(
    @CurrentUser() user: any,
    @Body() item: { type: string; id: string; name: string },
  ) {
    return this.customizationService.toggleFavorite(user.id, item);
  }

  @Put('preferences/table/:tableName')
  @ApiOperation({ summary: 'Update table preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Table preferences updated' })
  async updateTablePreferences(
    @CurrentUser() user: any,
    @Param('tableName') tableName: string,
    @Body() preferences: any,
  ) {
    return this.customizationService.updateTablePreference(user.id, tableName, preferences);
  }
}
