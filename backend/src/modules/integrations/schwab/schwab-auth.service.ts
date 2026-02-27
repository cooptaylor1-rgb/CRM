/**
 * SchwabAuthService
 *
 * Handles the full Schwab OAuth 2.0 lifecycle:
 *  - Building the authorization URL
 *  - Exchanging an auth code for tokens
 *  - Refreshing access tokens
 *  - Storing / retrieving tokens encrypted with AES-256-GCM
 */

import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  SCHWAB_OAUTH_AUTHORIZE_URL,
  SCHWAB_OAUTH_TOKEN_URL,
  SCHWAB_OAUTH_SCOPE,
  SCHWAB_ACCESS_TOKEN_TTL_SECONDS,
  SCHWAB_REFRESH_TOKEN_TTL_SECONDS,
  SCHWAB_TOKEN_REFRESH_BUFFER_SECONDS,
} from './schwab.constants';
import { SchwabTokenResponse } from './schwab.interfaces';
import { SchwabToken } from '../../../entities/schwab-token.entity';

// ---------------------------------------------------------------------------
// Encryption helpers (AES-256-GCM)
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret: string): Buffer {
  // Derive a fixed-length 32-byte key from the configured secret
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Layout: iv (12) | authTag (16) | ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(encoded: string, secret: string): string {
  const key = deriveKey(secret);
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

// ---------------------------------------------------------------------------
// SchwabAuthService
// ---------------------------------------------------------------------------

@Injectable()
export class SchwabAuthService {
  private readonly logger = new Logger(SchwabAuthService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly encryptionSecret: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(SchwabToken)
    private readonly tokenRepo: Repository<SchwabToken>,
  ) {
    this.clientId = this.config.getOrThrow<string>('SCHWAB_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow<string>('SCHWAB_CLIENT_SECRET');
    this.redirectUri = this.config.getOrThrow<string>('SCHWAB_REDIRECT_URI');
    this.encryptionSecret = this.config.getOrThrow<string>('SCHWAB_TOKEN_ENCRYPTION_SECRET');
  }

  // -------------------------------------------------------------------------
  // Build authorization URL
  // -------------------------------------------------------------------------

  /**
   * Returns the Schwab OAuth authorization URL that the user should be
   * redirected to in order to grant access.
   *
   * @param state  CSRF-protection state string (store in session before redirecting)
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: SCHWAB_OAUTH_SCOPE,
      state,
    });
    return `${SCHWAB_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
  }

  // -------------------------------------------------------------------------
  // Exchange authorization code for tokens
  // -------------------------------------------------------------------------

  /**
   * Exchanges the authorization code returned by Schwab for an access + refresh
   * token pair.
   *
   * IMPORTANT: Schwab encodes the \'@\' character as \`%40\` in the auth code;
   * this method decodes it automatically before sending the request.
   *
   * @param code  Raw code from the OAuth callback query-string
   */
  async exchangeCodeForTokens(code: string): Promise<SchwabTokenResponse> {
    // Decode %40 → @ (Schwab quirk)
    const decodedCode = decodeURIComponent(code);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: decodedCode,
      redirect_uri: this.redirectUri,
    });

    return this.postTokenRequest(body);
  }

  // -------------------------------------------------------------------------
  // Refresh access token
  // -------------------------------------------------------------------------

  /**
   * Uses the stored refresh token to obtain a new access token.
   *
   * @param refreshToken  Plaintext refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<SchwabTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    return this.postTokenRequest(body);
  }

  // -------------------------------------------------------------------------
  // Store tokens
  // -------------------------------------------------------------------------

  /**
   * Encrypts and persists the token pair for a given user.
   *
   * @param userId  Internal user / CRM contact identifier
   * @param tokens  Raw token response from Schwab
   */
  async storeTokens(userId: string, tokens: SchwabTokenResponse): Promise<void> {
    const now = new Date();
    const accessTokenExpiresAt = new Date(
      now.getTime() + tokens.expires_in * 1_000,
    );
    const refreshTokenExpiresAt = new Date(
      now.getTime() + SCHWAB_REFRESH_TOKEN_TTL_SECONDS * 1_000,
    );

    const encryptedAccessToken = encrypt(tokens.access_token, this.encryptionSecret);
    const encryptedRefreshToken = encrypt(tokens.refresh_token, this.encryptionSecret);

    const existing = await this.tokenRepo.findOne({ where: { userId } });

    if (existing) {
      await this.tokenRepo.update(
        { userId },
        {
          encryptedAccessToken,
          encryptedRefreshToken,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          updatedAt: now,
        },
      );
    } else {
      const entity = this.tokenRepo.create({
        userId,
        encryptedAccessToken,
        encryptedRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        createdAt: now,
        updatedAt: now,
      });
      await this.tokenRepo.save(entity);
    }

    this.logger.log(`Stored tokens for user ${userId}`);
  }

  // -------------------------------------------------------------------------
  // Get a valid access token (auto-refresh)
  // -------------------------------------------------------------------------

  /**
   * Returns a valid access token for the given user, automatically refreshing
   * if the stored token is within the refresh-buffer window.
   *
   * @throws UnauthorizedException when no tokens exist or the refresh token
   *         has expired.
   */
  async getValidToken(userId: string): Promise<string> {
    const record = await this.tokenRepo.findOne({ where: { userId } });

    if (!record) {
      throw new UnauthorizedException(
        `No Schwab tokens found for user ${userId}. Please re-authenticate.`,
      );
    }

    const now = new Date();
    const bufferMs = SCHWAB_TOKEN_REFRESH_BUFFER_SECONDS * 1_000;
    const accessExpiresAt = new Date(record.accessTokenExpiresAt);
    const refreshExpiresAt = new Date(record.refreshTokenExpiresAt);

    // Check whether refresh token itself is expired
    if (refreshExpiresAt <= now) {
      throw new UnauthorizedException(
        `Schwab refresh token has expired for user ${userId}. Please re-authenticate.`,
      );
    }

    // If access token is still valid (with buffer), return it directly
    if (accessExpiresAt.getTime() - bufferMs > now.getTime()) {
      return decrypt(record.encryptedAccessToken, this.encryptionSecret);
    }

    // Access token expired (or within buffer) — refresh it
    this.logger.log(`Access token expiring soon for user ${userId}; refreshing`);
    const plainRefresh = decrypt(record.encryptedRefreshToken, this.encryptionSecret);
    const newTokens = await this.refreshAccessToken(plainRefresh);
    await this.storeTokens(userId, newTokens);

    return newTokens.access_token;
  }

  // -------------------------------------------------------------------------
  // Revoke / disconnect
  // -------------------------------------------------------------------------

  /**
   * Removes the stored token record for the given user, effectively
   * disconnecting their Schwab account.
   */
  async revokeTokens(userId: string): Promise<void> {
    await this.tokenRepo.delete({ userId });
    this.logger.log(`Revoked Schwab tokens for user ${userId}`);
  }

  // -------------------------------------------------------------------------
  // Connection status
  // -------------------------------------------------------------------------

  /**
   * Returns true when the user has a non-expired refresh token on file.
   */
  async isConnected(userId: string): Promise<boolean> {
    const record = await this.tokenRepo.findOne({ where: { userId } });
    if (!record) return false;
    return new Date(record.refreshTokenExpiresAt) > new Date();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Posts a form-encoded body to the Schwab token endpoint using HTTP Basic
   * auth (base64 of clientId:clientSecret) as required by Schwab.
   */
  private async postTokenRequest(
    body: URLSearchParams,
  ): Promise<SchwabTokenResponse> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    try {
      const response = await axios.post<SchwabTokenResponse>(
        SCHWAB_OAUTH_TOKEN_URL,
        body.toString(),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data;
    } catch (err) {
      const message =
        (err as { response?: { data?: { error_description?: string } } })
          ?.response?.data?.error_description ?? 'Unknown error during token request';
      this.logger.error(`Schwab token request failed: ${message}`);
      throw new InternalServerErrorException(
        `Schwab token request failed: ${message}`,
      );
    }
  }
}
