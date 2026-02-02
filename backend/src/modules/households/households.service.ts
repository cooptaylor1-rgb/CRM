import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Household } from './entities/household.entity';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/entities/audit-event.entity';
import { Task } from '../tasks/entities/task.entity';
import { Meeting } from '../meetings/entities/meeting.entity';
import { MoneyMovementRequest } from '../money-movements/entities/money-movement.entity';
import { ComplianceReview } from '../compliance/entities/compliance-review.entity';

export type TimelineItemType = 'task' | 'meeting' | 'money_movement' | 'compliance_review';

export interface HouseholdTimelineItem {
  type: TimelineItemType;
  id: string;
  occurredAt: string;
  title: string;
  subtitle?: string;
  status?: string;
  entity?: any;
}

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdsRepository: Repository<Household>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
    @InjectRepository(MoneyMovementRequest)
    private moneyMovementsRepository: Repository<MoneyMovementRequest>,
    @InjectRepository(ComplianceReview)
    private complianceReviewsRepository: Repository<ComplianceReview>,
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

  async getTimeline(householdId: string): Promise<HouseholdTimelineItem[]> {
    // Ensures a 404 if household doesn't exist.
    await this.findOne(householdId);

    const [tasks, meetings, moneyMovements, complianceReviews] = await Promise.all([
      this.tasksRepository.find({
        where: { householdId, deletedAt: IsNull() },
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
        take: 50,
      }),
      this.meetingsRepository.find({
        where: { householdId, deletedAt: IsNull() },
        order: { startTime: 'DESC' },
        take: 50,
      }),
      this.moneyMovementsRepository.find({
        where: { householdId, deletedAt: IsNull() },
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
        take: 50,
      }),
      this.complianceReviewsRepository.find({
        where: { householdId },
        order: { reviewDate: 'DESC', updatedAt: 'DESC', createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    const items: HouseholdTimelineItem[] = [];

    for (const t of tasks) {
      const occurredAt = (t.dueDate || t.updatedAt || t.createdAt).toISOString();
      items.push({
        type: 'task',
        id: t.id,
        occurredAt,
        title: t.title,
        subtitle: t.dueDate ? `Due ${t.dueDate.toISOString()}` : undefined,
        status: t.status,
        entity: t,
      });
    }

    for (const m of meetings) {
      items.push({
        type: 'meeting',
        id: m.id,
        occurredAt: m.startTime.toISOString(),
        title: m.title,
        subtitle: m.meetingType,
        status: m.status,
        entity: m,
      });
    }

    for (const mm of moneyMovements) {
      const occurredAt = (mm.updatedAt || mm.createdAt).toISOString();
      items.push({
        type: 'money_movement',
        id: mm.id,
        occurredAt,
        title: mm.title || `${mm.type} request`,
        subtitle: mm.notes || undefined,
        status: mm.status,
        entity: mm,
      });
    }

    for (const cr of complianceReviews) {
      items.push({
        type: 'compliance_review',
        id: cr.id,
        occurredAt: cr.reviewDate?.toISOString?.() ? cr.reviewDate.toISOString() : cr.createdAt.toISOString(),
        title: `${cr.reviewType} compliance review`,
        subtitle: cr.findings ? cr.findings.slice(0, 120) : undefined,
        status: cr.status,
        entity: cr,
      });
    }

    // Sort newest first
    items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));

    return items;
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
