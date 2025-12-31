import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  CustodianConnection,
  CustodianAccountLink,
  CustodianSyncLog,
  CustodianType,
  ConnectionStatus,
  SyncStatus,
} from './custodian.entity';
import {
  CreateCustodianConnectionDto,
  UpdateCustodianConnectionDto,
  LinkAccountDto,
  SyncRequestDto,
  CustodianSyncResult,
} from './custodian.dto';
import { SchwabAdapter } from './schwab.adapter';
import { Account } from '../../accounts/entities/account.entity';

@Injectable()
export class CustodianService {
  private readonly logger = new Logger(CustodianService.name);

  constructor(
    @InjectRepository(CustodianConnection)
    private connectionRepository: Repository<CustodianConnection>,
    @InjectRepository(CustodianAccountLink)
    private accountLinkRepository: Repository<CustodianAccountLink>,
    @InjectRepository(CustodianSyncLog)
    private syncLogRepository: Repository<CustodianSyncLog>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private schwabAdapter: SchwabAdapter,
    private configService: ConfigService,
  ) {}

  // ==================== Connection Management ====================

  async createConnection(dto: CreateCustodianConnectionDto): Promise<CustodianConnection> {
    // Check if connection already exists
    const existing = await this.connectionRepository.findOne({
      where: { custodianType: dto.custodianType },
    });

    if (existing) {
      throw new BadRequestException(`Connection for ${dto.custodianType} already exists`);
    }

    const connection = this.connectionRepository.create({
      custodianType: dto.custodianType,
      status: ConnectionStatus.PENDING,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      apiKey: dto.apiKey,
      settings: {
        autoSync: dto.settings?.autoSync ?? true,
        syncFrequencyMinutes: dto.settings?.syncFrequencyMinutes ?? 60,
        syncAccounts: dto.settings?.syncAccounts ?? true,
        syncPositions: dto.settings?.syncPositions ?? true,
        syncTransactions: dto.settings?.syncTransactions ?? true,
        syncDocuments: dto.settings?.syncDocuments ?? false,
        webhookEnabled: false,
      },
    });

    return this.connectionRepository.save(connection);
  }

  async getConnection(custodianType: CustodianType): Promise<CustodianConnection> {
    const connection = await this.connectionRepository.findOne({
      where: { custodianType },
    });

    if (!connection) {
      throw new NotFoundException(`Connection for ${custodianType} not found`);
    }

    return connection;
  }

  async getAllConnections(): Promise<CustodianConnection[]> {
    return this.connectionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateConnection(
    custodianType: CustodianType,
    dto: UpdateCustodianConnectionDto,
  ): Promise<CustodianConnection> {
    const connection = await this.getConnection(custodianType);

    if (dto.clientId) connection.clientId = dto.clientId;
    if (dto.clientSecret) connection.clientSecret = dto.clientSecret;
    if (dto.apiKey) connection.apiKey = dto.apiKey;
    if (dto.settings) {
      connection.settings = { ...connection.settings, ...dto.settings };
    }

    return this.connectionRepository.save(connection);
  }

  async deleteConnection(custodianType: CustodianType): Promise<void> {
    const connection = await this.getConnection(custodianType);

    // Delete all linked accounts first
    await this.accountLinkRepository.delete({ custodianType });

    await this.connectionRepository.remove(connection);
  }

  // ==================== OAuth Flow ====================

  getOAuthUrl(custodianType: CustodianType): string {
    const state = Buffer.from(JSON.stringify({
      custodianType,
      timestamp: Date.now(),
    })).toString('base64');

    if (custodianType === CustodianType.SCHWAB) {
      return this.schwabAdapter.getAuthorizationUrl(state);
    }

    throw new BadRequestException(`OAuth not supported for ${custodianType}`);
  }

  async handleOAuthCallback(
    custodianType: CustodianType,
    code: string,
    state: string,
  ): Promise<CustodianConnection> {
    this.logger.log(`Handling OAuth callback for ${custodianType}`);

    const connection = await this.getConnection(custodianType);

    if (custodianType === CustodianType.SCHWAB) {
      const tokens = await this.schwabAdapter.exchangeCodeForTokens(code);

      connection.accessToken = tokens.access_token;
      connection.refreshToken = tokens.refresh_token;
      connection.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      connection.status = ConnectionStatus.CONNECTED;
      connection.lastError = undefined;

      return this.connectionRepository.save(connection);
    }

    throw new BadRequestException(`OAuth callback not supported for ${custodianType}`);
  }

  async refreshToken(custodianType: CustodianType): Promise<void> {
    const connection = await this.getConnection(custodianType);

    if (!connection.refreshToken) {
      throw new BadRequestException('No refresh token available');
    }

    if (custodianType === CustodianType.SCHWAB) {
      const tokens = await this.schwabAdapter.refreshAccessToken(connection.refreshToken);

      connection.accessToken = tokens.access_token;
      connection.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      connection.lastError = undefined;

      await this.connectionRepository.save(connection);
    }
  }

  async disconnect(custodianType: CustodianType): Promise<CustodianConnection> {
    const connection = await this.getConnection(custodianType);

    connection.status = ConnectionStatus.DISCONNECTED;
    connection.accessToken = undefined;
    connection.refreshToken = undefined;
    connection.tokenExpiresAt = undefined;

    return this.connectionRepository.save(connection);
  }

  // ==================== Account Linking ====================

  async linkAccount(dto: LinkAccountDto): Promise<CustodianAccountLink> {
    // Verify the account exists
    const account = await this.accountRepository.findOne({
      where: { id: dto.accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    // Check if already linked
    const existingLink = await this.accountLinkRepository.findOne({
      where: { accountId: dto.accountId },
    });

    if (existingLink) {
      throw new BadRequestException(`Account ${dto.accountId} is already linked`);
    }

    const link = this.accountLinkRepository.create({
      accountId: dto.accountId,
      custodianType: dto.custodianType,
      custodianAccountId: dto.custodianAccountId,
      custodianAccountNumber: dto.custodianAccountNumber,
      syncEnabled: true,
      syncStatus: SyncStatus.IDLE,
    });

    return this.accountLinkRepository.save(link);
  }

  async unlinkAccount(accountId: string): Promise<void> {
    const link = await this.accountLinkRepository.findOne({
      where: { accountId },
    });

    if (!link) {
      throw new NotFoundException(`Account link not found`);
    }

    await this.accountLinkRepository.remove(link);
  }

  async getLinkedAccounts(custodianType?: CustodianType): Promise<CustodianAccountLink[]> {
    const where: any = {};
    if (custodianType) {
      where.custodianType = custodianType;
    }

    return this.accountLinkRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getAccountLink(accountId: string): Promise<CustodianAccountLink | null> {
    return this.accountLinkRepository.findOne({
      where: { accountId },
    });
  }

  // ==================== Syncing ====================

  async syncAccounts(custodianType: CustodianType): Promise<CustodianSyncResult> {
    const startTime = Date.now();
    const connection = await this.getConnection(custodianType);

    if (connection.status !== ConnectionStatus.CONNECTED) {
      throw new BadRequestException(`Connection not active for ${custodianType}`);
    }

    // Create sync log
    const syncLog = this.syncLogRepository.create({
      custodianType,
      syncType: 'accounts',
      status: SyncStatus.SYNCING,
      startedAt: new Date(),
    });
    await this.syncLogRepository.save(syncLog);

    try {
      // Ensure token is valid
      if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
        await this.refreshToken(custodianType);
      }

      let accounts: any[] = [];

      if (custodianType === CustodianType.SCHWAB) {
        accounts = await this.schwabAdapter.getAccounts(connection.accessToken!);
      }

      let recordsCreated = 0;
      let recordsUpdated = 0;
      const errors: string[] = [];

      for (const custodianAccount of accounts) {
        try {
          // Check if already linked
          const existingLink = await this.accountLinkRepository.findOne({
            where: {
              custodianAccountId: custodianAccount.accountId,
              custodianType,
            },
          });

          if (existingLink) {
            // Update existing account
            const account = await this.accountRepository.findOne({
              where: { id: existingLink.accountId },
            });

            if (account) {
              account.currentValue = custodianAccount.currentBalances.totalValue;
              await this.accountRepository.save(account);
              recordsUpdated++;
            }
          } else {
            // Log discovered account (don't auto-create, let user link)
            this.logger.log(`Discovered unlinked account: ${custodianAccount.accountNumber}`);
          }
        } catch (error) {
          errors.push(`Error processing account ${custodianAccount.accountNumber}: ${error.message}`);
        }
      }

      // Update sync log
      syncLog.status = errors.length > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      syncLog.completedAt = new Date();
      syncLog.recordsProcessed = accounts.length;
      syncLog.recordsCreated = recordsCreated;
      syncLog.recordsUpdated = recordsUpdated;
      syncLog.recordsFailed = errors.length;
      syncLog.errors = errors.map(e => ({ error: e, timestamp: new Date().toISOString() }));
      await this.syncLogRepository.save(syncLog);

      // Update connection
      connection.lastSyncAt = new Date();
      connection.nextSyncAt = new Date(Date.now() + connection.settings.syncFrequencyMinutes * 60 * 1000);
      await this.connectionRepository.save(connection);

      return {
        success: true,
        syncLogId: syncLog.id,
        recordsProcessed: accounts.length,
        recordsCreated,
        recordsUpdated,
        recordsFailed: errors.length,
        errors,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.completedAt = new Date();
      syncLog.errorMessage = error.message;
      await this.syncLogRepository.save(syncLog);

      connection.lastError = error.message;
      await this.connectionRepository.save(connection);

      throw error;
    }
  }

  async syncPositions(custodianType: CustodianType, accountLinkId?: string): Promise<CustodianSyncResult> {
    const startTime = Date.now();
    const connection = await this.getConnection(custodianType);

    if (connection.status !== ConnectionStatus.CONNECTED) {
      throw new BadRequestException(`Connection not active for ${custodianType}`);
    }

    // Create sync log
    const syncLog = this.syncLogRepository.create({
      custodianType,
      accountLinkId,
      syncType: 'positions',
      status: SyncStatus.SYNCING,
      startedAt: new Date(),
    });
    await this.syncLogRepository.save(syncLog);

    try {
      // Get accounts to sync
      const where: any = { custodianType, syncEnabled: true };
      if (accountLinkId) where.id = accountLinkId;

      const accountLinks = await this.accountLinkRepository.find({ where });

      let totalRecords = 0;
      let recordsUpdated = 0;
      const errors: string[] = [];

      for (const link of accountLinks) {
        try {
          let positions: any[] = [];

          if (custodianType === CustodianType.SCHWAB) {
            positions = await this.schwabAdapter.getPositions(
              connection.accessToken!,
              link.custodianAccountId,
            );
          }

          totalRecords += positions.length;

          // Update sync metadata
          link.syncMetadata = {
            ...link.syncMetadata,
            lastPositionSync: new Date().toISOString(),
            positionsCount: positions.length,
          };
          link.lastSyncAt = new Date();
          link.syncStatus = SyncStatus.SUCCESS;
          await this.accountLinkRepository.save(link);

          recordsUpdated += positions.length;

          this.logger.log(`Synced ${positions.length} positions for account ${link.accountId}`);

        } catch (error) {
          errors.push(`Error syncing positions for ${link.accountId}: ${error.message}`);
          link.syncStatus = SyncStatus.FAILED;
          link.lastSyncError = error.message;
          await this.accountLinkRepository.save(link);
        }
      }

      // Update sync log
      syncLog.status = errors.length > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      syncLog.completedAt = new Date();
      syncLog.recordsProcessed = totalRecords;
      syncLog.recordsUpdated = recordsUpdated;
      syncLog.recordsFailed = errors.length;
      await this.syncLogRepository.save(syncLog);

      return {
        success: true,
        syncLogId: syncLog.id,
        recordsProcessed: totalRecords,
        recordsCreated: 0,
        recordsUpdated,
        recordsFailed: errors.length,
        errors,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.completedAt = new Date();
      syncLog.errorMessage = error.message;
      await this.syncLogRepository.save(syncLog);

      throw error;
    }
  }

  async fullSync(custodianType: CustodianType): Promise<CustodianSyncResult> {
    const startTime = Date.now();

    // Create parent sync log
    const syncLog = this.syncLogRepository.create({
      custodianType,
      syncType: 'full',
      status: SyncStatus.SYNCING,
      startedAt: new Date(),
    });
    await this.syncLogRepository.save(syncLog);

    try {
      // Run all syncs
      const accountsResult = await this.syncAccounts(custodianType);
      const positionsResult = await this.syncPositions(custodianType);

      const totalRecordsProcessed = accountsResult.recordsProcessed + positionsResult.recordsProcessed;
      const totalErrors = [...accountsResult.errors, ...positionsResult.errors];

      syncLog.status = totalErrors.length > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      syncLog.completedAt = new Date();
      syncLog.recordsProcessed = totalRecordsProcessed;
      syncLog.recordsCreated = accountsResult.recordsCreated + positionsResult.recordsCreated;
      syncLog.recordsUpdated = accountsResult.recordsUpdated + positionsResult.recordsUpdated;
      syncLog.recordsFailed = totalErrors.length;
      await this.syncLogRepository.save(syncLog);

      return {
        success: true,
        syncLogId: syncLog.id,
        recordsProcessed: totalRecordsProcessed,
        recordsCreated: syncLog.recordsCreated,
        recordsUpdated: syncLog.recordsUpdated,
        recordsFailed: totalErrors.length,
        errors: totalErrors,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.completedAt = new Date();
      syncLog.errorMessage = error.message;
      await this.syncLogRepository.save(syncLog);

      throw error;
    }
  }

  // ==================== Sync Logs ====================

  async getSyncLogs(
    custodianType?: CustodianType,
    limit: number = 50,
  ): Promise<CustodianSyncLog[]> {
    const where: any = {};
    if (custodianType) {
      where.custodianType = custodianType;
    }

    return this.syncLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getSyncLog(id: string): Promise<CustodianSyncLog> {
    const log = await this.syncLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Sync log ${id} not found`);
    }
    return log;
  }

  // ==================== Discovery ====================

  async discoverAccounts(custodianType: CustodianType): Promise<any[]> {
    const connection = await this.getConnection(custodianType);

    if (connection.status !== ConnectionStatus.CONNECTED) {
      throw new BadRequestException(`Connection not active for ${custodianType}`);
    }

    let accounts: any[] = [];

    if (custodianType === CustodianType.SCHWAB) {
      accounts = await this.schwabAdapter.getAccounts(connection.accessToken!);
    }

    // Mark which are already linked
    const links = await this.accountLinkRepository.find({
      where: { custodianType },
    });

    const linkedIds = new Set(links.map(l => l.custodianAccountId));

    return accounts.map(account => ({
      ...account,
      isLinked: linkedIds.has(account.accountId),
      linkId: links.find(l => l.custodianAccountId === account.accountId)?.id,
    }));
  }

  // ==================== Status ====================

  async getConnectionStatus(custodianType: CustodianType): Promise<{
    connected: boolean;
    status: ConnectionStatus;
    lastSync?: Date;
    nextSync?: Date;
    accountsLinked: number;
    error?: string;
  }> {
    try {
      const connection = await this.getConnection(custodianType);
      const linkedAccounts = await this.accountLinkRepository.count({
        where: { custodianType },
      });

      return {
        connected: connection.status === ConnectionStatus.CONNECTED,
        status: connection.status,
        lastSync: connection.lastSyncAt,
        nextSync: connection.nextSyncAt,
        accountsLinked: linkedAccounts,
        error: connection.lastError,
      };
    } catch {
      return {
        connected: false,
        status: ConnectionStatus.PENDING,
        accountsLinked: 0,
      };
    }
  }
}
