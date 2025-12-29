import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Person } from '../../persons/entities/person.entity';
import { Account } from '../../accounts/entities/account.entity';

export enum HouseholdStatus {
  PROSPECT = 'prospect',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export enum InvestmentObjective {
  PRESERVATION = 'preservation',
  INCOME = 'income',
  GROWTH = 'growth',
  SPECULATION = 'speculation',
}

@Entity('households')
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'primary_contact_person_id', nullable: true })
  primaryContactPersonId: string;

  @Column({ name: 'advisor_id', nullable: true })
  advisorId: string;

  @Column({
    type: 'enum',
    enum: RiskTolerance,
    name: 'risk_tolerance',
    nullable: true,
  })
  riskTolerance: RiskTolerance;

  @Column({
    type: 'enum',
    enum: InvestmentObjective,
    name: 'investment_objective',
    nullable: true,
  })
  investmentObjective: InvestmentObjective;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_aum',
    default: 0,
  })
  totalAum: number;

  @Column({
    type: 'enum',
    enum: HouseholdStatus,
    default: HouseholdStatus.PROSPECT,
  })
  status: HouseholdStatus;

  @Column({ name: 'onboarding_date', nullable: true })
  onboardingDate: Date;

  @Column({ name: 'last_review_date', nullable: true })
  lastReviewDate: Date;

  @Column({ name: 'next_review_date', nullable: true })
  nextReviewDate: Date;

  @OneToMany(() => Person, (person) => person.household)
  persons: Person[];

  @OneToMany(() => Account, (account) => account.household)
  accounts: Account[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
