import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum PipelineStage {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  MEETING_SCHEDULED = 'meeting_scheduled',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadSource {
  REFERRAL = 'referral',
  WEBSITE = 'website',
  EVENT = 'event',
  COLD_OUTREACH = 'cold_outreach',
  LINKEDIN = 'linkedin',
  EXISTING_CLIENT = 'existing_client',
  CENTER_OF_INFLUENCE = 'center_of_influence',
  OTHER = 'other',
}

export enum LostReason {
  PRICE = 'price',
  COMPETITOR = 'competitor',
  TIMING = 'timing',
  NO_RESPONSE = 'no_response',
  NOT_QUALIFIED = 'not_qualified',
  SERVICE_FIT = 'service_fit',
  OTHER = 'other',
}

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle: string;

  @Column({
    type: 'enum',
    enum: PipelineStage,
    default: PipelineStage.LEAD,
  })
  stage: PipelineStage;

  @Column({
    type: 'enum',
    enum: LeadSource,
    default: LeadSource.OTHER,
    name: 'lead_source',
  })
  leadSource: LeadSource;

  @Column({ name: 'referral_source', nullable: true })
  referralSource: string;

  @Column({ name: 'referrer_id', type: 'uuid', nullable: true })
  referrerId: string;

  @Column({ name: 'estimated_aum', type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedAum: number;

  @Column({ type: 'int', default: 50, name: 'probability_percent' })
  probabilityPercent: number;

  @Column({ name: 'expected_revenue', type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedRevenue: number;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate: Date;

  @Column({ name: 'assigned_advisor_id', type: 'uuid', nullable: true })
  assignedAdvisorId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: LostReason,
    nullable: true,
    name: 'lost_reason',
  })
  lostReason: LostReason;

  @Column({ name: 'lost_notes', type: 'text', nullable: true })
  lostNotes: string;

  @Column({ name: 'lost_to_competitor', nullable: true })
  lostToCompetitor: string;

  @Column({ name: 'won_date', type: 'timestamp', nullable: true })
  wonDate: Date;

  @Column({ name: 'lost_date', type: 'timestamp', nullable: true })
  lostDate: Date;

  @Column({ name: 'converted_household_id', type: 'uuid', nullable: true })
  convertedHouseholdId: string;

  @Column({ name: 'last_contact_date', type: 'timestamp', nullable: true })
  lastContactDate: Date;

  @Column({ name: 'next_follow_up_date', type: 'date', nullable: true })
  nextFollowUpDate: Date;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}

@Entity('prospect_activities')
export class ProspectActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prospect_id', type: 'uuid' })
  prospectId: string;

  @Column({
    type: 'enum',
    enum: ['call', 'email', 'meeting', 'note', 'stage_change', 'document_sent'],
    name: 'activity_type',
  })
  activityType: string;

  @Column()
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'old_stage', nullable: true })
  oldStage: string;

  @Column({ name: 'new_stage', nullable: true })
  newStage: string;

  @Column({ name: 'performed_by', type: 'uuid' })
  performedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
