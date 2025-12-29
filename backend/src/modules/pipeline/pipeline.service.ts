import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Prospect, ProspectActivity, PipelineStage } from './entities/prospect.entity';
import {
  CreateProspectDto,
  UpdateProspectDto,
  ChangeStageDto,
  MarkLostDto,
  LogActivityDto,
  ProspectFilterDto,
} from './dto/prospect.dto';

@Injectable()
export class PipelineService {
  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @InjectRepository(ProspectActivity)
    private activityRepository: Repository<ProspectActivity>,
  ) {}

  async create(dto: CreateProspectDto, userId: string): Promise<Prospect> {
    const prospect = this.prospectRepository.create({
      ...dto,
      createdBy: userId,
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
    });
    return this.prospectRepository.save(prospect);
  }

  async findAll(filter: ProspectFilterDto): Promise<Prospect[]> {
    const where: any = {};

    if (filter.stage) where.stage = filter.stage;
    if (filter.leadSource) where.leadSource = filter.leadSource;
    if (filter.assignedAdvisorId) where.assignedAdvisorId = filter.assignedAdvisorId;
    if (filter.followUpBefore) where.nextFollowUpDate = LessThan(new Date(filter.followUpBefore));

    return this.prospectRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({ where: { id } });
    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }
    return prospect;
  }

  async update(id: string, dto: UpdateProspectDto): Promise<Prospect> {
    const prospect = await this.findOne(id);
    Object.assign(prospect, dto);
    if (dto.expectedCloseDate) {
      prospect.expectedCloseDate = new Date(dto.expectedCloseDate);
    }
    if (dto.nextFollowUpDate) {
      prospect.nextFollowUpDate = new Date(dto.nextFollowUpDate);
    }
    return this.prospectRepository.save(prospect);
  }

  async changeStage(id: string, dto: ChangeStageDto, userId: string): Promise<Prospect> {
    const prospect = await this.findOne(id);
    const oldStage = prospect.stage;

    prospect.stage = dto.newStage;

    // Update probability based on stage
    const stageProbabilities = {
      [PipelineStage.LEAD]: 10,
      [PipelineStage.QUALIFIED]: 25,
      [PipelineStage.MEETING_SCHEDULED]: 40,
      [PipelineStage.PROPOSAL_SENT]: 60,
      [PipelineStage.NEGOTIATION]: 80,
      [PipelineStage.WON]: 100,
      [PipelineStage.LOST]: 0,
    };
    prospect.probabilityPercent = stageProbabilities[dto.newStage];

    if (dto.newStage === PipelineStage.WON) {
      prospect.wonDate = new Date();
    }

    await this.prospectRepository.save(prospect);

    // Log the stage change
    await this.logActivity(id, {
      activityType: 'stage_change',
      description: `Stage changed from ${oldStage} to ${dto.newStage}`,
      notes: dto.notes,
    }, userId);

    return prospect;
  }

  async markLost(id: string, dto: MarkLostDto, userId: string): Promise<Prospect> {
    const prospect = await this.findOne(id);
    const oldStage = prospect.stage;

    prospect.stage = PipelineStage.LOST;
    prospect.lostDate = new Date();
    prospect.lostReason = dto.lostReason;
    if (dto.lostNotes) prospect.lostNotes = dto.lostNotes;
    if (dto.lostToCompetitor) prospect.lostToCompetitor = dto.lostToCompetitor;
    prospect.probabilityPercent = 0;

    await this.prospectRepository.save(prospect);

    await this.logActivity(id, {
      activityType: 'stage_change',
      description: `Marked as lost. Reason: ${dto.lostReason}`,
      notes: dto.lostNotes,
    }, userId);

    return prospect;
  }

  async convertToClient(id: string, householdId: string, userId: string): Promise<Prospect> {
    const prospect = await this.findOne(id);
    
    prospect.stage = PipelineStage.WON;
    prospect.wonDate = new Date();
    prospect.convertedHouseholdId = householdId;
    prospect.probabilityPercent = 100;

    await this.prospectRepository.save(prospect);

    await this.logActivity(id, {
      activityType: 'stage_change',
      description: `Converted to client. Household ID: ${householdId}`,
    }, userId);

    return prospect;
  }

  async logActivity(prospectId: string, dto: LogActivityDto, userId: string): Promise<ProspectActivity> {
    const activity = this.activityRepository.create({
      prospectId,
      ...dto,
      performedBy: userId,
    });

    // Update last contact date on prospect
    await this.prospectRepository.update(prospectId, {
      lastContactDate: new Date(),
    });

    return this.activityRepository.save(activity);
  }

  async getActivities(prospectId: string): Promise<ProspectActivity[]> {
    return this.activityRepository.find({
      where: { prospectId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const prospect = await this.findOne(id);
    await this.prospectRepository.softRemove(prospect);
  }

  // Pipeline Analytics
  async getPipelineStats(): Promise<{
    byStage: Record<string, { count: number; value: number }>;
    totalPipeline: number;
    weightedPipeline: number;
    averageDealSize: number;
  }> {
    const prospects = await this.prospectRepository.find({
      where: { stage: PipelineStage.LEAD },
    });

    // Get all non-closed prospects
    const activeProspects = await this.prospectRepository
      .createQueryBuilder('p')
      .where('p.stage NOT IN (:...stages)', { stages: [PipelineStage.WON, PipelineStage.LOST] })
      .getMany();

    const byStage: Record<string, { count: number; value: number }> = {};
    let totalPipeline = 0;
    let weightedPipeline = 0;

    for (const stage of Object.values(PipelineStage)) {
      const stageProspects = activeProspects.filter(p => p.stage === stage);
      const stageValue = stageProspects.reduce((sum, p) => sum + (Number(p.expectedRevenue) || 0), 0);
      const stageWeighted = stageProspects.reduce(
        (sum, p) => sum + ((Number(p.expectedRevenue) || 0) * (p.probabilityPercent / 100)),
        0
      );

      byStage[stage] = {
        count: stageProspects.length,
        value: stageValue,
      };

      if (stage !== PipelineStage.WON && stage !== PipelineStage.LOST) {
        totalPipeline += stageValue;
        weightedPipeline += stageWeighted;
      }
    }

    const averageDealSize = activeProspects.length > 0
      ? totalPipeline / activeProspects.length
      : 0;

    return { byStage, totalPipeline, weightedPipeline, averageDealSize };
  }

  async getConversionMetrics(startDate: Date, endDate: Date): Promise<{
    totalLeads: number;
    converted: number;
    lost: number;
    conversionRate: number;
    averageTimeToClose: number;
  }> {
    const leads = await this.prospectRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });

    const converted = await this.prospectRepository.count({
      where: {
        stage: PipelineStage.WON,
        wonDate: Between(startDate, endDate),
      },
    });

    const lost = await this.prospectRepository.count({
      where: {
        stage: PipelineStage.LOST,
        lostDate: Between(startDate, endDate),
      },
    });

    // Calculate average time to close for won deals
    const wonDeals = await this.prospectRepository.find({
      where: {
        stage: PipelineStage.WON,
        wonDate: Between(startDate, endDate),
      },
    });

    let totalDays = 0;
    for (const deal of wonDeals) {
      const days = Math.floor(
        (deal.wonDate.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDays += days;
    }

    return {
      totalLeads: leads,
      converted,
      lost,
      conversionRate: leads > 0 ? (converted / leads) * 100 : 0,
      averageTimeToClose: wonDeals.length > 0 ? totalDays / wonDeals.length : 0,
    };
  }

  async getFollowUpsDue(): Promise<Prospect[]> {
    return this.prospectRepository.find({
      where: {
        nextFollowUpDate: LessThan(new Date()),
        stage: PipelineStage.LEAD, // Not won or lost
      },
      order: { nextFollowUpDate: 'ASC' },
    });
  }
}
