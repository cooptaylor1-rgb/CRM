import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Household } from '../../households/entities/household.entity';

// =============================================================================
// Enums
// =============================================================================

export enum InsightType {
  RISK_ALERT = 'risk_alert',
  OPPORTUNITY = 'opportunity',
  LIFE_EVENT = 'life_event',
  PORTFOLIO_DRIFT = 'portfolio_drift',
  REBALANCING_NEEDED = 'rebalancing_needed',
  TAX_OPTIMIZATION = 'tax_optimization',
  FEE_REVIEW = 'fee_review',
  ENGAGEMENT_DROP = 'engagement_drop',
  MILESTONE = 'milestone',
  COMPLIANCE_REMINDER = 'compliance_reminder',
  MARKET_IMPACT = 'market_impact',
  ESTATE_PLANNING = 'estate_planning',
}

export enum InsightPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum InsightStatus {
  NEW = 'new',
  VIEWED = 'viewed',
  ACKNOWLEDGED = 'acknowledged',
  ACTIONED = 'actioned',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired',
}

// =============================================================================
// Entity
// =============================================================================

@Entity('client_insights')
@Index(['householdId', 'status'])
@Index(['type', 'priority'])
@Index(['createdAt'])
export class ClientInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({
    type: 'enum',
    enum: InsightType,
  })
  type: InsightType;

  @Column({
    type: 'enum',
    enum: InsightPriority,
    default: InsightPriority.MEDIUM,
  })
  priority: InsightPriority;

  @Column({
    type: 'enum',
    enum: InsightStatus,
    default: InsightStatus.NEW,
  })
  status: InsightStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown>;

  @Column({ type: 'text', nullable: true, name: 'recommended_action' })
  recommendedAction: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'confidence_score' })
  confidenceScore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'potential_impact' })
  potentialImpact: number;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'actioned_at', nullable: true })
  actionedAt: Date;

  @Column({ name: 'actioned_by', type: 'uuid', nullable: true })
  actionedBy: string;

  @Column({ type: 'text', nullable: true, name: 'action_notes' })
  actionNotes: string;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
