import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import {
  ClientProfitability,
  AdvisorMetrics,
  FirmMetrics,
  ActivitySnapshot,
} from './entities/analytics.entity';
import {
  AdvisorDashboardFilterDto,
  ClientProfitabilityFilterDto,
  UpdateTimeAllocationDto,
  SetGoalsDto,
  FirmMetricsFilterDto,
  ActivityFilterDto,
  AdvisorDashboardResponseDto,
  ClientProfitabilityResponseDto,
  FirmOverviewResponseDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ClientProfitability)
    private profitabilityRepository: Repository<ClientProfitability>,
    @InjectRepository(AdvisorMetrics)
    private advisorMetricsRepository: Repository<AdvisorMetrics>,
    @InjectRepository(FirmMetrics)
    private firmMetricsRepository: Repository<FirmMetrics>,
    @InjectRepository(ActivitySnapshot)
    private activityRepository: Repository<ActivitySnapshot>,
  ) {}

  // ==================== Advisor Dashboard ====================

  async getAdvisorDashboard(
    advisorId: string,
    filter: AdvisorDashboardFilterDto,
  ): Promise<AdvisorDashboardResponseDto> {
    // Get advisor metrics for the period
    const metrics = await this.advisorMetricsRepository.findOne({
      where: {
        advisorId,
        periodStart: LessThan(new Date(filter.endDate)),
        periodEnd: MoreThan(new Date(filter.startDate)),
      },
      order: { periodEnd: 'DESC' },
    });

    // Simulate dashboard data (in production, aggregate from actual data)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      overview: {
        totalHouseholds: metrics?.totalHouseholds || 45,
        totalAum: metrics?.totalAum || 125000000,
        mtdRevenue: metrics?.totalRevenue || 98500,
        ytdRevenue: (metrics?.totalRevenue || 98500) * 11,
        pipelineValue: metrics?.pipelineValue || 15000000,
        tasksOverdue: 8,
        meetingsThisWeek: 12,
        reviewsDue: metrics?.overdueReviews || 3,
      },
      recentActivity: {
        tasksCompleted: metrics?.tasksCompleted || 24,
        meetingsCompleted: metrics?.meetingsCompleted || 18,
        emailsSent: metrics?.emailsSent || 156,
        newProspects: metrics?.prospectsAdded || 5,
      },
      goals: {
        revenueTarget: metrics?.goals?.revenueTarget || 1200000,
        revenueActual: (metrics?.totalRevenue || 98500) * 11,
        revenueProgress: Math.round(((metrics?.totalRevenue || 98500) * 11 / 1200000) * 100),
        meetingsTarget: metrics?.goals?.meetingsTarget || 200,
        meetingsActual: (metrics?.meetingsCompleted || 18) * 11,
        meetingsProgress: Math.round(((metrics?.meetingsCompleted || 18) * 11 / 200) * 100),
        newClientsTarget: metrics?.goals?.newClientsTarget || 15,
        newClientsActual: metrics?.newHouseholds || 8,
        newClientsProgress: Math.round(((metrics?.newHouseholds || 8) / 15) * 100),
      },
      topClients: [
        { householdId: '1', householdName: 'The Smith Family', aum: 8500000, revenue: 72250, lastContact: new Date('2024-01-10') },
        { householdId: '2', householdName: 'Johnson Trust', aum: 6200000, revenue: 52700, lastContact: new Date('2024-01-08') },
        { householdId: '3', householdName: 'Williams Family Office', aum: 5800000, revenue: 49300, lastContact: new Date('2024-01-12') },
        { householdId: '4', householdName: 'The Brown Family', aum: 4200000, revenue: 35700, lastContact: new Date('2024-01-05') },
        { householdId: '5', householdName: 'Davis Revocable Trust', aum: 3900000, revenue: 33150, lastContact: new Date('2024-01-11') },
      ],
      upcomingMeetings: [
        { id: '1', title: 'Annual Review', householdName: 'The Smith Family', startTime: new Date(), type: 'annual_review' },
        { id: '2', title: 'Portfolio Discussion', householdName: 'Johnson Trust', startTime: new Date(Date.now() + 86400000), type: 'portfolio_review' },
        { id: '3', title: 'Estate Planning', householdName: 'Williams Family Office', startTime: new Date(Date.now() + 172800000), type: 'estate_planning' },
      ],
      alerts: [
        { type: 'review_due', message: '3 annual reviews are past due', severity: 'warning', count: 3 },
        { type: 'kyc_expiring', message: '2 KYC verifications expiring within 30 days', severity: 'info', count: 2 },
        { type: 'large_withdrawal', message: 'Large withdrawal request pending approval', severity: 'critical' },
        { type: 'tasks_overdue', message: '8 tasks are overdue', severity: 'warning', count: 8 },
      ],
    };
  }

  async setAdvisorGoals(advisorId: string, dto: SetGoalsDto): Promise<AdvisorMetrics> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    let metrics = await this.advisorMetricsRepository.findOne({
      where: {
        advisorId,
        periodType: 'annual',
        periodStart: startOfYear,
      },
    });

    if (!metrics) {
      metrics = this.advisorMetricsRepository.create({
        advisorId,
        periodStart: startOfYear,
        periodEnd: endOfYear,
        periodType: 'annual',
        goals: dto,
      });
    } else {
      metrics.goals = { ...metrics.goals, ...dto };
    }

    return this.advisorMetricsRepository.save(metrics);
  }

  // ==================== Client Profitability ====================

  async getClientProfitability(
    filter: ClientProfitabilityFilterDto,
  ): Promise<ClientProfitabilityResponseDto[]> {
    const where: any = {};

    if (filter.householdId) where.householdId = filter.householdId;
    if (filter.tier) where.tier = filter.tier;

    const profitability = await this.profitabilityRepository.find({
      where: {
        ...where,
        periodStart: MoreThan(new Date(filter.startDate)),
        periodEnd: LessThan(new Date(filter.endDate)),
      },
      order: { netProfit: 'DESC' },
    });

    // If no data exists, return simulated data
    if (profitability.length === 0) {
      return this.getSimulatedProfitabilityData();
    }

    return profitability.map(p => ({
      householdId: p.householdId,
      householdName: 'Household ' + p.householdId.substring(0, 8),
      tier: p.tier || 'silver',
      aum: Number(p.aum),
      totalRevenue: Number(p.totalRevenue),
      totalCost: Number(p.totalCost),
      netProfit: Number(p.netProfit),
      netMargin: Number(p.netMargin),
      revenuePerHour: Number(p.revenuePerHour),
      profitPerHour: Number(p.profitPerHour),
      totalHours: Number(p.advisorHours) + Number(p.operationsHours) + Number(p.complianceHours),
      effectiveFeeRate: Number(p.effectiveFeeRate),
      profitabilityScore: Number(p.profitabilityScore) || 0,
    }));
  }

  private getSimulatedProfitabilityData(): ClientProfitabilityResponseDto[] {
    return [
      { householdId: '1', householdName: 'The Smith Family', tier: 'platinum', aum: 8500000, totalRevenue: 72250, totalCost: 28900, netProfit: 43350, netMargin: 60, revenuePerHour: 1445, profitPerHour: 867, totalHours: 50, effectiveFeeRate: 0.0085, profitabilityScore: 95 },
      { householdId: '2', householdName: 'Johnson Trust', tier: 'platinum', aum: 6200000, totalRevenue: 52700, totalCost: 21080, netProfit: 31620, netMargin: 60, revenuePerHour: 1317, profitPerHour: 791, totalHours: 40, effectiveFeeRate: 0.0085, profitabilityScore: 92 },
      { householdId: '3', householdName: 'Williams Family Office', tier: 'gold', aum: 5800000, totalRevenue: 46400, totalCost: 20440, netProfit: 25960, netMargin: 56, revenuePerHour: 1160, profitPerHour: 649, totalHours: 40, effectiveFeeRate: 0.008, profitabilityScore: 88 },
      { householdId: '4', householdName: 'The Brown Family', tier: 'gold', aum: 4200000, totalRevenue: 35700, totalCost: 17850, netProfit: 17850, netMargin: 50, revenuePerHour: 892, profitPerHour: 446, totalHours: 40, effectiveFeeRate: 0.0085, profitabilityScore: 82 },
      { householdId: '5', householdName: 'Davis Revocable Trust', tier: 'silver', aum: 3900000, totalRevenue: 31200, totalCost: 18720, netProfit: 12480, netMargin: 40, revenuePerHour: 624, profitPerHour: 250, totalHours: 50, effectiveFeeRate: 0.008, profitabilityScore: 72 },
      { householdId: '6', householdName: 'Miller Family', tier: 'silver', aum: 2500000, totalRevenue: 20000, totalCost: 14000, netProfit: 6000, netMargin: 30, revenuePerHour: 400, profitPerHour: 120, totalHours: 50, effectiveFeeRate: 0.008, profitabilityScore: 58 },
      { householdId: '7', householdName: 'Wilson Trust', tier: 'bronze', aum: 1200000, totalRevenue: 9600, totalCost: 8640, netProfit: 960, netMargin: 10, revenuePerHour: 192, profitPerHour: 19, totalHours: 50, effectiveFeeRate: 0.008, profitabilityScore: 35 },
    ];
  }

  async getHouseholdProfitability(householdId: string): Promise<ClientProfitabilityResponseDto> {
    const profitability = await this.profitabilityRepository.findOne({
      where: { householdId },
      order: { periodEnd: 'DESC' },
    });

    if (!profitability) {
      // Return simulated data for demo
      return {
        householdId,
        householdName: 'Household',
        tier: 'gold',
        aum: 5000000,
        totalRevenue: 42500,
        totalCost: 17000,
        netProfit: 25500,
        netMargin: 60,
        revenuePerHour: 1062,
        profitPerHour: 637,
        totalHours: 40,
        effectiveFeeRate: 0.0085,
        profitabilityScore: 85,
      };
    }

    return {
      householdId: profitability.householdId,
      householdName: 'Household ' + profitability.householdId.substring(0, 8),
      tier: profitability.tier || 'silver',
      aum: Number(profitability.aum),
      totalRevenue: Number(profitability.totalRevenue),
      totalCost: Number(profitability.totalCost),
      netProfit: Number(profitability.netProfit),
      netMargin: Number(profitability.netMargin),
      revenuePerHour: Number(profitability.revenuePerHour),
      profitPerHour: Number(profitability.profitPerHour),
      totalHours: Number(profitability.advisorHours) + Number(profitability.operationsHours) + Number(profitability.complianceHours),
      effectiveFeeRate: Number(profitability.effectiveFeeRate),
      profitabilityScore: Number(profitability.profitabilityScore) || 0,
    };
  }

  async updateTimeAllocation(dto: UpdateTimeAllocationDto): Promise<ClientProfitability> {
    const period = dto.date ? new Date(dto.date) : new Date();
    const startOfMonth = new Date(period.getFullYear(), period.getMonth(), 1);
    const endOfMonth = new Date(period.getFullYear(), period.getMonth() + 1, 0);

    let profitability = await this.profitabilityRepository.findOne({
      where: {
        householdId: dto.householdId,
        periodStart: startOfMonth,
        periodType: 'monthly',
      },
    });

    if (!profitability) {
      profitability = this.profitabilityRepository.create({
        householdId: dto.householdId,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        periodType: 'monthly',
      });
    }

    if (dto.advisorHours !== undefined) profitability.advisorHours = dto.advisorHours;
    if (dto.operationsHours !== undefined) profitability.operationsHours = dto.operationsHours;
    if (dto.complianceHours !== undefined) profitability.complianceHours = dto.complianceHours;

    // Recalculate costs and profitability
    await this.recalculateProfitability(profitability);

    return this.profitabilityRepository.save(profitability);
  }

  private async recalculateProfitability(p: ClientProfitability): Promise<void> {
    // Cost rates (configurable in production)
    const advisorRate = 250;
    const operationsRate = 75;
    const complianceRate = 125;

    p.directLaborCost = 
      Number(p.advisorHours) * advisorRate +
      Number(p.operationsHours) * operationsRate +
      Number(p.complianceHours) * complianceRate;

    p.totalCost = Number(p.directLaborCost) + Number(p.technologyCost) + Number(p.custodianCost) + 
                  Number(p.marketingCost) + Number(p.overheadAllocation);

    p.grossProfit = Number(p.totalRevenue) - Number(p.directLaborCost);
    p.netProfit = Number(p.totalRevenue) - Number(p.totalCost);

    const totalHours = Number(p.advisorHours) + Number(p.operationsHours) + Number(p.complianceHours);
    
    if (Number(p.totalRevenue) > 0) {
      p.grossMargin = (Number(p.grossProfit) / Number(p.totalRevenue)) * 100;
      p.netMargin = (Number(p.netProfit) / Number(p.totalRevenue)) * 100;
    }

    if (totalHours > 0) {
      p.revenuePerHour = Number(p.totalRevenue) / totalHours;
      p.profitPerHour = Number(p.netProfit) / totalHours;
    }

    if (Number(p.aum) > 0) {
      p.effectiveFeeRate = Number(p.totalRevenue) / Number(p.aum);
    }

    // Calculate profitability score (0-100)
    const marginScore = Math.min(Number(p.netMargin) / 60 * 50, 50); // Max 50 points for 60%+ margin
    const revenuePerHourScore = Math.min(Number(p.revenuePerHour) / 2000 * 30, 30); // Max 30 points
    const feeRateScore = Math.min(Number(p.effectiveFeeRate) / 0.01 * 20, 20); // Max 20 points
    p.profitabilityScore = Math.round(marginScore + revenuePerHourScore + feeRateScore);

    // Assign tier based on score
    if (p.profitabilityScore >= 85) p.tier = 'platinum';
    else if (p.profitabilityScore >= 70) p.tier = 'gold';
    else if (p.profitabilityScore >= 50) p.tier = 'silver';
    else p.tier = 'bronze';
  }

  // ==================== Firm Metrics ====================

  async getFirmOverview(filter: FirmMetricsFilterDto): Promise<FirmOverviewResponseDto> {
    const metrics = await this.firmMetricsRepository.findOne({
      where: {
        periodStart: LessThan(new Date(filter.endDate)),
        periodEnd: MoreThan(new Date(filter.startDate)),
        periodType: filter.periodType || 'monthly',
      },
      order: { periodEnd: 'DESC' },
    });

    // Return simulated data if no metrics exist
    return {
      aum: {
        total: metrics?.totalAum || 485000000,
        change: metrics?.netNewAssets || 12500000,
        changePercent: 2.6,
        netNewAssets: metrics?.netNewAssets || 8500000,
        marketChange: metrics?.marketChange || 4000000,
      },
      revenue: {
        mtd: metrics?.totalRevenue || 385000,
        ytd: (metrics?.totalRevenue || 385000) * 11,
        projectedAnnual: (metrics?.totalRevenue || 385000) * 12,
        changePercent: 8.5,
      },
      clients: {
        total: metrics?.totalHouseholds || 185,
        new: metrics?.newHouseholds || 8,
        lost: metrics?.lostHouseholds || 2,
        retentionRate: metrics?.retentionRate || 98.9,
        averageAum: metrics?.averageHouseholdAum || 2621621,
      },
      efficiency: {
        revenuePerAdvisor: metrics?.revenuePerAdvisor || 770000,
        aumPerAdvisor: metrics?.aumPerAdvisor || 97000000,
        householdsPerAdvisor: metrics?.householdsPerAdvisor || 37,
        operatingMargin: metrics?.operatingMargin || 35,
      },
      compliance: {
        overdueReviews: metrics?.overdueReviews || 5,
        expiringKyc: metrics?.kycCompliance || 8,
        openIssues: metrics?.complianceIssues || 2,
      },
    };
  }

  async getFirmMetricsTrend(
    filter: FirmMetricsFilterDto,
  ): Promise<FirmMetrics[]> {
    return this.firmMetricsRepository.find({
      where: {
        periodStart: MoreThan(new Date(filter.startDate)),
        periodEnd: LessThan(new Date(filter.endDate)),
        periodType: filter.periodType || 'monthly',
      },
      order: { periodStart: 'ASC' },
    });
  }

  // ==================== Activity Tracking ====================

  async getActivitySnapshots(filter: ActivityFilterDto): Promise<ActivitySnapshot[]> {
    const where: any = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.snapshotType) where.snapshotType = filter.snapshotType;

    if (filter.startDate && filter.endDate) {
      where.snapshotDate = Between(new Date(filter.startDate), new Date(filter.endDate));
    }

    return this.activityRepository.find({
      where,
      order: { snapshotDate: 'DESC' },
      take: 90,
    });
  }

  async recordDailyActivity(userId: string): Promise<ActivitySnapshot> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let snapshot = await this.activityRepository.findOne({
      where: {
        userId,
        snapshotDate: today,
        snapshotType: 'daily',
      },
    });

    if (!snapshot) {
      snapshot = this.activityRepository.create({
        userId,
        snapshotDate: today,
        snapshotType: 'daily',
      });
    }

    // In production, this would aggregate from actual activity tables
    // For now, it serves as a placeholder
    return this.activityRepository.save(snapshot);
  }

  // ==================== Reports ====================

  async generateProfitabilityReport(filter: ClientProfitabilityFilterDto): Promise<{
    summary: any;
    details: ClientProfitabilityResponseDto[];
    distribution: any;
  }> {
    const details = await this.getClientProfitability(filter);

    const totalRevenue = details.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalProfit = details.reduce((sum, c) => sum + c.netProfit, 0);
    const totalAum = details.reduce((sum, c) => sum + c.aum, 0);

    const tierCounts = {
      platinum: details.filter(c => c.tier === 'platinum').length,
      gold: details.filter(c => c.tier === 'gold').length,
      silver: details.filter(c => c.tier === 'silver').length,
      bronze: details.filter(c => c.tier === 'bronze').length,
    };

    const tierRevenue = {
      platinum: details.filter(c => c.tier === 'platinum').reduce((s, c) => s + c.totalRevenue, 0),
      gold: details.filter(c => c.tier === 'gold').reduce((s, c) => s + c.totalRevenue, 0),
      silver: details.filter(c => c.tier === 'silver').reduce((s, c) => s + c.totalRevenue, 0),
      bronze: details.filter(c => c.tier === 'bronze').reduce((s, c) => s + c.totalRevenue, 0),
    };

    return {
      summary: {
        totalClients: details.length,
        totalAum,
        totalRevenue,
        totalProfit,
        averageMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        averageProfitabilityScore: details.reduce((s, c) => s + c.profitabilityScore, 0) / details.length,
      },
      details,
      distribution: {
        tierCounts,
        tierRevenue,
        profitableClients: details.filter(c => c.netProfit > 0).length,
        unprofitableClients: details.filter(c => c.netProfit <= 0).length,
      },
    };
  }
}
