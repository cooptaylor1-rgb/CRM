import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';

import { ResearchSource } from './research-source.entity';
import { ResearchAttachment } from './research-attachment.entity';
import { ResearchAnnotation } from './research-annotation.entity';

// Lightweight stubs for joined entities not defined in this workstream
// These will be replaced by real entity imports as the CRM grows.
class Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
}

class Security {
  id: string;
  ticker: string;
  name: string;
}

class ResearchUserAction {
  id: string;
  userId: string;
  actionType: string;
  actedAt: Date;
}

export type ResearchItemStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'archived';

@Entity('research_items')
@Index('idx_research_items_status', ['status'])
@Index('idx_research_items_published_at', ['publishedAt'])
@Index('idx_research_items_source_id', ['sourceId'])
export class ResearchItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------------------------------------------------------------------------
  // Relations
  // ---------------------------------------------------------------------------

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => ResearchSource, (source) => source.researchItems, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'source_id' })
  source: ResearchSource;

  @OneToMany(() => ResearchAttachment, (attachment) => attachment.researchItem, {
    cascade: true,
    eager: false,
  })
  attachments: ResearchAttachment[];

  @OneToMany(() => ResearchAnnotation, (annotation) => annotation.researchItem, {
    cascade: true,
    eager: false,
  })
  annotations: ResearchAnnotation[];

  // ManyToMany joins – junction tables managed by Supabase/DB migrations
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'research_item_tags',
    joinColumn: { name: 'research_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @ManyToMany(() => Security)
  @JoinTable({
    name: 'research_item_securities',
    joinColumn: { name: 'research_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'security_id', referencedColumnName: 'id' },
  })
  securities: Security[];

  @OneToMany(() => ResearchUserAction, (action) => (action as any).researchItem, {
    eager: false,
  })
  actions: ResearchUserAction[];

  // ---------------------------------------------------------------------------
  // Core content fields
  // ---------------------------------------------------------------------------

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText: string | null;

  @Column({ name: 'content_html', type: 'text', nullable: true })
  contentHtml: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  author: string | null;

  @Column({ name: 'original_url', type: 'text', nullable: true })
  originalUrl: string | null;

  // ---------------------------------------------------------------------------
  // AI-generated fields
  // ---------------------------------------------------------------------------

  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary: string | null;

  @Column({ name: 'extracted_tickers', type: 'jsonb', nullable: true, default: '[]' })
  extractedTickers: string[] | null;

  @Column({ name: 'sentiment_scores', type: 'jsonb', nullable: true, default: '{}' })
  sentimentScores: Record<string, number> | null;

  // ---------------------------------------------------------------------------
  // Status and processing
  // ---------------------------------------------------------------------------

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: ResearchItemStatus;

  @Column({ name: 'raw_storage_path', type: 'text', nullable: true })
  rawStoragePath: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  metadata: Record<string, unknown> | null;

  // ---------------------------------------------------------------------------
  // Timestamps
  // ---------------------------------------------------------------------------

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'ingested_at', type: 'timestamptz', default: () => 'NOW()' })
  ingestedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
