/**
 * SchwabHttpClient
 *
 * A robust HTTP client wrapper around axios for the Schwab API.
 * Features:
 *  - Token-bucket rate limiting (120 req/min)
 *  - Automatic access-token refresh on 401
 *  - Exponential back-off retry on 429 / 5xx
 *  - Sanitised request/response logging (tokens are redacted)
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import {
  SCHWAB_BASE_URL,
  SCHWAB_RATE_LIMIT_PER_MINUTE,
  SCHWAB_RATE_LIMIT_INTERVAL_MS,
  SCHWAB_MAX_RETRIES,
  SCHWAB_RETRY_BASE_DELAY_MS,
  SCHWAB_RETRYABLE_STATUS_CODES,
} from './schwab.constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SchwabRequestConfig extends AxiosRequestConfig {
  /** Skip rate-limit queue for this request (use only for token refresh calls) */
  _skipRateLimit?: boolean;
  /** Internal retry counter — do not set manually */
  _retryCount?: number;
  /** Callback invoked when a 401 is encountered; should return a fresh token */
  _onUnauthorised?: () => Promise<string>;
}

// ---------------------------------------------------------------------------
// Token Bucket
// ---------------------------------------------------------------------------

class TokenBucket {
  private tokens: number;
  private readonly maxTokens: number;
  private lastRefill: number;
  private readonly refillIntervalMs: number;

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefill = Date.now();
  }

  /** Blocks until a token is available, then consumes it. */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Wait until at least one token is available
    const msUntilRefill = this.refillIntervalMs - (Date.now() - this.lastRefill);
    await delay(msUntilRefill > 0 ? msUntilRefill : this.refillIntervalMs);
    this.refill();
    this.tokens = Math.max(this.tokens - 1, 0);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillIntervalMs) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strips the Authorization header value from a headers object so that tokens
 * are never written to logs.
 */
function sanitiseHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitised = { ...headers };
  if (sanitised['Authorization']) {
    sanitised['Authorization'] = '[REDACTED]';
  }
  if (sanitised['authorization']) {
    sanitised['authorization'] = '[REDACTED]';
  }
  return sanitised;
}

function isRetryable(status: number): boolean {
  return SCHWAB_RETRYABLE_STATUS_CODES.includes(status);
}

// ---------------------------------------------------------------------------
// SchwabHttpClient
// ---------------------------------------------------------------------------

@Injectable()
export class SchwabHttpClient {
  private readonly logger = new Logger(SchwabHttpClient.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly bucket: TokenBucket;

  constructor() {
    this.bucket = new TokenBucket(SCHWAB_RATE_LIMIT_PER_MINUTE, SCHWAB_RATE_LIMIT_INTERVAL_MS);

    this.axiosInstance = axios.create({
      baseURL: SCHWAB_BASE_URL,
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.attachRequestInterceptor();
    this.attachResponseInterceptor();
  }

  // -------------------------------------------------------------------------
  // Public methods
  // -------------------------------------------------------------------------

  async get<T>(url: string, config: SchwabRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: unknown, config: SchwabRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: unknown, config: SchwabRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config: SchwabRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // -------------------------------------------------------------------------
  // Core request dispatcher
  // -------------------------------------------------------------------------

  private async request<T>(config: SchwabRequestConfig): Promise<T> {
    if (!config._skipRateLimit) {
      await this.bucket.acquire();
    }

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (!axiosErr.response) {
        // Network-level error — retry
        return this.handleRetry<T>(config, axiosErr);
      }

      const { status } = axiosErr.response;

      if (status === 401 && typeof config._onUnauthorised === 'function') {
        return this.handleUnauthorised<T>(config, axiosErr);
      }

      if (isRetryable(status)) {
        return this.handleRetry<T>(config, axiosErr);
      }

      throw axiosErr;
    }
  }

  // -------------------------------------------------------------------------
  // 401 handler — refresh token and retry once
  // -------------------------------------------------------------------------

  private async handleUnauthorised<T>(
    config: SchwabRequestConfig,
    err: AxiosError,
  ): Promise<T> {
    if ((config._retryCount ?? 0) >= 1) {
      // Already retried after token refresh — give up
      throw err;
    }

    this.logger.warn('Received 401; attempting token refresh');

    const freshToken = await config._onUnauthorised!();

    const retryConfig: SchwabRequestConfig = {
      ...config,
      _retryCount: (config._retryCount ?? 0) + 1,
      headers: {
        ...(config.headers as Record<string, string>),
        Authorization: `Bearer ${freshToken}`,
      },
    };

    return this.request<T>(retryConfig);
  }

  // -------------------------------------------------------------------------
  // Exponential back-off retry
  // -------------------------------------------------------------------------

  private async handleRetry<T>(
    config: SchwabRequestConfig,
    err: AxiosError,
  ): Promise<T> {
    const retryCount = config._retryCount ?? 0;

    if (retryCount >= SCHWAB_MAX_RETRIES) {
      this.logger.error(
        `Max retries (${SCHWAB_MAX_RETRIES}) exceeded for ${config.method} ${config.url}`,
      );
      throw err;
    }

    const backoffMs =
      SCHWAB_RETRY_BASE_DELAY_MS * Math.pow(2, retryCount) + Math.random() * 100;

    this.logger.warn(
      `Retrying ${config.method} ${config.url} in ${Math.round(backoffMs)}ms ` +
        `(attempt ${retryCount + 1}/${SCHWAB_MAX_RETRIES})`,
    );

    await delay(backoffMs);

    return this.request<T>({ ...config, _retryCount: retryCount + 1 });
  }

  // -------------------------------------------------------------------------
  // Axios interceptors
  // -------------------------------------------------------------------------

  private attachRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      (reqConfig: InternalAxiosRequestConfig) => {
        this.logger.debug(
          `→ ${reqConfig.method?.toUpperCase()} ${reqConfig.baseURL}${reqConfig.url} ` +
            `params=${JSON.stringify(reqConfig.params ?? {})} ` +
            `headers=${JSON.stringify(sanitiseHeaders((reqConfig.headers as Record<string, unknown>) ?? {}))}`,
        );
        return reqConfig;
      },
      (error: unknown) => Promise.reject(error),
    );
  }

  private attachResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug(
          `← ${response.status} ${response.config.method?.toUpperCase()} ${
            response.config.url
          } (${response.headers['content-length'] ?? '?'} bytes)`,
        );
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          this.logger.warn(
            `← ${error.response.status} ${error.config?.method?.toUpperCase()} ${
              error.config?.url
            } — ${JSON.stringify(error.response.data)}`,
          );
        } else {
          this.logger.error(`Network error: ${error.message}`);
        }
        return Promise.reject(error);
      },
    );
  }
}
