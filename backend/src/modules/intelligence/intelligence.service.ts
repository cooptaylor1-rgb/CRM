import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThan, MoreThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ClientInsight, InsightType, InsightPriority, InsightStatus } from './entities/client-insight.entity';
import { LifeEvent, LifeEventType, EventSource, EventImpact } from './entities/life-event.entity';
import { MeetingBrief, TalkingPoint, ActionItem, BriefSection, PortfolioSnapshot, ClientProfile } from './entities/meeting-brief.entity';
import { RiskScore, RiskLevel, RiskCategory } from './entities/risk-score.entity';

import { Household } from '../households/entities/household.entity';
import { Person } from '../persons/entities/person.entity';
import { Account } from '../accounts/entities/account.entity';

import { CreateInsightDto, UpdateInsightStatusDto, InsightFilterDto } from './dto/create-insight.dto';
import { CreateLifeEventDto, LifeEventFilterDto } from './dto/create-life-event.dto';
import { GenerateBriefDto, UpdateBriefDto, BriefFilterDto } from './dto/generate-brief.dto';

// =============================================================================
// Intelligence Service - AI-Powered Client Intelligence
// =============================================================================

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(
    @InjectRepository(ClientInsight)
    private insightRepository: Repository<ClientInsight>,
    @InjectRepository(LifeEvent)
    private lifeEventRepository: Repository<LifeEvent>,
    @InjectRepository(MeetingBrief)
    private briefRepository: Repository<MeetingBrief>,
    @InjectRepository(RiskScore)
    private riskScoreRepository: Repository<RiskScore>,
    @InjectRepository(Household)
    private householdRepository: Repository<Household>,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private dataSource: DataSource,
  ) {}

  // ===========================================================================
  // INSIGHTS MANAGEMENT
  // ===========================================================================

  async createInsight(dto: CreateInsightDto): Promise<ClientInsight> {
    const insight = this.insightRepository.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.insightRepository.save(insight);
  }

  async getInsights(filter: InsightFilterDto): Promise<ClientInsight[]> {
    const query = this.insightRepository.createQueryBuilder('insight');

    if (filter.householdId) {
      query.andWhere('insight.householdId = :householdId', { householdId: filter.householdId });
    }
    if (filter.type) {
      query.andWhere('insight.type = :type', { type: filter.type });
    }
    if (filter.priority) {
      query.andWhere('insight.priority = :priority', { priority: filter.priority });
    }
    if (filter.status) {
      query.andWhere('insight.status = :status', { status: filter.status });
    }

    query.orderBy('insight.priority', 'ASC')
         .addOrderBy('insight.createdAt', 'DESC');

    if (filter.limit) {
      query.take(filter.limit);
    }

    return query.getMany();
  }

  async updateInsightStatus(id: string, dto: UpdateInsightStatusDto, userId: string): Promise<ClientInsight> {
    const insight = await this.insightRepository.findOne({ where: { id } });
    if (!insight) {
      throw new NotFoundException(`Insight with ID ${id} not found`);
    }

    if (dto.status) {
      insight.status = dto.status as InsightStatus;
      if (dto.status === 'actioned') {
        insight.actionedAt = new Date();
        insight.actionedBy = userId;
      }
    }
    if (dto.actionNotes) {
      insight.actionNotes = dto.actionNotes;
    }

    return this.insightRepository.save(insight);
  }

  async getInsightsDashboard(firmId?: string): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<string, number>;
    recentInsights: ClientInsight[];
  }> {
    const insights = await this.insightRepository.find({
      where: { status: In([InsightStatus.NEW, InsightStatus.VIEWED]) },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = {};

    for (const insight of insights) {
      byPriority[insight.priority] = (byPriority[insight.priority] || 0) + 1;
      byType[insight.type] = (byType[insight.type] || 0) + 1;
    }

    return {
      ...byPriority,
      byType,
      recentInsights: insights.slice(0, 10),
    };
  }

  // ===========================================================================
  // LIFE EVENTS
  // ===========================================================================

  async createLifeEvent(dto: CreateLifeEventDto): Promise<LifeEvent> {
    const event = this.lifeEventRepository.create({
      ...dto,
      eventDate: new Date(dto.eventDate),
    });
    return this.lifeEventRepository.save(event);
  }

  async getLifeEvents(filter: LifeEventFilterDto): Promise<LifeEvent[]> {
    const query = this.lifeEventRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.person', 'person')
      .leftJoinAndSelect('event.household', 'household');

    if (filter.householdId) {
      query.andWhere('event.householdId = :householdId', { householdId: filter.householdId });
    }
    if (filter.eventType) {
      query.andWhere('event.eventType = :eventType', { eventType: filter.eventType });
    }
    if (filter.source) {
      query.andWhere('event.source = :source', { source: filter.source });
    }
    if (filter.acknowledged !== undefined) {
      query.andWhere('event.isAcknowledged = :acknowledged', { acknowledged: filter.acknowledged === 'true' });
    }
    if (filter.startDate) {
      query.andWhere('event.eventDate >= :startDate', { startDate: new Date(filter.startDate) });
    }
    if (filter.endDate) {
      query.andWhere('event.eventDate <= :endDate', { endDate: new Date(filter.endDate) });
    }

    return query.orderBy('event.eventDate', 'DESC').getMany();
  }

  async acknowledgeLifeEvent(id: string, userId: string): Promise<LifeEvent> {
    const event = await this.lifeEventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Life event with ID ${id} not found`);
    }

    event.isAcknowledged = true;
    event.acknowledgedBy = userId;
    event.acknowledgedAt = new Date();

    return this.lifeEventRepository.save(event);
  }

  // ===========================================================================
  // MEETING BRIEF GENERATION
  // ===========================================================================

  async generateMeetingBrief(dto: GenerateBriefDto, userId: string): Promise<MeetingBrief> {
    const household = await this.householdRepository.findOne({
      where: { id: dto.householdId },
      relations: ['persons', 'accounts'],
    });

    if (!household) {
      throw new NotFoundException(`Household with ID ${dto.householdId} not found`);
    }

    // Build client profile
    const clientProfile = await this.buildClientProfile(household);

    // Build portfolio snapshot
    const portfolioSnapshot = await this.buildPortfolioSnapshot(household);

    // Generate talking points
    const talkingPoints = await this.generateTalkingPoints(household, dto.purpose, dto.additionalTopics);

    // Generate sections
    const sections = await this.generateBriefSections(household);

    // Get pending action items from previous meetings
    const actionItems = await this.getPendingActionItems(dto.householdId);

    // Get warnings and opportunities
    const warnings = await this.getWarningsForBrief(dto.householdId);
    const opportunities = await this.getOpportunitiesForBrief(dto.householdId);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(household, portfolioSnapshot, warnings, opportunities);

    const brief = this.briefRepository.create({
      householdId: dto.householdId,
      meetingId: dto.meetingId,
      meetingDate: new Date(dto.meetingDate),
      meetingType: dto.meetingType,
      purpose: dto.purpose,
      clientProfile,
      portfolioSnapshot,
      talkingPoints,
      sections,
      actionItems,
      warnings,
      opportunities,
      executiveSummary,
      generatedAt: new Date(),
      generatedBy: userId,
    });

    return this.briefRepository.save(brief);
  }

  async getMeetingBriefs(filter: BriefFilterDto): Promise<MeetingBrief[]> {
    const query = this.briefRepository.createQueryBuilder('brief')
      .leftJoinAndSelect('brief.household', 'household');

    if (filter.householdId) {
      query.andWhere('brief.householdId = :householdId', { householdId: filter.householdId });
    }
    if (filter.startDate) {
      query.andWhere('brief.meetingDate >= :startDate', { startDate: new Date(filter.startDate) });
    }
    if (filter.endDate) {
      query.andWhere('brief.meetingDate <= :endDate', { endDate: new Date(filter.endDate) });
    }
    if (filter.meetingType) {
      query.andWhere('brief.meetingType = :meetingType', { meetingType: filter.meetingType });
    }

    return query.orderBy('brief.meetingDate', 'DESC').getMany();
  }

  async getMeetingBrief(id: string, markViewed = false): Promise<MeetingBrief> {
    const brief = await this.briefRepository.findOne({
      where: { id },
      relations: ['household'],
    });

    if (!brief) {
      throw new NotFoundException(`Meeting brief with ID ${id} not found`);
    }

    if (markViewed && !brief.isViewed) {
      brief.isViewed = true;
      brief.viewedAt = new Date();
      await this.briefRepository.save(brief);
    }

    return brief;
  }

  async updateMeetingBrief(id: string, dto: UpdateBriefDto, userId: string): Promise<MeetingBrief> {
    const brief = await this.getMeetingBrief(id);

    if (dto.talkingPoints) {
      brief.talkingPoints = dto.talkingPoints;
    }
    if (dto.actionItems) {
      brief.actionItems = dto.actionItems;
    }
    if (dto.advisorNote) {
      const notes = brief.advisorNotes || [];
      notes.push({
        note: dto.advisorNote.note,
        addedAt: new Date(),
        addedBy: userId,
      });
      brief.advisorNotes = notes;
    }

    return this.briefRepository.save(brief);
  }

  // ===========================================================================
  // RISK SCORING
  // ===========================================================================

  async calculateRiskScore(householdId: string): Promise<RiskScore> {
    const household = await this.householdRepository.findOne({
      where: { id: householdId },
      relations: ['persons', 'accounts'],
    });

    if (!household) {
      throw new NotFoundException(`Household with ID ${householdId} not found`);
    }

    // Get previous score for trend comparison
    const previousScore = await this.riskScoreRepository.findOne({
      where: { householdId },
      order: { calculatedAt: 'DESC' },
    });

    // Calculate individual risk scores
    const attritionScore = await this.calculateAttritionRisk(household);
    const complianceScore = await this.calculateComplianceRisk(household);
    const portfolioScore = await this.calculatePortfolioRisk(household);
    const engagementScore = await this.calculateEngagementScore(household);

    // Calculate overall score (weighted average)
    const overallScore = (
      attritionScore * 0.30 +
      complianceScore * 0.25 +
      portfolioScore * 0.25 +
      engagementScore * 0.20
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore);

    // Build detailed risk categories
    const riskCategories = this.buildRiskCategories(household, {
      attritionScore,
      complianceScore,
      portfolioScore,
      engagementScore,
    });

    // Generate key factors and recommendations
    const keyFactors = this.identifyKeyRiskFactors(riskCategories);
    const recommendations = this.generateRiskRecommendations(riskCategories, keyFactors);

    // Calculate trend
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    let scoreChange = 0;
    if (previousScore) {
      scoreChange = overallScore - Number(previousScore.overallScore);
      if (scoreChange < -5) trendDirection = 'improving';
      else if (scoreChange > 5) trendDirection = 'declining';
    }

    const riskScore = this.riskScoreRepository.create({
      householdId,
      overallScore,
      riskLevel,
      attritionScore,
      complianceScore,
      portfolioScore,
      engagementScore,
      riskCategories,
      keyFactors,
      recommendations,
      trendDirection,
      scoreChange,
      calculatedAt: new Date(),
      nextCalculationAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Weekly
    });

    return this.riskScoreRepository.save(riskScore);
  }

  async getRiskScore(householdId: string): Promise<RiskScore | null> {
    return this.riskScoreRepository.findOne({
      where: { householdId },
      order: { calculatedAt: 'DESC' },
    });
  }

  async getRiskScoreHistory(householdId: string, months = 12): Promise<RiskScore[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.riskScoreRepository.find({
      where: {
        householdId,
        calculatedAt: MoreThan(startDate),
      },
      order: { calculatedAt: 'ASC' },
    });
  }

  async getHighRiskHouseholds(limit = 20): Promise<{ household: Household; riskScore: RiskScore }[]> {
    const scores = await this.riskScoreRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.household', 'household')
      .distinctOn(['score.householdId'])
      .orderBy('score.householdId')
      .addOrderBy('score.calculatedAt', 'DESC')
      .getMany();

    // Filter to high risk and sort by score
    return scores
      .filter(s => Number(s.overallScore) >= 60)
      .sort((a, b) => Number(b.overallScore) - Number(a.overallScore))
      .slice(0, limit)
      .map(score => ({ household: score.household, riskScore: score }));
  }

  // ===========================================================================
  // AUTOMATED INSIGHT GENERATION
  // ===========================================================================

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyInsights(): Promise<void> {
    this.logger.log('Starting daily insight generation...');

    const households = await this.householdRepository.find({
      relations: ['persons', 'accounts'],
    });

    for (const household of households) {
      try {
        await this.generateInsightsForHousehold(household);
      } catch (error) {
        this.logger.error(`Error generating insights for household ${household.id}:`, error);
      }
    }

    this.logger.log('Daily insight generation completed');
  }

  async generateInsightsForHousehold(household: Household): Promise<ClientInsight[]> {
    const insights: ClientInsight[] = [];

    // Check for portfolio drift
    const portfolioDrift = await this.checkPortfolioDrift(household);
    if (portfolioDrift) insights.push(portfolioDrift);

    // Check for upcoming review dates
    const reviewReminder = await this.checkReviewDate(household);
    if (reviewReminder) insights.push(reviewReminder);

    // Check for milestone events
    const milestones = await this.checkMilestones(household);
    insights.push(...milestones);

    // Check for engagement drop
    const engagementInsight = await this.checkEngagementDrop(household);
    if (engagementInsight) insights.push(engagementInsight);

    // Check for tax optimization opportunities
    const taxInsights = await this.checkTaxOpportunities(household);
    insights.push(...taxInsights);

    return insights;
  }

  // ===========================================================================
  // LIFE EVENT DETECTION
  // ===========================================================================

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async detectLifeEvents(): Promise<void> {
    this.logger.log('Starting life event detection...');

    const households = await this.householdRepository.find({
      relations: ['persons', 'accounts'],
    });

    for (const household of households) {
      try {
        await this.detectLifeEventsForHousehold(household);
      } catch (error) {
        this.logger.error(`Error detecting life events for household ${household.id}:`, error);
      }
    }

    this.logger.log('Life event detection completed');
  }

  async detectLifeEventsForHousehold(household: Household): Promise<LifeEvent[]> {
    const events: LifeEvent[] = [];

    // Check for birthday milestones (50, 55, 59.5, 60, 65, 70, 72, 73)
    for (const person of household.persons || []) {
      const birthdayEvent = await this.checkBirthdayMilestone(person, household.id);
      if (birthdayEvent) events.push(birthdayEvent);
    }

    // Check for RMD approaching (72+)
    const rmdEvent = await this.checkRmdApproaching(household);
    if (rmdEvent) events.push(rmdEvent);

    // Check for account anniversaries
    for (const account of household.accounts || []) {
      const anniversaryEvent = await this.checkAccountAnniversary(account, household.id);
      if (anniversaryEvent) events.push(anniversaryEvent);
    }

    // Check for AUM milestones
    const aumEvent = await this.checkAumMilestone(household);
    if (aumEvent) events.push(aumEvent);

    return events;
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  private async buildClientProfile(household: Household): Promise<ClientProfile> {
    const primaryContact = household.persons?.find(p => p.isPrimaryContact);
    const relationshipStart = household.onboardingDate || household.createdAt;
    const years = Math.floor((Date.now() - new Date(relationshipStart).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    return {
      householdName: household.name,
      primaryContact: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'N/A',
      relationshipLength: years > 0 ? `${years} year${years > 1 ? 's' : ''}` : 'Less than a year',
      riskTolerance: household.riskTolerance || 'Not set',
      investmentObjective: household.investmentObjective || 'Not set',
      lastMeetingDate: household.lastReviewDate || null,
      communicationPreference: 'Email', // Would come from preferences
    };
  }

  private async buildPortfolioSnapshot(household: Household): Promise<PortfolioSnapshot> {
    const accounts = household.accounts || [];
    const totalAum = accounts.reduce((sum, acc) => sum + Number(acc.currentValue || 0), 0);

    // In a real implementation, this would pull from actual position data
    return {
      totalAum,
      ytdReturn: 8.5, // Would be calculated from actual returns
      inceptionReturn: 45.2,
      assetAllocation: [
        { name: 'Equities', percentage: 60, value: totalAum * 0.6 },
        { name: 'Fixed Income', percentage: 30, value: totalAum * 0.3 },
        { name: 'Alternatives', percentage: 7, value: totalAum * 0.07 },
        { name: 'Cash', percentage: 3, value: totalAum * 0.03 },
      ],
      topHoldings: [
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', value: totalAum * 0.25, weight: 25 },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', value: totalAum * 0.15, weight: 15 },
        { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', value: totalAum * 0.12, weight: 12 },
      ],
      recentActivity: [],
    };
  }

  private async generateTalkingPoints(
    household: Household,
    purpose?: string,
    additionalTopics?: string[],
  ): Promise<TalkingPoint[]> {
    const points: TalkingPoint[] = [];

    // Portfolio performance
    points.push({
      topic: 'Portfolio Performance Review',
      context: 'Review YTD performance and compare to benchmarks',
      suggestedApproach: 'Start with positive highlights, then address any underperforming areas',
      priority: 'must_discuss',
    });

    // Recent life events
    const recentEvents = await this.lifeEventRepository.find({
      where: { householdId: household.id, isAcknowledged: false },
      order: { eventDate: 'DESC' },
      take: 3,
    });

    for (const event of recentEvents) {
      points.push({
        topic: event.title,
        context: event.description || 'Recent life event detected',
        suggestedApproach: 'Discuss implications for financial planning',
        priority: 'should_discuss',
      });
    }

    // Active insights
    const activeInsights = await this.insightRepository.find({
      where: { householdId: household.id, status: In([InsightStatus.NEW, InsightStatus.VIEWED]) },
      order: { priority: 'ASC' },
      take: 3,
    });

    for (const insight of activeInsights) {
      points.push({
        topic: insight.title,
        context: insight.description,
        suggestedApproach: insight.recommendedAction || 'Discuss and determine action',
        priority: insight.priority === InsightPriority.CRITICAL ? 'must_discuss' : 'should_discuss',
      });
    }

    // Add custom topics if provided
    if (additionalTopics) {
      for (const topic of additionalTopics) {
        points.push({
          topic,
          context: 'Custom topic added for this meeting',
          suggestedApproach: 'Address based on client needs',
          priority: 'optional',
        });
      }
    }

    return points;
  }

  private async generateBriefSections(household: Household): Promise<BriefSection[]> {
    const sections: BriefSection[] = [];

    // Relationship Summary
    sections.push({
      title: 'Relationship Summary',
      content: `${household.name} has been a client since ${household.onboardingDate?.toLocaleDateString() || 'N/A'}. ` +
               `Current AUM: $${Number(household.totalAum).toLocaleString()}. ` +
               `Risk Profile: ${household.riskTolerance || 'Not set'}.`,
      priority: 1,
      type: 'summary',
    });

    // Recent Activity
    sections.push({
      title: 'Recent Activity',
      content: 'No significant transactions in the past 30 days.',
      priority: 2,
      type: 'detail',
    });

    return sections;
  }

  private async getPendingActionItems(householdId: string): Promise<ActionItem[]> {
    // Get action items from previous meeting briefs
    const previousBriefs = await this.briefRepository.find({
      where: { householdId },
      order: { meetingDate: 'DESC' },
      take: 3,
    });

    const pendingItems: ActionItem[] = [];
    for (const brief of previousBriefs) {
      const pending = (brief.actionItems || []).filter(item => item.status !== 'completed');
      pendingItems.push(...pending);
    }

    return pendingItems;
  }

  private async getWarningsForBrief(householdId: string): Promise<string[]> {
    const warnings: string[] = [];

    const criticalInsights = await this.insightRepository.find({
      where: {
        householdId,
        priority: In([InsightPriority.CRITICAL, InsightPriority.HIGH]),
        status: In([InsightStatus.NEW, InsightStatus.VIEWED]),
      },
    });

    for (const insight of criticalInsights) {
      warnings.push(insight.title);
    }

    return warnings;
  }

  private async getOpportunitiesForBrief(householdId: string): Promise<string[]> {
    const opportunities: string[] = [];

    const opportunityInsights = await this.insightRepository.find({
      where: {
        householdId,
        type: InsightType.OPPORTUNITY,
        status: In([InsightStatus.NEW, InsightStatus.VIEWED]),
      },
    });

    for (const insight of opportunityInsights) {
      opportunities.push(insight.title);
    }

    return opportunities;
  }

  private generateExecutiveSummary(
    household: Household,
    portfolio: PortfolioSnapshot,
    warnings: string[],
    opportunities: string[],
  ): string {
    let summary = `${household.name} meeting preparation summary. `;
    summary += `Total AUM: $${portfolio.totalAum.toLocaleString()}, YTD Return: ${portfolio.ytdReturn}%. `;

    if (warnings.length > 0) {
      summary += `Key concerns: ${warnings.slice(0, 2).join(', ')}. `;
    }

    if (opportunities.length > 0) {
      summary += `Opportunities to discuss: ${opportunities.slice(0, 2).join(', ')}.`;
    }

    return summary;
  }

  private async calculateAttritionRisk(household: Household): Promise<number> {
    let score = 20; // Base score

    // No recent contact increases risk
    if (household.lastReviewDate) {
      const daysSinceReview = (Date.now() - new Date(household.lastReviewDate).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceReview > 365) score += 30;
      else if (daysSinceReview > 180) score += 15;
    } else {
      score += 20;
    }

    // Low AUM relative to average could indicate partial relationship
    if (Number(household.totalAum) < 100000) {
      score += 15;
    }

    // Unacknowledged life events increase risk
    const unackEvents = await this.lifeEventRepository.count({
      where: { householdId: household.id, isAcknowledged: false },
    });
    score += Math.min(unackEvents * 5, 20);

    return Math.min(score, 100);
  }

  private async calculateComplianceRisk(household: Household): Promise<number> {
    let score = 10; // Base score

    // Overdue review
    if (household.nextReviewDate && new Date(household.nextReviewDate) < new Date()) {
      score += 40;
    }

    // Missing KYC for persons
    const pendingKyc = (household.persons || []).filter(p => p.kycStatus === 'pending').length;
    score += pendingKyc * 10;

    return Math.min(score, 100);
  }

  private async calculatePortfolioRisk(household: Household): Promise<number> {
    let score = 15; // Base score

    // Risk tolerance not set
    if (!household.riskTolerance) {
      score += 20;
    }

    // Investment objective not set
    if (!household.investmentObjective) {
      score += 15;
    }

    // Check for portfolio drift (placeholder - would use actual allocation data)
    const driftPercentage = 5; // Would be calculated
    if (driftPercentage > 10) score += 25;
    else if (driftPercentage > 5) score += 10;

    return Math.min(score, 100);
  }

  private async calculateEngagementScore(household: Household): Promise<number> {
    // Higher score = lower engagement = higher risk
    let score = 30;

    // Calculate based on last interaction
    if (household.lastReviewDate) {
      const daysSinceReview = (Date.now() - new Date(household.lastReviewDate).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceReview > 180) score += 30;
      else if (daysSinceReview > 90) score += 15;
    }

    // Account activity (placeholder)
    const activeAccounts = (household.accounts || []).filter(a => a.status === 'open').length;
    if (activeAccounts === 0) score += 20;

    return Math.min(score, 100);
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.VERY_HIGH;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MODERATE;
    if (score >= 20) return RiskLevel.LOW;
    return RiskLevel.VERY_LOW;
  }

  private buildRiskCategories(
    household: Household,
    scores: { attritionScore: number; complianceScore: number; portfolioScore: number; engagementScore: number },
  ): RiskCategory[] {
    return [
      {
        category: 'Attrition Risk',
        score: scores.attritionScore,
        factors: [
          {
            factor: 'Contact Frequency',
            score: household.lastReviewDate ? 30 : 60,
            weight: 0.4,
            trend: 'stable',
            details: 'Based on last review date',
          },
          {
            factor: 'Relationship Depth',
            score: Number(household.totalAum) > 500000 ? 20 : 40,
            weight: 0.3,
            trend: 'stable',
            details: 'Based on AUM level',
          },
        ],
      },
      {
        category: 'Compliance Risk',
        score: scores.complianceScore,
        factors: [
          {
            factor: 'Review Status',
            score: household.nextReviewDate && new Date(household.nextReviewDate) < new Date() ? 80 : 20,
            weight: 0.5,
            trend: 'stable',
            details: 'Based on review schedule',
          },
        ],
      },
      {
        category: 'Portfolio Risk',
        score: scores.portfolioScore,
        factors: [
          {
            factor: 'Profile Completeness',
            score: household.riskTolerance && household.investmentObjective ? 20 : 60,
            weight: 0.4,
            trend: 'stable',
            details: 'Investment profile setup',
          },
        ],
      },
      {
        category: 'Engagement',
        score: scores.engagementScore,
        factors: [
          {
            factor: 'Activity Level',
            score: scores.engagementScore,
            weight: 1,
            trend: 'stable',
            details: 'Based on recent interactions',
          },
        ],
      },
    ];
  }

  private identifyKeyRiskFactors(categories: RiskCategory[]): string[] {
    const factors: string[] = [];

    for (const category of categories) {
      if (category.score >= 50) {
        factors.push(`High ${category.category.toLowerCase()}`);
      }
      for (const factor of category.factors) {
        if (factor.score >= 60) {
          factors.push(factor.details);
        }
      }
    }

    return factors.slice(0, 5);
  }

  private generateRiskRecommendations(categories: RiskCategory[], keyFactors: string[]): string[] {
    const recommendations: string[] = [];

    const attritionCategory = categories.find(c => c.category === 'Attrition Risk');
    if (attritionCategory && attritionCategory.score >= 50) {
      recommendations.push('Schedule a check-in call to strengthen relationship');
    }

    const complianceCategory = categories.find(c => c.category === 'Compliance Risk');
    if (complianceCategory && complianceCategory.score >= 50) {
      recommendations.push('Complete overdue compliance review immediately');
    }

    const portfolioCategory = categories.find(c => c.category === 'Portfolio Risk');
    if (portfolioCategory && portfolioCategory.score >= 50) {
      recommendations.push('Update investment profile and risk tolerance');
    }

    const engagementCategory = categories.find(c => c.category === 'Engagement');
    if (engagementCategory && engagementCategory.score >= 50) {
      recommendations.push('Implement proactive communication strategy');
    }

    return recommendations;
  }

  private async checkPortfolioDrift(household: Household): Promise<ClientInsight | null> {
    // Placeholder - would check actual allocation vs target
    return null;
  }

  private async checkReviewDate(household: Household): Promise<ClientInsight | null> {
    if (!household.nextReviewDate) return null;

    const daysUntilReview = (new Date(household.nextReviewDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000);

    if (daysUntilReview < 0) {
      const insight = this.insightRepository.create({
        householdId: household.id,
        type: InsightType.COMPLIANCE_REMINDER,
        priority: InsightPriority.HIGH,
        title: 'Overdue Review',
        description: `Annual review for ${household.name} is overdue by ${Math.abs(Math.floor(daysUntilReview))} days`,
        recommendedAction: 'Schedule review meeting immediately',
        confidenceScore: 100,
      });
      return this.insightRepository.save(insight);
    }

    if (daysUntilReview <= 30) {
      const insight = this.insightRepository.create({
        householdId: household.id,
        type: InsightType.COMPLIANCE_REMINDER,
        priority: InsightPriority.MEDIUM,
        title: 'Upcoming Review',
        description: `Annual review for ${household.name} due in ${Math.floor(daysUntilReview)} days`,
        recommendedAction: 'Schedule review meeting',
        confidenceScore: 100,
      });
      return this.insightRepository.save(insight);
    }

    return null;
  }

  private async checkMilestones(household: Household): Promise<ClientInsight[]> {
    const insights: ClientInsight[] = [];

    // Check AUM milestones
    const aumMilestones = [100000, 250000, 500000, 1000000, 5000000, 10000000];
    const aum = Number(household.totalAum);

    for (const milestone of aumMilestones) {
      if (aum >= milestone * 0.95 && aum < milestone) {
        const insight = this.insightRepository.create({
          householdId: household.id,
          type: InsightType.MILESTONE,
          priority: InsightPriority.LOW,
          title: `Approaching $${(milestone / 1000000).toFixed(1)}M AUM`,
          description: `${household.name} is close to reaching $${(milestone / 1000000).toFixed(1)}M in assets`,
          recommendedAction: 'Consider sending congratulatory note when milestone is reached',
          confidenceScore: 95,
        });
        insights.push(await this.insightRepository.save(insight));
      }
    }

    return insights;
  }

  private async checkEngagementDrop(household: Household): Promise<ClientInsight | null> {
    if (!household.lastReviewDate) return null;

    const daysSinceContact = (Date.now() - new Date(household.lastReviewDate).getTime()) / (24 * 60 * 60 * 1000);

    if (daysSinceContact > 180) {
      const insight = this.insightRepository.create({
        householdId: household.id,
        type: InsightType.ENGAGEMENT_DROP,
        priority: InsightPriority.MEDIUM,
        title: 'Low Recent Engagement',
        description: `No contact with ${household.name} in ${Math.floor(daysSinceContact)} days`,
        recommendedAction: 'Reach out to re-engage client',
        confidenceScore: 90,
      });
      return this.insightRepository.save(insight);
    }

    return null;
  }

  private async checkTaxOpportunities(household: Household): Promise<ClientInsight[]> {
    // Placeholder for tax-loss harvesting, Roth conversion opportunities, etc.
    return [];
  }

  private async checkBirthdayMilestone(person: Person, householdId: string): Promise<LifeEvent | null> {
    if (!person.dateOfBirth) return null;

    const dob = new Date(person.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

    // Check if birthday is within 30 days
    const daysUntilBirthday = (birthdayThisYear.getTime() - today.getTime()) / (24 * 60 * 60 * 1000);

    if (daysUntilBirthday >= 0 && daysUntilBirthday <= 30) {
      const milestoneBirthdays = [50, 55, 59.5, 60, 62, 65, 70, 72, 73];
      const upcomingAge = age + (daysUntilBirthday > 0 ? 1 : 0);

      if (milestoneBirthdays.includes(upcomingAge)) {
        const existingEvent = await this.lifeEventRepository.findOne({
          where: {
            householdId,
            personId: person.id,
            eventType: LifeEventType.BIRTHDAY_MILESTONE,
            eventDate: Between(
              new Date(today.getFullYear(), 0, 1),
              new Date(today.getFullYear(), 11, 31),
            ),
          },
        });

        if (!existingEvent) {
          const event = this.lifeEventRepository.create({
            householdId,
            personId: person.id,
            eventType: LifeEventType.BIRTHDAY_MILESTONE,
            source: EventSource.SYSTEM,
            impact: upcomingAge >= 59.5 ? EventImpact.HIGH : EventImpact.MEDIUM,
            title: `${person.firstName}'s ${upcomingAge}th Birthday`,
            description: this.getBirthdayMilestoneDescription(upcomingAge),
            eventDate: birthdayThisYear,
            recommendedActions: this.getBirthdayMilestoneActions(upcomingAge),
            confidenceScore: 100,
          });
          return this.lifeEventRepository.save(event);
        }
      }
    }

    return null;
  }

  private getBirthdayMilestoneDescription(age: number): string {
    const descriptions: Record<number, string> = {
      50: 'Mid-career milestone - good time to review retirement planning',
      55: 'Eligible for catch-up contributions to retirement accounts',
      59.5: 'Can now withdraw from retirement accounts without early withdrawal penalty',
      60: 'Entering pre-retirement phase',
      62: 'Earliest eligible age for Social Security benefits',
      65: 'Medicare eligibility begins',
      70: 'Key retirement milestone',
      72: 'RMD requirements begin (for those born before 1960)',
      73: 'RMD requirements begin (for those born 1960 or later)',
    };
    return descriptions[age] || `${age}th birthday milestone`;
  }

  private getBirthdayMilestoneActions(age: number): string[] {
    const actions: Record<number, string[]> = {
      50: ['Review retirement savings progress', 'Discuss catch-up contribution strategy'],
      55: ['Maximize catch-up contributions', 'Review retirement timeline'],
      59.5: ['Discuss withdrawal strategies', 'Review Roth conversion opportunities'],
      60: ['Update retirement income projections', 'Review Social Security strategy'],
      62: ['Discuss Social Security timing options', 'Review healthcare coverage'],
      65: ['Ensure Medicare enrollment', 'Review supplemental insurance needs'],
      70: ['Optimize Social Security benefits', 'Review estate planning'],
      72: ['Set up RMD calculations', 'Review tax implications'],
      73: ['Set up RMD calculations', 'Review tax implications'],
    };
    return actions[age] || ['Send birthday acknowledgment'];
  }

  private async checkRmdApproaching(household: Household): Promise<LifeEvent | null> {
    // Check if any person in household is approaching RMD age
    for (const person of household.persons || []) {
      if (!person.dateOfBirth) continue;

      const dob = new Date(person.dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

      if (age >= 71.5 && age < 72) {
        const existingEvent = await this.lifeEventRepository.findOne({
          where: {
            householdId: household.id,
            personId: person.id,
            eventType: LifeEventType.RMD_APPROACHING,
          },
        });

        if (!existingEvent) {
          const event = this.lifeEventRepository.create({
            householdId: household.id,
            personId: person.id,
            eventType: LifeEventType.RMD_APPROACHING,
            source: EventSource.SYSTEM,
            impact: EventImpact.HIGH,
            title: `RMD Requirements Approaching for ${person.firstName}`,
            description: 'Required Minimum Distributions will begin soon. Planning needed.',
            eventDate: new Date(),
            recommendedActions: [
              'Calculate projected RMD amounts',
              'Review qualified charitable distribution (QCD) options',
              'Plan for tax implications',
              'Set up automatic RMD withdrawals',
            ],
            confidenceScore: 100,
          });
          return this.lifeEventRepository.save(event);
        }
      }
    }

    return null;
  }

  private async checkAccountAnniversary(account: Account, householdId: string): Promise<LifeEvent | null> {
    if (!account.openedDate) return null;

    const openedDate = new Date(account.openedDate);
    const today = new Date();
    const yearsOpen = today.getFullYear() - openedDate.getFullYear();

    // Check for milestone anniversaries (5, 10, 15, 20, 25 years)
    if ([5, 10, 15, 20, 25].includes(yearsOpen)) {
      const anniversaryThisYear = new Date(today.getFullYear(), openedDate.getMonth(), openedDate.getDate());
      const daysUntilAnniversary = (anniversaryThisYear.getTime() - today.getTime()) / (24 * 60 * 60 * 1000);

      if (daysUntilAnniversary >= 0 && daysUntilAnniversary <= 30) {
        const existingEvent = await this.lifeEventRepository.findOne({
          where: {
            householdId,
            eventType: LifeEventType.ACCOUNT_ANNIVERSARY,
            eventDate: Between(
              new Date(today.getFullYear(), 0, 1),
              new Date(today.getFullYear(), 11, 31),
            ),
          },
        });

        if (!existingEvent) {
          const event = this.lifeEventRepository.create({
            householdId,
            eventType: LifeEventType.ACCOUNT_ANNIVERSARY,
            source: EventSource.SYSTEM,
            impact: EventImpact.LOW,
            title: `${yearsOpen}-Year Account Anniversary`,
            description: `Account ${account.accountNumber} has been open for ${yearsOpen} years`,
            eventDate: anniversaryThisYear,
            recommendedActions: [
              'Send appreciation communication',
              'Review account performance since inception',
            ],
            confidenceScore: 100,
          });
          return this.lifeEventRepository.save(event);
        }
      }
    }

    return null;
  }

  private async checkAumMilestone(household: Household): Promise<LifeEvent | null> {
    const milestones = [100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];
    const aum = Number(household.totalAum);

    for (const milestone of milestones) {
      if (aum >= milestone && aum < milestone * 1.05) {
        const existingEvent = await this.lifeEventRepository.findOne({
          where: {
            householdId: household.id,
            eventType: LifeEventType.AUM_MILESTONE,
            metadata: { milestone },
          },
        });

        if (!existingEvent) {
          const event = this.lifeEventRepository.create({
            householdId: household.id,
            eventType: LifeEventType.AUM_MILESTONE,
            source: EventSource.DETECTED,
            impact: EventImpact.MEDIUM,
            title: `Reached $${(milestone / 1000000).toFixed(1)}M AUM Milestone`,
            description: `${household.name} has reached $${(milestone / 1000000).toFixed(1)}M in assets under management`,
            eventDate: new Date(),
            metadata: { milestone, currentAum: aum },
            recommendedActions: [
              'Send congratulatory communication',
              'Review fee structure for potential benefits',
              'Discuss expanded service offerings',
            ],
            confidenceScore: 100,
          });
          return this.lifeEventRepository.save(event);
        }
      }
    }

    return null;
  }
}
