import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SchwabAccount,
  SchwabPosition,
  SchwabTransaction,
  SchwabOAuthResponse,
} from './custodian.dto';

/**
 * Schwab Advisor Center API Adapter
 * 
 * This adapter handles all communication with Schwab's API.
 * In production, this would use the actual Schwab Advisor Services API.
 * 
 * Schwab API Documentation: https://developer.schwab.com/
 * 
 * Required Scopes:
 * - accounts:read - Read account data
 * - positions:read - Read position data  
 * - transactions:read - Read transaction history
 * - documents:read - Read documents (statements, confirms)
 */
@Injectable()
export class SchwabAdapter {
  private readonly logger = new Logger(SchwabAdapter.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('SCHWAB_API_URL') || 'https://api.schwabapi.com/v1';
    this.clientId = this.configService.get('SCHWAB_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('SCHWAB_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get('SCHWAB_REDIRECT_URI') || 'http://localhost:3001/api/custodian/schwab/callback';
  }

  /**
   * Generate OAuth authorization URL for Schwab
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'accounts:read',
      'positions:read',
      'transactions:read',
      'documents:read',
    ].join(' ');

    return `https://api.schwabapi.com/oauth/authorize?` +
      `client_id=${encodeURIComponent(this.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${encodeURIComponent(state)}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<SchwabOAuthResponse> {
    this.logger.log('Exchanging authorization code for tokens');

    // In production, this would make an actual API call to Schwab
    // For now, we simulate the token exchange
    const mockResponse: SchwabOAuthResponse = {
      access_token: `schwab_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: `schwab_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expires_in: 1800, // 30 minutes
      token_type: 'Bearer',
      scope: 'accounts:read positions:read transactions:read documents:read',
    };

    return mockResponse;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<SchwabOAuthResponse> {
    this.logger.log('Refreshing access token');

    // In production, call Schwab's token refresh endpoint
    const mockResponse: SchwabOAuthResponse = {
      access_token: `schwab_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: refreshToken, // Schwab typically returns the same refresh token
      expires_in: 1800,
      token_type: 'Bearer',
      scope: 'accounts:read positions:read transactions:read documents:read',
    };

    return mockResponse;
  }

  /**
   * Fetch all accounts from Schwab
   */
  async getAccounts(accessToken: string): Promise<SchwabAccount[]> {
    this.logger.log('Fetching accounts from Schwab');

    // In production, call: GET /accounts
    // For now, return simulated data that demonstrates the structure
    const mockAccounts: SchwabAccount[] = [
      {
        accountNumber: 'SCHWAB-1234567',
        accountId: 'acc_sch_001',
        accountType: 'BROKERAGE',
        accountStatus: 'ACTIVE',
        displayName: 'Individual Brokerage',
        currentBalances: {
          cashBalance: 45230.50,
          marketValue: 1234567.89,
          totalValue: 1279798.39,
        },
      },
      {
        accountNumber: 'SCHWAB-2345678',
        accountId: 'acc_sch_002',
        accountType: 'IRA',
        accountStatus: 'ACTIVE',
        displayName: 'Traditional IRA',
        currentBalances: {
          cashBalance: 12500.00,
          marketValue: 567890.12,
          totalValue: 580390.12,
        },
      },
      {
        accountNumber: 'SCHWAB-3456789',
        accountId: 'acc_sch_003',
        accountType: 'ROTH_IRA',
        accountStatus: 'ACTIVE',
        displayName: 'Roth IRA',
        currentBalances: {
          cashBalance: 8750.25,
          marketValue: 234567.00,
          totalValue: 243317.25,
        },
      },
    ];

    return mockAccounts;
  }

  /**
   * Fetch positions for a specific account
   */
  async getPositions(accessToken: string, accountId: string): Promise<SchwabPosition[]> {
    this.logger.log(`Fetching positions for account ${accountId}`);

    // In production, call: GET /accounts/{accountId}/positions
    const mockPositions: SchwabPosition[] = [
      {
        symbol: 'VTI',
        cusip: '922908363',
        description: 'Vanguard Total Stock Market ETF',
        quantity: 500,
        marketValue: 125000.00,
        averageCost: 220.50,
        costBasis: 110250.00,
        unrealizedGainLoss: 14750.00,
        unrealizedGainLossPercent: 13.38,
        assetType: 'ETF',
        currentPrice: 250.00,
      },
      {
        symbol: 'BND',
        cusip: '921937835',
        description: 'Vanguard Total Bond Market ETF',
        quantity: 300,
        marketValue: 23400.00,
        averageCost: 80.00,
        costBasis: 24000.00,
        unrealizedGainLoss: -600.00,
        unrealizedGainLossPercent: -2.50,
        assetType: 'ETF',
        currentPrice: 78.00,
      },
      {
        symbol: 'AAPL',
        cusip: '037833100',
        description: 'Apple Inc.',
        quantity: 100,
        marketValue: 19500.00,
        averageCost: 150.00,
        costBasis: 15000.00,
        unrealizedGainLoss: 4500.00,
        unrealizedGainLossPercent: 30.00,
        assetType: 'EQUITY',
        currentPrice: 195.00,
      },
      {
        symbol: 'MSFT',
        cusip: '594918104',
        description: 'Microsoft Corporation',
        quantity: 75,
        marketValue: 28125.00,
        averageCost: 320.00,
        costBasis: 24000.00,
        unrealizedGainLoss: 4125.00,
        unrealizedGainLossPercent: 17.19,
        assetType: 'EQUITY',
        currentPrice: 375.00,
      },
      {
        symbol: 'GOOGL',
        cusip: '02079K305',
        description: 'Alphabet Inc. Class A',
        quantity: 50,
        marketValue: 7000.00,
        averageCost: 120.00,
        costBasis: 6000.00,
        unrealizedGainLoss: 1000.00,
        unrealizedGainLossPercent: 16.67,
        assetType: 'EQUITY',
        currentPrice: 140.00,
      },
    ];

    return mockPositions;
  }

  /**
   * Fetch transaction history for an account
   */
  async getTransactions(
    accessToken: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SchwabTransaction[]> {
    this.logger.log(`Fetching transactions for account ${accountId}`);

    // In production, call: GET /accounts/{accountId}/transactions
    const mockTransactions: SchwabTransaction[] = [
      {
        transactionId: 'txn_001',
        transactionDate: '2024-12-15T10:30:00Z',
        settlementDate: '2024-12-17T00:00:00Z',
        transactionType: 'BUY',
        description: 'Buy 10 shares of AAPL',
        symbol: 'AAPL',
        quantity: 10,
        price: 192.50,
        amount: -1925.00,
        fees: 0,
      },
      {
        transactionId: 'txn_002',
        transactionDate: '2024-12-10T14:15:00Z',
        settlementDate: '2024-12-12T00:00:00Z',
        transactionType: 'DIVIDEND',
        description: 'Dividend payment - VTI',
        symbol: 'VTI',
        amount: 125.50,
      },
      {
        transactionId: 'txn_003',
        transactionDate: '2024-12-05T09:45:00Z',
        settlementDate: '2024-12-07T00:00:00Z',
        transactionType: 'SELL',
        description: 'Sell 25 shares of MSFT',
        symbol: 'MSFT',
        quantity: 25,
        price: 370.00,
        amount: 9250.00,
        fees: 0,
      },
      {
        transactionId: 'txn_004',
        transactionDate: '2024-12-01T00:00:00Z',
        settlementDate: '2024-12-01T00:00:00Z',
        transactionType: 'DEPOSIT',
        description: 'ACH Deposit',
        amount: 5000.00,
      },
    ];

    return mockTransactions;
  }

  /**
   * Get account details including balances
   */
  async getAccountDetails(accessToken: string, accountId: string): Promise<SchwabAccount> {
    this.logger.log(`Fetching account details for ${accountId}`);

    const accounts = await this.getAccounts(accessToken);
    const account = accounts.find(a => a.accountId === accountId);

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Fetch positions for this account
    account.positions = await this.getPositions(accessToken, accountId);

    return account;
  }

  /**
   * Validate the connection is working
   */
  async validateConnection(accessToken: string): Promise<boolean> {
    try {
      // Try to fetch accounts - if it works, connection is valid
      const accounts = await this.getAccounts(accessToken);
      return accounts.length >= 0; // Even 0 accounts is valid
    } catch (error) {
      this.logger.error('Connection validation failed', error);
      return false;
    }
  }

  /**
   * Map Schwab account type to CRM account type
   */
  mapAccountType(schwabType: string): string {
    const typeMap: Record<string, string> = {
      'BROKERAGE': 'individual',
      'IRA': 'ira',
      'ROTH_IRA': 'roth_ira',
      'SEP_IRA': 'sep_ira',
      'SIMPLE_IRA': 'simple_ira',
      '401K': '401k',
      '403B': '403b',
      '529': '529',
      'TRUST': 'trust',
      'JOINT': 'joint',
      'CUSTODIAL': 'custodial',
      'CORPORATE': 'corporate',
    };

    return typeMap[schwabType] || 'individual';
  }

  /**
   * Map Schwab transaction type to CRM transaction type
   */
  mapTransactionType(schwabType: string): string {
    const typeMap: Record<string, string> = {
      'BUY': 'buy',
      'SELL': 'sell',
      'DIVIDEND': 'dividend',
      'INTEREST': 'interest',
      'DEPOSIT': 'deposit',
      'WITHDRAWAL': 'withdrawal',
      'FEE': 'fee',
      'TRANSFER_IN': 'transfer_in',
      'TRANSFER_OUT': 'transfer_out',
      'DIVIDEND_REINVEST': 'dividend_reinvest',
    };

    return typeMap[schwabType] || 'other';
  }
}
