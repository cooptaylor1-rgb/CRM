import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskCategory {
  CLIENT_ONBOARDING = 'client_onboarding',
  ANNUAL_REVIEW = 'annual_review',
  COMPLIANCE = 'compliance',
  DOCUMENT_REQUEST = 'document_request',
  FOLLOW_UP = 'follow_up',
  MEETING_PREP = 'meeting_prep',
  TRADING = 'trading',
  BILLING = 'billing',
  KYC_VERIFICATION = 'kyc_verification',
  OTHER = 'other',
}

@Entity('tasks')
@Index(['assignedTo'])
@Index(['status'])
@Index(['dueDate'])
@Index(['householdId'])
@Index(['priority'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskCategory,
    default: TaskCategory.OTHER,
  })
  category: TaskCategory;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy: string;

  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  householdId: string;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  personId: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId: string;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'completed_by', type: 'uuid', nullable: true })
  completedBy: string;

  @Column({ name: 'parent_task_id', type: 'uuid', nullable: true })
  parentTaskId: string;

  @Column({ name: 'workflow_id', type: 'uuid', nullable: true })
  workflowId: string;

  @Column({ name: 'workflow_step', type: 'int', nullable: true })
  workflowStep: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'reminder_at', type: 'timestamp', nullable: true })
  reminderAt: Date;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
  estimatedMinutes: number;

  @Column({ name: 'actual_minutes', type: 'int', nullable: true })
  actualMinutes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}
