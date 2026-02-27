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

@Entity('research_annotations')
@Index('idx_research_annotations_research_item_id', ['researchItemId'])
@Index('idx_research_annotations_author_id', ['authorId'])
export class ResearchAnnotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------------------------------------------------------------------------
  // Relations
  // ---------------------------------------------------------------------------

  @Column({ name: 'research_item_id', type: 'uuid' })
  researchItemId: string;

  @ManyToOne(() => ResearchItem, (item) => item.annotations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'research_item_id' })
  researchItem: ResearchItem;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  // Author is a Supabase Auth user; we store the UUID and join lazily.
  // A full User entity join can be added when the users module is available.
  author?: Record<string, unknown>;

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'highlighted_text', type: 'text', nullable: true })
  highlightedText: string | null;

  // JSON position data for anchoring the annotation to a specific location
  // e.g. { startOffset: 123, endOffset: 456, xpath: '//p[3]' }
  @Column({ name: 'position_data', type: 'jsonb', nullable: true })
  positionData: Record<string, unknown> | null;

  // ---------------------------------------------------------------------------
  // Collaboration
  // ---------------------------------------------------------------------------

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null;

  // ---------------------------------------------------------------------------
  // Timestamps
  // ---------------------------------------------------------------------------

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
