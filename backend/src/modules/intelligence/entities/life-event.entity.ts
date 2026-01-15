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
import { Person } from '../../persons/entities/person.entity';

// =============================================================================
// Enums
// =============================================================================

export enum LifeEventType {
  // Family Events
  MARRIAGE = 'marriage',
  DIVORCE = 'divorce',
  BIRTH_OF_CHILD = 'birth_of_child',
  DEATH_IN_FAMILY = 'death_in_family',
  CHILD_GRADUATION = 'child_graduation',
  CHILD_COLLEGE = 'child_college',

  // Career Events
  RETIREMENT = 'retirement',
  JOB_CHANGE = 'job_change',
  BUSINESS_SALE = 'business_sale',
  PROMOTION = 'promotion',

  // Financial Events
  INHERITANCE = 'inheritance',
  LARGE_WITHDRAWAL = 'large_withdrawal',
  LARGE_DEPOSIT = 'large_deposit',
  HOME_PURCHASE = 'home_purchase',
  HOME_SALE = 'home_sale',

  // Health Events
  MAJOR_ILLNESS = 'major_illness',
  DISABILITY = 'disability',
  LONG_TERM_CARE = 'long_term_care',

  // Milestone Events
  BIRTHDAY_MILESTONE = 'birthday_milestone',
  ACCOUNT_ANNIVERSARY = 'account_anniversary',
  AUM_MILESTONE = 'aum_milestone',

  // Planning Events
  ESTATE_PLAN_UPDATE = 'estate_plan_update',
  BENEFICIARY_CHANGE = 'beneficiary_change',
  RMD_APPROACHING = 'rmd_approaching',
}

export enum EventSource {
  DETECTED = 'detected',       // AI detected from patterns
  REPORTED = 'reported',       // Client reported
  ADVISOR_NOTED = 'advisor',   // Advisor entered
  SYSTEM = 'system',           // System generated (birthdays, anniversaries)
}

export enum EventImpact {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// =============================================================================
// Entity
// =============================================================================

@Entity('life_events')
@Index(['householdId', 'eventDate'])
@Index(['eventType', 'source'])
export class LifeEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ name: 'person_id', nullable: true })
  personId: string;

  @Column({
    type: 'enum',
    enum: LifeEventType,
    name: 'event_type',
  })
  eventType: LifeEventType;

  @Column({
    type: 'enum',
    enum: EventSource,
    default: EventSource.DETECTED,
  })
  source: EventSource;

  @Column({
    type: 'enum',
    enum: EventImpact,
    default: EventImpact.MEDIUM,
  })
  impact: EventImpact;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'event_date' })
  eventDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'text', array: true, nullable: true, name: 'recommended_actions' })
  recommendedActions: string[];

  @Column({ default: false, name: 'is_acknowledged' })
  isAcknowledged: boolean;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string;

  @Column({ name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'confidence_score' })
  confidenceScore: number;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
