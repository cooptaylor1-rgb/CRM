import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';

import { IntelligenceService } from './intelligence.service';
import { CreateInsightDto, UpdateInsightStatusDto, InsightFilterDto } from './dto/create-insight.dto';
import { CreateLifeEventDto, AcknowledgeLifeEventDto, LifeEventFilterDto } from './dto/create-life-event.dto';
import { GenerateBriefDto, UpdateBriefDto, BriefFilterDto } from './dto/generate-brief.dto';

// =============================================================================
// Intelligence Controller - AI-Powered Client Intelligence API
// =============================================================================

@ApiTags('Intelligence')
@ApiBearerAuth()
@Controller('intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  // ===========================================================================
  // INSIGHTS ENDPOINTS
  // ===========================================================================

  @Get('insights')
  @ApiOperation({ summary: 'Get client insights with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns filtered insights' })
  async getInsights(@Query() filter: InsightFilterDto) {
    return this.intelligenceService.getInsights(filter);
  }

  @Get('insights/dashboard')
  @ApiOperation({ summary: 'Get insights dashboard summary' })
  @ApiResponse({ status: 200, description: 'Returns insights dashboard data' })
  async getInsightsDashboard() {
    return this.intelligenceService.getInsightsDashboard();
  }

  @Post('insights')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Create a new insight manually' })
  @ApiResponse({ status: 201, description: 'Insight created successfully' })
  async createInsight(@Body() dto: CreateInsightDto) {
    return this.intelligenceService.createInsight(dto);
  }

  @Patch('insights/:id/status')
  @ApiOperation({ summary: 'Update insight status' })
  @ApiResponse({ status: 200, description: 'Insight status updated' })
  async updateInsightStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInsightStatusDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.intelligenceService.updateInsightStatus(id, dto, req.user.id);
  }

  @Post('insights/generate/:householdId')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Generate insights for a household' })
  @ApiResponse({ status: 200, description: 'Insights generated' })
  async generateInsightsForHousehold(@Param('householdId') householdId: string) {
    const household = await this.intelligenceService['householdRepository'].findOne({
      where: { id: householdId },
      relations: ['persons', 'accounts'],
    });
    if (!household) {
      return { message: 'Household not found', insights: [] };
    }
    const insights = await this.intelligenceService.generateInsightsForHousehold(household);
    return { message: 'Insights generated', count: insights.length, insights };
  }

  // ===========================================================================
  // LIFE EVENTS ENDPOINTS
  // ===========================================================================

  @Get('life-events')
  @ApiOperation({ summary: 'Get life events with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns filtered life events' })
  async getLifeEvents(@Query() filter: LifeEventFilterDto) {
    return this.intelligenceService.getLifeEvents(filter);
  }

  @Post('life-events')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Record a new life event' })
  @ApiResponse({ status: 201, description: 'Life event recorded' })
  async createLifeEvent(@Body() dto: CreateLifeEventDto) {
    return this.intelligenceService.createLifeEvent(dto);
  }

  @Patch('life-events/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a life event' })
  @ApiResponse({ status: 200, description: 'Life event acknowledged' })
  async acknowledgeLifeEvent(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.intelligenceService.acknowledgeLifeEvent(id, req.user.id);
  }

  @Post('life-events/detect/:householdId')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Detect life events for a household' })
  @ApiResponse({ status: 200, description: 'Life events detected' })
  async detectLifeEventsForHousehold(@Param('householdId') householdId: string) {
    const household = await this.intelligenceService['householdRepository'].findOne({
      where: { id: householdId },
      relations: ['persons', 'accounts'],
    });
    if (!household) {
      return { message: 'Household not found', events: [] };
    }
    const events = await this.intelligenceService.detectLifeEventsForHousehold(household);
    return { message: 'Life events detected', count: events.length, events };
  }

  // ===========================================================================
  // MEETING BRIEFS ENDPOINTS
  // ===========================================================================

  @Get('briefs')
  @ApiOperation({ summary: 'Get meeting briefs with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns filtered meeting briefs' })
  async getMeetingBriefs(@Query() filter: BriefFilterDto) {
    return this.intelligenceService.getMeetingBriefs(filter);
  }

  @Get('briefs/:id')
  @ApiOperation({ summary: 'Get a specific meeting brief' })
  @ApiResponse({ status: 200, description: 'Returns the meeting brief' })
  async getMeetingBrief(
    @Param('id') id: string,
    @Query('markViewed') markViewed?: string,
  ) {
    return this.intelligenceService.getMeetingBrief(id, markViewed === 'true');
  }

  @Post('briefs/generate')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Generate a meeting brief' })
  @ApiResponse({ status: 201, description: 'Meeting brief generated' })
  async generateMeetingBrief(
    @Body() dto: GenerateBriefDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.intelligenceService.generateMeetingBrief(dto, req.user.id);
  }

  @Patch('briefs/:id')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Update a meeting brief' })
  @ApiResponse({ status: 200, description: 'Meeting brief updated' })
  async updateMeetingBrief(
    @Param('id') id: string,
    @Body() dto: UpdateBriefDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.intelligenceService.updateMeetingBrief(id, dto, req.user.id);
  }

  // ===========================================================================
  // RISK SCORE ENDPOINTS
  // ===========================================================================

  @Get('risk-scores/:householdId')
  @ApiOperation({ summary: 'Get current risk score for a household' })
  @ApiResponse({ status: 200, description: 'Returns current risk score' })
  async getRiskScore(@Param('householdId') householdId: string) {
    return this.intelligenceService.getRiskScore(householdId);
  }

  @Get('risk-scores/:householdId/history')
  @ApiOperation({ summary: 'Get risk score history for a household' })
  @ApiResponse({ status: 200, description: 'Returns risk score history' })
  async getRiskScoreHistory(
    @Param('householdId') householdId: string,
    @Query('months') months?: string,
  ) {
    return this.intelligenceService.getRiskScoreHistory(
      householdId,
      months ? parseInt(months, 10) : 12,
    );
  }

  @Post('risk-scores/:householdId/calculate')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Calculate/recalculate risk score for a household' })
  @ApiResponse({ status: 200, description: 'Risk score calculated' })
  async calculateRiskScore(@Param('householdId') householdId: string) {
    return this.intelligenceService.calculateRiskScore(householdId);
  }

  @Get('risk-scores/high-risk/households')
  @ApiOperation({ summary: 'Get households with high risk scores' })
  @ApiResponse({ status: 200, description: 'Returns high-risk households' })
  async getHighRiskHouseholds(@Query('limit') limit?: string) {
    return this.intelligenceService.getHighRiskHouseholds(
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ===========================================================================
  // HOUSEHOLD INTELLIGENCE SUMMARY
  // ===========================================================================

  @Get('summary/:householdId')
  @ApiOperation({ summary: 'Get complete intelligence summary for a household' })
  @ApiResponse({ status: 200, description: 'Returns comprehensive intelligence data' })
  async getHouseholdIntelligenceSummary(@Param('householdId') householdId: string) {
    const [insights, lifeEvents, riskScore, recentBriefs] = await Promise.all([
      this.intelligenceService.getInsights({ householdId, limit: 10 }),
      this.intelligenceService.getLifeEvents({ householdId }),
      this.intelligenceService.getRiskScore(householdId),
      this.intelligenceService.getMeetingBriefs({ householdId }),
    ]);

    return {
      householdId,
      insights: {
        total: insights.length,
        byPriority: {
          critical: insights.filter(i => i.priority === 'critical').length,
          high: insights.filter(i => i.priority === 'high').length,
          medium: insights.filter(i => i.priority === 'medium').length,
          low: insights.filter(i => i.priority === 'low').length,
        },
        items: insights,
      },
      lifeEvents: {
        total: lifeEvents.length,
        unacknowledged: lifeEvents.filter(e => !e.isAcknowledged).length,
        items: lifeEvents.slice(0, 10),
      },
      riskScore: riskScore || { message: 'No risk score calculated yet' },
      recentBriefs: recentBriefs.slice(0, 5),
      generatedAt: new Date(),
    };
  }
}
