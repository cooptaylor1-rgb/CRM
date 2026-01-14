import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Household } from '../../households/entities/household.entity';

// =============================================================================
// Types
// =============================================================================

export interface RiskFactorScore {
  factor: string;
  score: number;        // 0-100
  weight: number;       // Contribution to overall score
  trend: 'improving' | 'stable' | 'declining';
  details: string;
}

export interface RiskCategory {
  category: string;
  score: number;
  factors: RiskFactorScore[];
}

// =============================================================================
// Enums
// =============================================================================

export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

// =============================================================================
// Entity
// =============================================================================

@Entity('risk_scores')
@Index(['householdId', 'calculatedAt'])
@Index(['overallScore'])
export class RiskScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  // Overall composite score (0-100, lower is better)
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'overall_score' })
  overallScore: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    name: 'risk_level',
  })
  riskLevel: RiskLevel;

  // Attrition Risk (0-100) - likelihood of leaving
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'attrition_score' })
  attritionScore: number;

  // Compliance Risk (0-100)
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'compliance_score' })
  complianceScore: number;

  // Portfolio Risk (0-100) - misalignment with objectives
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'portfolio_score' })
  portfolioScore: number;

  // Engagement Score (0-100, higher is better) - stored inverted for consistency
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'engagement_score' })
  engagementScore: number;

  // Detailed breakdown by category
  @Column({ type: 'jsonb', name: 'risk_categories' })
  riskCategories: RiskCategory[];

  // Key risk factors identified
  @Column({ type: 'text', array: true, name: 'key_factors' })
  keyFactors: string[];

  // Recommended actions to reduce risk
  @Column({ type: 'text', array: true, name: 'recommendations' })
  recommendations: string[];

  // Trend compared to previous score
  @Column({ name: 'trend_direction', nullable: true })
  trendDirection: 'improving' | 'stable' | 'declining';

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'score_change' })
  scoreChange: number;

  @Column({ name: 'calculated_at' })
  calculatedAt: Date;

  @Column({ name: 'next_calculation_at', nullable: true })
  nextCalculationAt: Date;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
