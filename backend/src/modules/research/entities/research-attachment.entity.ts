import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ResearchItem } from './research-item.entity';

export type AttachmentProcessingStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'skipped'
  | 'failed';

@Entity('research_attachments')
@Index('idx_research_attachments_research_item_id', ['researchItemId'])
@Index('idx_research_attachments_processing_status', ['processingStatus'])
export class ResearchAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------------------------------------------------------------------------
  // Relations
  // ---------------------------------------------------------------------------

  @Column({ name: 'research_item_id', type: 'uuid' })
  researchItemId: string;

  @ManyToOne(() => ResearchItem, (item) => item.attachments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'research_item_id' })
  researchItem: ResearchItem;

  // ---------------------------------------------------------------------------
  // File metadata
  // ---------------------------------------------------------------------------

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'content_type', type: 'varchar', length: 255 })
  contentType: string;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize: number | null;

  @Column({ name: 'storage_path', type: 'text' })
  storagePath: string;

  @Column({ name: 'storage_bucket', type: 'varchar', length: 100, default: 'research-attachments' })
  storageBucket: string;

  // ---------------------------------------------------------------------------
  // AI processing
  // ---------------------------------------------------------------------------

  @Column({
    name: 'processing_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  processingStatus: AttachmentProcessingStatus;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string | null;

  @Column({ name: 'page_count', type: 'integer', nullable: true })
  pageCount: number | null;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  // ---------------------------------------------------------------------------
  // Timestamps
  // ---------------------------------------------------------------------------

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
