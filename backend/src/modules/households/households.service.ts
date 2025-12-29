import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from './entities/household.entity';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/entities/audit-event.entity';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdsRepository: Repository<Household>,
    private auditService: AuditService,
  ) {}

  async create(createHouseholdDto: CreateHouseholdDto, userId: string): Promise<Household> {
    const household = this.householdsRepository.create(createHouseholdDto);
    const saved = await this.householdsRepository.save(household);
    
    // Audit log the creation
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.CREATE,
      entityType: 'Household',
      entityId: saved.id,
      action: 'Created household',
      changes: { name: saved.name, status: saved.status },
    });
    
    return saved;
  }

  async findAll(): Promise<Household[]> {
    return this.householdsRepository.find({
      relations: ['persons', 'accounts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Household> {
    const household = await this.householdsRepository.findOne({
      where: { id },
      relations: ['persons', 'accounts'],
    });

    if (!household) {
      throw new NotFoundException(`Household with ID ${id} not found`);
    }

    return household;
  }

  async update(
    id: string,
    updateHouseholdDto: UpdateHouseholdDto,
    userId: string,
  ): Promise<Household> {
    const household = await this.findOne(id);
    const previousState = { ...household };
    
    Object.assign(household, updateHouseholdDto);
    const saved = await this.householdsRepository.save(household);
    
    // Audit log the update
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'Household',
      entityId: id,
      action: 'Updated household',
      changes: {
        before: { name: previousState.name, status: previousState.status },
        after: { name: saved.name, status: saved.status },
      },
    });
    
    return saved;
  }

  /**
   * Soft delete for SEC compliance - records must be retained for 5+ years.
   * Hard deletes are prohibited per SEC Rule 204-2.
   */
  async remove(id: string, userId: string): Promise<void> {
    const household = await this.findOne(id);
    
    // Soft delete using TypeORM's softRemove
    household.deletedBy = userId;
    await this.householdsRepository.save(household);
    await this.householdsRepository.softRemove(household);
    
    // Audit log the deletion
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.DELETE,
      entityType: 'Household',
      entityId: id,
      action: 'Soft deleted household',
      changes: { name: household.name },
    });
  }

  async updateTotalAum(householdId: string): Promise<void> {
    const household = await this.householdsRepository.findOne({
      where: { id: householdId },
      relations: ['accounts'],
    });

    if (household) {
      const totalAum = household.accounts.reduce(
        (sum, account) => sum + Number(account.currentValue || 0),
        0,
      );
      household.totalAum = totalAum;
      await this.householdsRepository.save(household);
    }
  }
}
