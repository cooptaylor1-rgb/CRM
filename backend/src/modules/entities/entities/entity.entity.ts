import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

export enum EntityType {
  TRUST = 'trust',
  CORPORATION = 'corporation',
  LLC = 'llc',
  PARTNERSHIP = 'partnership',
  FOUNDATION = 'foundation',
  ESTATE = 'estate',
  FLP = 'flp', // Family Limited Partnership
  GRAT = 'grat', // Grantor Retained Annuity Trust
  QPRT = 'qprt', // Qualified Personal Residence Trust
  ILIT = 'ilit', // Irrevocable Life Insurance Trust
  CRT = 'crt', // Charitable Remainder Trust
  DAF = 'daf', // Donor Advised Fund
  PRIVATE_FOUNDATION = 'private_foundation',
}

export enum TrustType {
  REVOCABLE = 'revocable',
  IRREVOCABLE = 'irrevocable',
  LIVING = 'living',
  TESTAMENTARY = 'testamentary',
  CHARITABLE = 'charitable',
  SPECIAL_NEEDS = 'special_needs',
  SPENDTHRIFT = 'spendthrift',
  GENERATION_SKIPPING = 'generation_skipping',
  GRANTOR = 'grantor',
  NON_GRANTOR = 'non_grantor',
}

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISSOLVED = 'dissolved',
  TERMINATED = 'terminated',
  PENDING = 'pending',
}

export enum EntityRole {
  GRANTOR = 'grantor',
  TRUSTEE = 'trustee',
  CO_TRUSTEE = 'co_trustee',
  SUCCESSOR_TRUSTEE = 'successor_trustee',
  BENEFICIARY = 'beneficiary',
  REMAINDER_BENEFICIARY = 'remainder_beneficiary',
  INCOME_BENEFICIARY = 'income_beneficiary',
  PROTECTOR = 'protector',
  MANAGER = 'manager',
  MEMBER = 'member',
  GENERAL_PARTNER = 'general_partner',
  LIMITED_PARTNER = 'limited_partner',
  SHAREHOLDER = 'shareholder',
  OFFICER = 'officer',
  DIRECTOR = 'director',
  REGISTERED_AGENT = 'registered_agent',
}

@Entity('legal_entities')
@Index(['householdId'])
@Index(['firmId', 'entityType'])
@Index(['status'])
export class LegalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'firm_id', nullable: true })
  @Index()
  firmId: string;

  @Column({ name: 'household_id', nullable: true })
  householdId: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    name: 'entity_type',
  })
  entityType: EntityType;

  @Column({
    type: 'enum',
    enum: TrustType,
    name: 'trust_type',
    nullable: true,
  })
  trustType: TrustType;

  @Column({ name: 'legal_name' })
  legalName: string;

  @Column({ name: 'short_name', nullable: true })
  shortName: string;

  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  @Column({ name: 'tax_id_type', nullable: true })
  taxIdType: string; // EIN, SSN, etc.

  // Formation details
  @Column({ name: 'state_of_formation', nullable: true })
  stateOfFormation: string;

  @Column({ name: 'country_of_formation', default: 'US' })
  countryOfFormation: string;

  @Column({ name: 'formation_date', type: 'date', nullable: true })
  formationDate: Date;

  @Column({ name: 'fiscal_year_end', nullable: true })
  fiscalYearEnd: string; // MM-DD format

  @Column({
    type: 'enum',
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  status: EntityStatus;

  // Trust-specific fields
  @Column({ name: 'trust_date', type: 'date', nullable: true })
  trustDate: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate: Date;

  @Column({ name: 'termination_condition', type: 'text', nullable: true })
  terminationCondition: string;

  @Column({ name: 'distribution_standard', nullable: true })
  distributionStandard: string; // HEMS, discretionary, etc.

  @Column({ name: 'situs_state', nullable: true })
  situsState: string;

  @Column({ name: 'governing_law', nullable: true })
  governingLaw: string;

  @Column({ name: 'is_grantor_trust', default: false })
  isGrantorTrust: boolean;

  @Column({ name: 'gst_exempt', default: false })
  gstExempt: boolean;

  @Column({ name: 'pour_over_will', default: false })
  pourOverWill: boolean;

  // LLC-specific fields
  @Column({ name: 'operating_agreement_date', type: 'date', nullable: true })
  operatingAgreementDate: Date;

  @Column({ name: 'tax_classification', nullable: true })
  taxClassification: string; // disregarded, partnership, s-corp, c-corp

  @Column({ name: 'registered_agent_name', nullable: true })
  registeredAgentName: string;

  @Column({ name: 'registered_agent_address', type: 'text', nullable: true })
  registeredAgentAddress: string;

  @Column({ name: 'principal_office_address', type: 'text', nullable: true })
  principalOfficeAddress: string;

  // Valuation
  @Column({ name: 'estimated_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  estimatedValue: number;

  @Column({ name: 'valuation_date', type: 'date', nullable: true })
  valuationDate: Date;

  @Column({ name: 'valuation_method', nullable: true })
  valuationMethod: string;

  // Compliance
  @Column({ name: 'annual_report_due', nullable: true })
  annualReportDue: string; // MM-DD

  @Column({ name: 'last_annual_report_date', type: 'date', nullable: true })
  lastAnnualReportDate: Date;

  @Column({ name: 'last_k1_date', type: 'date', nullable: true })
  lastK1Date: Date;

  @Column({ name: 'requires_1099', default: false })
  requires1099: boolean;

  // Attorney/accountant info
  @Column({ name: 'attorney_name', nullable: true })
  attorneyName: string;

  @Column({ name: 'attorney_firm', nullable: true })
  attorneyFirm: string;

  @Column({ name: 'attorney_contact', nullable: true })
  attorneyContact: string;

  @Column({ name: 'accountant_name', nullable: true })
  accountantName: string;

  @Column({ name: 'accountant_firm', nullable: true })
  accountantFirm: string;

  @Column({ name: 'accountant_contact', nullable: true })
  accountantContact: string;

  // Document references
  @Column({ name: 'primary_document_id', nullable: true })
  primaryDocumentId: string;

  @Column({ name: 'amendment_ids', type: 'jsonb', default: '[]' })
  amendmentIds: string[];

  // Metadata
  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @OneToMany(() => EntityRelationship, rel => rel.entity)
  relationships: EntityRelationship[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}

// Entity relationship to people (trustees, beneficiaries, etc.)
@Entity('entity_relationships')
@Index(['entityId'])
@Index(['personId'])
@Index(['role'])
export class EntityRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @ManyToOne(() => LegalEntity, entity => entity.relationships)
  @JoinColumn({ name: 'entity_id' })
  entity: LegalEntity;

  @Column({ name: 'person_id', nullable: true })
  personId: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({
    type: 'enum',
    enum: EntityRole,
  })
  role: EntityRole;

  @Column({ name: 'role_title', nullable: true })
  roleTitle: string; // Custom title like "Primary Trustee"

  @Column({ name: 'ownership_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  ownershipPercentage: number;

  @Column({ name: 'distribution_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  distributionPercentage: number;

  @Column({ name: 'capital_contribution', type: 'decimal', precision: 18, scale: 2, nullable: true })
  capitalContribution: number;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'succession_order', nullable: true })
  successionOrder: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: '{}' })
  permissions: Record<string, boolean>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// Entity distribution/income tracking
@Entity('entity_distributions')
@Index(['entityId'])
@Index(['beneficiaryId'])
@Index(['distributionDate'])
export class EntityDistribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'beneficiary_id', nullable: true })
  beneficiaryId: string;

  @Column({ name: 'beneficiary_entity_id', nullable: true })
  beneficiaryEntityId: string;

  @Column({ name: 'distribution_date', type: 'date' })
  distributionDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'distribution_type', default: 'income' })
  distributionType: string; // income, principal, mandatory, discretionary

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: string; // Source account

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'document_id', nullable: true })
  documentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// Entity document tracking
@Entity('entity_documents')
@Index(['entityId'])
@Index(['documentType'])
export class EntityDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'document_id' })
  documentId: string;

  @Column({ name: 'document_type' })
  documentType: string; // trust_agreement, amendment, k1, annual_report, etc.

  @Column({ name: 'document_date', type: 'date', nullable: true })
  documentDate: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
