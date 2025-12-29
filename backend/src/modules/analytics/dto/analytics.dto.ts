import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class DateRangeDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}

export class PeriodTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodType?: 'monthly' | 'quarterly' | 'annual';
}

export class AdvisorDashboardFilterDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  advisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodType?: 'monthly' | 'quarterly' | 'annual';
}

export class ClientProfitabilityFilterDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  advisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeUnprofitable?: boolean;
}

export class UpdateTimeAllocationDto {
  @ApiProperty()
  @IsUUID()
  householdId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  advisorHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  operationsHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  complianceHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class SetGoalsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  revenueTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  meetingsTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  newClientsTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  aumTarget?: number;
}

export class FirmMetricsFilterDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodType?: 'monthly' | 'quarterly' | 'annual';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeProjections?: boolean;
}

export class ActivityFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  snapshotType?: 'daily' | 'weekly';
}

// Response DTOs

export class AdvisorDashboardResponseDto {
  @ApiProperty()
  overview: {
    totalHouseholds: number;
    totalAum: number;
    mtdRevenue: number;
    ytdRevenue: number;
    pipelineValue: number;
    tasksOverdue: number;
    meetingsThisWeek: number;
    reviewsDue: number;
  };

  @ApiProperty()
  recentActivity: {
    tasksCompleted: number;
    meetingsCompleted: number;
    emailsSent: number;
    newProspects: number;
  };

  @ApiProperty()
  goals: {
    revenueTarget: number;
    revenueActual: number;
    revenueProgress: number;
    meetingsTarget: number;
    meetingsActual: number;
    meetingsProgress: number;
    newClientsTarget: number;
    newClientsActual: number;
    newClientsProgress: number;
  };

  @ApiProperty()
  topClients: {
    householdId: string;
    householdName: string;
    aum: number;
    revenue: number;
    lastContact: Date;
  }[];

  @ApiProperty()
  upcomingMeetings: {
    id: string;
    title: string;
    householdName: string;
    startTime: Date;
    type: string;
  }[];

  @ApiProperty()
  alerts: {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    count?: number;
  }[];
}

export class ClientProfitabilityResponseDto {
  @ApiProperty()
  householdId: string;

  @ApiProperty()
  householdName: string;

  @ApiProperty()
  tier: string;

  @ApiProperty()
  aum: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty()
  netProfit: number;

  @ApiProperty()
  netMargin: number;

  @ApiProperty()
  revenuePerHour: number;

  @ApiProperty()
  profitPerHour: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  effectiveFeeRate: number;

  @ApiProperty()
  profitabilityScore: number;
}

export class FirmOverviewResponseDto {
  @ApiProperty()
  aum: {
    total: number;
    change: number;
    changePercent: number;
    netNewAssets: number;
    marketChange: number;
  };

  @ApiProperty()
  revenue: {
    mtd: number;
    ytd: number;
    projectedAnnual: number;
    changePercent: number;
  };

  @ApiProperty()
  clients: {
    total: number;
    new: number;
    lost: number;
    retentionRate: number;
    averageAum: number;
  };

  @ApiProperty()
  efficiency: {
    revenuePerAdvisor: number;
    aumPerAdvisor: number;
    householdsPerAdvisor: number;
    operatingMargin: number;
  };

  @ApiProperty()
  compliance: {
    overdueReviews: number;
    expiringKyc: number;
    openIssues: number;
  };
}
