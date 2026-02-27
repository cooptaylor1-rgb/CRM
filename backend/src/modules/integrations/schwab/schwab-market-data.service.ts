/**
 * SchwabMarketDataService
 *
 * Provides access to Schwab market data endpoints:
 *  - Real-time and delayed quotes (batch, up to 200 symbols)
 *  - Price history (OHLCV candles)
 *  - Top movers
 *  - Instrument search
 *  - Market hours
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchwabHttpClient } from './schwab-http.client';
import {
  SCHWAB_QUOTES_PATH,
  SCHWAB_PRICE_HISTORY_PATH,
  SCHWAB_MOVERS_PATH,
  SCHWAB_INSTRUMENTS_PATH,
  SCHWAB_MARKET_HOURS_PATH,
  SCHWAB_MAX_QUOTE_SYMBOLS,
} from './schwab.constants';
import {
  SchwabQuotesResponse,
  SchwabPriceHistoryResponse,
  SchwabMoversResponse,
  SchwabMover,
  SchwabInstrumentsResponse,
  SchwabMarketHoursResponse,
} from './schwab.interfaces';

// ---------------------------------------------------------------------------
// Parameter types
// ---------------------------------------------------------------------------

export type PeriodType = 'day' | 'month' | 'year' | 'ytd';
export type FrequencyType = 'minute' | 'daily' | 'weekly' | 'monthly';
export type MoverDirection = 'up' | 'down';
export type MoverChange = 'percent' | 'value';
export type InstrumentProjection =
  | 'symbol-search'
  | 'symbol-regex'
  | 'desc-search'
  | 'desc-regex'
  | 'search'
  | 'fundamental';

// ---------------------------------------------------------------------------
// SchwabMarketDataService
// ---------------------------------------------------------------------------

@Injectable()
export class SchwabMarketDataService {
  private readonly logger = new Logger(SchwabMarketDataService.name);

  /** App-level access token used for market-data endpoints (not user-specific) */
  private readonly appKey: string;
  private readonly appSecret: string;

  constructor(
    private readonly httpClient: SchwabHttpClient,
    private readonly config: ConfigService,
  ) {
    this.appKey = this.config.getOrThrow<string>('SCHWAB_CLIENT_ID');
    this.appSecret = this.config.getOrThrow<string>('SCHWAB_CLIENT_SECRET');
  }

  // -------------------------------------------------------------------------
  // Auth helper
  // -------------------------------------------------------------------------

  /**
   * Builds an Authorization header using the provided Bearer token.
   * Market-data endpoints accept the same OAuth access tokens.
   */
  private authHeaders(accessToken: string) {
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  }

  // -------------------------------------------------------------------------
  // getQuotes
  // -------------------------------------------------------------------------

  /**
   * Fetches real-time (or delayed) quotes for a batch of symbols.
   * Automatically chunks requests to respect the 200-symbol limit per call.
   *
   * @param symbols      Array of ticker symbols (e.g. ['AAPL', 'MSFT'])
   * @param accessToken  Valid OAuth access token
   * @param fields       Optional comma-separated field filter
   */
  async getQuotes(
    symbols: string[],
    accessToken: string,
    fields?: string,
  ): Promise<SchwabQuotesResponse> {
    if (symbols.length === 0) return {};

    const chunks: string[][] = [];
    for (let i = 0; i < symbols.length; i += SCHWAB_MAX_QUOTE_SYMBOLS) {
      chunks.push(symbols.slice(i, i + SCHWAB_MAX_QUOTE_SYMBOLS));
    }

    this.logger.debug(
      `Fetching quotes for ${symbols.length} symbols in ${chunks.length} batch(es)`,
    );

    const results = await Promise.all(
      chunks.map((chunk) =>
        this.httpClient.get<SchwabQuotesResponse>(SCHWAB_QUOTES_PATH, {
          ...this.authHeaders(accessToken),
          params: {
            symbols: chunk.join(','),
            ...(fields ? { fields } : {}),
          },
        }),
      ),
    );

    // Merge all chunk results into a single map
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  // -------------------------------------------------------------------------
  // getPriceHistory
  // -------------------------------------------------------------------------

  /**
   * Retrieves historical OHLCV candle data for a symbol.
   *
   * @param symbol         Ticker symbol
   * @param accessToken    Valid OAuth access token
   * @param periodType     Aggregation period type ('day' | 'month' | 'year' | 'ytd')
   * @param period         Number of periods
   * @param frequencyType  Candle frequency type ('minute' | 'daily' | 'weekly' | 'monthly')
   * @param frequency      Candle frequency multiplier
   * @param startDate      Optional start date (ISO string or Date)
   * @param endDate        Optional end date (ISO string or Date)
   * @param needExtendedHoursData  Include pre/post market data (default false)
   */
  async getPriceHistory(
    symbol: string,
    accessToken: string,
    periodType: PeriodType = 'month',
    period = 3,
    frequencyType: FrequencyType = 'daily',
    frequency = 1,
    startDate?: Date | string,
    endDate?: Date | string,
    needExtendedHoursData = false,
  ): Promise<SchwabPriceHistoryResponse> {
    this.logger.debug(
      `Fetching price history: ${symbol} ${periodType}/${period} ${frequencyType}/${frequency}`,
    );

    const params: Record<string, unknown> = {
      symbol,
      periodType,
      period,
      frequencyType,
      frequency,
      needExtendedHoursData,
    };

    if (startDate) {
      params.startDate = new Date(startDate).getTime();
    }
    if (endDate) {
      params.endDate = new Date(endDate).getTime();
    }

    return this.httpClient.get<SchwabPriceHistoryResponse>(
      SCHWAB_PRICE_HISTORY_PATH,
      { ...this.authHeaders(accessToken), params },
    );
  }

  // -------------------------------------------------------------------------
  // getMovers
  // -------------------------------------------------------------------------

  /**
   * Returns the top-moving securities for a given index.
   *
   * @param indexSymbol  Index symbol (e.g. '$SPX', '$COMPX', '$DJI')
   * @param accessToken  Valid OAuth access token
   * @param direction    'up' or 'down'
   * @param change       'percent' or 'value'
   */
  async getMovers(
    indexSymbol: string,
    accessToken: string,
    direction: MoverDirection = 'up',
    change: MoverChange = 'percent',
  ): Promise<SchwabMover[]> {
    this.logger.debug(`Fetching movers for ${indexSymbol} direction=${direction}`);

    const response = await this.httpClient.get<SchwabMoversResponse>(
      SCHWAB_MOVERS_PATH(indexSymbol),
      {
        ...this.authHeaders(accessToken),
        params: { direction, change },
      },
    );
    return response.screeners ?? [];
  }

  // -------------------------------------------------------------------------
  // searchInstruments
  // -------------------------------------------------------------------------

  /**
   * Searches for instruments by symbol or description.
   *
   * @param symbol      Ticker or description to search for
   * @param projection  Search type (e.g. 'symbol-search', 'fundamental')
   * @param accessToken Valid OAuth access token
   */
  async searchInstruments(
    symbol: string,
    accessToken: string,
    projection: InstrumentProjection = 'symbol-search',
  ): Promise<SchwabInstrumentsResponse> {
    this.logger.debug(
      `Searching instruments: symbol=${symbol} projection=${projection}`,
    );

    return this.httpClient.get<SchwabInstrumentsResponse>(
      SCHWAB_INSTRUMENTS_PATH,
      {
        ...this.authHeaders(accessToken),
        params: { symbol, projection },
      },
    );
  }

  // -------------------------------------------------------------------------
  // getMarketHours
  // -------------------------------------------------------------------------

  /**
   * Returns market hours for one or more markets.
   *
   * @param markets     Comma-separated market list (e.g. 'equity,option')
   * @param accessToken Valid OAuth access token
   * @param date        Optional date in YYYY-MM-DD format (defaults to today)
   */
  async getMarketHours(
    markets: string,
    accessToken: string,
    date?: string,
  ): Promise<SchwabMarketHoursResponse> {
    this.logger.debug(`Fetching market hours for markets=${markets}`);

    const params: Record<string, string> = { markets };
    if (date) params.date = date;

    return this.httpClient.get<SchwabMarketHoursResponse>(
      SCHWAB_MARKET_HOURS_PATH,
      { ...this.authHeaders(accessToken), params },
    );
  }
}
