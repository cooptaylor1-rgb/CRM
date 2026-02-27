# Schwab API Integration Specification

**Project:** Wealth Management CRM / Portfolio Management Tool  
**Backend:** NestJS 10  
**Frontend:** Next.js 14  
**Database/Auth:** Supabase (PostgreSQL + Auth + Storage)  
**Target:** Replace mocked `schwab.adapter.ts` with live Schwab API calls  
**Schwab Developer Portal:** https://developer.schwab.com  
**Last Updated:** 2026-02-27  

---

## Table of Contents

1. [OAuth 2.0 Authentication Flow](#1-oauth-20-authentication-flow)
2. [Schwab Service Architecture](#2-schwab-service-architecture)
3. [Account Sync Strategy](#3-account-sync-strategy)
4. [Market Data Strategy](#4-market-data-strategy)
5. [Order Management](#5-order-management)
6. [Streaming Implementation](#6-streaming-implementation)
7. [Error Handling & Rate Limiting](#7-error-handling--rate-limiting)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Security](#9-security)
10. [NestJS Module Structure](#10-nestjs-module-structure)
11. [Database Schema](#11-database-schema)
12. [Environment Configuration](#12-environment-configuration)
13. [Migration from Mocked Adapter](#13-migration-from-mocked-adapter)

---

## 1. OAuth 2.0 Authentication Flow

### 1.1 Overview

The Schwab API uses a **three-legged OAuth 2.0 Authorization Code flow**. Each advisor authenticates with their own Schwab credentials, granting the application access to their linked brokerage accounts. Tokens are per-advisor, not per-application.

Key token characteristics:
- **Access tokens** expire after **30 minutes** (1800 seconds)
- **Refresh tokens** expire after **7 days**
- After refresh token expiry, the full OAuth flow must be re-initiated

### 1.2 App Registration on developer.schwab.com

Before any integration is possible, the application must be registered:

1. Create a developer account at `https://developer.schwab.com`
2. Navigate to **Dashboard → Create App**
3. Select both API products:
   - `Accounts and Trading Production`
   - `Market Data Production`
4. Set the **Callback URL** to your production callback endpoint:
   - Production: `https://your-app.com/api/schwab/oauth/callback`
   - Multiple URLs are supported (comma-separated, 255-char limit total)
   - Must be HTTPS (no HTTP in production)
5. Note the **App Key** (Client ID) and **Secret** (Client Secret) from the App Details screen
6. Status will initially be `Approved - Pending`; wait for `Ready For Use` (typically 1–3 business days)
7. Set the **Order Limit** to `120` (maximum order-related requests per minute)

### 1.3 OAuth Endpoints

| Endpoint | URL |
|----------|-----|
| Authorization | `GET https://api.schwabapi.com/v1/oauth/authorize` |
| Token Exchange / Refresh | `POST https://api.schwabapi.com/v1/oauth/token` |

### 1.4 Step-by-Step OAuth Flow

#### Step 1 — Advisor initiates connection

The advisor clicks "Connect Schwab Account" in the CRM UI. The backend constructs the authorization URL:

```
https://api.schwabapi.com/v1/oauth/authorize?client_id={APP_KEY}&redirect_uri={CALLBACK_URL}
```

The advisor is redirected to Schwab's **Login Micro Site (LMS)** where they:
- Log in with their **Schwab brokerage credentials** (not developer portal credentials)
- Select which sub-accounts to authorize for API access
- Consent to the data sharing

#### Step 2 — Schwab redirects back with auth code

After consent, Schwab redirects to the callback URL:

```
https://your-app.com/api/schwab/oauth/callback?code={AUTHORIZATION_CODE}&session={SESSION_ID}
```

**Critical:** The auth code contains a literal `%40` at the end (URL-encoded `@`). It must be URL-decoded before use. The code is **only valid for a short window** (~60 seconds); exchange it immediately.

#### Step 3 — Exchange auth code for tokens

```http
POST https://api.schwabapi.com/v1/oauth/token
Authorization: Basic {BASE64(APP_KEY:APP_SECRET)}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={DECODED_AUTH_CODE}&redirect_uri={CALLBACK_URL}
```

Response:

```json
{
  "expires_in": 1800,
  "token_type": "Bearer",
  "scope": "...",
  "refresh_token": "{REFRESH_TOKEN}",
  "access_token": "{ACCESS_TOKEN}",
  "id_token": "{ID_TOKEN}"
}
```

#### Step 4 — Refresh access token

When the access token is within 5 minutes of expiry (or has expired), use the refresh token:

```http
POST https://api.schwabapi.com/v1/oauth/token
Authorization: Basic {BASE64(APP_KEY:APP_SECRET)}
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={REFRESH_TOKEN}
```

If the refresh token itself is expired (>7 days), the full OAuth flow must restart from Step 1.

### 1.5 Token Storage

Tokens are stored encrypted in a `schwab_tokens` Supabase table (schema in [Section 11](#11-database-schema)). Encryption uses **AES-256-GCM** before write; decrypt on read. Never store tokens in plaintext.

### 1.6 Multi-Advisor Token Management

Each advisor (`user_id` in Supabase Auth) has their own token row. The `SchwabAuthService` retrieves tokens by `user_id` and ensures the access token is valid before every API call.

### 1.7 NestJS Implementation

#### `schwab-auth.controller.ts` — OAuth callback handler

```typescript
import {
  Controller, Get, Query, Res, Req, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SchwabAuthService } from './schwab-auth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('schwab/oauth')
export class SchwabAuthController {
  constructor(private readonly schwabAuthService: SchwabAuthService) {}

  /**
   * Step 1: Advisor clicks "Connect Schwab" — redirect to Schwab LMS
   */
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  async initiateOAuth(@Req() req: Request, @Res() res: Response) {
    const userId = req.user['sub'];
    const authUrl = this.schwabAuthService.buildAuthorizationUrl(userId);
    return res.redirect(authUrl);
  }

  /**
   * Step 2 & 3: Schwab redirects back with auth code; exchange for tokens
   */
  @Get('callback')
  async handleCallback(
    @Query('code') rawCode: string,
    @Query('session') session: string,
    @Res() res: Response,
  ) {
    // Decode %40 → @ at end of code
    const authCode = decodeURIComponent(rawCode);

    // Retrieve userId from state stored in cache (see buildAuthorizationUrl)
    const userId = await this.schwabAuthService.getUserIdFromSession(session);

    await this.schwabAuthService.exchangeCodeForTokens(userId, authCode);

    // Redirect advisor back to CRM settings page
    return res.redirect('/settings/integrations?schwab=connected');
  }

  /**
   * Disconnect: revoke and delete stored tokens
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req: Request) {
    const userId = req.user['sub'];
    await this.schwabAuthService.revokeTokens(userId);
  }
}
```

#### `schwab-auth.service.ts` — Token lifecycle management

```typescript
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { SchwabToken } from './entities/schwab-token.entity';

@Injectable()
export class SchwabAuthService {
  private readonly logger = new Logger(SchwabAuthService.name);
  private readonly BASE_AUTH_URL = 'https://api.schwabapi.com/v1/oauth/authorize';
  private readonly TOKEN_URL = 'https://api.schwabapi.com/v1/oauth/token';
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  
  // In-flight refresh promises, keyed by userId, to prevent concurrent refreshes
  private refreshPromises = new Map<string, Promise<string>>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(SchwabToken)
    private readonly tokenRepo: Repository<SchwabToken>,
  ) {}

  buildAuthorizationUrl(userId: string): string {
    const clientId = this.configService.get<string>('SCHWAB_APP_KEY');
    const callbackUrl = this.configService.get<string>('SCHWAB_CALLBACK_URL');
    // Store userId keyed by a short-lived session ID (use Redis or Supabase cache)
    const sessionId = crypto.randomUUID();
    // TODO: cache.set(sessionId, userId, 300) — 5 min TTL
    return `${this.BASE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${sessionId}`;
  }

  async getUserIdFromSession(session: string): Promise<string> {
    // TODO: return cache.get(session)
    // Fallback: parse from a signed state parameter
    throw new Error('Implement session lookup from cache');
  }

  async exchangeCodeForTokens(userId: string, authCode: string): Promise<void> {
    const clientId = this.configService.get<string>('SCHWAB_APP_KEY');
    const clientSecret = this.configService.get<string>('SCHWAB_APP_SECRET');
    const callbackUrl = this.configService.get<string>('SCHWAB_CALLBACK_URL');

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: callbackUrl,
    });

    const response = await firstValueFrom(
      this.httpService.post(this.TOKEN_URL, body.toString(), {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    const { access_token, refresh_token, expires_in } = response.data;
    await this.storeTokens(userId, access_token, refresh_token, expires_in);
    this.logger.log(`Tokens stored for user ${userId}`);
  }

  /**
   * Returns a valid access token for the given user.
   * Automatically refreshes if expiring within 5 minutes.
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const tokenRecord = await this.tokenRepo.findOne({ where: { userId } });
    if (!tokenRecord) {
      throw new UnauthorizedException(`No Schwab token found for user ${userId}. Re-connect required.`);
    }

    const expiresAt = new Date(tokenRecord.accessTokenExpiresAt);
    const fiveMinuteBuffer = new Date(Date.now() + 5 * 60 * 1000);

    if (expiresAt > fiveMinuteBuffer) {
      // Token still valid — decrypt and return
      return this.decryptToken(tokenRecord.encryptedAccessToken);
    }

    // Token expiring soon — refresh (deduplicated per user)
    return this.refreshAccessToken(userId, tokenRecord);
  }

  private async refreshAccessToken(userId: string, tokenRecord: SchwabToken): Promise<string> {
    // Deduplicate concurrent refresh attempts for the same user
    if (this.refreshPromises.has(userId)) {
      return this.refreshPromises.get(userId)!;
    }

    const refreshPromise = (async () => {
      try {
        const refreshToken = this.decryptToken(tokenRecord.encryptedRefreshToken);
        const refreshTokenExpiry = new Date(tokenRecord.refreshTokenExpiresAt);

        if (refreshTokenExpiry < new Date()) {
          // Refresh token expired — need full re-auth
          await this.tokenRepo.update({ userId }, { status: 'EXPIRED' });
          throw new UnauthorizedException(
            `Schwab refresh token expired for user ${userId}. Please re-connect your Schwab account.`,
          );
        }

        const clientId = this.configService.get<string>('SCHWAB_APP_KEY');
        const clientSecret = this.configService.get<string>('SCHWAB_APP_SECRET');
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        });

        const response = await firstValueFrom(
          this.httpService.post(this.TOKEN_URL, body.toString(), {
            headers: {
              Authorization: `Basic ${basicAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }),
        );

        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;
        await this.storeTokens(userId, access_token, newRefreshToken, expires_in);
        this.logger.log(`Access token refreshed for user ${userId}`);
        return access_token;
      } finally {
        this.refreshPromises.delete(userId);
      }
    })();

    this.refreshPromises.set(userId, refreshPromise);
    return refreshPromise;
  }

  private async storeTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): Promise<void> {
    const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.tokenRepo.upsert(
      {
        userId,
        encryptedAccessToken: this.encryptToken(accessToken),
        encryptedRefreshToken: this.encryptToken(refreshToken),
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      ['userId'],
    );
  }

  private encryptToken(plaintext: string): string {
    const key = Buffer.from(
      this.configService.get<string>('SCHWAB_TOKEN_ENCRYPTION_KEY'),
      'hex',
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Format: iv(hex):authTag(hex):ciphertext(hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decryptToken(encryptedData: string): string {
    const key = Buffer.from(
      this.configService.get<string>('SCHWAB_TOKEN_ENCRYPTION_KEY'),
      'hex',
    );
    const [ivHex, authTagHex, ciphertextHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = crypto.createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  }

  async revokeTokens(userId: string): Promise<void> {
    await this.tokenRepo.update({ userId }, { status: 'REVOKED' });
    this.logger.log(`Tokens revoked for user ${userId}`);
  }
}
```

---

## 2. Schwab Service Architecture

### 2.1 Service Map

```
SchwabModule
├── SchwabAuthService          OAuth flow, token storage, refresh, encryption
├── SchwabAuthController       /schwab/oauth/connect, /schwab/oauth/callback
├── SchwabAccountService       Account data, positions, balances, hash value mgmt
├── SchwabOrderService         Place, modify, cancel, preview orders
├── SchwabMarketDataService    Quotes, price history, options chains, movers
├── SchwabStreamingService     WebSocket client, subscription management
└── SchwabSyncService          Orchestrates scheduled syncs via cron
```

### 2.2 HTTP Client Wrapper

All REST calls go through a shared `SchwabHttpClient` that:
- Injects the valid Bearer token per-user before each request
- Applies rate limiting (token bucket — 120 req/min)
- Implements exponential backoff on 429 / 5xx responses
- Logs all requests to the `custodian_sync_logs` table

```typescript
// schwab-http.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SchwabAuthService } from './schwab-auth.service';
import { RateLimiter } from 'limiter';

@Injectable()
export class SchwabHttpClient {
  private readonly logger = new Logger(SchwabHttpClient.name);
  private readonly BASE_URL = 'https://api.schwabapi.com/trader/v1';
  private readonly MARKET_DATA_URL = 'https://api.schwabapi.com/marketdata/v1';

  // 120 requests per 60 seconds (rolling window)
  private readonly rateLimiter = new RateLimiter({ tokensPerInterval: 120, interval: 'minute' });

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: SchwabAuthService,
  ) {}

  async get<T>(
    userId: string,
    path: string,
    params?: Record<string, any>,
    isMarketData = false,
  ): Promise<T> {
    return this.request<T>(userId, 'GET', path, undefined, params, isMarketData);
  }

  async post<T>(userId: string, path: string, body: any): Promise<T> {
    return this.request<T>(userId, 'POST', path, body);
  }

  async put<T>(userId: string, path: string, body: any): Promise<T> {
    return this.request<T>(userId, 'PUT', path, body);
  }

  async delete(userId: string, path: string): Promise<void> {
    await this.request(userId, 'DELETE', path);
  }

  private async request<T>(
    userId: string,
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>,
    isMarketData = false,
    attempt = 0,
  ): Promise<T> {
    await this.rateLimiter.removeTokens(1);

    const accessToken = await this.authService.getValidAccessToken(userId);
    const baseUrl = isMarketData ? this.MARKET_DATA_URL : this.BASE_URL;

    const config: AxiosRequestConfig = {
      method,
      url: `${baseUrl}${path}`,
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
      data: body,
    };

    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.request<T>(config),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status;

      // Retry on 429 (rate limit) or 5xx (server error) with exponential backoff
      if ((status === 429 || status >= 500) && attempt < 4) {
        const delay = Math.min(1000 * 2 ** attempt, 32000); // 1s, 2s, 4s, 8s, 32s cap
        this.logger.warn(`Schwab API ${status} on ${path}, retry ${attempt + 1} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(userId, method, path, body, params, isMarketData, attempt + 1);
      }

      this.logger.error(`Schwab API error ${status} on ${method} ${path}: ${error.message}`);
      throw error;
    }
  }
}
```

### 2.3 `SchwabAccountService`

```typescript
// schwab-account.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SchwabHttpClient } from './schwab-http.client';
import {
  SchwabAccountNumbersResponse,
  SchwabAccountDetail,
  SchwabTransaction,
} from './interfaces/schwab-api.interfaces';

@Injectable()
export class SchwabAccountService {
  private readonly logger = new Logger(SchwabAccountService.name);

  constructor(private readonly http: SchwabHttpClient) {}

  /**
   * Fetch all account numbers and their hash values.
   * IMPORTANT: All subsequent account calls use hashValue, never the plain number.
   */
  async getAccountNumbers(userId: string): Promise<SchwabAccountNumbersResponse[]> {
    return this.http.get<SchwabAccountNumbersResponse[]>(userId, '/accounts/accountNumbers');
  }

  /**
   * Fetch full account details with positions.
   */
  async getAccount(userId: string, hashValue: string, includePositions = true): Promise<SchwabAccountDetail> {
    const params = includePositions ? { fields: 'positions' } : undefined;
    return this.http.get<SchwabAccountDetail>(userId, `/accounts/${hashValue}`, params);
  }

  /**
   * Fetch all accounts for user (useful for initial sync).
   */
  async getAllAccounts(userId: string): Promise<SchwabAccountDetail[]> {
    return this.http.get<SchwabAccountDetail[]>(userId, '/accounts', { fields: 'positions' });
  }

  /**
   * Fetch transaction history for an account.
   * Schwab supports up to 1 year of history.
   */
  async getTransactions(
    userId: string,
    hashValue: string,
    startDate: string, // ISO 8601: "2025-01-01T00:00:00.000Z"
    endDate: string,
    types?: string,    // e.g. "TRADE,DIVIDEND_OR_INTEREST"
  ): Promise<SchwabTransaction[]> {
    return this.http.get<SchwabTransaction[]>(userId, `/accounts/${hashValue}/transactions`, {
      startDate,
      endDate,
      types,
    });
  }

  async getTransaction(
    userId: string,
    hashValue: string,
    transactionId: string,
  ): Promise<SchwabTransaction> {
    return this.http.get<SchwabTransaction>(
      userId,
      `/accounts/${hashValue}/transactions/${transactionId}`,
    );
  }

  async getUserPreference(userId: string): Promise<any> {
    return this.http.get(userId, '/userPreference');
  }
}
```

### 2.4 `SchwabOrderService`

```typescript
// schwab-order.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SchwabHttpClient } from './schwab-http.client';
import { PlaceSchwabOrderDto } from './dto/schwab-order.dto';
import { SchwabOrder, SchwabOrderPreview } from './interfaces/schwab-api.interfaces';

@Injectable()
export class SchwabOrderService {
  private readonly logger = new Logger(SchwabOrderService.name);

  constructor(private readonly http: SchwabHttpClient) {}

  async getOrdersForAccount(
    userId: string,
    hashValue: string,
    fromEnteredTime?: string,
    toEnteredTime?: string,
    status?: string,
    maxResults = 100,
  ): Promise<SchwabOrder[]> {
    return this.http.get<SchwabOrder[]>(userId, `/accounts/${hashValue}/orders`, {
      fromEnteredTime,
      toEnteredTime,
      status,
      maxResults,
    });
  }

  async getAllOrders(
    userId: string,
    fromEnteredTime?: string,
    toEnteredTime?: string,
    status?: string,
  ): Promise<SchwabOrder[]> {
    return this.http.get<SchwabOrder[]>(userId, '/orders', {
      fromEnteredTime,
      toEnteredTime,
      status,
    });
  }

  /** Preview order — validates and returns filled/estimated values WITHOUT placing */
  async previewOrder(
    userId: string,
    hashValue: string,
    order: PlaceSchwabOrderDto,
  ): Promise<SchwabOrderPreview> {
    return this.http.post<SchwabOrderPreview>(
      userId,
      `/accounts/${hashValue}/previewOrder`,
      order,
    );
  }

  /** Place a live order — always preview first in the UI workflow */
  async placeOrder(
    userId: string,
    hashValue: string,
    order: PlaceSchwabOrderDto,
  ): Promise<void> {
    // POST returns 201 with no body; orderId comes from Location header
    // The SchwabHttpClient will need to expose raw response for this endpoint
    await this.http.post(userId, `/accounts/${hashValue}/orders`, order);
    this.logger.log(`Order placed for account hash ${hashValue.slice(0, 8)}...`);
  }

  async replaceOrder(
    userId: string,
    hashValue: string,
    orderId: string,
    order: PlaceSchwabOrderDto,
  ): Promise<void> {
    await this.http.put(userId, `/accounts/${hashValue}/orders/${orderId}`, order);
  }

  async cancelOrder(userId: string, hashValue: string, orderId: string): Promise<void> {
    await this.http.delete(userId, `/accounts/${hashValue}/orders/${orderId}`);
    this.logger.log(`Order ${orderId} cancelled`);
  }
}
```

### 2.5 `SchwabMarketDataService`

```typescript
// schwab-market-data.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SchwabHttpClient } from './schwab-http.client';
import {
  SchwabQuote,
  SchwabPriceHistory,
  SchwabOptionChain,
} from './interfaces/schwab-api.interfaces';

@Injectable()
export class SchwabMarketDataService {
  private readonly logger = new Logger(SchwabMarketDataService.name);

  constructor(private readonly http: SchwabHttpClient) {}

  /** Batch quotes — up to 500 symbols in one call */
  async getQuotes(
    userId: string,
    symbols: string[],
    fields?: string,    // e.g. "quote,reference"
    indicative = false,
  ): Promise<Record<string, SchwabQuote>> {
    return this.http.get<Record<string, SchwabQuote>>(
      userId,
      '/quotes',
      { symbols: symbols.join(','), fields, indicative },
      true, // isMarketData
    );
  }

  async getQuote(userId: string, symbol: string): Promise<SchwabQuote> {
    return this.http.get<SchwabQuote>(userId, `/quotes/${symbol}`, undefined, true);
  }

  /**
   * Historical OHLCV — up to 15 years daily, 6 months intraday.
   * frequencyType: minute | daily | weekly | monthly
   */
  async getPriceHistory(
    userId: string,
    symbol: string,
    periodType: 'day' | 'month' | 'year' | 'ytd',
    period?: number,
    frequencyType?: 'minute' | 'daily' | 'weekly' | 'monthly',
    frequency?: number,
    startDate?: number, // epoch ms
    endDate?: number,
    needExtendedHoursData = false,
  ): Promise<SchwabPriceHistory> {
    return this.http.get<SchwabPriceHistory>(
      userId,
      '/pricehistory',
      { symbol, periodType, period, frequencyType, frequency, startDate, endDate, needExtendedHoursData },
      true,
    );
  }

  async getOptionChain(
    userId: string,
    symbol: string,
    contractType?: 'CALL' | 'PUT' | 'ALL',
    strikeCount?: number,
    includeUnderlyingQuote = true,
    strategy?: string,
    range?: string,
    expMonth?: string,
    optionType?: string,
  ): Promise<SchwabOptionChain> {
    return this.http.get<SchwabOptionChain>(
      userId,
      '/chains',
      { symbol, contractType, strikeCount, includeUnderlyingQuote, strategy, range, expMonth, optionType },
      true,
    );
  }

  async getExpirationChain(userId: string, symbol: string): Promise<any> {
    return this.http.get(userId, '/expirationchain', { symbol }, true);
  }

  async getMarketHours(userId: string, markets: string, date?: string): Promise<any> {
    return this.http.get(userId, '/markets', { markets, date }, true);
  }

  async getMovers(
    userId: string,
    symbolId: string, // e.g. "$SPX", "$COMPX", "$DJI"
    sort?: 'VOLUME' | 'TRADES' | 'PERCENT_CHANGE_UP' | 'PERCENT_CHANGE_DOWN',
    frequency?: number,
  ): Promise<any> {
    return this.http.get(userId, `/movers/${symbolId}`, { sort, frequency }, true);
  }

  async searchInstruments(userId: string, symbol: string, projection: string): Promise<any> {
    return this.http.get(userId, '/instruments', { symbol, projection }, true);
  }

  async getInstrumentByCUSIP(userId: string, cusipId: string): Promise<any> {
    return this.http.get(userId, `/instruments/${cusipId}`, undefined, true);
  }
}
```

### 2.6 `SchwabSyncService`

Orchestrates all scheduled syncs using `@nestjs/schedule`.

```typescript
// schwab-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchwabAccountService } from './schwab-account.service';
import { SchwabAuthService } from './schwab-auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchwabToken } from './entities/schwab-token.entity';
import { CustodianAccountLink } from '../entities/custodian-account-link.entity';

@Injectable()
export class SchwabSyncService {
  private readonly logger = new Logger(SchwabSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly accountService: SchwabAccountService,
    @InjectRepository(SchwabToken)
    private readonly tokenRepo: Repository<SchwabToken>,
    @InjectRepository(CustodianAccountLink)
    private readonly accountLinkRepo: Repository<CustodianAccountLink>,
  ) {}

  /**
   * Every 15 minutes during US market hours (Mon-Fri 9:30 AM - 4:00 PM ET)
   */
  @Cron('0,15,30,45 14-20 * * 1-5') // UTC equivalent of ET market hours
  async syncDuringMarketHours() {
    await this.syncAllAdvisors('market_hours');
  }

  /**
   * Hourly outside market hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncAfterHours() {
    if (this.isMarketOpen()) return; // Handled by the 15-min cron
    await this.syncAllAdvisors('after_hours');
  }

  private async syncAllAdvisors(trigger: string) {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    const activeTokens = await this.tokenRepo.find({ where: { status: 'ACTIVE' } });
    this.logger.log(`Starting ${trigger} sync for ${activeTokens.length} advisors`);

    for (const token of activeTokens) {
      try {
        await this.syncAdvisorAccounts(token.userId);
      } catch (err) {
        this.logger.error(`Sync failed for user ${token.userId}: ${err.message}`);
      }
    }

    this.isSyncing = false;
  }

  async syncAdvisorAccounts(userId: string): Promise<void> {
    // 1. Get account number → hash value mapping
    const accountNumbers = await this.accountService.getAccountNumbers(userId);

    for (const { accountNumber, hashValue } of accountNumbers) {
      // 2. Upsert the hash value mapping
      await this.accountLinkRepo.upsert(
        {
          userId,
          custodian: 'SCHWAB',
          custodianAccountNumber: accountNumber,
          custodianHashValue: hashValue,
          lastSyncedAt: new Date(),
        },
        ['custodianAccountNumber', 'custodian'],
      );

      // 3. Fetch full account detail + positions
      const accountDetail = await this.accountService.getAccount(userId, hashValue);
      // TODO: map accountDetail → internal account / position records
      await this.persistAccountData(accountDetail, hashValue, userId);
    }
  }

  private async persistAccountData(accountDetail: any, hashValue: string, userId: string): Promise<void> {
    // Map Schwab account structure to internal models and upsert
    // Implementation depends on your internal Account / Position entity structure
    this.logger.debug(`Persisting data for hash ${hashValue.slice(0, 8)}...`);
  }

  private isMarketOpen(): boolean {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const dayOfWeek = now.getUTCDay();
    // Mon-Fri, 14:30–21:00 UTC (9:30 AM – 4:00 PM ET, approximate, no DST handling)
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const utcMinutes = utcHour * 60 + utcMinute;
    return utcMinutes >= 870 && utcMinutes <= 1260; // 14:30–21:00
  }
}
```

---

## 3. Account Sync Strategy

### 3.1 Hash Value Architecture

**Critical:** Every account-specific Schwab API call requires the **hash value** of the account number, not the actual number. The hash value is obtained from `GET /accounts/accountNumbers`, which returns:

```json
[
  {
    "accountNumber": "123456789",
    "hashValue": "ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890"
  }
]
```

The mapping is stored in `custodian_account_links.custodian_hash_value` and refreshed on every sync. Hash values are stable across sessions, but always refresh them on initial connect and after any re-authorization.

### 3.2 Initial Sync Flow

When an advisor first connects their Schwab account:

1. **Trigger:** OAuth callback completes successfully
2. **Fetch account numbers + hash values** from `/accounts/accountNumbers`
3. **For each account:**
   a. Upsert to `custodian_account_links` with hash value
   b. Call `GET /accounts/{hashValue}?fields=positions` for full detail
   c. Map Schwab account types to internal account types (e.g., `INDIVIDUAL`, `JOINT_TENANTS`, `TRADITIONAL_IRA`)
   d. Upsert positions to internal `positions` table
   e. Fetch last 90 days of transactions
4. **Update sync status** to `SYNCED` in `custodian_account_links`
5. **Trigger streaming subscriptions** for all held symbols

### 3.3 Scheduled Sync Cadence

| Period | Frequency | Trigger |
|--------|-----------|---------|
| Market hours (9:30 AM–4:00 PM ET, Mon–Fri) | Every 15 minutes | Cron |
| Pre/post-market (4:00 AM–9:30 AM, 4:00 PM–8:00 PM ET) | Every 30 minutes | Cron |
| After hours / weekends | Every 60 minutes | Cron |
| Manual | On-demand | Advisor action |

### 3.4 Conflict Resolution

When Schwab data differs from local data:

| Conflict Type | Resolution |
|---------------|------------|
| Position quantity mismatch | Schwab is authoritative; overwrite local |
| Cash balance difference | Schwab is authoritative; log difference |
| Transaction already exists | Skip (idempotent upsert by `transactionId`) |
| Order status changed externally | Update local order status; notify advisor |
| Account closed in Schwab | Mark local account as `CLOSED`; preserve history |

Always log conflicts to `custodian_sync_logs` with the before/after values.

### 3.5 Transaction Sync

```typescript
// Sync transactions for the last 30 days (or since last sync)
async syncTransactions(userId: string, hashValue: string, since: Date): Promise<void> {
  const transactions = await this.accountService.getTransactions(
    userId,
    hashValue,
    since.toISOString(),
    new Date().toISOString(),
  );

  for (const tx of transactions) {
    await this.transactionRepo.upsert(
      {
        externalId: String(tx.activityId),
        custodian: 'SCHWAB',
        accountHashValue: hashValue,
        type: tx.type,
        tradeDate: new Date(tx.tradeDate),
        settleDate: new Date(tx.settlementDate),
        netAmount: tx.netAmount,
        fees: tx.transactionItem?.fee ?? 0,
        rawData: tx, // store full Schwab payload for audit
      },
      ['externalId', 'custodian'],
    );
  }
}
```

---

## 4. Market Data Strategy

### 4.1 Real-time vs. Cached Data

| Data Type | Source | Cache Strategy |
|-----------|--------|----------------|
| Level 1 quotes (current holdings) | WebSocket stream | In-memory + Supabase Realtime push |
| Quotes for search / on-demand | REST `/quotes` batch | 15-second cache |
| Daily OHLCV history | REST `/pricehistory` | Stored in `price_history` table; refresh nightly |
| Intraday bars (1-min, 5-min) | WebSocket chart stream | In-memory only; not persisted |
| Option chains | REST `/chains` | Not cached; on-demand only |
| Market hours | REST `/markets` | Cached daily |

### 4.2 Batch Quote Updates

For accounts with many holdings, batch quotes efficiently:

```typescript
async refreshPortfolioQuotes(userId: string, symbols: string[]): Promise<void> {
  // Schwab /quotes accepts up to ~500 symbols per call
  const BATCH_SIZE = 200;
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const quotes = await this.marketDataService.getQuotes(userId, batch);
    await this.cacheQuotes(quotes);
  }
}
```

### 4.3 Price History Storage

Store OHLCV data in the `price_history` table for portfolio analytics, performance charts, and TWR calculations. Refresh daily after 6:00 PM ET:

```sql
-- price_history table (see Section 11)
-- Indexed on (symbol, date) for fast range queries
-- Partitioned by year for large datasets (optional)
```

```typescript
@Cron('0 23 * * 1-5') // 6 PM ET = 23:00 UTC
async refreshDailyPriceHistory() {
  const symbols = await this.getDistinctHeldSymbols();
  for (const symbol of symbols) {
    const history = await this.marketDataService.getPriceHistory(
      this.systemUserId, // Use first active advisor token
      symbol,
      'year',
      1,
      'daily',
      1,
    );
    await this.upsertPriceHistory(symbol, history.candles);
  }
}
```

### 4.4 Market Hours Awareness

Cache market hours at startup and daily refresh. Use this to:
- Start/stop WebSocket streaming
- Skip API calls when all markets are closed
- Show "market closed" indicators in the UI

```typescript
async isEquityMarketOpen(): Promise<boolean> {
  const hours = await this.marketDataService.getMarketHours(
    this.systemUserId,
    'equity',
    new Date().toISOString().split('T')[0],
  );
  return hours?.equity?.EQ?.isOpen ?? false;
}
```

---

## 5. Order Management

### 5.1 Order Placement Workflow

The workflow enforces an advisory preview step before any live order is submitted:

```
Advisor creates order in UI
         │
         ▼
POST /accounts/{hash}/previewOrder
  Returns estimated fill, fees, warnings
         │
         ▼
Advisor reviews preview in UI (confirm/cancel)
         │ (confirm)
         ▼
Compliance check (pre-trade: position limits, restricted securities)
         │ (pass)
         ▼
POST /accounts/{hash}/orders
  Schwab returns 201 with Location: /accounts/{hash}/orders/{orderId}
         │
         ▼
Poll GET /accounts/{hash}/orders/{orderId}
  Track status: AWAITING_PARENT_ORDER → WORKING → FILLED/CANCELLED/REJECTED
         │
         ▼
WebSocket account_activity stream delivers fill confirmations in real-time
```

### 5.2 Order Status States

| Schwab Status | Description | Internal Status |
|---------------|-------------|-----------------|
| `AWAITING_PARENT_ORDER` | Conditional order waiting for parent | `PENDING` |
| `AWAITING_CONDITION` | OCO/OTO waiting for condition | `PENDING` |
| `AWAITING_STOP_CONDITION` | Stop order not yet triggered | `PENDING` |
| `AWAITING_MANUAL_REVIEW` | Needs Schwab manual review | `REVIEW` |
| `ACCEPTED` | Order accepted | `ACCEPTED` |
| `PENDING_ACTIVATION` | Pre-market/post-market waiting | `PENDING` |
| `QUEUED` | Queued for transmission | `QUEUED` |
| `WORKING` | Live order in market | `WORKING` |
| `REJECTED` | Order rejected | `REJECTED` |
| `PENDING_CANCEL` | Cancel request submitted | `CANCELLING` |
| `CANCELLED` | Order cancelled | `CANCELLED` |
| `PENDING_REPLACE` | Replace request submitted | `REPLACING` |
| `REPLACED` | Original order replaced | `REPLACED` |
| `FILLED` | Fully filled | `FILLED` |
| `EXPIRED` | Order expired (e.g., DAY order end) | `EXPIRED` |

### 5.3 Order DTO

```typescript
// dto/schwab-order.dto.ts
import { IsEnum, IsNumber, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP',
  MARKET_ON_CLOSE = 'MARKET_ON_CLOSE',
  LIMIT_ON_CLOSE = 'LIMIT_ON_CLOSE',
}

export enum OrderSession {
  NORMAL = 'NORMAL',
  AM = 'AM',      // Pre-market
  PM = 'PM',      // Post-market
  SEAMLESS = 'SEAMLESS', // Pre + regular + post
}

export enum OrderDuration {
  DAY = 'DAY',
  GOOD_TILL_CANCEL = 'GOOD_TILL_CANCEL',
  FILL_OR_KILL = 'FILL_OR_KILL',
  IMMEDIATE_OR_CANCEL = 'IMMEDIATE_OR_CANCEL',
  END_OF_WEEK = 'END_OF_WEEK',
  END_OF_MONTH = 'END_OF_MONTH',
  NEXT_END_OF_MONTH = 'NEXT_END_OF_MONTH',
}

export enum OrderStrategyType {
  SINGLE = 'SINGLE',
  OCO = 'OCO',       // One-cancels-other
  TRIGGER = 'TRIGGER', // One-triggers-other
}

export enum AssetType {
  EQUITY = 'EQUITY',
  OPTION = 'OPTION',
}

export enum Instruction {
  BUY = 'BUY',
  SELL = 'SELL',
  SELL_SHORT = 'SELL_SHORT',
  BUY_TO_COVER = 'BUY_TO_COVER',
  BUY_TO_OPEN = 'BUY_TO_OPEN',
  BUY_TO_CLOSE = 'BUY_TO_CLOSE',
  SELL_TO_OPEN = 'SELL_TO_OPEN',
  SELL_TO_CLOSE = 'SELL_TO_CLOSE',
}

export class OrderInstrumentDto {
  @IsString()
  symbol: string;

  @IsEnum(AssetType)
  assetType: AssetType;
}

export class OrderLegDto {
  @IsEnum(Instruction)
  instruction: Instruction;

  @IsNumber()
  quantity: number;

  @ValidateNested()
  @Type(() => OrderInstrumentDto)
  instrument: OrderInstrumentDto;
}

export class PlaceSchwabOrderDto {
  @IsEnum(OrderType)
  orderType: OrderType;

  @IsEnum(OrderSession)
  session: OrderSession;

  @IsEnum(OrderDuration)
  duration: OrderDuration;

  @IsEnum(OrderStrategyType)
  orderStrategyType: OrderStrategyType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLegDto)
  orderLegCollection: OrderLegDto[];

  @IsOptional()
  @IsNumber()
  price?: number; // Limit price

  @IsOptional()
  @IsNumber()
  stopPrice?: number;

  @IsOptional()
  @IsNumber()
  stopPriceOffset?: number;

  @IsOptional()
  @IsString()
  stopPriceLinkBasis?: 'LAST' | 'BID' | 'ASK' | 'MARK';

  @IsOptional()
  @IsString()
  stopPriceLinkType?: 'VALUE' | 'PERCENT';

  @IsOptional()
  @IsString()
  complexOrderStrategyType?: string; // 'NONE', 'COVERED', 'VERTICAL', 'CUSTOM', etc.

  @IsOptional()
  childOrderStrategies?: PlaceSchwabOrderDto[]; // For OCO / OTO
}
```

### 5.4 Order Examples

**Market order — buy 100 shares of AAPL:**
```json
{
  "orderType": "MARKET",
  "session": "NORMAL",
  "duration": "DAY",
  "orderStrategyType": "SINGLE",
  "orderLegCollection": [
    {
      "instruction": "BUY",
      "quantity": 100,
      "instrument": { "symbol": "AAPL", "assetType": "EQUITY" }
    }
  ]
}
```

**OCO — sell at target or stop:**
```json
{
  "orderStrategyType": "OCO",
  "childOrderStrategies": [
    {
      "orderType": "LIMIT",
      "session": "NORMAL",
      "price": "185.00",
      "duration": "GOOD_TILL_CANCEL",
      "orderStrategyType": "SINGLE",
      "orderLegCollection": [
        { "instruction": "SELL", "quantity": 100, "instrument": { "symbol": "AAPL", "assetType": "EQUITY" } }
      ]
    },
    {
      "orderType": "STOP",
      "session": "NORMAL",
      "stopPrice": "170.00",
      "duration": "GOOD_TILL_CANCEL",
      "orderStrategyType": "SINGLE",
      "orderLegCollection": [
        { "instruction": "SELL", "quantity": 100, "instrument": { "symbol": "AAPL", "assetType": "EQUITY" } }
      ]
    }
  ]
}
```

---

## 6. Streaming Implementation

### 6.1 Architecture Overview

Schwab's streaming API is a **WebSocket-based protocol** accessed at a URL obtained from `GET /userPreference`. The stream requires:
1. An initial `LOGIN` request with the access token
2. Subscription requests for specific services (LEVELONE_EQUITIES, CHART_EQUITY, ACCT_ACTIVITY, etc.)
3. Heartbeat handling to detect stale connections

The `SchwabStreamingService` in NestJS:
- Maintains a single WebSocket connection per active session
- Routes incoming messages to registered handlers
- Forwards updates to Supabase Realtime channels for the frontend
- Reconnects automatically with exponential backoff on disconnect

### 6.2 `SchwabStreamingService`

```typescript
// schwab-streaming.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import { SchwabAccountService } from './schwab-account.service';
import { SchwabAuthService } from './schwab-auth.service';
import { SchwabMarketDataCacheService } from './schwab-market-data-cache.service';

interface StreamRequest {
  service: string;
  command: 'SUBS' | 'ADD' | 'UNSUBS' | 'VIEW';
  requestid: string;
  SchwabClientCustomerId: string;
  SchwabClientCorrelId: string;
  parameters: Record<string, any>;
}

@Injectable()
export class SchwabStreamingService implements OnModuleDestroy {
  private readonly logger = new Logger(SchwabStreamingService.name);
  private ws: WebSocket | null = null;
  private requestIdCounter = 0;
  private streamerInfo: any = null;
  private reconnectAttempt = 0;
  private isConnected = false;
  private subscribedSymbols = new Set<string>();
  private messageHandlers = new Map<string, (data: any) => void>();
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  constructor(
    private readonly authService: SchwabAuthService,
    private readonly accountService: SchwabAccountService,
    private readonly cacheService: SchwabMarketDataCacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Connect to Schwab streaming. Call after OAuth and during market hours.
   */
  async connect(userId: string): Promise<void> {
    // 1. Retrieve streamer connection info from userPreference
    const userPref = await this.accountService.getUserPreference(userId);
    this.streamerInfo = userPref.streamerInfo?.[0];

    if (!this.streamerInfo?.streamerSocketUrl) {
      throw new Error('No streamer URL found in userPreference');
    }

    const accessToken = await this.authService.getValidAccessToken(userId);
    await this.openWebSocket(accessToken, userId);
  }

  private async openWebSocket(accessToken: string, userId: string): Promise<void> {
    const url = this.streamerInfo.streamerSocketUrl;
    this.logger.log(`Connecting to Schwab stream: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on('open', async () => {
      this.logger.log('WebSocket connection opened');
      await this.sendLoginRequest(accessToken);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(JSON.parse(data.toString()));
    });

    this.ws.on('close', (code, reason) => {
      this.isConnected = false;
      this.clearPing();
      this.logger.warn(`Stream closed (code: ${code}, reason: ${reason})`);
      this.scheduleReconnect(userId);
    });

    this.ws.on('error', (err) => {
      this.logger.error(`Stream error: ${err.message}`);
    });
  }

  private async sendLoginRequest(accessToken: string): Promise<void> {
    const loginRequest = {
      requests: [
        {
          service: 'ADMIN',
          command: 'LOGIN',
          requestid: '0',
          SchwabClientCustomerId: this.streamerInfo.schwabClientCustomerId,
          SchwabClientCorrelId: this.streamerInfo.schwabClientCorrelId,
          parameters: {
            Authorization: accessToken,
            SchwabClientChannel: this.streamerInfo.schwabClientChannel,
            SchwabClientFunctionId: this.streamerInfo.schwabClientFunctionId,
          },
        },
      ],
    };

    this.ws?.send(JSON.stringify(loginRequest));
  }

  private handleMessage(message: any): void {
    // Handle login response
    if (message.response) {
      for (const resp of message.response) {
        if (resp.service === 'ADMIN' && resp.command === 'LOGIN') {
          if (resp.content?.code === 0) {
            this.isConnected = true;
            this.reconnectAttempt = 0;
            this.logger.log('Stream login successful');
            this.startPing();
            this.resubscribeAll(); // Re-subscribe if reconnecting
          } else {
            this.logger.error(`Stream login failed: ${JSON.stringify(resp.content)}`);
          }
        }
      }
    }

    // Handle data
    if (message.data) {
      for (const dataItem of message.data) {
        const handler = this.messageHandlers.get(dataItem.service);
        if (handler) {
          handler(dataItem.content);
        }
      }
    }

    // Handle heartbeat / notify
    if (message.notify) {
      // Heartbeat — no action needed, WebSocket is alive
    }
  }

  /**
   * Subscribe to Level 1 equity quotes for an array of symbols.
   * Fields: 0=key, 1=bid, 2=ask, 3=last, 4=cumVol, 8=high, 9=low, 31=close, 48=mark
   */
  async subscribeEquityQuotes(symbols: string[]): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Cannot subscribe — stream not connected');
      return;
    }

    symbols.forEach((s) => this.subscribedSymbols.add(s));

    // Register handler for incoming quote data
    this.messageHandlers.set('LEVELONE_EQUITIES', (content: any[]) => {
      for (const quote of content) {
        this.cacheService.updateQuote(quote.key, {
          bid: quote['1'],
          ask: quote['2'],
          last: quote['3'],
          volume: quote['4'],
          high: quote['8'],
          low: quote['9'],
          close: quote['31'],
          mark: quote['48'],
        });
        // Emit to Supabase Realtime (see Section 6.3)
      }
    });

    this.sendStreamRequest({
      service: 'LEVELONE_EQUITIES',
      command: 'ADD',
      parameters: {
        keys: symbols.join(','),
        fields: '0,1,2,3,4,8,9,31,48',
      },
    });
  }

  async subscribeAccountActivity(): Promise<void> {
    this.messageHandlers.set('ACCT_ACTIVITY', (content: any[]) => {
      for (const activity of content) {
        this.logger.log(`Account activity: ${JSON.stringify(activity)}`);
        // Parse fill/order confirmations and update order status
        // Emit order_update event to Supabase Realtime
      }
    });

    this.sendStreamRequest({
      service: 'ACCT_ACTIVITY',
      command: 'SUBS',
      parameters: {
        keys: 'Account Activity',
        fields: '0,1,2,3',
      },
    });
  }

  async unsubscribeSymbols(symbols: string[]): Promise<void> {
    symbols.forEach((s) => this.subscribedSymbols.delete(s));
    this.sendStreamRequest({
      service: 'LEVELONE_EQUITIES',
      command: 'UNSUBS',
      parameters: { keys: symbols.join(',') },
    });
  }

  private sendStreamRequest(partial: Partial<StreamRequest>): void {
    const request = {
      requests: [
        {
          service: partial.service,
          command: partial.command,
          requestid: String(++this.requestIdCounter),
          SchwabClientCustomerId: this.streamerInfo.schwabClientCustomerId,
          SchwabClientCorrelId: this.streamerInfo.schwabClientCorrelId,
          parameters: partial.parameters ?? {},
        },
      ],
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request));
    } else {
      this.logger.warn('Attempted to send on closed WebSocket');
    }
  }

  private resubscribeAll(): void {
    if (this.subscribedSymbols.size > 0) {
      this.subscribeEquityQuotes([...this.subscribedSymbols]);
    }
    this.subscribeAccountActivity();
  }

  private scheduleReconnect(userId: string): void {
    if (this.reconnectAttempt >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Max reconnect attempts reached. Giving up on stream.');
      return;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 60000); // cap at 60s
    this.reconnectAttempt++;
    this.logger.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);

    setTimeout(async () => {
      try {
        await this.connect(userId);
      } catch (err) {
        this.logger.error(`Reconnect failed: ${err.message}`);
        this.scheduleReconnect(userId);
      }
    }, delay);
  }

  private startPing(): void {
    // Send a heartbeat every 20 seconds to prevent connection timeout
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 20_000);
  }

  private clearPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  async disconnect(): Promise<void> {
    this.clearPing();
    this.ws?.close(1000, 'Normal closure');
    this.ws = null;
    this.isConnected = false;
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
```

### 6.3 Supabase Realtime Integration

When the stream receives quote updates, push them to the frontend via Supabase Realtime:

```typescript
// In SchwabMarketDataCacheService or a Supabase event emitter service
import { createClient } from '@supabase/supabase-js';

// In schwab-market-data-cache.service.ts
async updateQuote(symbol: string, quote: Partial<QuoteData>): Promise<void> {
  // Update in-memory cache
  this.quoteCache.set(symbol, { ...this.quoteCache.get(symbol), ...quote, updatedAt: Date.now() });

  // Write to market_data_cache table — Supabase Realtime will broadcast to frontend
  await this.supabase
    .from('market_data_cache')
    .upsert({ symbol, ...quote, updated_at: new Date().toISOString() }, { onConflict: 'symbol' });
}
```

The Next.js frontend subscribes to the `market_data_cache` Supabase channel:

```typescript
// frontend: hooks/useRealtimeQuotes.ts
const channel = supabase
  .channel('market-data')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'market_data_cache' }, 
    (payload) => updateLocalQuote(payload.new))
  .subscribe();
```

### 6.4 Market Hours Streaming Schedule

```typescript
// In SchwabSyncService
@Cron('30 13 * * 1-5') // 9:30 AM ET = 13:30 UTC
async startMarketHoursStream() {
  await this.streamingService.connect(this.getSystemUserId());
  const symbols = await this.getDistinctHeldSymbols();
  await this.streamingService.subscribeEquityQuotes(symbols);
  await this.streamingService.subscribeAccountActivity();
}

@Cron('0 20 * * 1-5') // 4:00 PM ET = 20:00 UTC
async stopMarketHoursStream() {
  await this.streamingService.disconnect();
}
```

---

## 7. Error Handling & Rate Limiting

### 7.1 Rate Limits

| Limit Type | Value | Notes |
|------------|-------|-------|
| REST requests | ~120 / minute | Rolling window; 429-001 = rate limit hit |
| Order requests (PUT/POST/DELETE) | 0–120 / minute | Configurable in developer portal |
| Burst limit | Varies | 429-005 = burst exceeded; back off 60s |
| WebSocket subscriptions | No hard limit documented | Use ADD command to append; avoid mass SUBS resets |

### 7.2 Exponential Backoff Logic

Already implemented in `SchwabHttpClient` (Section 2.2). Key parameters:

```typescript
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 32000;
const JITTER = () => Math.random() * 500; // Add jitter to prevent thundering herd

const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS) + JITTER();
```

On 429-005 (burst), back off for the full 60 seconds before retrying.

### 7.3 Circuit Breaker Pattern

Use `opossum` library for circuit breaking on the Schwab HTTP client:

```typescript
import * as CircuitBreaker from 'opossum';

const circuitBreakerOptions = {
  timeout: 10000,          // Request timeout: 10s
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000,     // Try again after 30s
  volumeThreshold: 5,      // Minimum requests before circuit can open
};

const breaker = new CircuitBreaker(
  (config: AxiosRequestConfig) => firstValueFrom(this.httpService.request(config)),
  circuitBreakerOptions,
);

breaker.on('open', () => this.logger.error('Schwab API circuit breaker OPEN'));
breaker.on('halfOpen', () => this.logger.warn('Schwab API circuit breaker HALF-OPEN'));
breaker.on('close', () => this.logger.log('Schwab API circuit breaker CLOSED'));
```

### 7.4 Error Logging

All Schwab API interactions are logged to `custodian_sync_logs`:

```typescript
// Log structure
interface SchwabSyncLog {
  id: string;
  userId: string;
  custodian: 'SCHWAB';
  operation: string;          // e.g. 'SYNC_ACCOUNTS', 'PLACE_ORDER'
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errorCode?: string;          // HTTP status or Schwab error code
  errorMessage?: string;       // Sanitized — no tokens, no account numbers
  durationMs: number;
  recordsProcessed?: number;
  createdAt: Date;
}
```

**Never log:**
- Access or refresh tokens
- Full account numbers (log only last 4 digits)
- Client secrets
- Any PII beyond user ID

### 7.5 Alerting Strategy

Alert via Supabase Edge Function or NestJS webhook when:

| Condition | Alert Level |
|-----------|-------------|
| Sync failed 3 consecutive times for a user | WARNING |
| Sync failed 5 consecutive times for a user | CRITICAL (email advisor + admin) |
| Refresh token expired | WARNING (prompt re-connection in UI) |
| Circuit breaker opens | CRITICAL |
| Order placement failed | IMMEDIATE (email advisor) |
| All sync disabled (market hours, no active tokens) | INFO |

---

## 8. Data Flow Diagrams

### 8.1 OAuth Authentication Flow

```
Advisor (Browser)           CRM Backend (NestJS)          Schwab OAuth Server
       │                           │                              │
       │  GET /schwab/oauth/connect│                              │
       │──────────────────────────▶│                              │
       │                           │ Build auth URL               │
       │                           │ (store userId in cache)      │
       │  302 Redirect to Schwab   │                              │
       │◀──────────────────────────│                              │
       │                           │                              │
       │  GET /oauth/authorize     │                              │
       │─────────────────────────────────────────────────────────▶│
       │  (Login to Schwab,        │                              │
       │   select accounts)        │                              │
       │                           │                              │
       │  302 → /schwab/oauth/callback?code=...                   │
       │◀─────────────────────────────────────────────────────────│
       │                           │                              │
       │  GET /schwab/oauth/callback?code={code}                  │
       │──────────────────────────▶│                              │
       │                           │ Decode %40 → @               │
       │                           │ POST /oauth/token            │
       │                           │ (Basic Auth, code exchange)  │
       │                           │─────────────────────────────▶│
       │                           │◀─────────────────────────────│
       │                           │  { access_token,             │
       │                           │    refresh_token,            │
       │                           │    expires_in: 1800 }        │
       │                           │ Encrypt & store tokens       │
       │                           │ Trigger initial account sync │
       │  302 /settings?connected  │                              │
       │◀──────────────────────────│                              │
```

### 8.2 Account Sync Data Flow

```
SchwabSyncService (Cron)
       │
       ├─ GET /accounts/accountNumbers
       │     └─ Returns: [{ accountNumber, hashValue }]
       │           │
       │           ▼
       │     Upsert → custodian_account_links (store hashValue)
       │
       ├─ For each account hash:
       │     GET /accounts/{hashValue}?fields=positions
       │           │
       │           ▼
       │     Map Schwab → Internal models
       │           │
       │           ├─ Upsert → accounts table
       │           ├─ Upsert → positions table
       │           └─ Upsert → balances table
       │
       ├─ For each account hash:
       │     GET /accounts/{hashValue}/transactions
       │           │
       │           ▼
       │     Upsert → transactions table (idempotent by externalId)
       │
       └─ Update custodian_sync_logs (SUCCESS / FAILURE)
```

### 8.3 Real-time Streaming Data Flow

```
Schwab WebSocket Stream
       │
       │  (Market hours only: 9:30 AM – 4:00 PM ET)
       │
       ├─ LEVELONE_EQUITIES updates
       │       │
       │       ▼
       │  SchwabStreamingService.handleMessage()
       │       │
       │       ├─ Update in-memory QuoteCache
       │       │
       │       └─ Upsert → market_data_cache (Supabase table)
       │                         │
       │                         ▼
       │               Supabase Realtime broadcast
       │                         │
       │                         ▼
       │               Next.js frontend updates
       │               (useRealtimeQuotes hook)
       │
       ├─ ACCT_ACTIVITY updates (fills, order status)
       │       │
       │       ▼
       │  Parse order_fill / order_cancel events
       │       │
       │       ├─ Update orders table
       │       └─ Supabase Realtime → Advisor notification
       │
       └─ CHART_EQUITY (1-min bars for active views)
               │
               ▼
         In-memory intraday cache (not persisted)
```

### 8.4 Order Placement Flow

```
Advisor UI                  CRM Backend               Schwab REST API
    │                           │                           │
    │  Submit order form        │                           │
    │──────────────────────────▶│                           │
    │                           │ Validate DTO              │
    │                           │ POST /previewOrder        │
    │                           │──────────────────────────▶│
    │                           │◀──────────────────────────│
    │                           │  { estimatedFill,         │
    │                           │    fees, warnings }       │
    │  Show preview modal       │                           │
    │◀──────────────────────────│                           │
    │                           │                           │
    │  Advisor clicks CONFIRM   │                           │
    │──────────────────────────▶│                           │
    │                           │ Compliance check          │
    │                           │ POST /orders              │
    │                           │──────────────────────────▶│
    │                           │◀──────────────────────────│
    │                           │  201 Location: /orders/id │
    │                           │ Store order in DB         │
    │  Order accepted toast     │                           │
    │◀──────────────────────────│                           │
    │                           │                           │
    │  (WebSocket stream)       │                           │
    │       ┌───────────────────┘                           │
    │       │ ACCT_ACTIVITY: order fill                     │
    │       ▼                                               │
    │  Update order status      │                           │
    │  Realtime notification    │                           │
```

---

## 9. Security

### 9.1 Token Encryption

All Schwab tokens are encrypted before storage using **AES-256-GCM** (authenticated encryption). The encryption key is a 256-bit (32-byte) key stored as an environment variable (`SCHWAB_TOKEN_ENCRYPTION_KEY`), never in the database.

```
Stored format: {iv_hex}:{authTag_hex}:{ciphertext_hex}
Example:       a3f1...8b2c:9d4e...1f70:c72a...3b91
```

Key rotation procedure:
1. Generate new key: `openssl rand -hex 32`
2. Decrypt all tokens with old key, re-encrypt with new key in a transaction
3. Update `SCHWAB_TOKEN_ENCRYPTION_KEY` environment variable
4. Rotate in all deployment environments

### 9.2 API Call Audit Log

Every Schwab API call (read and write) is logged to `schwab_audit_log`:

```sql
CREATE TABLE schwab_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  operation     TEXT NOT NULL,         -- 'GET_ACCOUNTS', 'PLACE_ORDER', etc.
  endpoint      TEXT NOT NULL,         -- '/accounts/{hash}' (hash truncated)
  http_method   TEXT NOT NULL,
  status_code   INTEGER,
  duration_ms   INTEGER,
  advisor_ip    INET,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**Rules:**
- Log endpoint paths with hash values truncated to 8 chars + `...`
- Never log request/response bodies containing account numbers, tokens, or order details
- Log only metadata: method, endpoint pattern, status, duration
- Audit log rows are immutable (no UPDATE/DELETE; use `REVOKE` for RLS)

### 9.3 Network Security

- All Schwab API calls originate from the **NestJS backend only** — never from the Next.js frontend
- The `SCHWAB_APP_KEY` and `SCHWAB_APP_SECRET` are **never exposed to the browser**
- The callback URL must be a backend endpoint, not a frontend URL
- Use Supabase Row Level Security (RLS) on `schwab_tokens` to prevent cross-user access:

```sql
-- RLS policy: advisors can only see their own tokens
CREATE POLICY "Users can access own tokens" ON schwab_tokens
  FOR ALL USING (user_id = auth.uid());
```

### 9.4 Secure Token Refresh

- Token refresh is **deduplicated per user** (the `refreshPromises` map in `SchwabAuthService`) to prevent race conditions where multiple parallel requests all trigger simultaneous refreshes
- If a refresh token is within 24 hours of expiry, proactively notify the advisor to re-authorize
- Lock the token row during refresh using a Supabase advisory lock or database-level transaction to prevent concurrent processes from refreshing simultaneously

---

## 10. NestJS Module Structure

### 10.1 File/Folder Layout

```
backend/src/modules/integrations/schwab/
├── schwab.module.ts
├── schwab-auth.service.ts
├── schwab-auth.controller.ts
├── schwab-account.service.ts
├── schwab-order.service.ts
├── schwab-market-data.service.ts
├── schwab-market-data-cache.service.ts
├── schwab-streaming.service.ts
├── schwab-sync.service.ts
├── schwab-http.client.ts
│
├── dto/
│   ├── schwab-order.dto.ts
│   ├── schwab-account.dto.ts
│   └── schwab-quote.dto.ts
│
├── entities/
│   ├── schwab-token.entity.ts
│   └── schwab-account-cache.entity.ts
│
├── guards/
│   └── schwab-auth.guard.ts
│
├── interfaces/
│   └── schwab-api.interfaces.ts
│
└── constants/
    └── schwab-api.constants.ts
```

### 10.2 `schwab.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { SchwabAuthService } from './schwab-auth.service';
import { SchwabAuthController } from './schwab-auth.controller';
import { SchwabAccountService } from './schwab-account.service';
import { SchwabOrderService } from './schwab-order.service';
import { SchwabMarketDataService } from './schwab-market-data.service';
import { SchwabMarketDataCacheService } from './schwab-market-data-cache.service';
import { SchwabStreamingService } from './schwab-streaming.service';
import { SchwabSyncService } from './schwab-sync.service';
import { SchwabHttpClient } from './schwab-http.client';

import { SchwabToken } from './entities/schwab-token.entity';
import { SchwabAccountCache } from './entities/schwab-account-cache.entity';
import { CustodianAccountLink } from '../entities/custodian-account-link.entity';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 3 }),
    TypeOrmModule.forFeature([SchwabToken, SchwabAccountCache, CustodianAccountLink]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SchwabAuthController],
  providers: [
    SchwabAuthService,
    SchwabAccountService,
    SchwabOrderService,
    SchwabMarketDataService,
    SchwabMarketDataCacheService,
    SchwabStreamingService,
    SchwabSyncService,
    SchwabHttpClient,
  ],
  exports: [
    SchwabAuthService,
    SchwabAccountService,
    SchwabOrderService,
    SchwabMarketDataService,
    SchwabStreamingService,
  ],
})
export class SchwabModule {}
```

### 10.3 `entities/schwab-token.entity.ts`

```typescript
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type TokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

@Entity('schwab_tokens')
export class SchwabToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'encrypted_access_token', type: 'text' })
  encryptedAccessToken: string;

  @Column({ name: 'encrypted_refresh_token', type: 'text' })
  encryptedRefreshToken: string;

  @Column({ name: 'access_token_expires_at', type: 'timestamptz' })
  accessTokenExpiresAt: Date;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamptz' })
  refreshTokenExpiresAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: TokenStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 10.4 `interfaces/schwab-api.interfaces.ts`

```typescript
export interface SchwabAccountNumbersResponse {
  accountNumber: string;
  hashValue: string;
}

export interface SchwabPosition {
  shortQuantity: number;
  averagePrice: number;
  currentDayCost: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longOpenProfitLoss: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  instrument: {
    assetType: string;
    cusip: string;
    symbol: string;
    description: string;
    instrumentId: number;
    netChange: number;
  };
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice: number;
  taxLotAverageLongPrice: number;
  longOpenProfitLossFromCostBasis: number;
  previousSessionLongQuantity: number;
}

export interface SchwabAccountBalance {
  accruedInterest: number;
  cashBalance: number;
  cashReceipts: number;
  longOptionMarketValue: number;
  liquidationValue: number;
  longMarketValue: number;
  moneyMarketFund: number;
  savings: number;
  shortMarketValue: number;
  pendingDeposits: number;
  mutualFundValue: number;
  bondValue: number;
  shortOptionMarketValue: number;
  availableFundsNonMarginableTrade: number;
  availableFunds: number;
  buyingPower: number;
  buyingPowerNonMarginableTrade: number;
  dayTradingBuyingPower: number;
  equity: number;
  equityPercentage: number;
  longMarginValue: number;
  maintenanceCall: number;
  maintenanceRequirement: number;
  marginBalance: number;
  regTCall: number;
  shortBalance: number;
  shortMarginValue: number;
  sma: number;
}

export interface SchwabAccountDetail {
  securitiesAccount: {
    type: string;           // 'MARGIN', 'CASH', 'IRA', etc.
    accountNumber: string;
    roundTrips: number;
    isDayTrader: boolean;
    isClosingOnlyRestricted: boolean;
    pfcbFlag: boolean;
    positions?: SchwabPosition[];
    initialBalances: SchwabAccountBalance;
    currentBalances: SchwabAccountBalance;
    projectedBalances: SchwabAccountBalance;
  };
  aggregatedBalance?: {
    currentLiquidationValue: number;
    liquidationValue: number;
  };
}

export interface SchwabOrder {
  session: string;
  duration: string;
  orderType: string;
  cancelTime?: string;
  complexOrderStrategyType: string;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  requestedDestination: string;
  destinationLinkName: string;
  price?: number;
  stopPrice?: number;
  orderLegCollection: Array<{
    orderLegType: string;
    legId: number;
    instrument: { assetType: string; cusip: string; symbol: string; instrumentId: number };
    instruction: string;
    positionEffect: string;
    quantity: number;
  }>;
  orderStrategyType: string;
  orderId: number;
  cancelable: boolean;
  editable: boolean;
  status: string;
  enteredTime: string;
  closeTime?: string;
  tag?: string;
  accountNumber: string;
  orderActivityCollection?: Array<{
    activityType: string;
    executionType: string;
    quantity: number;
    orderRemainingQuantity: number;
    executionLegs: Array<{
      legId: number;
      price: number;
      quantity: number;
      mismarkedQuantity: number;
      instrumentId: number;
      time: string;
    }>;
  }>;
}

export interface SchwabOrderPreview {
  orderId?: number;
  orderStrategy: SchwabOrder;
  orderValidationResult: {
    alerts: Array<{ alertMessage: string; validationRuleName: string; description: string }>;
    accepts: string[];
    rejects: string[];
    warns: string[];
  };
  commissionAndFee?: {
    commission: { commissionLegs: Array<{ commissionValues: Array<{ amount: number; type: string }> }> };
    fee: { feeLegs: Array<{ feeValues: Array<{ amount: number; type: string }> }> };
  };
}

export interface SchwabTransaction {
  activityId: number;
  time: string;
  type: string;            // 'TRADE', 'RECEIVE_AND_DELIVER', 'DIVIDEND_OR_INTEREST', etc.
  status: string;
  tradeDate: string;
  settlementDate: string;
  positionId?: number;
  orderId?: number;
  netAmount: number;
  accountNumber: string;
  transactionItem: {
    accountId: number;
    amount: number;
    price: number;
    cost: number;
    parentOrderKey?: number;
    instruction?: string;
    positionEffect?: string;
    instrument: {
      assetType: string;
      cusip: string;
      symbol: string;
      description: string;
      instrumentId: number;
    };
    fee?: number;
  };
}

export interface SchwabQuote {
  assetMainType: string;
  assetSubType?: string;
  quoteType: string;
  realtime: boolean;
  ssid: number;
  symbol: string;
  quote?: {
    askMICId: string;
    askPrice: number;
    askSize: number;
    askTime: number;
    bidMICId: string;
    bidPrice: number;
    bidSize: number;
    bidTime: number;
    closePrice: number;
    highPrice: number;
    lastMICId: string;
    lastPrice: number;
    lastSize: number;
    lowPrice: number;
    mark: number;
    markChange: number;
    markPercentChange: number;
    netChange: number;
    netPercentChange: number;
    openPrice: number;
    quoteTime: number;
    totalVolume: number;
    tradeTime: number;
  };
  reference?: {
    cusip: string;
    description: string;
    exchange: string;
    exchangeName: string;
    isHardToBorrow: boolean;
    isShortable: boolean;
    htbRate: number;
  };
  fundamental?: {
    avg10DaysVolume: number;
    avg1YearVolume: number;
    declarationDate: string;
    divAmount: number;
    divExDate: string;
    divFreq: number;
    divPayAmount: number;
    divPayDate: string;
    divYield: number;
    eps: number;
    fundLeverageFactor: number;
    lastEarningsDate: string;
    nextDivExDate: string;
    nextDivPayDate: string;
    peRatio: number;
  };
}

export interface SchwabPriceHistory {
  candles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    datetime: number; // epoch ms
  }>;
  symbol: string;
  empty: boolean;
}

export interface SchwabOptionChain {
  symbol: string;
  status: string;
  underlying?: Record<string, any>;
  strategy: string;
  interval: number;
  isDelayed: boolean;
  isIndex: boolean;
  daysToExpiration: number;
  interestRate: number;
  underlyingPrice: number;
  volatility: number;
  callExpDateMap: Record<string, Record<string, any[]>>;
  putExpDateMap: Record<string, Record<string, any[]>>;
}
```

### 10.5 `constants/schwab-api.constants.ts`

```typescript
export const SCHWAB_TRADER_BASE_URL = 'https://api.schwabapi.com/trader/v1';
export const SCHWAB_MARKET_DATA_BASE_URL = 'https://api.schwabapi.com/marketdata/v1';
export const SCHWAB_AUTH_BASE_URL = 'https://api.schwabapi.com/v1/oauth';

export const SCHWAB_RATE_LIMIT_PER_MINUTE = 120;
export const SCHWAB_MAX_QUOTE_SYMBOLS = 500;
export const SCHWAB_MAX_TRANSACTION_HISTORY_DAYS = 365;
export const SCHWAB_ACCESS_TOKEN_TTL_SECONDS = 1800; // 30 minutes
export const SCHWAB_REFRESH_TOKEN_TTL_DAYS = 7;

export const SCHWAB_ORDER_STATUSES = {
  AWAITING_PARENT_ORDER: 'AWAITING_PARENT_ORDER',
  AWAITING_CONDITION: 'AWAITING_CONDITION',
  AWAITING_STOP_CONDITION: 'AWAITING_STOP_CONDITION',
  AWAITING_MANUAL_REVIEW: 'AWAITING_MANUAL_REVIEW',
  ACCEPTED: 'ACCEPTED',
  PENDING_ACTIVATION: 'PENDING_ACTIVATION',
  QUEUED: 'QUEUED',
  WORKING: 'WORKING',
  REJECTED: 'REJECTED',
  PENDING_CANCEL: 'PENDING_CANCEL',
  CANCELLED: 'CANCELLED',
  PENDING_REPLACE: 'PENDING_REPLACE',
  REPLACED: 'REPLACED',
  FILLED: 'FILLED',
  EXPIRED: 'EXPIRED',
} as const;

export const SCHWAB_STREAM_SERVICES = {
  LEVELONE_EQUITIES: 'LEVELONE_EQUITIES',
  LEVELONE_OPTIONS: 'LEVELONE_OPTIONS',
  LEVELONE_FUTURES: 'LEVELONE_FUTURES',
  LEVELONE_FUTURES_OPTIONS: 'LEVELONE_FUTURES_OPTIONS',
  LEVELONE_FOREX: 'LEVELONE_FOREX',
  NYSE_BOOK: 'NYSE_BOOK',
  NASDAQ_BOOK: 'NASDAQ_BOOK',
  OPTIONS_BOOK: 'OPTIONS_BOOK',
  CHART_EQUITY: 'CHART_EQUITY',
  CHART_FUTURES: 'CHART_FUTURES',
  SCREENER_EQUITY: 'SCREENER_EQUITY',
  SCREENER_OPTION: 'SCREENER_OPTION',
  ACCT_ACTIVITY: 'ACCT_ACTIVITY',
} as const;

export const SCHWAB_STREAM_COMMANDS = {
  SUBS: 'SUBS',    // Replace all subscriptions
  ADD: 'ADD',      // Append to subscriptions
  UNSUBS: 'UNSUBS', // Remove from subscriptions
  VIEW: 'VIEW',    // Change fields subscribed
} as const;
```

### 10.6 `guards/schwab-auth.guard.ts`

```typescript
import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { SchwabAuthService } from '../schwab-auth.service';

/**
 * Guard that verifies the requesting user has a valid, non-expired Schwab token.
 * Use on any endpoint that requires live Schwab data.
 */
@Injectable()
export class SchwabAuthGuard implements CanActivate {
  constructor(private readonly schwabAuthService: SchwabAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const token = await this.schwabAuthService.getTokenRecord(userId);

    if (!token || token.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Schwab account not connected. Please connect your Schwab account in Settings.',
      );
    }

    if (new Date(token.refreshTokenExpiresAt) < new Date()) {
      throw new UnauthorizedException(
        'Schwab session expired. Please reconnect your Schwab account.',
      );
    }

    return true;
  }
}
```

---

## 11. Database Schema

### 11.1 Supabase SQL Migrations

```sql
-- ============================================================
-- schwab_tokens: Encrypted OAuth tokens per advisor
-- ============================================================
CREATE TABLE schwab_tokens (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_access_token     TEXT NOT NULL,
  encrypted_refresh_token    TEXT NOT NULL,
  access_token_expires_at    TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at   TIMESTAMPTZ NOT NULL,
  status                     TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','REVOKED')),
  created_at                 TIMESTAMPTZ DEFAULT now(),
  updated_at                 TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT schwab_tokens_user_id_unique UNIQUE (user_id)
);

-- RLS: advisors can only access their own tokens
ALTER TABLE schwab_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own schwab tokens"
  ON schwab_tokens FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- custodian_account_links: Maps Schwab account # → hash value → internal account
-- ============================================================
CREATE TABLE custodian_account_links (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id),
  internal_account_id         UUID REFERENCES accounts(id),
  custodian                   TEXT NOT NULL DEFAULT 'SCHWAB',
  custodian_account_number    TEXT NOT NULL,      -- Store last 4 digits only or encrypted
  custodian_hash_value        TEXT NOT NULL,      -- The hash value for API calls
  account_type                TEXT,               -- 'INDIVIDUAL', 'JOINT_TENANTS', 'TRADITIONAL_IRA', etc.
  account_nickname            TEXT,
  sync_status                 TEXT DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING','SYNCED','ERROR','DISABLED')),
  last_synced_at              TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT custodian_account_links_unique UNIQUE (custodian, custodian_account_number)
);

CREATE INDEX idx_custodian_account_links_user ON custodian_account_links (user_id);
CREATE INDEX idx_custodian_account_links_hash ON custodian_account_links (custodian_hash_value);


-- ============================================================
-- market_data_cache: Real-time quote cache (updated by streaming service)
-- ============================================================
CREATE TABLE market_data_cache (
  symbol          TEXT PRIMARY KEY,
  bid_price       NUMERIC(18, 4),
  ask_price       NUMERIC(18, 4),
  last_price      NUMERIC(18, 4),
  mark_price      NUMERIC(18, 4),
  open_price      NUMERIC(18, 4),
  high_price      NUMERIC(18, 4),
  low_price       NUMERIC(18, 4),
  close_price     NUMERIC(18, 4),
  total_volume    BIGINT,
  net_change      NUMERIC(18, 4),
  net_pct_change  NUMERIC(10, 4),
  is_realtime     BOOLEAN DEFAULT false,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime replication for frontend subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE market_data_cache;


-- ============================================================
-- price_history: Daily OHLCV data for analytics / charting
-- ============================================================
CREATE TABLE price_history (
  id          BIGSERIAL PRIMARY KEY,
  symbol      TEXT NOT NULL,
  date        DATE NOT NULL,
  open        NUMERIC(18, 4) NOT NULL,
  high        NUMERIC(18, 4) NOT NULL,
  low         NUMERIC(18, 4) NOT NULL,
  close       NUMERIC(18, 4) NOT NULL,
  volume      BIGINT NOT NULL,
  adj_close   NUMERIC(18, 4),  -- Split/dividend adjusted
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT price_history_symbol_date_unique UNIQUE (symbol, date)
);

CREATE INDEX idx_price_history_symbol_date ON price_history (symbol, date DESC);


-- ============================================================
-- custodian_sync_logs: Audit trail for all sync operations
-- ============================================================
CREATE TABLE custodian_sync_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id),
  custodian           TEXT NOT NULL DEFAULT 'SCHWAB',
  operation           TEXT NOT NULL,  -- 'SYNC_ACCOUNTS', 'SYNC_TRANSACTIONS', 'PLACE_ORDER', etc.
  status              TEXT NOT NULL CHECK (status IN ('SUCCESS','FAILURE','PARTIAL')),
  error_code          TEXT,
  error_message       TEXT,           -- Sanitized — no tokens, no account numbers
  records_processed   INTEGER,
  duration_ms         INTEGER,
  triggered_by        TEXT DEFAULT 'CRON',  -- 'CRON', 'MANUAL', 'OAUTH_CALLBACK'
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_logs_user_created ON custodian_sync_logs (user_id, created_at DESC);
CREATE INDEX idx_sync_logs_status ON custodian_sync_logs (status, created_at DESC);


-- ============================================================
-- schwab_audit_log: Immutable record of all Schwab API calls
-- ============================================================
CREATE TABLE schwab_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  operation     TEXT NOT NULL,
  endpoint      TEXT NOT NULL,   -- Pattern with truncated hash: '/accounts/ABCDEF12...'
  http_method   TEXT NOT NULL,
  status_code   INTEGER,
  duration_ms   INTEGER,
  advisor_ip    INET,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Append-only: revoke UPDATE/DELETE privileges
REVOKE UPDATE, DELETE ON schwab_audit_log FROM authenticated;
CREATE INDEX idx_audit_log_user ON schwab_audit_log (user_id, created_at DESC);
```

---

## 12. Environment Configuration

### 12.1 Required Environment Variables

Add to `backend/.env` (and Supabase Edge Functions / deployment secrets):

```bash
# Schwab API credentials (from developer.schwab.com)
SCHWAB_APP_KEY=your_app_key_here
SCHWAB_APP_SECRET=your_app_secret_here
SCHWAB_CALLBACK_URL=https://your-app.com/api/schwab/oauth/callback

# AES-256-GCM key for token encryption — generate with: openssl rand -hex 32
SCHWAB_TOKEN_ENCRYPTION_KEY=your_64_char_hex_key_here

# Optional: override base URLs for testing against a sandbox (if Schwab provides one)
SCHWAB_TRADER_API_URL=https://api.schwabapi.com/trader/v1
SCHWAB_MARKET_DATA_API_URL=https://api.schwabapi.com/marketdata/v1
SCHWAB_OAUTH_BASE_URL=https://api.schwabapi.com/v1/oauth
```

### 12.2 Validation on Startup

Use `@nestjs/config` with `Joi` schema validation:

```typescript
// config/schwab.config.ts
import * as Joi from 'joi';

export const schwabConfigSchema = Joi.object({
  SCHWAB_APP_KEY: Joi.string().required(),
  SCHWAB_APP_SECRET: Joi.string().required(),
  SCHWAB_CALLBACK_URL: Joi.string().uri().required(),
  SCHWAB_TOKEN_ENCRYPTION_KEY: Joi.string().length(64).required(), // 32 bytes = 64 hex chars
});
```

---

## 13. Migration from Mocked Adapter

### 13.1 Current State

The existing `backend/src/modules/integrations/custodian/schwab.adapter.ts` returns static mocked data. The migration strategy is:

### 13.2 Migration Steps

1. **Create the Schwab module** at `backend/src/modules/integrations/schwab/` using the structure in Section 10
2. **Implement `SchwabAuthService`** and OAuth endpoints first (no mocked data needed)
3. **Run initial OAuth flow** in a development environment to validate token exchange
4. **Replace `getAccountNumbers()`** in the adapter — first live endpoint to validate
5. **Replace `getAccounts()`** — verify hash value flow end-to-end
6. **Replace `getPositions()`** — validate position mapping to internal model
7. **Replace `getOrders()`** — validate order status mapping
8. **Implement market data** — validate quotes against known prices
9. **Enable streaming** — test in development with a paper/small account first
10. **Decommission mocked adapter** — remove `schwab.adapter.ts` or replace its internals entirely

### 13.3 Adapter Interface Compatibility

The new Schwab services should implement the existing `ICustodianAdapter` interface if one exists, or the new module should be injected wherever `schwab.adapter.ts` was previously used:

```typescript
// Replace injection in any module that used schwab.adapter.ts:
// Before:
providers: [{ provide: 'CUSTODIAN_ADAPTER', useClass: SchwabAdapter }]
// After:
providers: [SchwabAccountService, SchwabOrderService, SchwabMarketDataService]
```

### 13.4 Testing Strategy

- **Unit tests:** Mock `SchwabHttpClient`; test service logic in isolation
- **Integration tests:** Use Schwab's `Accounts and Trading Production` in a dev environment with a real (small) account or dedicated test account
- **Canary deployment:** Enable the live adapter for one advisor first; monitor `custodian_sync_logs` for 24 hours before full rollout
- **Never use production client accounts for integration testing**

---

## Appendix: Quick Reference

### API Base URLs

| API | Base URL |
|-----|----------|
| OAuth | `https://api.schwabapi.com/v1/oauth` |
| Accounts & Trading | `https://api.schwabapi.com/trader/v1` |
| Market Data | `https://api.schwabapi.com/marketdata/v1` |

### Key Rate Limits

| Limit | Value |
|-------|-------|
| REST requests | ~120 / min |
| Order requests | 0–120 / min (configurable) |
| Backoff on 429-005 | 60 seconds |
| Access token TTL | 30 minutes |
| Refresh token TTL | 7 days |

### Important Gotchas

1. **Always use hash values** — never raw account numbers in API calls
2. **Auth code expires in ~60 seconds** — exchange immediately in the callback
3. **Auth code URL-decode** — `%40` must become `@` before token exchange
4. **Deduplicate token refreshes** — concurrent requests can cause race conditions
5. **Refresh token is 7 days** — prompt re-auth at day 6 to avoid disruption
6. **WebSocket login requires fresh access token** — refresh before stream connect
7. **Order POST returns 201 with no body** — extract order ID from `Location` header
8. **Quotes batch limit** — max ~500 symbols per `/quotes` call; paginate for larger portfolios
9. **Streaming is per-session, not per-account** — one WebSocket serves all accounts

### Schwab Developer Resources

- [Developer Portal](https://developer.schwab.com)
- [API Documentation (Internet Archive)](https://archive.org/stream/schwabtraderapi/schwabapi_djvu.txt)
- [schwab-py Python Reference Library](https://schwab-py.readthedocs.io)
- [Community Discord / Reddit r/Schwab](https://reddit.com/r/Schwab)
