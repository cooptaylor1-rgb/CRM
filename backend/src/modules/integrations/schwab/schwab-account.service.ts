/**
 * SchwabAccountService
 *
 * Provides methods to retrieve and synchronise Schwab account data with the
 * local CRM database.
 *
 * Endpoints used:
 *  GET /trader/v1/accounts/accountNumbers  → hashValues
 *  GET /trader/v1/accounts/{hashValue}?fields=positions  → single account
 *  GET /trader/v1/accounts?fields=positions  → all accounts
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchwabHttpClient } from './schwab-http.client';
import { SchwabAuthService } from './schwab-auth.service';
import {
  SCHWAB_ACCOUNT_NUMBERS_PATH,
  SCHWAB_ACCOUNTS_PATH,
  SCHWAB_ACCOUNT_PATH,
} from './schwab.constants';
import {
  SchwabAccountNumber,
  SchwabAccountWrapper,
  SchwabSecuritiesAccount,
} from './schwab.interfaces';
import { CustodianAccount } from '../../../entities/custodian-account.entity';

// ---------------------------------------------------------------------------
// Account type mapping
// ---------------------------------------------------------------------------

/**
 * Maps a Schwab account-type string to the CRM's internal account-type enum.
 */
export function mapSchwabAccountType(
  schwabType: string,
): 'brokerage' | 'retirement' | 'cash' | 'margin' | 'unknown' {
  const t = schwabType?.toUpperCase();
  if (t === 'CASH') return 'cash';
  if (t === 'MARGIN') return 'margin';
  if (t?.includes('IRA') || t?.includes('401') || t?.includes('ROTH'))
    return 'retirement';
  if (t?.includes('BROKERAGE')) return 'brokerage';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// SchwabAccountService
// ---------------------------------------------------------------------------

@Injectable()
export class SchwabAccountService {
  private readonly logger = new Logger(SchwabAccountService.name);

  constructor(
    private readonly httpClient: SchwabHttpClient,
    private readonly authService: SchwabAuthService,
    @InjectRepository(CustodianAccount)
    private readonly accountRepo: Repository<CustodianAccount>,
  ) {}

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Builds Axios config with Bearer authorization header.
   * Also provides the onUnauthorised callback so the HTTP client can
   * auto-refresh the access token on 401.
   */
  private async buildAuthConfig(userId: string) {
    const accessToken = await this.authService.getValidToken(userId);
    return {
      headers: { Authorization: `Bearer ${accessToken}` },
      _onUnauthorised: () => this.authService.getValidToken(userId),
    };
  }

  // -------------------------------------------------------------------------
  // getAccountNumbers
  // -------------------------------------------------------------------------

  /**
   * Fetches the list of account numbers + their hash values from Schwab.
   * The hashValue is the safe identifier to use in all subsequent API calls.
   *
   * @param userId  CRM user ID
   */
  async getAccountNumbers(userId: string): Promise<SchwabAccountNumber[]> {
    this.logger.debug(`Fetching account numbers for user ${userId}`);
    const config = await this.buildAuthConfig(userId);
    return this.httpClient.get<SchwabAccountNumber[]>(
      SCHWAB_ACCOUNT_NUMBERS_PATH,
      config,
    );
  }

  // -------------------------------------------------------------------------
  // getAccount
  // -------------------------------------------------------------------------

  /**
   * Fetches a single account including its current positions.
   *
   * @param userId     CRM user ID
   * @param hashValue  Schwab account hash (from getAccountNumbers)
   */
  async getAccount(
    userId: string,
    hashValue: string,
  ): Promise<SchwabSecuritiesAccount> {
    this.logger.debug(`Fetching account ${hashValue} for user ${userId}`);
    const config = await this.buildAuthConfig(userId);
    const wrapper = await this.httpClient.get<SchwabAccountWrapper>(
      SCHWAB_ACCOUNT_PATH(hashValue),
      { ...config, params: { fields: 'positions' } },
    );
    return wrapper.securitiesAccount;
  }

  // -------------------------------------------------------------------------
  // getAllAccounts
  // -------------------------------------------------------------------------

  /**
   * Fetches all linked Schwab accounts (with positions) in a single call.
   *
   * @param userId  CRM user ID
   */
  async getAllAccounts(userId: string): Promise<SchwabSecuritiesAccount[]> {
    this.logger.debug(`Fetching all accounts for user ${userId}`);
    const config = await this.buildAuthConfig(userId);
    const wrappers = await this.httpClient.get<SchwabAccountWrapper[]>(
      SCHWAB_ACCOUNTS_PATH,
      { ...config, params: { fields: 'positions' } },
    );
    return wrappers.map((w) => w.securitiesAccount);
  }

  // -------------------------------------------------------------------------
  // syncAccounts
  // -------------------------------------------------------------------------

  /**
   * Syncs all Schwab accounts for a given user into the local CRM database.
   * Creates new records or updates existing ones; marks accounts not returned
   * by Schwab as inactive.
   *
   * @param userId  CRM user ID
   * @returns       Array of upserted CustodianAccount entities
   */
  async syncAccounts(userId: string): Promise<CustodianAccount[]> {
    this.logger.log(`Starting account sync for user ${userId}`);

    // Fetch both account numbers (with hashes) and full account data
    const [accountNumbers, accounts] = await Promise.all([
      this.getAccountNumbers(userId),
      this.getAllAccounts(userId),
    ]);

    // Build a lookup map: accountNumber -> hashValue
    const hashMap = new Map(
      accountNumbers.map((a) => [a.accountNumber, a.hashValue]),
    );

    const upserted: CustodianAccount[] = [];

    for (const schwabAccount of accounts) {
      const hashValue = hashMap.get(schwabAccount.accountNumber) ?? '';
      const accountType = mapSchwabAccountType(schwabAccount.type);

      const currentBalance =
        schwabAccount.currentBalances?.equity ??
        schwabAccount.currentBalances?.totalCash ??
        0;

      // Try to find an existing record by custodian + accountNumber
      const existing = await this.accountRepo.findOne({
        where: { custodian: 'schwab', accountNumber: schwabAccount.accountNumber },
      });

      if (existing) {
        await this.accountRepo.update(
          { id: existing.id },
          {
            hashValue,
            accountType,
            currentBalance,
            positions: schwabAccount.positions ?? [],
            rawData: schwabAccount as unknown as Record<string, unknown>,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        );
        upserted.push({ ...existing, currentBalance } as CustodianAccount);
      } else {
        const newAccount = this.accountRepo.create({
          userId,
          custodian: 'schwab',
          accountNumber: schwabAccount.accountNumber,
          hashValue,
          accountType,
          currentBalance,
          positions: schwabAccount.positions ?? [],
          rawData: schwabAccount as unknown as Record<string, unknown>,
          isActive: true,
          lastSyncedAt: new Date(),
        });
        const saved = await this.accountRepo.save(newAccount);
        upserted.push(saved);
      }
    }

    // Mark accounts no longer returned by Schwab as inactive
    const activeAccountNumbers = new Set(
      accounts.map((a) => a.accountNumber),
    );
    const allLocalAccounts = await this.accountRepo.find({
      where: { userId, custodian: 'schwab', isActive: true },
    });
    for (const local of allLocalAccounts) {
      if (!activeAccountNumbers.has(local.accountNumber)) {
        await this.accountRepo.update({ id: local.id }, { isActive: false });
        this.logger.warn(
          `Account ${local.accountNumber} no longer returned by Schwab; marked inactive`,
        );
      }
    }

    this.logger.log(
      `Account sync complete for user ${userId}: ${upserted.length} upserted`,
    );
    return upserted;
  }
}
