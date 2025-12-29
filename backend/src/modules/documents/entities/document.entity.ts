import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum DocumentType {
  AGREEMENT = 'agreement',
  FORM_ADV = 'form_adv',
  DISCLOSURE = 'disclosure',
  CORRESPONDENCE = 'correspondence',
  STATEMENT = 'statement',
  TAX_DOC = 'tax_doc',
  MEETING_NOTES = 'meeting_notes',
  COMPLIANCE_REVIEW = 'compliance_review',
}

export enum DocumentStatus {
  ACTIVE = 'active',
  SUPERSEDED = 'superseded', // Replaced by newer version
  ARCHIVED = 'archived',      // Past retention but kept
}

/**
 * SEC Rule 204-2 compliant document entity.
 * Documents are immutable after creation (WORM - Write Once Read Many).
 * Updates create amendments, originals are preserved.
 */
@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id', nullable: true })
  householdId: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    name: 'document_type',
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.ACTIVE,
  })
  status: DocumentStatus;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ name: 'file_hash', nullable: true })
  fileHash: string; // SHA-256 hash for integrity verification

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ name: 'retention_date', nullable: true })
  retentionDate: Date;

  /**
   * Link to original document if this is an amendment/supersession
   */
  @Column({ name: 'original_document_id', type: 'uuid', nullable: true })
  originalDocumentId: string | null;

  /**
   * Version number for document lineage tracking
   */
  @Column({ name: 'version', default: 1 })
  version: number;

  /**
   * Reason for supersession (required when creating amendments)
   */
  @Column({ name: 'supersession_reason', type: 'text', nullable: true })
  supersessionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Soft delete for retention - document is hidden but preserved.
   * SEC requires 5-6+ year retention depending on document type.
   */
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @Column({ name: 'deletion_reason', type: 'text', nullable: true })
  deletionReason: string | null;
}
