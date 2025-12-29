import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum RelationshipType {
  // Professional Advisors
  CPA = 'cpa',
  TAX_ATTORNEY = 'tax_attorney',
  ESTATE_ATTORNEY = 'estate_attorney',
  BUSINESS_ATTORNEY = 'business_attorney',
  INSURANCE_AGENT = 'insurance_agent',
  MORTGAGE_BROKER = 'mortgage_broker',
  REAL_ESTATE_AGENT = 'real_estate_agent',
  BANKER = 'banker',
  
  // Other Financial
  OTHER_FINANCIAL_ADVISOR = 'other_financial_advisor',
  TRUSTEE = 'trustee',
  EXECUTOR = 'executor',
  
  // Personal
  FAMILY_MEMBER = 'family_member',
  BUSINESS_PARTNER = 'business_partner',
  EMPLOYER = 'employer',
  
  // Referral Sources
  CENTER_OF_INFLUENCE = 'center_of_influence',
  REFERRAL_SOURCE = 'referral_source',
  
  OTHER = 'other',
}

export enum RelationshipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FORMER = 'former',
}

@Entity('client_relationships')
export class ClientRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id', type: 'uuid' })
  householdId: string;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  personId: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    name: 'relationship_type',
  })
  relationshipType: RelationshipType;

  // Contact Information
  @Column({ name: 'contact_name' })
  contactName: string;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'mobile_phone', nullable: true })
  mobilePhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  // Relationship Details
  @Column({
    type: 'enum',
    enum: RelationshipStatus,
    default: RelationshipStatus.ACTIVE,
  })
  status: RelationshipStatus;

  @Column({ name: 'relationship_since', type: 'date', nullable: true })
  relationshipSince: Date;

  @Column({ name: 'introduced_by', nullable: true })
  introducedBy: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'has_release_on_file', default: false })
  hasReleaseOnFile: boolean;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: Date;

  @Column({ name: 'release_expiration', type: 'date', nullable: true })
  releaseExpiration: Date;

  // Collaboration
  @Column({ name: 'collaboration_notes', type: 'text', nullable: true })
  collaborationNotes: string;

  @Column({ name: 'last_contact_date', type: 'timestamp', nullable: true })
  lastContactDate: Date;

  @Column({ name: 'meeting_frequency', nullable: true })
  meetingFrequency: string;

  // Quality/Trust
  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ name: 'would_recommend', default: true })
  wouldRecommend: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}
