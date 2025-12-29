import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum WorkflowTrigger {
  // Client Lifecycle
  NEW_CLIENT_ONBOARDING = 'new_client_onboarding',
  ANNUAL_REVIEW_DUE = 'annual_review_due',
  QUARTERLY_REVIEW_DUE = 'quarterly_review_due',
  CLIENT_BIRTHDAY = 'client_birthday',
  CLIENT_ANNIVERSARY = 'client_anniversary',
  
  // Account Events
  ACCOUNT_OPENED = 'account_opened',
  ACCOUNT_CLOSED = 'account_closed',
  LARGE_DEPOSIT = 'large_deposit',
  LARGE_WITHDRAWAL = 'large_withdrawal',
  
  // Compliance
  KYC_EXPIRING = 'kyc_expiring',
  DOCUMENT_EXPIRING = 'document_expiring',
  COMPLIANCE_REVIEW_DUE = 'compliance_review_due',
  
  // Pipeline
  NEW_PROSPECT = 'new_prospect',
  PROSPECT_STAGE_CHANGE = 'prospect_stage_change',
  PROSPECT_WON = 'prospect_won',
  
  // Manual
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('workflow_templates')
export class WorkflowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkflowTrigger,
  })
  trigger: WorkflowTrigger;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
  })
  status: WorkflowStatus;

  @Column({ name: 'trigger_conditions', type: 'jsonb', nullable: true })
  triggerConditions: Record<string, any>;

  @Column({ type: 'jsonb' })
  steps: WorkflowStep[];

  @Column({ name: 'estimated_duration_days', type: 'int', nullable: true })
  estimatedDurationDays: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'task' | 'email' | 'notification' | 'wait' | 'condition' | 'meeting';
  order: number;
  config: WorkflowStepConfig;
  dependsOn?: string[];
}

export interface WorkflowStepConfig {
  // For tasks
  taskTitle?: string;
  taskDescription?: string;
  taskCategory?: string;
  taskPriority?: string;
  assignTo?: 'advisor' | 'operations' | 'compliance' | 'specific_user';
  assignToUserId?: string;
  dueDaysFromStart?: number;
  dueDaysFromPrevious?: number;

  // For emails
  emailTemplate?: string;
  emailRecipient?: 'client' | 'advisor' | 'specific';
  emailRecipientAddress?: string;

  // For notifications
  notificationMessage?: string;
  notifyUsers?: string[];

  // For wait
  waitDays?: number;
  waitUntilDate?: string;
  waitForCondition?: string;

  // For conditions
  condition?: string;
  trueSteps?: string[];
  falseSteps?: string[];

  // For meetings
  meetingType?: string;
  meetingDuration?: number;
  meetingTitle?: string;
}

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  householdId: string;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  personId: string;

  @Column({ name: 'prospect_id', type: 'uuid', nullable: true })
  prospectId: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId: string;

  @Column({ default: 'running' })
  status: string;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep: number;

  @Column({ name: 'step_statuses', type: 'jsonb', default: '{}' })
  stepStatuses: Record<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
    startedAt?: string;
    completedAt?: string;
    taskId?: string;
    notes?: string;
  }>;

  @Column({ name: 'triggered_by', type: 'uuid', nullable: true })
  triggeredBy: string;

  @Column({ name: 'trigger_data', type: 'jsonb', nullable: true })
  triggerData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
