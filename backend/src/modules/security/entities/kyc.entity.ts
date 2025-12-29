import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KycStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ENHANCED_DUE_DILIGENCE = 'enhanced_due_diligence',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PROHIBITED = 'prohibited',
}

export enum VerificationType {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  INCOME = 'income',
  SOURCE_OF_FUNDS = 'source_of_funds',
  BENEFICIAL_OWNERSHIP = 'beneficial_ownership',
  PEP_SCREENING = 'pep_screening',
  SANCTIONS_SCREENING = 'sanctions_screening',
  ADVERSE_MEDIA = 'adverse_media',
}

@Entity('kyc_verifications')
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  householdId: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NOT_STARTED,
  })
  status: KycStatus;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    name: 'risk_level',
    default: RiskLevel.LOW,
  })
  riskLevel: RiskLevel;

  @Column({ name: 'risk_score', type: 'int', nullable: true })
  riskScore: number;

  @Column({ name: 'risk_factors', type: 'text', array: true, default: '{}' })
  riskFactors: string[];

  // Identity Verification
  @Column({ name: 'identity_verified', default: false })
  identityVerified: boolean;

  @Column({ name: 'identity_verified_date', type: 'timestamp', nullable: true })
  identityVerifiedDate: Date;

  @Column({ name: 'identity_document_type', nullable: true })
  identityDocumentType: string;

  @Column({ name: 'identity_document_number', nullable: true })
  identityDocumentNumber: string;

  @Column({ name: 'identity_document_expiry', type: 'date', nullable: true })
  identityDocumentExpiry: Date;

  // Address Verification
  @Column({ name: 'address_verified', default: false })
  addressVerified: boolean;

  @Column({ name: 'address_verified_date', type: 'timestamp', nullable: true })
  addressVerifiedDate: Date;

  @Column({ name: 'address_verification_method', nullable: true })
  addressVerificationMethod: string;

  // PEP & Sanctions
  @Column({ name: 'is_pep', default: false })
  isPep: boolean;

  @Column({ name: 'pep_type', nullable: true })
  pepType: string;

  @Column({ name: 'pep_country', nullable: true })
  pepCountry: string;

  @Column({ name: 'pep_position', nullable: true })
  pepPosition: string;

  @Column({ name: 'pep_check_date', type: 'timestamp', nullable: true })
  pepCheckDate: Date;

  @Column({ name: 'sanctions_check_passed', default: true })
  sanctionsCheckPassed: boolean;

  @Column({ name: 'sanctions_check_date', type: 'timestamp', nullable: true })
  sanctionsCheckDate: Date;

  @Column({ name: 'sanctions_lists_checked', type: 'text', array: true, default: '{}' })
  sanctionsListsChecked: string[];

  @Column({ name: 'sanctions_hits', type: 'jsonb', nullable: true })
  sanctionsHits: { list: string; matchType: string; details: string }[];

  // Adverse Media
  @Column({ name: 'adverse_media_check_date', type: 'timestamp', nullable: true })
  adverseMediaCheckDate: Date;

  @Column({ name: 'adverse_media_found', default: false })
  adverseMediaFound: boolean;

  @Column({ name: 'adverse_media_details', type: 'text', nullable: true })
  adverseMediaDetails: string;

  // Source of Funds/Wealth
  @Column({ name: 'source_of_funds_verified', default: false })
  sourceOfFundsVerified: boolean;

  @Column({ name: 'source_of_funds', nullable: true })
  sourceOfFunds: string;

  @Column({ name: 'source_of_wealth', nullable: true })
  sourceOfWealth: string;

  @Column({ name: 'expected_activity', type: 'text', nullable: true })
  expectedActivity: string;

  // Accredited/Qualified Status
  @Column({ name: 'accredited_investor', default: false })
  accreditedInvestor: boolean;

  @Column({ name: 'accredited_verification_date', type: 'timestamp', nullable: true })
  accreditedVerificationDate: Date;

  @Column({ name: 'accredited_verification_method', nullable: true })
  accreditedVerificationMethod: string;

  @Column({ name: 'qualified_client', default: false })
  qualifiedClient: boolean;

  @Column({ name: 'qualified_purchaser', default: false })
  qualifiedPurchaser: boolean;

  // Review & Approval
  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  // Ongoing Monitoring
  @Column({ name: 'next_review_date', type: 'date', nullable: true })
  nextReviewDate: Date;

  @Column({ name: 'review_frequency_months', type: 'int', default: 12 })
  reviewFrequencyMonths: number;

  @Column({ name: 'last_periodic_review', type: 'timestamp', nullable: true })
  lastPeriodicReview: Date;

  // Documentation
  @Column({ name: 'supporting_documents', type: 'uuid', array: true, default: '{}' })
  supportingDocuments: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  verificationHistory: {
    type: string;
    date: string;
    result: string;
    performedBy: string;
    notes?: string;
  }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}

@Entity('suspicious_activity_reports')
export class SuspiciousActivityReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_number', unique: true })
  reportNumber: string;

  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  householdId: string;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  personId: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId: string;

  @Column({ name: 'activity_date', type: 'timestamp' })
  activityDate: Date;

  @Column({ name: 'detection_date', type: 'timestamp' })
  detectionDate: Date;

  @Column({ name: 'activity_type' })
  activityType: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'amount_involved', type: 'decimal', precision: 15, scale: 2, nullable: true })
  amountInvolved: number;

  @Column({ name: 'red_flags', type: 'text', array: true, default: '{}' })
  redFlags: string[];

  @Column({ name: 'reported_to_fincen', default: false })
  reportedToFincen: boolean;

  @Column({ name: 'fincen_report_date', type: 'timestamp', nullable: true })
  fincenReportDate: Date;

  @Column({ name: 'fincen_report_number', nullable: true })
  fincenReportNumber: string;

  @Column({ name: 'investigation_notes', type: 'text', nullable: true })
  investigationNotes: string;

  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution: string;

  @Column({ default: 'open' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}
