import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EntityType {
  TRUST = 'trust',
  CORPORATION = 'corporation',
  LLC = 'llc',
  PARTNERSHIP = 'partnership',
  FOUNDATION = 'foundation',
  ESTATE = 'estate',
}

@Entity('legal_entities')
export class LegalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id', nullable: true })
  householdId: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    name: 'entity_type',
  })
  entityType: EntityType;

  @Column({ name: 'legal_name' })
  legalName: string;

  @Column({ name: 'state_of_formation', nullable: true })
  stateOfFormation: string;

  @Column({ name: 'formation_date', nullable: true })
  formationDate: Date;

  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
