import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum MoneyMovementType {
  WIRE = 'wire',
  ACH = 'ach',
  JOURNAL = 'journal',
  DISTRIBUTION = 'distribution',
  OTHER = 'other',
}

export enum MoneyMovementStatus {
  REQUESTED = 'requested',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  INITIATED = 'initiated',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('money_movement_requests')
export class MoneyMovementRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  householdId?: string;

  @Column({ type: 'uuid', nullable: true })
  personId?: string;

  @Column({ type: 'uuid', nullable: true })
  accountId?: string;

  @Column({ type: 'enum', enum: MoneyMovementType, default: MoneyMovementType.OTHER })
  type: MoneyMovementType;

  @Column({ type: 'numeric', nullable: true })
  amount?: number;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @Column({ type: 'date', nullable: true })
  neededByDate?: string;

  @Column({ type: 'enum', enum: MoneyMovementStatus, default: MoneyMovementStatus.REQUESTED })
  status: MoneyMovementStatus;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // A lightweight checklist model for now; later we can normalize into steps + evidence.
  @Column({ type: 'jsonb', nullable: true })
  checklist?: any;

  // Tracks generated artifacts (package PDF, pre-filled Schwab forms, etc.)
  @Column({ type: 'jsonb', nullable: true })
  initiationArtifacts?: any;

  // Idempotency key for initiation. Used to safely handle retries.
  @Column({ type: 'text', nullable: true })
  initiationIdempotencyKey?: string;

  @Column({ type: 'uuid', nullable: true })
  requestedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  initiatedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  initiatedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;
}
