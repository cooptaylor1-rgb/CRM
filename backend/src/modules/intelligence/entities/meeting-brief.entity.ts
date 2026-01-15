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
// Types
// =============================================================================

export interface BriefSection {
  title: string;
  content: string;
  priority: number;
  type: 'summary' | 'detail' | 'action' | 'warning' | 'opportunity';
}

export interface PortfolioSnapshot {
  totalAum: number;
  ytdReturn: number;
  inceptionReturn: number;
  assetAllocation: { name: string; percentage: number; value: number }[];
  topHoldings: { symbol: string; name: string; value: number; weight: number }[];
  recentActivity: { date: Date; type: string; description: string }[];
}

export interface ClientProfile {
  householdName: string;
  primaryContact: string;
  relationshipLength: string;
  riskTolerance: string;
  investmentObjective: string;
  lastMeetingDate: Date | null;
  communicationPreference: string;
}

export interface TalkingPoint {
  topic: string;
  context: string;
  suggestedApproach: string;
  priority: 'must_discuss' | 'should_discuss' | 'optional';
}

export interface ActionItem {
  item: string;
  dueDate: Date | null;
  assignee: string | null;
  status: 'pending' | 'in_progress' | 'completed';
}

// =============================================================================
// Entity
// =============================================================================

@Entity('meeting_briefs')
@Index(['householdId', 'meetingDate'])
@Index(['generatedAt'])
export class MeetingBrief {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ name: 'meeting_id', nullable: true })
  meetingId: string;

  @Column({ name: 'meeting_date' })
  meetingDate: Date;

  @Column({ name: 'meeting_type', nullable: true })
  meetingType: string;

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'jsonb', name: 'client_profile' })
  clientProfile: ClientProfile;

  @Column({ type: 'jsonb', name: 'portfolio_snapshot' })
  portfolioSnapshot: PortfolioSnapshot;

  @Column({ type: 'jsonb', name: 'talking_points' })
  talkingPoints: TalkingPoint[];

  @Column({ type: 'jsonb' })
  sections: BriefSection[];

  @Column({ type: 'jsonb', name: 'action_items' })
  actionItems: ActionItem[];

  @Column({ type: 'text', array: true, nullable: true })
  warnings: string[];

  @Column({ type: 'text', array: true, nullable: true })
  opportunities: string[];

  @Column({ type: 'text', nullable: true, name: 'executive_summary' })
  executiveSummary: string;

  @Column({ name: 'generated_at' })
  generatedAt: Date;

  @Column({ name: 'generated_by', nullable: true })
  generatedBy: string;

  @Column({ default: false, name: 'is_viewed' })
  isViewed: boolean;

  @Column({ name: 'viewed_at', nullable: true })
  viewedAt: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'advisor_notes' })
  advisorNotes: { note: string; addedAt: Date; addedBy: string }[];

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
