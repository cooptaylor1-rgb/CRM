/**
 * SchwabSyncService
 *
 * Orchestrates full and incremental synchronisation of Schwab data into the
 * local CRM database.
 *
 * Scheduled jobs (via @nestjs/schedule):
 *  - Full sync  : daily at 01:00 AM CT
 *  - Positions  : every 15 minutes during market hours
 *  - Transactions: daily at 06:00 AM CT (catches previous day settlements)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SchwabAuthService } from './schwab-auth.service';
import { SchwabAccountService } from './schwab-account.service';
import { SchwabHttpClient } from './schwab-http.client';
import { SCHWAB_TRANSACTIONS_PATH } from './schwab.constants';
import { SchwabTransaction } from './schwab.interfaces';
import { CustodianAccount } from '../../../entities/custodian-account.entity';
import { CustodianSyncLog } from '../../../entities/custodian-sync-log.entity';
import { CustodianTransaction } from '../../../entities/custodian-transaction.entity';

// ---------------------------------------------------------------------------
// Transaction type mapping
// ---------------------------------------------------------------------------

/**
 * Maps a Schwab transaction type to the CRM's internal transaction category.
 */
export function mapSchwabTransactionType(
  schwabType: string,
): 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal' | 'fee' | 'other' {
  const t = schwabType?.toUpperCase();
  if (t === 'TRADE') return 'buy'; // further refined by transferItems direction
  if (t === 'DIVIDEND_OR_INTEREST') return 'dividend';
  if (t === 'ACH_RECEIPT' || t === 'WIRE_IN' || t === 'CASH_RECEIPT') return 'deposit';
  if (t === 'ACH_DISBURSEMENT' || t === 'WIRE_OUT' || t === 'CASH_DISBURSEMENT') return 'withdrawal';
  if (t === 'MARGIN_CALL') return 'fee';
  return 'other';
}

// ---------------------------------------------------------------------------
// SyncResult
// ---------------------------------------------------------------------------

export interface SyncResult {
  userId: string;
  syncType: 'full' | 'positions' | 'transactions';
  accountsSynced: number;
  positionsSynced: number;
  transactionsSynced: number;
  errors: string[];
  startedAt: Date;
  completedAt: Date;
}

// ---------------------------------------------------------------------------
// SchwabSyncService
// ---------------------------------------------------------------------------

@Injectable()
export class SchwabSyncService {
  private readonly logger = new Logger(SchwabSyncService.name);

  constructor(
    private readonly authService: SchwabAuthService,
    private readonly accountService: SchwabAccountService,
    private readonly httpClient: SchwabHttpClient,
    @InjectRepository(CustodianAccount)
    private readonly accountRepo: Repository<CustodianAccount>,
    @InjectRepository(CustodianSyncLog)
    private readonly syncLogRepo: Repository<CustodianSyncLog>,
    @InjectRepository(CustodianTransaction)
    private readonly transactionRepo: Repository<CustodianTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------------------------------------------------
  // Scheduled: full sync daily @ 01:00 CT
  // -------------------------------------------------------------------------

  /** Runs a full sync for every connected Schwab user each night. */
  @Cron('0 1 * * *', { timeZone: 'America/Chicago' })
  async scheduledFullSync(): Promise<void> {
    this.logger.log('Scheduled full sync starting');
    const connectedUsers = await this.getConnectedUserIds();
    for (const userId of connectedUsers) {
      try {
        await this.fullSync(userId);
      } catch (err) {
        this.logger.error(`Full sync failed for user ${userId}`, err);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Scheduled: positions every 15 min during market hours (Mon-Fri, 8:30-16:00 CT)
  // -------------------------------------------------------------------------

  @Cron('*/15 8-15 * * 1-5', { timeZone: 'America/Chicago' })
  async scheduledPositionSync(): Promise<void> {
    this.logger.debug('Scheduled position sync starting');
    const connectedUsers = await this.getConnectedUserIds();
    for (const userId of connectedUsers) {
      try {
        await this.syncPositions(userId);
      } catch (err) {
        this.logger.error(`Position sync failed for user ${userId}`, err);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Scheduled: transactions daily @ 06:00 CT
  // -------------------------------------------------------------------------

  @Cron('0 6 * * *', { timeZone: 'America/Chicago' })
  async scheduledTransactionSync(): Promise<void> {
    this.logger.log('Scheduled transaction sync starting');
    const connectedUsers = await this.getConnectedUserIds();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2); // 2-day lookback for settlement
    const endDate = new Date();

    for (const userId of connectedUsers) {
      try {
        await this.syncTransactions(userId, startDate, endDate);
      } catch (err) {
        this.logger.error(`Transaction sync failed for user ${userId}`, err);
      }
    }
  }

  // -------------------------------------------------------------------------
  // fullSync
  // -------------------------------------------------------------------------

  /**
   * Runs a complete sync: accounts → positions → transactions (last 30 days).
   *
   * @param userId  CRM user ID
   */
  async fullSync(userId: string): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let accountsSynced = 0;
    let positionsSynced = 0;
    let transactionsSynced = 0;

    const log = await this.createSyncLog(userId, 'full');

    try {
      // 1. Accounts
      const accounts = await this.accountService.syncAccounts(userId);
      accountsSynced = accounts.length;

      // 2. Positions (embedded in accounts, count positions across all)
      positionsSynced = accounts.reduce(
        (sum, a) => sum + ((a.positions as unknown[]) ?? []).length,
        0,
      );

      // 3. Transactions (last 30 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const transactionResult = await this.syncTransactions(
        userId,
        startDate,
        new Date(),
      );
      transactionsSynced = transactionResult.transactionsSynced;

      await this.updateSyncLog(log, 'success', {
        accountsSynced,
        positionsSynced,
        transactionsSynced,
      });
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      errors.push(message);
      this.logger.error(`Full sync error for user ${userId}: ${message}`);
      await this.updateSyncLog(log, 'error', {}, message);
    }

    const completedAt = new Date();
    return {
      userId,
      syncType: 'full',
      accountsSynced,
      positionsSynced,
      transactionsSynced,
      errors,
      startedAt,
      completedAt,
    };
  }

  // -------------------------------------------------------------------------
  // syncPositions
  // -------------------------------------------------------------------------

  /**
   * Re-fetches all account positions for the user and updates the database.
   *
   * @param userId  CRM user ID
   */
  async syncPositions(userId: string): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let positionsSynced = 0;

    const log = await this.createSyncLog(userId, 'positions');

    try {
      const accounts = await this.accountService.syncAccounts(userId);
      positionsSynced = accounts.reduce(
        (sum, a) => sum + ((a.positions as unknown[]) ?? []).length,
        0,
      );
      await this.updateSyncLog(log, 'success', { positionsSynced });
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      errors.push(message);
      await this.updateSyncLog(log, 'error', {}, message);
    }

    return {
      userId,
      syncType: 'positions',
      accountsSynced: 0,
      positionsSynced,
      transactionsSynced: 0,
      errors,
      startedAt,
      completedAt: new Date(),
    };
  }

  // -------------------------------------------------------------------------
  // syncTransactions
  // -------------------------------------------------------------------------

  /**
   * Syncs transactions for all linked Schwab accounts within the given date range.
   * Upserting is done by activityId to avoid duplicates.
   *
   * @param userId     CRM user ID
   * @param startDate  Start of the date range
   * @param endDate    End of the date range
   */
  async syncTransactions(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let transactionsSynced = 0;

    const log = await this.createSyncLog(userId, 'transactions');

    try {
      // Get all active Schwab accounts for this user
      const accounts = await this.accountRepo.find({
        where: { userId, custodian: 'schwab', isActive: true },
      });

      const accessToken = await this.authService.getValidToken(userId);

      for (const account of accounts) {
        try {
          const rawTransactions = await this.fetchTransactions(
            account.hashValue,
            accessToken,
            startDate,
            endDate,
          );

          for (const tx of rawTransactions) {
            await this.upsertTransaction(userId, account.id, tx);
            transactionsSynced++;
          }
        } catch (err) {
          const message = `Account ${account.accountNumber}: ${(err as Error).message}`;
          errors.push(message);
          this.logger.warn(
            `Transaction sync error for account ${account.accountNumber}: ${message}`,
          );
        }
      }

      await this.updateSyncLog(log, 'success', { transactionsSynced });
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      errors.push(message);
      await this.updateSyncLog(log, 'error', {}, message);
    }

    return {
      userId,
      syncType: 'transactions',
      accountsSynced: 0,
      positionsSynced: 0,
      transactionsSynced,
      errors,
      startedAt,
      completedAt: new Date(),
    };
  }

  // -------------------------------------------------------------------------
  // Private: fetch transactions from Schwab API
  // -------------------------------------------------------------------------

  private async fetchTransactions(
    hashValue: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SchwabTransaction[]> {
    return this.httpClient.get<SchwabTransaction[]>(
      SCHWAB_TRANSACTIONS_PATH(hashValue),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      },
    );
  }

  // -------------------------------------------------------------------------
  // Private: upsert a single transaction
  // -------------------------------------------------------------------------

  private async upsertTransaction(
    userId: string,
    accountId: string,
    tx: SchwabTransaction,
  ): Promise<void> {
    const existing = await this.transactionRepo.findOne({
      where: { custodian: 'schwab', externalTransactionId: String(tx.activityId) },
    });

    const primaryItem = tx.transferItems?.[0];
    const symbol = primaryItem?.instrument?.symbol;
    const quantity = primaryItem?.amount;
    const price = primaryItem?.price;
    const transactionType = mapSchwabTransactionType(tx.type);

    const data = {
      userId,
      accountId,
      custodian: 'schwab' as const,
      externalTransactionId: String(tx.activityId),
      transactionDate: new Date(tx.tradeDate),
      settlementDate: tx.settlementDate ? new Date(tx.settlementDate) : null,
      transactionType,
      description: tx.description,
      symbol: symbol ?? null,
      quantity: quantity ?? null,
      price: price ?? null,
      amount: tx.netAmount,
      rawData: tx as unknown as Record<string, unknown>,
    };

    if (existing) {
      await this.transactionRepo.update({ id: existing.id }, data);
    } else {
      await this.transactionRepo.save(this.transactionRepo.create(data));
    }
  }

  // -------------------------------------------------------------------------
  // Private: sync log helpers
  // -------------------------------------------------------------------------

  private async createSyncLog(
    userId: string,
    syncType: string,
  ): Promise<CustodianSyncLog> {
    const log = this.syncLogRepo.create({
      userId,
      custodian: 'schwab',
      syncType,
      status: 'running',
      startedAt: new Date(),
    });
    return this.syncLogRepo.save(log);
  }

  private async updateSyncLog(
    log: CustodianSyncLog,
    status: 'success' | 'error',
    metadata: Record<string, number>,
    errorMessage?: string,
  ): Promise<void> {
    await this.syncLogRepo.update(
      { id: log.id },
      {
        status,
        completedAt: new Date(),
        metadata,
        errorMessage: errorMessage ?? null,
      },
    );
  }

  // -------------------------------------------------------------------------
  // Private: get all user IDs with active Schwab connections
  // -------------------------------------------------------------------------

  private async getConnectedUserIds(): Promise<string[]> {
    const rows = await this.dataSource.query<{ userId: string }[]>(
      `SELECT DISTINCT "userId" FROM schwab_tokens
       WHERE refresh_token_expires_at > NOW()`,
    );
    return rows.map((r) => r.userId);
  }
}
