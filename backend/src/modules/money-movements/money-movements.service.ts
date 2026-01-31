import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/entities/audit-event.entity';
import {
  MoneyMovementRequest,
  MoneyMovementStatus,
  MoneyMovementType,
} from './entities/money-movement.entity';
import {
  CreateMoneyMovementRequestDto,
  UpdateMoneyMovementRequestDto,
  MoneyMovementFilterDto,
  InitiateMoneyMovementDto,
} from './dto/money-movement.dto';

@Injectable()
export class MoneyMovementsService {
  constructor(
    @InjectRepository(MoneyMovementRequest)
    private repo: Repository<MoneyMovementRequest>,
    private audit: AuditService,
  ) {}

  async create(dto: CreateMoneyMovementRequestDto, userId: string) {
    const entity = this.repo.create({
      ...dto,
      currency: dto.currency || 'USD',
      status: MoneyMovementStatus.REQUESTED,
      requestedBy: userId,
      // If neededByDate is full ISO, keep only date portion (YYYY-MM-DD)
      neededByDate: dto.neededByDate ? dto.neededByDate.slice(0, 10) : undefined,
    });

    const saved = await this.repo.save(entity);

    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.CREATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Created money movement request',
      changes: dto,
    });

    return saved;
  }

  async findAll(filter: MoneyMovementFilterDto) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;
    if (filter.householdId) where.householdId = filter.householdId;

    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const mm = await this.repo.findOne({ where: { id } });
    if (!mm) throw new NotFoundException(`Money movement request ${id} not found`);
    return mm;
  }

  async update(id: string, dto: UpdateMoneyMovementRequestDto, userId: string) {
    const mm = await this.findOne(id);

    // Guard: avoid arbitrary status transitions until we formalize state machine.
    if (dto.status && dto.status !== mm.status) {
      throw new BadRequestException(
        'Use explicit lifecycle endpoints (/approve, /initiate, /confirm, /close, /cancel) for status transitions',
      );
    }

    Object.assign(mm, {
      ...dto,
      neededByDate: dto.neededByDate ? dto.neededByDate.slice(0, 10) : mm.neededByDate,
    });

    const saved = await this.repo.save(mm);

    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Updated money movement request',
      changes: dto,
    });

    return saved;
  }

  async approve(id: string, userId: string) {
    const mm = await this.findOne(id);
    if (
      ![
        MoneyMovementStatus.REQUESTED,
        MoneyMovementStatus.IN_REVIEW,
      ].includes(mm.status)
    ) {
      throw new BadRequestException(`Cannot approve from status: ${mm.status}`);
    }

    mm.status = MoneyMovementStatus.APPROVED;
    mm.approvedBy = userId;
    mm.approvedAt = new Date();

    const saved = await this.repo.save(mm);
    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Approved money movement request',
    });
    return saved;
  }

  async initiate(id: string, dto: InitiateMoneyMovementDto, userId: string) {
    const mm = await this.findOne(id);
    if (![MoneyMovementStatus.APPROVED].includes(mm.status)) {
      throw new BadRequestException(`Cannot initiate from status: ${mm.status}`);
    }

    mm.status = MoneyMovementStatus.INITIATED;
    mm.initiatedBy = userId;
    mm.initiatedAt = new Date();
    if (dto.notes) {
      mm.notes = mm.notes ? `${mm.notes}\n\n${dto.notes}` : dto.notes;
    }
    if (dto.initiationArtifacts) {
      mm.initiationArtifacts = dto.initiationArtifacts;
    }

    const saved = await this.repo.save(mm);
    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Initiated money movement request (package + prefill)',
      changes: dto,
    });
    return saved;
  }

  async confirm(id: string, userId: string) {
    const mm = await this.findOne(id);
    if (![MoneyMovementStatus.INITIATED, MoneyMovementStatus.SUBMITTED].includes(mm.status)) {
      throw new BadRequestException(`Cannot confirm from status: ${mm.status}`);
    }

    mm.status = MoneyMovementStatus.CONFIRMED;
    const saved = await this.repo.save(mm);
    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Confirmed money movement request',
    });
    return saved;
  }

  async close(id: string, userId: string) {
    const mm = await this.findOne(id);
    if (![MoneyMovementStatus.CONFIRMED].includes(mm.status)) {
      throw new BadRequestException(`Cannot close from status: ${mm.status}`);
    }

    mm.status = MoneyMovementStatus.CLOSED;
    const saved = await this.repo.save(mm);
    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Closed money movement request',
    });
    return saved;
  }

  async cancel(id: string, userId: string) {
    const mm = await this.findOne(id);
    if ([MoneyMovementStatus.CLOSED, MoneyMovementStatus.CANCELLED].includes(mm.status)) {
      throw new BadRequestException(`Cannot cancel from status: ${mm.status}`);
    }

    mm.status = MoneyMovementStatus.CANCELLED;
    const saved = await this.repo.save(mm);
    await this.audit.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'money_movement_request',
      entityId: saved.id,
      action: 'Cancelled money movement request',
    });
    return saved;
  }
}
