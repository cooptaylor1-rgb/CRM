import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  TargetAssetAllocation,
  AllocationLineItem,
  FeeSchedule,
  FeeTier,
  FeeHistory,
  AllocationEntityType,
} from './entities/allocation.entity';
import {
  CreateTargetAllocationDto,
  UpdateTargetAllocationDto,
  GetAllocationsQueryDto,
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  GetFeeSchedulesQueryDto,
  CalculateFeeDto,
  RecordFeeHistoryDto,
} from './allocations.dto';

@Injectable()
export class AllocationsService {
  private readonly logger = new Logger(AllocationsService.name);

  constructor(
    @InjectRepository(TargetAssetAllocation)
    private allocationRepo: Repository<TargetAssetAllocation>,
    @InjectRepository(AllocationLineItem)
    private lineItemRepo: Repository<AllocationLineItem>,
    @InjectRepository(FeeSchedule)
    private feeScheduleRepo: Repository<FeeSchedule>,
    @InjectRepository(FeeTier)
    private feeTierRepo: Repository<FeeTier>,
    @InjectRepository(FeeHistory)
    private feeHistoryRepo: Repository<FeeHistory>,
    private dataSource: DataSource,
  ) {}

  // ==================== Target Asset Allocations ====================

  async createAllocation(
    firmId: string,
    userId: string,
    dto: CreateTargetAllocationDto
  ): Promise<TargetAssetAllocation & { lineItems: AllocationLineItem[] }> {
    // Validate that percentages sum to 100
    const totalPercentage = dto.lineItems.reduce(
      (sum, item) => sum + item.targetPercentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException(
        `Target percentages must sum to 100% (currently ${totalPercentage}%)`
      );
    }

    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      const allocationRepo = manager.getRepository(TargetAssetAllocation);
      const lineItemRepo = manager.getRepository(AllocationLineItem);

      // Deactivate existing active allocations for this entity
      await allocationRepo.update(
        {
          firmId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          isActive: true,
        },
        { isActive: false }
      );

      // Create allocation
      const allocation = allocationRepo.create({
        firmId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        name: dto.name,
        description: dto.description,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
        notes: dto.notes,
        createdBy: userId,
        isActive: true,
      });

      const savedAllocation = await allocationRepo.save(allocation);

      // Create line items
      const lineItems = dto.lineItems.map((item, index) =>
        lineItemRepo.create({
          allocationId: savedAllocation.id,
          assetClass: item.assetClass,
          customAssetClass: item.customAssetClass,
          targetPercentage: item.targetPercentage,
          minPercentage: item.minPercentage,
          maxPercentage: item.maxPercentage,
          notes: item.notes,
          displayOrder: item.displayOrder ?? index,
        })
      );

      const savedLineItems = await lineItemRepo.save(lineItems);

      return { ...savedAllocation, lineItems: savedLineItems };
    });
  }

  async getAllocations(
    firmId: string,
    query: GetAllocationsQueryDto
  ): Promise<{ allocations: (TargetAssetAllocation & { lineItems: AllocationLineItem[] })[]; total: number }> {
    const qb = this.allocationRepo
      .createQueryBuilder('allocation')
      // Use LEFT JOIN to load line items in single query (fixes N+1)
      .leftJoinAndSelect('allocation.lineItems', 'lineItems')
      .where('allocation.firmId = :firmId', { firmId });

    if (query.entityType) {
      qb.andWhere('allocation.entityType = :entityType', {
        entityType: query.entityType,
      });
    }
    if (query.entityId) {
      qb.andWhere('allocation.entityId = :entityId', {
        entityId: query.entityId,
      });
    }
    if (query.activeOnly) {
      qb.andWhere('allocation.isActive = true');
    }

    qb.orderBy('allocation.createdAt', 'DESC')
      .addOrderBy('lineItems.displayOrder', 'ASC');

    if (query.limit) {
      qb.take(query.limit);
    }
    if (query.offset) {
      qb.skip(query.offset);
    }

    const [allocations, total] = await qb.getManyAndCount();

    // Line items are already loaded via JOIN - map to expected format
    const allocationsWithItems = allocations.map((allocation) => ({
      ...allocation,
      lineItems: allocation.lineItems || [],
    }));

    return { allocations: allocationsWithItems, total };
  }

  async getAllocation(
    allocationId: string,
    firmId: string
  ): Promise<TargetAssetAllocation & { lineItems: AllocationLineItem[] }> {
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId, firmId },
    });
    if (!allocation) {
      throw new NotFoundException('Target allocation not found');
    }

    const lineItems = await this.lineItemRepo.find({
      where: { allocationId },
      order: { displayOrder: 'ASC' },
    });

    return { ...allocation, lineItems };
  }

  async getEntityAllocation(
    entityType: AllocationEntityType,
    entityId: string,
    firmId: string
  ): Promise<(TargetAssetAllocation & { lineItems: AllocationLineItem[] }) | null> {
    const allocation = await this.allocationRepo.findOne({
      where: { entityType, entityId, firmId, isActive: true },
    });
    if (!allocation) {
      return null;
    }

    const lineItems = await this.lineItemRepo.find({
      where: { allocationId: allocation.id },
      order: { displayOrder: 'ASC' },
    });

    return { ...allocation, lineItems };
  }

  async updateAllocation(
    allocationId: string,
    firmId: string,
    dto: UpdateTargetAllocationDto
  ): Promise<TargetAssetAllocation & { lineItems: AllocationLineItem[] }> {
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId, firmId },
    });
    if (!allocation) {
      throw new NotFoundException('Target allocation not found');
    }

    // Validate percentages if line items are being updated
    if (dto.lineItems) {
      const totalPercentage = dto.lineItems.reduce(
        (sum, item) => sum + item.targetPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestException(
          `Target percentages must sum to 100% (currently ${totalPercentage}%)`
        );
      }
    }

    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      const allocationRepo = manager.getRepository(TargetAssetAllocation);
      const lineItemRepo = manager.getRepository(AllocationLineItem);

      // Update allocation fields
      if (dto.name !== undefined) allocation.name = dto.name;
      if (dto.description !== undefined) allocation.description = dto.description;
      if (dto.isActive !== undefined) allocation.isActive = dto.isActive;
      if (dto.effectiveDate !== undefined)
        allocation.effectiveDate = new Date(dto.effectiveDate);
      if (dto.reviewDate !== undefined)
        allocation.reviewDate = new Date(dto.reviewDate);
      if (dto.notes !== undefined) allocation.notes = dto.notes;

      await allocationRepo.save(allocation);

      // Update line items if provided
      if (dto.lineItems) {
        // Delete existing line items
        await lineItemRepo.delete({ allocationId });

        // Create new line items
        const lineItems = dto.lineItems.map((item, index) =>
          lineItemRepo.create({
            allocationId,
            assetClass: item.assetClass,
            customAssetClass: item.customAssetClass,
            targetPercentage: item.targetPercentage,
            minPercentage: item.minPercentage,
            maxPercentage: item.maxPercentage,
            notes: item.notes,
            displayOrder: item.displayOrder ?? index,
          })
        );

        await lineItemRepo.save(lineItems);
      }

      return this.getAllocation(allocationId, firmId);
    });
  }

  async deleteAllocation(allocationId: string, firmId: string): Promise<void> {
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId, firmId },
    });
    if (!allocation) {
      throw new NotFoundException('Target allocation not found');
    }

    // Use transaction to ensure atomicity
    await this.dataSource.transaction(async (manager) => {
      const allocationRepo = manager.getRepository(TargetAssetAllocation);
      const lineItemRepo = manager.getRepository(AllocationLineItem);

      await lineItemRepo.delete({ allocationId });
      await allocationRepo.remove(allocation);
    });
  }

  // ==================== Fee Schedules ====================

  async createFeeSchedule(
    firmId: string,
    userId: string,
    dto: CreateFeeScheduleDto
  ): Promise<FeeSchedule & { tiers: FeeTier[] }> {
    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      const feeScheduleRepo = manager.getRepository(FeeSchedule);
      const feeTierRepo = manager.getRepository(FeeTier);

      // Deactivate existing active fee schedules for this entity
      await feeScheduleRepo.update(
        {
          firmId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          isActive: true,
        },
        { isActive: false }
      );

      // Create fee schedule
      const feeSchedule = feeScheduleRepo.create({
        firmId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        name: dto.name,
        description: dto.description,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        billingMethod: dto.billingMethod,
        minimumFee: dto.minimumFee,
        maximumFee: dto.maximumFee,
        notes: dto.notes,
        createdBy: userId,
        isActive: true,
      });

      const savedFeeSchedule = await feeScheduleRepo.save(feeSchedule);

      // Create fee tiers
      const tiers = dto.tiers.map((tier, index) =>
        feeTierRepo.create({
          feeScheduleId: savedFeeSchedule.id,
          feeType: tier.feeType,
          feeFrequency: tier.feeFrequency,
          tierName: tier.tierName,
          minAmount: tier.minAmount,
          maxAmount: tier.maxAmount,
          rate: tier.rate,
          flatAmount: tier.flatAmount,
          notes: tier.notes,
          displayOrder: tier.displayOrder ?? index,
        })
      );

      const savedTiers = await feeTierRepo.save(tiers);

      return { ...savedFeeSchedule, tiers: savedTiers };
    });
  }

  async getFeeSchedules(
    firmId: string,
    query: GetFeeSchedulesQueryDto
  ): Promise<{ feeSchedules: (FeeSchedule & { tiers: FeeTier[] })[]; total: number }> {
    const qb = this.feeScheduleRepo
      .createQueryBuilder('feeSchedule')
      // Use LEFT JOIN to load tiers in single query (fixes N+1)
      .leftJoinAndSelect('feeSchedule.tiers', 'tiers')
      .where('feeSchedule.firmId = :firmId', { firmId });

    if (query.entityType) {
      qb.andWhere('feeSchedule.entityType = :entityType', {
        entityType: query.entityType,
      });
    }
    if (query.entityId) {
      qb.andWhere('feeSchedule.entityId = :entityId', {
        entityId: query.entityId,
      });
    }
    if (query.activeOnly) {
      qb.andWhere('feeSchedule.isActive = true');
    }

    qb.orderBy('feeSchedule.createdAt', 'DESC')
      .addOrderBy('tiers.displayOrder', 'ASC');

    if (query.limit) {
      qb.take(query.limit);
    }
    if (query.offset) {
      qb.skip(query.offset);
    }

    const [feeSchedules, total] = await qb.getManyAndCount();

    // Tiers are already loaded via JOIN - map to expected format
    const schedulesWithTiers = feeSchedules.map((schedule) => ({
      ...schedule,
      tiers: schedule.tiers || [],
    }));

    return { feeSchedules: schedulesWithTiers, total };
  }

  async getFeeSchedule(
    feeScheduleId: string,
    firmId: string
  ): Promise<FeeSchedule & { tiers: FeeTier[] }> {
    const feeSchedule = await this.feeScheduleRepo.findOne({
      where: { id: feeScheduleId, firmId },
    });
    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    const tiers = await this.feeTierRepo.find({
      where: { feeScheduleId },
      order: { displayOrder: 'ASC' },
    });

    return { ...feeSchedule, tiers };
  }

  async getEntityFeeSchedule(
    entityType: AllocationEntityType,
    entityId: string,
    firmId: string
  ): Promise<(FeeSchedule & { tiers: FeeTier[] }) | null> {
    const feeSchedule = await this.feeScheduleRepo.findOne({
      where: { entityType, entityId, firmId, isActive: true },
    });
    if (!feeSchedule) {
      return null;
    }

    const tiers = await this.feeTierRepo.find({
      where: { feeScheduleId: feeSchedule.id },
      order: { displayOrder: 'ASC' },
    });

    return { ...feeSchedule, tiers };
  }

  async updateFeeSchedule(
    feeScheduleId: string,
    firmId: string,
    dto: UpdateFeeScheduleDto
  ): Promise<FeeSchedule & { tiers: FeeTier[] }> {
    const feeSchedule = await this.feeScheduleRepo.findOne({
      where: { id: feeScheduleId, firmId },
    });
    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      const feeScheduleRepo = manager.getRepository(FeeSchedule);
      const feeTierRepo = manager.getRepository(FeeTier);

      // Update fee schedule fields
      if (dto.name !== undefined) feeSchedule.name = dto.name;
      if (dto.description !== undefined) feeSchedule.description = dto.description;
      if (dto.isActive !== undefined) feeSchedule.isActive = dto.isActive;
      if (dto.effectiveDate !== undefined)
        feeSchedule.effectiveDate = new Date(dto.effectiveDate);
      if (dto.endDate !== undefined)
        feeSchedule.endDate = new Date(dto.endDate);
      if (dto.billingMethod !== undefined)
        feeSchedule.billingMethod = dto.billingMethod;
      if (dto.minimumFee !== undefined) feeSchedule.minimumFee = dto.minimumFee;
      if (dto.maximumFee !== undefined) feeSchedule.maximumFee = dto.maximumFee;
      if (dto.notes !== undefined) feeSchedule.notes = dto.notes;

      await feeScheduleRepo.save(feeSchedule);

      // Update tiers if provided
      if (dto.tiers) {
        // Delete existing tiers
        await feeTierRepo.delete({ feeScheduleId });

        // Create new tiers
        const tiers = dto.tiers.map((tier, index) =>
          feeTierRepo.create({
            feeScheduleId,
            feeType: tier.feeType,
            feeFrequency: tier.feeFrequency,
            tierName: tier.tierName,
            minAmount: tier.minAmount,
            maxAmount: tier.maxAmount,
            rate: tier.rate,
            flatAmount: tier.flatAmount,
            notes: tier.notes,
            displayOrder: tier.displayOrder ?? index,
          })
        );

        await feeTierRepo.save(tiers);
      }

      return this.getFeeSchedule(feeScheduleId, firmId);
    });
  }

  async deleteFeeSchedule(feeScheduleId: string, firmId: string): Promise<void> {
    const feeSchedule = await this.feeScheduleRepo.findOne({
      where: { id: feeScheduleId, firmId },
    });
    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    // Use transaction to ensure atomicity
    await this.dataSource.transaction(async (manager) => {
      const feeScheduleRepo = manager.getRepository(FeeSchedule);
      const feeTierRepo = manager.getRepository(FeeTier);

      await feeTierRepo.delete({ feeScheduleId });
      await feeScheduleRepo.remove(feeSchedule);
    });
  }

  // ==================== Fee Calculation ====================

  async calculateFee(dto: CalculateFeeDto, firmId: string): Promise<{
    feeAmount: number;
    effectiveRate: number;
    breakdown: Array<{
      tierName: string;
      amount: number;
      rate: number;
      fee: number;
    }>;
  }> {
    const feeSchedule = await this.getFeeSchedule(dto.feeScheduleId, firmId);

    let totalFee = 0;
    let remainingAmount = dto.billableAmount;
    const breakdown: Array<{
      tierName: string;
      amount: number;
      rate: number;
      fee: number;
    }> = [];

    // Sort tiers by minAmount
    const sortedTiers = [...feeSchedule.tiers].sort(
      (a, b) => Number(a.minAmount) - Number(b.minAmount)
    );

    for (const tier of sortedTiers) {
      if (remainingAmount <= 0) break;

      const tierMin = Number(tier.minAmount);
      const tierMax = tier.maxAmount ? Number(tier.maxAmount) : Infinity;

      if (dto.billableAmount < tierMin) continue;

      const amountInTier = Math.min(
        remainingAmount,
        tierMax - Math.max(tierMin, dto.billableAmount - remainingAmount)
      );

      if (amountInTier <= 0) continue;

      let tierFee = 0;
      if (tier.flatAmount) {
        tierFee = Number(tier.flatAmount);
      } else {
        tierFee = amountInTier * (Number(tier.rate) / 100);
      }

      breakdown.push({
        tierName: tier.tierName || `Tier ${tierMin}-${tierMax}`,
        amount: amountInTier,
        rate: Number(tier.rate),
        fee: tierFee,
      });

      totalFee += tierFee;
      remainingAmount -= amountInTier;
    }

    // Apply minimum/maximum fee constraints
    if (feeSchedule.minimumFee && totalFee < Number(feeSchedule.minimumFee)) {
      totalFee = Number(feeSchedule.minimumFee);
    }
    if (feeSchedule.maximumFee && totalFee > Number(feeSchedule.maximumFee)) {
      totalFee = Number(feeSchedule.maximumFee);
    }

    const effectiveRate =
      dto.billableAmount > 0 ? (totalFee / dto.billableAmount) * 100 : 0;

    return {
      feeAmount: Math.round(totalFee * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 10000) / 10000,
      breakdown,
    };
  }

  // ==================== Fee History ====================

  async recordFeeHistory(
    firmId: string,
    userId: string,
    dto: RecordFeeHistoryDto
  ): Promise<FeeHistory> {
    const history = this.feeHistoryRepo.create({
      feeScheduleId: dto.feeScheduleId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      billingPeriodStart: new Date(dto.billingPeriodStart),
      billingPeriodEnd: new Date(dto.billingPeriodEnd),
      billableAmount: dto.billableAmount,
      feeAmount: dto.feeAmount,
      effectiveRate: dto.effectiveRate,
      invoiceNumber: dto.invoiceNumber,
      notes: dto.notes,
      createdBy: userId,
    });

    return this.feeHistoryRepo.save(history);
  }

  async getFeeHistory(
    entityType: AllocationEntityType,
    entityId: string,
    firmId: string,
    limit = 12
  ): Promise<FeeHistory[]> {
    // SECURITY: Verify the entity belongs to the requesting firm
    // Check if there's any fee schedule or allocation for this entity+firm
    const hasAccess = await this.verifyEntityAccess(entityType, entityId, firmId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this entity\'s fee history');
    }

    return this.feeHistoryRepo.find({
      where: { entityType, entityId },
      order: { billingPeriodEnd: 'DESC' },
      take: limit,
    });
  }

  /**
   * Verify that the firm has access to the specified entity
   * by checking for existing allocations or fee schedules
   */
  private async verifyEntityAccess(
    entityType: AllocationEntityType,
    entityId: string,
    firmId: string
  ): Promise<boolean> {
    // Check if there's an allocation for this entity belonging to the firm
    const allocation = await this.allocationRepo.findOne({
      where: { entityType, entityId, firmId },
      select: ['id'],
    });
    if (allocation) return true;

    // Check if there's a fee schedule for this entity belonging to the firm
    const feeSchedule = await this.feeScheduleRepo.findOne({
      where: { entityType, entityId, firmId },
      select: ['id'],
    });
    if (feeSchedule) return true;

    return false;
  }

  async markFeeAsBilled(
    historyId: string,
    invoiceNumber: string
  ): Promise<FeeHistory> {
    const history = await this.feeHistoryRepo.findOne({
      where: { id: historyId },
    });
    if (!history) {
      throw new NotFoundException('Fee history record not found');
    }

    history.isBilled = true;
    history.billedAt = new Date();
    history.invoiceNumber = invoiceNumber;

    return this.feeHistoryRepo.save(history);
  }
}
