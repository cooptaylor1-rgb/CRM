import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// ==================== Enums ====================

export enum AssetClass {
  US_LARGE_CAP = 'us_large_cap',
  US_MID_CAP = 'us_mid_cap',
  US_SMALL_CAP = 'us_small_cap',
  INTERNATIONAL_DEVELOPED = 'international_developed',
  EMERGING_MARKETS = 'emerging_markets',
  US_BONDS = 'us_bonds',
  INTERNATIONAL_BONDS = 'international_bonds',
  HIGH_YIELD_BONDS = 'high_yield_bonds',
  TIPS = 'tips',
  CASH = 'cash',
  REAL_ESTATE = 'real_estate',
  COMMODITIES = 'commodities',
  ALTERNATIVES = 'alternatives',
  PRIVATE_EQUITY = 'private_equity',
  HEDGE_FUNDS = 'hedge_funds',
  OTHER = 'other',
}

export enum AllocationEntityType {
  HOUSEHOLD = 'household',
  ACCOUNT = 'account',
  PERSON = 'person',
}

export enum FeeType {
  AUM = 'aum',
  FLAT = 'flat',
  HOURLY = 'hourly',
  PERFORMANCE = 'performance',
  SUBSCRIPTION = 'subscription',
  TRANSACTION = 'transaction',
  OTHER = 'other',
}

export enum FeeFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
  ONE_TIME = 'one_time',
}

export enum BillingMethod {
  ADVANCE = 'advance',
  ARREARS = 'arrears',
}

// ==================== Target Asset Allocation ====================

@Entity('target_asset_allocations')
@Index(['entityType', 'entityId'])
@Index(['firmId'])
export class TargetAssetAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'firm_id' })
  firmId: string;

  @Column({
    type: 'enum',
    enum: AllocationEntityType,
    name: 'entity_type',
  })
  entityType: AllocationEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ name: 'review_date', type: 'date', nullable: true })
  reviewDate: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('AllocationLineItem', 'allocation')
  lineItems: AllocationLineItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== Allocation Line Items ====================

@Entity('allocation_line_items')
@Index(['allocationId'])
export class AllocationLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'allocation_id' })
  allocationId: string;

  @ManyToOne('TargetAssetAllocation', 'lineItems')
  @JoinColumn({ name: 'allocation_id' })
  allocation: TargetAssetAllocation;

  @Column({
    type: 'enum',
    enum: AssetClass,
    name: 'asset_class',
  })
  assetClass: AssetClass;

  @Column({ name: 'custom_asset_class', nullable: true })
  customAssetClass: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'target_percentage',
  })
  targetPercentage: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'min_percentage',
    nullable: true,
  })
  minPercentage: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'max_percentage',
    nullable: true,
  })
  maxPercentage: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== Fee Schedule ====================

@Entity('fee_schedules')
@Index(['entityType', 'entityId'])
@Index(['firmId'])
export class FeeSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'firm_id' })
  firmId: string;

  @Column({
    type: 'enum',
    enum: AllocationEntityType,
    name: 'entity_type',
  })
  entityType: AllocationEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: BillingMethod,
    name: 'billing_method',
    default: BillingMethod.ARREARS,
  })
  billingMethod: BillingMethod;

  @Column({ name: 'minimum_fee', type: 'decimal', precision: 12, scale: 2, nullable: true })
  minimumFee: number;

  @Column({ name: 'maximum_fee', type: 'decimal', precision: 12, scale: 2, nullable: true })
  maximumFee: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('FeeTier', 'feeSchedule')
  tiers: FeeTier[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== Fee Tier ====================

@Entity('fee_tiers')
@Index(['feeScheduleId'])
export class FeeTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fee_schedule_id' })
  feeScheduleId: string;

  @ManyToOne('FeeSchedule', 'tiers')
  @JoinColumn({ name: 'fee_schedule_id' })
  feeSchedule: FeeSchedule;

  @Column({
    type: 'enum',
    enum: FeeType,
    name: 'fee_type',
  })
  feeType: FeeType;

  @Column({
    type: 'enum',
    enum: FeeFrequency,
    name: 'fee_frequency',
  })
  feeFrequency: FeeFrequency;

  @Column({ name: 'tier_name', nullable: true })
  tierName: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'min_amount',
    default: 0,
  })
  minAmount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'max_amount',
    nullable: true,
  })
  maxAmount: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 4,
    name: 'rate',
  })
  rate: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'flat_amount',
    nullable: true,
  })
  flatAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ==================== Fee History (for tracking changes) ====================

@Entity('fee_history')
@Index(['feeScheduleId'])
@Index(['entityType', 'entityId'])
export class FeeHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fee_schedule_id', nullable: true })
  feeScheduleId: string;

  @Column({
    type: 'enum',
    enum: AllocationEntityType,
    name: 'entity_type',
  })
  entityType: AllocationEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'billing_period_start', type: 'date' })
  billingPeriodStart: Date;

  @Column({ name: 'billing_period_end', type: 'date' })
  billingPeriodEnd: Date;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'billable_amount',
  })
  billableAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'fee_amount',
  })
  feeAmount: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 4,
    name: 'effective_rate',
    nullable: true,
  })
  effectiveRate: number;

  @Column({ name: 'is_billed', default: false })
  isBilled: boolean;

  @Column({ name: 'billed_at', type: 'timestamp', nullable: true })
  billedAt: Date;

  @Column({ name: 'invoice_number', nullable: true })
  invoiceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
