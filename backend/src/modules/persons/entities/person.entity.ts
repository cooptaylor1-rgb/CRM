import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Household } from '../../households/entities/household.entity';
import { encryptedTransformer } from '../../../common/transformers/encrypted.transformer';

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

@Entity('persons')
@Index(['householdId'])
@Index(['lastName'])
@Index(['kycStatus'])
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

  @Column({ name: 'date_of_birth', type: 'text', nullable: true, transformer: encryptedTransformer })
  dateOfBirth: string;

  @Column({ type: 'text', nullable: true, transformer: encryptedTransformer })
  email: string;

  @Column({ name: 'phone_primary', type: 'text', nullable: true, transformer: encryptedTransformer })
  phonePrimary: string;

  @Column({ type: 'text', nullable: true, transformer: encryptedTransformer })
  address: string;

  @Column({ name: 'ssn', type: 'text', nullable: true, transformer: encryptedTransformer })
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
