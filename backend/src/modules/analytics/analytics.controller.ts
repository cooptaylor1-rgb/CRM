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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import {
  AdvisorDashboardFilterDto,
  ClientProfitabilityFilterDto,
  UpdateTimeAllocationDto,
  SetGoalsDto,
  FirmMetricsFilterDto,
  ActivityFilterDto,
} from './dto/analytics.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== Advisor Dashboard ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get advisor dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  getMyDashboard(@Query() filter: AdvisorDashboardFilterDto, @Request() req: RequestWithUser) {
    return this.analyticsService.getAdvisorDashboard(req.user.id, filter);
  }

  @Get('dashboard/:advisorId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get dashboard for specific advisor' })
  @ApiResponse({ status: 200, description: 'Advisor dashboard data' })
  getAdvisorDashboard(
    @Param('advisorId') advisorId: string,
    @Query() filter: AdvisorDashboardFilterDto,
  ) {
    return this.analyticsService.getAdvisorDashboard(advisorId, filter);
  }

  @Patch('goals')
  @ApiOperation({ summary: 'Set advisor goals' })
  @ApiResponse({ status: 200, description: 'Goals updated' })
  setMyGoals(@Body() dto: SetGoalsDto, @Request() req: RequestWithUser) {
    return this.analyticsService.setAdvisorGoals(req.user.id, dto);
  }

  @Patch('goals/:advisorId')
  @Roles('admin')
  @ApiOperation({ summary: 'Set goals for specific advisor' })
  @ApiResponse({ status: 200, description: 'Goals updated' })
  setAdvisorGoals(@Param('advisorId') advisorId: string, @Body() dto: SetGoalsDto) {
    return this.analyticsService.setAdvisorGoals(advisorId, dto);
  }

  // ==================== Client Profitability ====================

  @Get('profitability')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Get client profitability data' })
  @ApiResponse({ status: 200, description: 'Profitability data' })
  getClientProfitability(@Query() filter: ClientProfitabilityFilterDto) {
    return this.analyticsService.getClientProfitability(filter);
  }

  @Get('profitability/household/:householdId')
  @ApiOperation({ summary: 'Get profitability for specific household' })
  @ApiResponse({ status: 200, description: 'Household profitability' })
  getHouseholdProfitability(@Param('householdId') householdId: string) {
    return this.analyticsService.getHouseholdProfitability(householdId);
  }

  @Patch('profitability/time-allocation')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Update time allocation for household' })
  @ApiResponse({ status: 200, description: 'Time allocation updated' })
  updateTimeAllocation(@Body() dto: UpdateTimeAllocationDto) {
    return this.analyticsService.updateTimeAllocation(dto);
  }

  @Get('profitability/report')
  @Roles('admin')
  @ApiOperation({ summary: 'Generate profitability report' })
  @ApiResponse({ status: 200, description: 'Profitability report' })
  getProfitabilityReport(@Query() filter: ClientProfitabilityFilterDto) {
    return this.analyticsService.generateProfitabilityReport(filter);
  }

  // ==================== Firm Metrics ====================

  @Get('firm/overview')
  @Roles('admin')
  @ApiOperation({ summary: 'Get firm overview metrics' })
  @ApiResponse({ status: 200, description: 'Firm overview' })
  getFirmOverview(@Query() filter: FirmMetricsFilterDto) {
    return this.analyticsService.getFirmOverview(filter);
  }

  @Get('firm/trend')
  @Roles('admin')
  @ApiOperation({ summary: 'Get firm metrics trend' })
  @ApiResponse({ status: 200, description: 'Firm metrics over time' })
  getFirmTrend(@Query() filter: FirmMetricsFilterDto) {
    return this.analyticsService.getFirmMetricsTrend(filter);
  }

  // ==================== Activity ====================

  @Get('activity')
  @ApiOperation({ summary: 'Get activity snapshots' })
  @ApiResponse({ status: 200, description: 'Activity data' })
  getActivity(@Query() filter: ActivityFilterDto) {
    return this.analyticsService.getActivitySnapshots(filter);
  }

  @Post('activity/record')
  @ApiOperation({ summary: 'Record daily activity (internal)' })
  @ApiResponse({ status: 201, description: 'Activity recorded' })
  recordActivity(@Request() req: RequestWithUser) {
    return this.analyticsService.recordDailyActivity(req.user.id);
  }
}
