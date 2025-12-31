import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import { CreateEntityDto, CreateEntityRelationshipDto, UpdateEntityRelationshipDto, CreateDistributionDto, LinkEntityDocumentDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EntityType, EntityStatus, EntityRole } from './entities/entity.entity';

@ApiTags('Entities')
@Controller('entities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  // ==================== Entity CRUD ====================

  @Post()
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Create a new legal entity' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Entity created' })
  create(
    @CurrentUser() user: any,
    @Body() createEntityDto: CreateEntityDto,
  ) {
    return this.entitiesService.create(user.firmId, createEntityDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all legal entities' })
  @ApiQuery({ name: 'householdId', required: false })
  @ApiQuery({ name: 'entityType', required: false, enum: EntityType })
  @ApiQuery({ name: 'status', required: false, enum: EntityStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of entities' })
  findAll(
    @CurrentUser() user: any,
    @Query('householdId') householdId?: string,
    @Query('entityType') entityType?: EntityType,
    @Query('status') status?: EntityStatus,
    @Query('search') search?: string,
  ) {
    return this.entitiesService.findAll(user.firmId, { householdId, entityType, status, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get entity statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity statistics' })
  getStats(@CurrentUser() user: any) {
    return this.entitiesService.getEntityStats(user.firmId);
  }

  @Get('compliance/upcoming')
  @ApiOperation({ summary: 'Get entities with upcoming compliance deadlines' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entities with upcoming deadlines' })
  getUpcomingCompliance(
    @CurrentUser() user: any,
    @Query('daysAhead') daysAhead?: string,
  ) {
    return this.entitiesService.getUpcomingCompliance(user.firmId, daysAhead ? parseInt(daysAhead) : 90);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get entities by household' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Household entities' })
  findByHousehold(
    @CurrentUser() user: any,
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.entitiesService.findByHousehold(user.firmId, householdId);
  }

  @Get('person/:personId')
  @ApiOperation({ summary: 'Get entities associated with a person' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Person entities' })
  findByPerson(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.entitiesService.findEntitiesByPerson(personId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a legal entity by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity details' })
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.entitiesService.findOne(user.firmId, id);
  }

  @Patch(':id')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Update a legal entity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity updated' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ) {
    return this.entitiesService.update(user.firmId, id, updateEntityDto, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a legal entity' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Entity deleted' })
  async remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.entitiesService.remove(user.firmId, id);
  }

  // ==================== Relationships ====================

  @Post(':id/relationships')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Add a relationship to an entity' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Relationship added' })
  addRelationship(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEntityRelationshipDto,
  ) {
    dto.entityId = id;
    return this.entitiesService.addRelationship(user.firmId, dto);
  }

  @Get(':id/relationships')
  @ApiOperation({ summary: 'Get entity relationships' })
  @ApiQuery({ name: 'role', required: false, enum: EntityRole })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity relationships' })
  getRelationships(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('role') role?: EntityRole,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.entitiesService.getRelationships(id, { 
      role, 
      activeOnly: activeOnly !== 'false',
    });
  }

  @Get(':id/trustees')
  @ApiOperation({ summary: 'Get entity trustees' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity trustees' })
  getTrustees(@Param('id', ParseUUIDPipe) id: string) {
    return this.entitiesService.getTrustees(id);
  }

  @Get(':id/beneficiaries')
  @ApiOperation({ summary: 'Get entity beneficiaries' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity beneficiaries' })
  getBeneficiaries(@Param('id', ParseUUIDPipe) id: string) {
    return this.entitiesService.getBeneficiaries(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get entity members/partners' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity members' })
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.entitiesService.getMembers(id);
  }

  @Patch('relationships/:relationshipId')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Update a relationship' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relationship updated' })
  updateRelationship(
    @Param('relationshipId', ParseUUIDPipe) relationshipId: string,
    @Body() dto: UpdateEntityRelationshipDto,
  ) {
    return this.entitiesService.updateRelationship(relationshipId, dto);
  }

  @Delete('relationships/:relationshipId')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Remove a relationship' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Relationship removed' })
  async removeRelationship(@Param('relationshipId', ParseUUIDPipe) relationshipId: string) {
    await this.entitiesService.removeRelationship(relationshipId);
  }

  // ==================== Distributions ====================

  @Post(':id/distributions')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Record a distribution' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Distribution recorded' })
  recordDistribution(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDistributionDto,
  ) {
    dto.entityId = id;
    return this.entitiesService.recordDistribution(user.firmId, dto, user.id);
  }

  @Get(':id/distributions')
  @ApiOperation({ summary: 'Get entity distributions' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'beneficiaryId', required: false })
  @ApiQuery({ name: 'distributionType', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity distributions' })
  getDistributions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year?: string,
    @Query('beneficiaryId') beneficiaryId?: string,
    @Query('distributionType') distributionType?: string,
  ) {
    return this.entitiesService.getDistributions(id, {
      year: year ? parseInt(year) : undefined,
      beneficiaryId,
      distributionType,
    });
  }

  @Get(':id/distributions/summary')
  @ApiOperation({ summary: 'Get distribution summary' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Distribution summary' })
  getDistributionSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year?: string,
  ) {
    return this.entitiesService.getDistributionSummary(id, year ? parseInt(year) : undefined);
  }

  // ==================== Documents ====================

  @Post(':id/documents')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Link a document to an entity' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document linked' })
  linkDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkEntityDocumentDto,
  ) {
    dto.entityId = id;
    return this.entitiesService.linkDocument(dto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get entity documents' })
  @ApiQuery({ name: 'documentType', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entity documents' })
  getDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.entitiesService.getEntityDocuments(id, documentType);
  }

  @Delete('documents/:entityDocId')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Unlink a document from an entity' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Document unlinked' })
  async unlinkDocument(@Param('entityDocId', ParseUUIDPipe) entityDocId: string) {
    await this.entitiesService.unlinkDocument(entityDocId);
  }
}
