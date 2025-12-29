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
} from 'typeorm';
import { Household } from '../../households/entities/household.entity';
import { Position } from './position.entity';

export enum AccountType {
  INDIVIDUAL = 'individual',
  JOINT = 'joint',
  TRUST = 'trust',
  IRA = 'ira',
  ROTH_IRA = 'roth_ira',
  FOUR_O_ONE_K = '401k',
  FIVE_TWO_NINE = '529',
  CUSTODIAL = 'custodial',
  CORPORATE = 'corporate',
}

export enum AccountStatus {
  PENDING = 'pending',
  OPEN = 'open',
  CLOSED = 'closed',
  RESTRICTED = 'restricted',
}

export enum ManagementStyle {
  DISCRETIONARY = 'discretionary',
  NON_DISCRETIONARY = 'non_discretionary',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_number', unique: true })
  accountNumber: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ name: 'owner_person_id', nullable: true })
  ownerPersonId: string;

  @Column({ name: 'owner_entity_id', nullable: true })
  ownerEntityId: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    name: 'account_type',
  })
  accountType: AccountType;

  @Column({ nullable: true })
  custodian: string;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING,
  })
  status: AccountStatus;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'current_value',
    default: 0,
  })
  currentValue: number;

  @Column({
    type: 'enum',
    enum: ManagementStyle,
    name: 'management_style',
    nullable: true,
  })
  managementStyle: ManagementStyle;

  @Column({ name: 'opened_date', nullable: true })
  openedDate: Date;

  @Column({ name: 'closed_date', nullable: true })
  closedDate: Date;

  @ManyToOne(() => Household, (household) => household.accounts)
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @OneToMany(() => Position, (position) => position.account)
  positions: Position[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
