import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Household } from '../../households/entities/household.entity';
import { Encrypted } from '../../../common/decorators/encrypted.decorator';

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'middle_name', nullable: true })
  middleName: string;

  @Column({ name: 'date_of_birth', nullable: true })
  @Encrypted()
  dateOfBirth: Date;

  @Column({ nullable: true })
  @Encrypted()
  email: string;

  @Column({ name: 'phone_primary', nullable: true })
  @Encrypted()
  phonePrimary: string;

  @Column({ type: 'text', nullable: true })
  @Encrypted()
  address: string;

  @Column({ name: 'ssn', type: 'text', nullable: true })
  @Encrypted()
  ssn: string;

  @Column({ name: 'is_primary_contact', default: false })
  isPrimaryContact: boolean;

  @Column({
    type: 'enum',
    enum: KycStatus,
    name: 'kyc_status',
    default: KycStatus.PENDING,
  })
  kycStatus: KycStatus;

  @ManyToOne(() => Household, (household) => household.persons)
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
