import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

// ==================== Client Profitability ====================

@Entity('client_profitability')
@Index(['householdId', 'periodStart', 'periodEnd'])
export class ClientProfitability extends BaseEntity {
  @Column({ type: 'uuid' })
  householdId: string;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'varchar', default: 'monthly' })
  periodType: 'monthly' | 'quarterly' | 'annual';

  // Revenue
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  managementFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  advisoryFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  planningFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  performanceFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  // Time & Cost Allocation
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  advisorHours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  operationsHours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  complianceHours: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  directLaborCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  technologyCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  custodianCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  marketingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  overheadAllocation: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  // Profitability Metrics
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  grossProfit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netProfit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  grossMargin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  netMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenuePerHour: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  profitPerHour: number;

  // Client Value Metrics
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  aum: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  effectiveFeeRate: number;

  @Column({ type: 'int', default: 0 })
  meetingsCount: number;

  @Column({ type: 'int', default: 0 })
  emailCount: number;

  @Column({ type: 'int', default: 0 })
  tasksCount: number;

  @Column({ type: 'int', default: 0 })
  documentsGenerated: number;

  // Scoring
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  profitabilityScore?: number;

  @Column({ type: 'varchar', nullable: true })
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze';

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}

// ==================== Advisor Metrics ====================

@Entity('advisor_metrics')
@Index(['advisorId', 'periodStart', 'periodEnd'])
export class AdvisorMetrics extends BaseEntity {
  @Column({ type: 'uuid' })
  advisorId: string;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'varchar', default: 'monthly' })
  periodType: 'monthly' | 'quarterly' | 'annual';

  // Book of Business
  @Column({ type: 'int', default: 0 })
  totalHouseholds: number;

  @Column({ type: 'int', default: 0 })
  newHouseholds: number;

  @Column({ type: 'int', default: 0 })
  lostHouseholds: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAum: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netNewAssets: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  marketChange: number;

  // Revenue
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  managementFeeRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  planningFeeRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherRevenue: number;

  // Activity Metrics
  @Column({ type: 'int', default: 0 })
  meetingsCompleted: number;

  @Column({ type: 'int', default: 0 })
  reviewMeetings: number;

  @Column({ type: 'int', default: 0 })
  prospectMeetings: number;

  @Column({ type: 'int', default: 0 })
  tasksCompleted: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  clientFacingHours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  adminHours: number;

  @Column({ type: 'int', default: 0 })
  emailsSent: number;

  @Column({ type: 'int', default: 0 })
  emailsReceived: number;

  // Pipeline
  @Column({ type: 'int', default: 0 })
  prospectsAdded: number;

  @Column({ type: 'int', default: 0 })
  prospectsConverted: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  pipelineValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversionRate: number;

  // Quality Metrics
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  clientSatisfactionScore?: number;

  @Column({ type: 'int', default: 0 })
  complianceIssues: number;

  @Column({ type: 'int', default: 0 })
  overdueReviews: number;

  @Column({ type: 'int', default: 0 })
  overdueKyc: number;

  // Scoring
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  performanceScore?: number;

  @Column({ type: 'jsonb', default: {} })
  goals: {
    revenueTarget?: number;
    meetingsTarget?: number;
    newClientsTarget?: number;
    aumTarget?: number;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}

// ==================== Firm Metrics ====================

@Entity('firm_metrics')
@Index(['periodStart', 'periodEnd'])
export class FirmMetrics extends BaseEntity {
  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'varchar', default: 'monthly' })
  periodType: 'monthly' | 'quarterly' | 'annual';

  // AUM
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAum: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  beginningAum: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netNewAssets: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  marketChange: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  withdrawals: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  contributions: number;

  // Revenue
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  managementFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  advisoryFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  planningFees: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherRevenue: number;

  // Clients
  @Column({ type: 'int', default: 0 })
  totalHouseholds: number;

  @Column({ type: 'int', default: 0 })
  newHouseholds: number;

  @Column({ type: 'int', default: 0 })
  lostHouseholds: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  retentionRate: number;

  // Key Ratios
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  averageHouseholdAum: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  averageRevenuePerHousehold: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  blendedFeeRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  operatingMargin: number;

  // Staff
  @Column({ type: 'int', default: 0 })
  totalAdvisors: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  revenuePerAdvisor: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  aumPerAdvisor: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  householdsPerAdvisor: number;

  // Compliance
  @Column({ type: 'int', default: 0 })
  complianceIssues: number;

  @Column({ type: 'int', default: 0 })
  overdueReviews: number;

  @Column({ type: 'int', default: 0 })
  kycCompliance: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}

// ==================== Activity Snapshots ====================

@Entity('activity_snapshots')
@Index(['userId', 'snapshotDate'])
export class ActivitySnapshot extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'date' })
  snapshotDate: Date;

  @Column({ type: 'varchar', default: 'daily' })
  snapshotType: 'daily' | 'weekly';

  // Tasks
  @Column({ type: 'int', default: 0 })
  tasksCreated: number;

  @Column({ type: 'int', default: 0 })
  tasksCompleted: number;

  @Column({ type: 'int', default: 0 })
  tasksOverdue: number;

  // Meetings
  @Column({ type: 'int', default: 0 })
  meetingsScheduled: number;

  @Column({ type: 'int', default: 0 })
  meetingsCompleted: number;

  @Column({ type: 'int', default: 0 })
  meetingsCancelled: number;

  // Communications
  @Column({ type: 'int', default: 0 })
  emailsSent: number;

  @Column({ type: 'int', default: 0 })
  emailsReceived: number;

  @Column({ type: 'int', default: 0 })
  callsLogged: number;

  // Documents
  @Column({ type: 'int', default: 0 })
  documentsUploaded: number;

  @Column({ type: 'int', default: 0 })
  documentsGenerated: number;

  // Pipeline
  @Column({ type: 'int', default: 0 })
  prospectsAdded: number;

  @Column({ type: 'int', default: 0 })
  prospectsAdvanced: number;

  @Column({ type: 'int', default: 0 })
  prospectsConverted: number;

  @Column({ type: 'int', default: 0 })
  prospectsLost: number;

  // Workflows
  @Column({ type: 'int', default: 0 })
  workflowsStarted: number;

  @Column({ type: 'int', default: 0 })
  workflowsCompleted: number;

  @Column({ type: 'int', default: 0 })
  workflowStepsCompleted: number;

  @Column({ type: 'jsonb', default: {} })
  additionalMetrics: Record<string, any>;
}
