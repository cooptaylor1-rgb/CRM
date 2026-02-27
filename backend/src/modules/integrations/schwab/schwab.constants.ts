/**
 * Schwab API Constants
 * Defines all base URLs, endpoints, rate limits, and token TTLs for the Schwab API.
 */

/** Base URL for all Schwab API calls */
export const SCHWAB_BASE_URL = 'https://api.schwabapi.com';

/** OAuth authorization endpoint */
export const SCHWAB_OAUTH_AUTHORIZE_URL = 'https://api.schwabapi.com/v1/oauth/authorize';

/** OAuth token exchange / refresh endpoint */
export const SCHWAB_OAUTH_TOKEN_URL = 'https://api.schwabapi.com/v1/oauth/token';

// ---------------------------------------------------------------------------
// Trader API paths
// ---------------------------------------------------------------------------
export const SCHWAB_TRADER_BASE = '/trader/v1';

/** Returns [{accountNumber, hashValue}] */
export const SCHWAB_ACCOUNT_NUMBERS_PATH = `${SCHWAB_TRADER_BASE}/accounts/accountNumbers`;

/** Get all accounts (append ?fields=positions for positions) */
export const SCHWAB_ACCOUNTS_PATH = `${SCHWAB_TRADER_BASE}/accounts`;

/**
 * Get a single account by hash value.
 * Replace :hashValue with actual hash.
 */
export const SCHWAB_ACCOUNT_PATH = (hashValue: string): string =>
  `${SCHWAB_TRADER_BASE}/accounts/${hashValue}`;

/**
 * Get / create orders for a given account.
 * Replace :hashValue with actual hash.
 */
export const SCHWAB_ORDERS_PATH = (hashValue: string): string =>
  `${SCHWAB_TRADER_BASE}/accounts/${hashValue}/orders`;

/**
 * Get transactions for a given account.
 * Replace :hashValue with actual hash.
 */
export const SCHWAB_TRANSACTIONS_PATH = (hashValue: string): string =>
  `${SCHWAB_TRADER_BASE}/accounts/${hashValue}/transactions`;

// ---------------------------------------------------------------------------
// Market data API paths
// ---------------------------------------------------------------------------
export const SCHWAB_MARKET_DATA_BASE = '/marketdata/v1';

/** Quotes endpoint (supports up to 200 symbols per request) */
export const SCHWAB_QUOTES_PATH = `${SCHWAB_MARKET_DATA_BASE}/quotes`;

/** Price history endpoint */
export const SCHWAB_PRICE_HISTORY_PATH = `${SCHWAB_MARKET_DATA_BASE}/pricehistory`;

/** Market movers endpoint */
export const SCHWAB_MOVERS_PATH = (indexSymbol: string): string =>
  `${SCHWAB_MARKET_DATA_BASE}/movers/${indexSymbol}`;

/** Instrument search endpoint */
export const SCHWAB_INSTRUMENTS_PATH = `${SCHWAB_MARKET_DATA_BASE}/instruments`;

/** Market hours endpoint */
export const SCHWAB_MARKET_HOURS_PATH = `${SCHWAB_MARKET_DATA_BASE}/markets`;

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/** Maximum requests allowed per minute (token-bucket cap) */
export const SCHWAB_RATE_LIMIT_PER_MINUTE = 120;

/** Interval (ms) between token-bucket refills */
export const SCHWAB_RATE_LIMIT_INTERVAL_MS = 60_000;

/** Maximum number of symbols per quotes request */
export const SCHWAB_MAX_QUOTE_SYMBOLS = 200;

// ---------------------------------------------------------------------------
// Token TTLs
// ---------------------------------------------------------------------------

/** Access token lifetime in seconds (30 minutes) */
export const SCHWAB_ACCESS_TOKEN_TTL_SECONDS = 1_800;

/** Refresh token lifetime in seconds (7 days) */
export const SCHWAB_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Buffer in seconds before expiry to trigger a proactive refresh */
export const SCHWAB_TOKEN_REFRESH_BUFFER_SECONDS = 120;

// ---------------------------------------------------------------------------
// Retry / back-off
// ---------------------------------------------------------------------------

/** Maximum number of retry attempts for transient errors */
export const SCHWAB_MAX_RETRIES = 3;

/** Base delay (ms) for exponential back-off */
export const SCHWAB_RETRY_BASE_DELAY_MS = 500;

/** HTTP status codes that should trigger a retry */
export const SCHWAB_RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

// ---------------------------------------------------------------------------
// Miscellaneous
// ---------------------------------------------------------------------------

/** Scope requested during OAuth authorization */
export const SCHWAB_OAUTH_SCOPE = 'readonly';

/** DI injection token for SchwabHttpClient */
export const SCHWAB_HTTP_CLIENT_TOKEN = 'SCHWAB_HTTP_CLIENT';

/** DI injection token for SchwabConfig */
export const SCHWAB_CONFIG_TOKEN = 'SCHWAB_CONFIG';
