import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditEventType {
  // Data operations
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ACCESS = 'access',
  EXPORT = 'export',

  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',

  // Compliance (SEC/FINRA)
  DOCUMENT_VIEW = 'document_view',
  DOCUMENT_DOWNLOAD = 'document_download',
  COMPLIANCE_REVIEW = 'compliance_review',
  APPROVAL = 'approval',

  // Integration
  SYNC_START = 'sync_start',
  SYNC_COMPLETE = 'sync_complete',
  SYNC_FAILED = 'sync_failed',
}

@Entity('audit_events')
@Index(['userId'])
@Index(['timestamp'])
@Index(['eventType'])
@Index(['entityType', 'entityId'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: AuditEventType,
    name: 'event_type',
  })
  eventType: AuditEventType;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: any;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;
}
