import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  REMEDIATED = 'remediated',
  CLOSED = 'closed',
}

export enum IncidentType {
  PHISHING = 'phishing',
  MALWARE = 'malware',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  ACCOUNT_COMPROMISE = 'account_compromise',
  SOCIAL_ENGINEERING = 'social_engineering',
  INSIDER_THREAT = 'insider_threat',
  DENIAL_OF_SERVICE = 'denial_of_service',
  LOST_DEVICE = 'lost_device',
  POLICY_VIOLATION = 'policy_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  VENDOR_BREACH = 'vendor_breach',
  OTHER = 'other',
}

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  PII = 'pii',
  FINANCIAL = 'financial',
}

@Entity('security_incidents')
export class SecurityIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_number', unique: true })
  incidentNumber: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentType,
    name: 'incident_type',
  })
  incidentType: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MEDIUM,
  })
  severity: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
  })
  status: IncidentStatus;

  // Discovery & Timeline
  @Column({ name: 'discovered_at', type: 'timestamp' })
  discoveredAt: Date;

  @Column({ name: 'discovered_by', type: 'uuid', nullable: true })
  discoveredBy: string;

  @Column({ name: 'discovery_method', nullable: true })
  discoveryMethod: string;

  @Column({ name: 'occurred_at', type: 'timestamp', nullable: true })
  occurredAt: Date;

  @Column({ name: 'contained_at', type: 'timestamp', nullable: true })
  containedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  // Impact Assessment
  @Column({ name: 'affected_systems', type: 'text', array: true, default: '{}' })
  affectedSystems: string[];

  @Column({ name: 'affected_users', type: 'text', array: true, default: '{}' })
  affectedUsers: string[];

  @Column({ name: 'affected_clients', type: 'uuid', array: true, default: '{}' })
  affectedClients: string[];

  @Column({ name: 'data_types_affected', type: 'enum', enum: DataClassification, array: true, nullable: true })
  dataTypesAffected: DataClassification[];

  @Column({ name: 'records_affected_count', type: 'int', nullable: true })
  recordsAffectedCount: number;

  @Column({ name: 'estimated_financial_impact', type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedFinancialImpact: number;

  // Response
  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ name: 'response_team', type: 'uuid', array: true, default: '{}' })
  responseTeam: string[];

  @Column({ name: 'containment_actions', type: 'text', nullable: true })
  containmentActions: string;

  @Column({ name: 'remediation_actions', type: 'text', nullable: true })
  remediationActions: string;

  @Column({ name: 'lessons_learned', type: 'text', nullable: true })
  lessonsLearned: string;

  // Compliance & Notifications
  @Column({ name: 'requires_notification', default: false })
  requiresNotification: boolean;

  @Column({ name: 'notification_deadline', type: 'timestamp', nullable: true })
  notificationDeadline: Date;

  @Column({ name: 'sec_notified', default: false })
  secNotified: boolean;

  @Column({ name: 'sec_notification_date', type: 'timestamp', nullable: true })
  secNotificationDate: Date;

  @Column({ name: 'clients_notified', default: false })
  clientsNotified: boolean;

  @Column({ name: 'client_notification_date', type: 'timestamp', nullable: true })
  clientNotificationDate: Date;

  @Column({ name: 'law_enforcement_notified', default: false })
  lawEnforcementNotified: boolean;

  @Column({ name: 'law_enforcement_case_number', nullable: true })
  lawEnforcementCaseNumber: string;

  // Root Cause
  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause: string;

  @Column({ name: 'attack_vector', nullable: true })
  attackVector: string;

  @Column({ name: 'threat_actor', nullable: true })
  threatActor: string;

  // Evidence & Documentation
  @Column({ name: 'evidence_preserved', default: false })
  evidencePreserved: boolean;

  @Column({ name: 'evidence_location', type: 'text', nullable: true })
  evidenceLocation: string;

  @Column({ name: 'related_documents', type: 'uuid', array: true, default: '{}' })
  relatedDocuments: string[];

  @Column({ type: 'jsonb', nullable: true })
  timeline: { timestamp: string; action: string; actor: string; notes?: string }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
