import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ResearchItem } from './research-item.entity';

export type ResearchSourceType = 'email' | 'rss' | 'manual' | 'api' | 'upload';

@Entity('research_sources')
@Index('idx_research_sources_source_type', ['sourceType'])
@Index('idx_research_sources_email_address', ['emailAddress'], { unique: true, where: '"email_address" IS NOT NULL' })
export class ResearchSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------------------------------------------------------------------------
  // Relations
  // ---------------------------------------------------------------------------

  @OneToMany(() => ResearchItem, (item) => item.source)
  researchItems: ResearchItem[];

  // ---------------------------------------------------------------------------
  // Identity
  // ---------------------------------------------------------------------------

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'source_type',
    type: 'varchar',
    length: 20,
    default: 'email',
  })
  sourceType: ResearchSourceType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ---------------------------------------------------------------------------
  // Email-specific fields
  // ---------------------------------------------------------------------------

  @Column({ name: 'email_address', type: 'varchar', length: 255, nullable: true })
  emailAddress: string | null;

  @Column({ name: 'email_domain', type: 'varchar', length: 255, nullable: true })
  emailDomain: string | null;

  // ---------------------------------------------------------------------------
  // RSS/API-specific fields
  // ---------------------------------------------------------------------------

  @Column({ name: 'feed_url', type: 'text', nullable: true })
  feedUrl: string | null;

  @Column({ name: 'api_endpoint', type: 'text', nullable: true })
  apiEndpoint: string | null;

  @Column({ name: 'api_key_ref', type: 'varchar', length: 255, nullable: true })
  apiKeyRef: string | null; // reference to secrets manager key, not the key itself

  // ---------------------------------------------------------------------------
  // Metadata
  // ---------------------------------------------------------------------------

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'auto_process', type: 'boolean', default: true })
  autoProcess: boolean;

  @Column({ name: 'allowed_sender_domains', type: 'jsonb', nullable: true, default: '[]' })
  allowedSenderDomains: string[] | null;

  @Column({ name: 'last_ingested_at', type: 'timestamptz', nullable: true })
  lastIngestedAt: Date | null;

  @Column({ name: 'ingest_count', type: 'integer', default: 0 })
  ingestCount: number;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, default: '{}' })
  metadata: Record<string, unknown> | null;

  // ---------------------------------------------------------------------------
  // Timestamps
  // ---------------------------------------------------------------------------

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
