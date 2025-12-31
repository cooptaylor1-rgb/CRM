import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LegalEntity, EntityRelationship, EntityDistribution, EntityDocument, EntityType, EntityStatus, EntityRole } from './entities/entity.entity';
import { CreateEntityDto, CreateEntityRelationshipDto, UpdateEntityRelationshipDto, CreateDistributionDto, LinkEntityDocumentDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

@Injectable()
export class EntitiesService {
  private readonly logger = new Logger(EntitiesService.name);

  constructor(
    @InjectRepository(LegalEntity)
    private entitiesRepository: Repository<LegalEntity>,
    @InjectRepository(EntityRelationship)
    private relationshipRepository: Repository<EntityRelationship>,
    @InjectRepository(EntityDistribution)
    private distributionRepository: Repository<EntityDistribution>,
    @InjectRepository(EntityDocument)
    private entityDocRepository: Repository<EntityDocument>,
  ) {}

  // ==================== Entity CRUD ====================

  async create(firmId: string, createEntityDto: CreateEntityDto, userId?: string): Promise<LegalEntity> {
    const entity = this.entitiesRepository.create({
      ...createEntityDto,
      firmId,
      createdBy: userId,
    });
    const saved = await this.entitiesRepository.save(entity);
    this.logger.log(`Created entity ${saved.id} (${saved.legalName}) for firm ${firmId}`);
    return saved;
  }

  async findAll(firmId: string, options?: {
    householdId?: string;
    entityType?: EntityType;
    status?: EntityStatus;
    search?: string;
  }): Promise<LegalEntity[]> {
    const query = this.entitiesRepository.createQueryBuilder('entity')
      .leftJoinAndSelect('entity.relationships', 'relationships')
      .where('entity.firmId = :firmId', { firmId });

    if (options?.householdId) {
      query.andWhere('entity.householdId = :householdId', { householdId: options.householdId });
    }
    if (options?.entityType) {
      query.andWhere('entity.entityType = :entityType', { entityType: options.entityType });
    }
    if (options?.status) {
      query.andWhere('entity.status = :status', { status: options.status });
    }
    if (options?.search) {
      query.andWhere('(entity.legalName ILIKE :search OR entity.shortName ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    return query.orderBy('entity.legalName', 'ASC').getMany();
  }

  async findOne(firmId: string, id: string): Promise<LegalEntity> {
    const entity = await this.entitiesRepository.findOne({
      where: { id, firmId },
      relations: ['relationships'],
    });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async findByHousehold(firmId: string, householdId: string): Promise<LegalEntity[]> {
    return this.entitiesRepository.find({
      where: { householdId, firmId },
      relations: ['relationships'],
      order: { legalName: 'ASC' },
    });
  }

  async update(firmId: string, id: string, updateEntityDto: UpdateEntityDto, userId?: string): Promise<LegalEntity> {
    const entity = await this.findOne(firmId, id);
    Object.assign(entity, updateEntityDto, { updatedBy: userId });
    return this.entitiesRepository.save(entity);
  }

  async remove(firmId: string, id: string): Promise<void> {
    const entity = await this.findOne(firmId, id);
    
    // Remove related records first
    await this.relationshipRepository.delete({ entityId: id });
    await this.distributionRepository.delete({ entityId: id });
    await this.entityDocRepository.delete({ entityId: id });
    
    await this.entitiesRepository.remove(entity);
    this.logger.log(`Removed entity ${id}`);
  }

  // ==================== Relationship Management ====================

  async addRelationship(firmId: string, dto: CreateEntityRelationshipDto): Promise<EntityRelationship> {
    // Verify entity exists
    await this.findOne(firmId, dto.entityId);

    // If person or related entity, validate they exist (would need their services)
    // For now, just create the relationship

    const relationship = this.relationshipRepository.create(dto);
    return this.relationshipRepository.save(relationship);
  }

  async getRelationships(entityId: string, options?: {
    role?: EntityRole;
    activeOnly?: boolean;
  }): Promise<EntityRelationship[]> {
    const query = this.relationshipRepository.createQueryBuilder('rel')
      .where('rel.entityId = :entityId', { entityId });

    if (options?.role) {
      query.andWhere('rel.role = :role', { role: options.role });
    }
    if (options?.activeOnly !== false) {
      query.andWhere('rel.isActive = :active', { active: true });
    }

    return query.orderBy('rel.successionOrder', 'ASC').addOrderBy('rel.isPrimary', 'DESC').getMany();
  }

  async updateRelationship(relationshipId: string, dto: UpdateEntityRelationshipDto): Promise<EntityRelationship> {
    const relationship = await this.relationshipRepository.findOne({ where: { id: relationshipId } });
    if (!relationship) {
      throw new NotFoundException(`Relationship ${relationshipId} not found`);
    }
    Object.assign(relationship, dto);
    return this.relationshipRepository.save(relationship);
  }

  async removeRelationship(relationshipId: string): Promise<void> {
    const result = await this.relationshipRepository.delete(relationshipId);
    if (!result.affected) {
      throw new NotFoundException(`Relationship ${relationshipId} not found`);
    }
  }

  async getTrustees(entityId: string): Promise<EntityRelationship[]> {
    return this.getRelationships(entityId, {
      role: EntityRole.TRUSTEE,
      activeOnly: true,
    });
  }

  async getBeneficiaries(entityId: string): Promise<EntityRelationship[]> {
    return this.relationshipRepository.find({
      where: [
        { entityId, role: EntityRole.BENEFICIARY, isActive: true },
        { entityId, role: EntityRole.INCOME_BENEFICIARY, isActive: true },
        { entityId, role: EntityRole.REMAINDER_BENEFICIARY, isActive: true },
      ],
      order: { distributionPercentage: 'DESC' },
    });
  }

  async getMembers(entityId: string): Promise<EntityRelationship[]> {
    return this.relationshipRepository.find({
      where: [
        { entityId, role: EntityRole.MEMBER, isActive: true },
        { entityId, role: EntityRole.MANAGER, isActive: true },
        { entityId, role: EntityRole.GENERAL_PARTNER, isActive: true },
        { entityId, role: EntityRole.LIMITED_PARTNER, isActive: true },
      ],
      order: { ownershipPercentage: 'DESC' },
    });
  }

  // ==================== Distribution Tracking ====================

  async recordDistribution(firmId: string, dto: CreateDistributionDto, approvedBy?: string): Promise<EntityDistribution> {
    await this.findOne(firmId, dto.entityId);

    const distribution = this.distributionRepository.create({
      ...dto,
      approvedBy,
    });
    return this.distributionRepository.save(distribution);
  }

  async getDistributions(entityId: string, options?: {
    year?: number;
    beneficiaryId?: string;
    distributionType?: string;
  }): Promise<EntityDistribution[]> {
    const query = this.distributionRepository.createQueryBuilder('dist')
      .where('dist.entityId = :entityId', { entityId });

    if (options?.year) {
      query.andWhere('EXTRACT(YEAR FROM dist.distributionDate) = :year', { year: options.year });
    }
    if (options?.beneficiaryId) {
      query.andWhere('dist.beneficiaryId = :beneficiaryId', { beneficiaryId: options.beneficiaryId });
    }
    if (options?.distributionType) {
      query.andWhere('dist.distributionType = :type', { type: options.distributionType });
    }

    return query.orderBy('dist.distributionDate', 'DESC').getMany();
  }

  async getDistributionSummary(entityId: string, year?: number): Promise<{
    totalDistributed: number;
    byType: Record<string, number>;
    byBeneficiary: Record<string, number>;
  }> {
    const query = this.distributionRepository.createQueryBuilder('dist')
      .where('dist.entityId = :entityId', { entityId });

    if (year) {
      query.andWhere('EXTRACT(YEAR FROM dist.distributionDate) = :year', { year });
    }

    const distributions = await query.getMany();

    const summary = {
      totalDistributed: 0,
      byType: {} as Record<string, number>,
      byBeneficiary: {} as Record<string, number>,
    };

    for (const dist of distributions) {
      const amount = Number(dist.amount);
      summary.totalDistributed += amount;
      
      const type = dist.distributionType || 'other';
      summary.byType[type] = (summary.byType[type] || 0) + amount;

      if (dist.beneficiaryId) {
        summary.byBeneficiary[dist.beneficiaryId] = (summary.byBeneficiary[dist.beneficiaryId] || 0) + amount;
      }
    }

    return summary;
  }

  // ==================== Document Management ====================

  async linkDocument(dto: LinkEntityDocumentDto): Promise<EntityDocument> {
    // If setting as primary, unset other primary docs of same type
    if (dto.isPrimary) {
      await this.entityDocRepository.update(
        { entityId: dto.entityId, documentType: dto.documentType, isPrimary: true },
        { isPrimary: false },
      );
    }

    const entityDoc = this.entityDocRepository.create(dto);
    return this.entityDocRepository.save(entityDoc);
  }

  async getEntityDocuments(entityId: string, documentType?: string): Promise<EntityDocument[]> {
    const where: any = { entityId };
    if (documentType) {
      where.documentType = documentType;
    }

    return this.entityDocRepository.find({
      where,
      order: { isPrimary: 'DESC', documentDate: 'DESC' },
    });
  }

  async unlinkDocument(entityDocId: string): Promise<void> {
    await this.entityDocRepository.delete(entityDocId);
  }

  // ==================== Entity Analytics ====================

  async getEntityStats(firmId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalEstimatedValue: number;
  }> {
    const entities = await this.entitiesRepository.find({ where: { firmId } });

    const stats = {
      total: entities.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalEstimatedValue: 0,
    };

    for (const entity of entities) {
      stats.byType[entity.entityType] = (stats.byType[entity.entityType] || 0) + 1;
      stats.byStatus[entity.status] = (stats.byStatus[entity.status] || 0) + 1;
      if (entity.estimatedValue) {
        stats.totalEstimatedValue += Number(entity.estimatedValue);
      }
    }

    return stats;
  }

  async getUpcomingCompliance(firmId: string, daysAhead: number = 90): Promise<LegalEntity[]> {
    // Find entities with upcoming annual reports or other compliance deadlines
    const entities = await this.entitiesRepository.find({
      where: { firmId, status: EntityStatus.ACTIVE },
    });

    const today = new Date();
    const upcoming: LegalEntity[] = [];

    for (const entity of entities) {
      if (entity.annualReportDue) {
        const [month, day] = entity.annualReportDue.split('-').map(Number);
        const dueDate = new Date(today.getFullYear(), month - 1, day);
        if (dueDate < today) {
          dueDate.setFullYear(dueDate.getFullYear() + 1);
        }
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= daysAhead) {
          upcoming.push(entity);
        }
      }
    }

    return upcoming;
  }

  // ==================== Person/Entity Lookup ====================

  async findEntitiesByPerson(personId: string): Promise<LegalEntity[]> {
    const relationships = await this.relationshipRepository.find({
      where: { personId, isActive: true },
    });
    
    const entityIds = [...new Set(relationships.map(r => r.entityId))];
    if (entityIds.length === 0) return [];

    return this.entitiesRepository.find({
      where: { id: In(entityIds) },
    });
  }

  async getPersonRolesInEntity(personId: string, entityId: string): Promise<EntityRelationship[]> {
    return this.relationshipRepository.find({
      where: { personId, entityId, isActive: true },
    });
  }
}
