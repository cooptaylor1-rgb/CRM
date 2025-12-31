import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum CustodianType {
  SCHWAB = 'schwab',
  FIDELITY = 'fidelity',
  PERSHING = 'pershing',
  INTERACTIVE_BROKERS = 'interactive_brokers',
  VANGUARD = 'vanguard',
  TD_AMERITRADE = 'td_ameritrade',
}

export enum ConnectionStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  EXPIRED = 'expired',
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/**
 * Represents a firm-level connection to a custodian
 */
@Entity('custodian_connections')
@Index(['custodianType'], { unique: true })
export class CustodianConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CustodianType, name: 'custodian_type' })
  custodianType: CustodianType;

  @Column({ type: 'enum', enum: ConnectionStatus, default: ConnectionStatus.PENDING })
  status: ConnectionStatus;

  @Column({ type: 'text', nullable: true, name: 'client_id' })
  clientId?: string;

  @Column({ type: 'text', nullable: true, name: 'client_secret' })
  clientSecret?: string;

  @Column({ type: 'text', nullable: true, name: 'api_key' })
  apiKey?: string;

  @Column({ type: 'text', nullable: true, name: 'access_token' })
  accessToken?: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'token_expires_at' })
  tokenExpiresAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    autoSync: boolean;
    syncFrequencyMinutes: number;
    syncAccounts: boolean;
    syncPositions: boolean;
    syncTransactions: boolean;
    syncDocuments: boolean;
    webhookEnabled: boolean;
    webhookUrl?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', nullable: true, name: 'last_error' })
  lastError?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_sync_at' })
  lastSyncAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_sync_at' })
  nextSyncAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Links a CRM account to its custodian account
 */
@Entity('custodian_account_links')
@Index(['accountId'], { unique: true })
@Index(['custodianAccountId', 'custodianType'], { unique: true })
export class CustodianAccountLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @Column({ type: 'enum', enum: CustodianType, name: 'custodian_type' })
  custodianType: CustodianType;

  @Column({ type: 'varchar', name: 'custodian_account_id' })
  custodianAccountId: string;

  @Column({ type: 'varchar', nullable: true, name: 'custodian_account_number' })
  custodianAccountNumber?: string;

  @Column({ type: 'boolean', default: true, name: 'sync_enabled' })
  syncEnabled: boolean;

  @Column({ type: 'enum', enum: SyncStatus, default: SyncStatus.IDLE, name: 'sync_status' })
  syncStatus: SyncStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'last_sync_at' })
  lastSyncAt?: Date;

  @Column({ type: 'varchar', nullable: true, name: 'last_sync_error' })
  lastSyncError?: string;

  @Column({ type: 'jsonb', default: {} })
  syncMetadata: {
    lastPositionSync?: string;
    lastTransactionSync?: string;
    lastBalanceSync?: string;
    positionsCount?: number;
    transactionsCount?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Sync history and audit log
 */
@Entity('custodian_sync_logs')
@Index(['custodianType', 'createdAt'])
export class CustodianSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CustodianType, name: 'custodian_type' })
  custodianType: CustodianType;

  @Column({ type: 'uuid', nullable: true, name: 'account_link_id' })
  accountLinkId?: string;

  @Column({ type: 'varchar', name: 'sync_type' })
  syncType: 'full' | 'incremental' | 'accounts' | 'positions' | 'transactions' | 'documents';

  @Column({ type: 'enum', enum: SyncStatus, name: 'status' })
  status: SyncStatus;

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @Column({ type: 'integer', default: 0, name: 'records_processed' })
  recordsProcessed: number;

  @Column({ type: 'integer', default: 0, name: 'records_created' })
  recordsCreated: number;

  @Column({ type: 'integer', default: 0, name: 'records_updated' })
  recordsUpdated: number;

  @Column({ type: 'integer', default: 0, name: 'records_failed' })
  recordsFailed: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'jsonb', default: [] })
  errors: Array<{
    recordId?: string;
    error: string;
    timestamp: string;
  }>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
