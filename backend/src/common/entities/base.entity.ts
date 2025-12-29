import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Base entity providing soft delete support for SEC compliance.
 * SEC Rule 204-2 requires retention of records for 5+ years.
 * Hard deletes are prohibited - use soft delete instead.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  /**
   * Check if the entity is soft deleted
   */
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}

/**
 * Auditable entity that requires immutability after creation.
 * Used for compliance-critical records like documents and communications.
 * SEC Rule 204-2(g) requires WORM (Write Once Read Many) for certain records.
 */
export abstract class ImmutableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  /**
   * Soft delete for retention - record is hidden but preserved
   */
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  /**
   * Reason for deletion (required for compliance audit trail)
   */
  @Column({ name: 'deletion_reason', type: 'text', nullable: true })
  deletionReason: string | null;
}
