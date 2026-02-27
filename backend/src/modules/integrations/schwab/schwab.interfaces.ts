/**
 * Schwab API Response Interfaces
 * TypeScript type definitions for every object shape returned by the Schwab API.
 */

// ---------------------------------------------------------------------------
// OAuth / Tokens
// ---------------------------------------------------------------------------

/**
 * Response from POST /v1/oauth/token
 */
export interface SchwabTokenResponse {
  access_token: string;
  refresh_token: string;
  /** Lifetime of the access token in seconds */
  expires_in: number;
  token_type: string;
  scope: string;
  /** Optional OpenID Connect identity token */
  id_token?: string;
}

// ---------------------------------------------------------------------------
// Account Numbers
// ---------------------------------------------------------------------------

/**
 * Entry returned by GET /trader/v1/accounts/accountNumbers
 * The hashValue is used as the path parameter for all account-specific endpoints.
 */
export interface SchwabAccountNumber {
  accountNumber: string;
  hashValue: string;
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

export interface SchwabCurrentBalance {
  availableFunds: number;
  availableFundsNonMarginableTrade: number;
  availableCredit: number;
  buyingPower: number;
  buyingPowerNonMarginableTrade: number;
  dayTradingBuyingPower: number;
  equity: number;
  equityPercentage: number;
  longMarginValue: number;
  longOptionMarketValue: number;
  longStockValue: number;
  maintenanceCall: number;
  maintenanceRequirement: number;
  marginBalance: number;
  moneyMarketFund: number;
  mutualFundValue: number;
  regTCall: number;
  shortBalance: number;
  shortMarginValue: number;
  shortOptionMarketValue: number;
  shortStockValue: number;
  totalCash: number;
  cashBalance: number;
  cashAvailableForTrading: number;
  cashAvailableForWithdrawal: number;
  cashCall: number;
  longNonMarginableMarketValue: number;
  totalMarginUsed: number;
  unsettledCash: number;
  pendingDeposits: number;
  bondValue: number;
}

export interface SchwabInitialBalance {
  accruedInterest: number;
  availableFundsNonMarginableTrade: number;
  bondValue: number;
  buyingPower: number;
  cashBalance: number;
  cashBuyingPower: number;
  cashReceipts: number;
  dayTradingBuyingPower: number;
  dayTradingBuyingPowerCall: number;
  dayTradingEquityCall: number;
  equity: number;
  equityPercentage: number;
  liquidationValue: number;
  longMarginValue: number;
  longOptionMarketValue: number;
  longStockValue: number;
  maintenanceCall: number;
  maintenanceRequirement: number;
  margin: number;
  marginEquity: number;
  moneyMarketFund: number;
  mutualFundValue: number;
  regTCall: number;
  shortMarginValue: number;
  shortOptionMarketValue: number;
  shortStockValue: number;
  totalCash: number;
  isInCall: boolean;
  unsettledCash: number;
  pendingDeposits: number;
  marginBalance: number;
  shortBalance: number;
  accountValue: number;
}

export interface SchwabProjectedBalance {
  availableFunds: number;
  availableFundsNonMarginableTrade: number;
  buyingPower: number;
  dayTradingBuyingPower: number;
  dayTradingBuyingPowerCall: number;
  maintenanceCall: number;
  regTCall: number;
  isInCall: boolean;
  stockBuyingPower: number;
}

// ---------------------------------------------------------------------------
// Instrument
// ---------------------------------------------------------------------------

export type SchwabAssetType =
  | 'EQUITY'
  | 'OPTION'
  | 'MUTUAL_FUND'
  | 'FIXED_INCOME'
  | 'CASH_EQUIVALENT'
  | 'ETF'
  | 'FOREX'
  | 'FUTURES'
  | 'FUTURES_OPTION'
  | 'INDEX'
  | 'INDICATOR'
  | 'UNKNOWN';

export interface SchwabInstrument {
  assetType: SchwabAssetType;
  cusip?: string;
  symbol: string;
  description?: string;
  instrumentId?: number;
  netChange?: number;
  /** Only present for options */
  type?: string;
  putCall?: 'PUT' | 'CALL';
  underlyingSymbol?: string;
  optionMultiplier?: number;
  optionDeliverables?: SchwabOptionDeliverable[];
}

export interface SchwabOptionDeliverable {
  deliverableUnits: number;
  currencyType: string;
  assetType: SchwabAssetType;
  symbol: string;
}

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export interface SchwabPosition {
  shortQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  agedQuantity?: number;
  instrument: SchwabInstrument;
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice?: number;
  averageShortPrice?: number;
  taxLotAverageLongPrice?: number;
  taxLotAverageShortPrice?: number;
  longOpenProfitLoss?: number;
  shortOpenProfitLoss?: number;
  previousSessionLongQuantity?: number;
  previousSessionShortQuantity?: number;
  currentDayCost?: number;
}

// ---------------------------------------------------------------------------
// Securities Account
// ---------------------------------------------------------------------------

export type SchwabAccountType = 'CASH' | 'MARGIN';

export interface SchwabSecuritiesAccount {
  type: SchwabAccountType;
  accountNumber: string;
  roundTrips: number;
  isDayTrader: boolean;
  isClosingOnlyRestricted: boolean;
  pfcbFlag: boolean;
  positions?: SchwabPosition[];
  initialBalances?: SchwabInitialBalance;
  currentBalances?: SchwabCurrentBalance;
  projectedBalances?: SchwabProjectedBalance;
}

/** Top-level wrapper returned by GET /trader/v1/accounts */
export interface SchwabAccountWrapper {
  securitiesAccount: SchwabSecuritiesAccount;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type SchwabOrderStatus =
  | 'AWAITING_PARENT_ORDER'
  | 'AWAITING_CONDITION'
  | 'AWAITING_STOP_CONDITION'
  | 'AWAITING_MANUAL_REVIEW'
  | 'ACCEPTED'
  | 'AWAITING_UR_OUT'
  | 'PENDING_ACTIVATION'
  | 'QUEUED'
  | 'WORKING'
  | 'REJECTED'
  | 'PENDING_CANCEL'
  | 'CANCELED'
  | 'PENDING_REPLACE'
  | 'REPLACED'
  | 'FILLED'
  | 'EXPIRED'
  | 'NEW'
  | 'AWAITING_RELEASE_TIME'
  | 'PENDING_ACKNOWLEDGEMENT'
  | 'PENDING_RECALL'
  | 'UNKNOWN';

export type SchwabOrderType =
  | 'MARKET'
  | 'LIMIT'
  | 'STOP'
  | 'STOP_LIMIT'
  | 'TRAILING_STOP'
  | 'CABINET'
  | 'NON_MARKETABLE'
  | 'MARKET_ON_CLOSE'
  | 'EXERCISE'
  | 'TRAILING_STOP_LIMIT'
  | 'NET_DEBIT'
  | 'NET_CREDIT'
  | 'NET_ZERO'
  | 'LIMIT_ON_CLOSE'
  | 'UNKNOWN';

export interface SchwabOrderLeg {
  orderLegType: string;
  legId: number;
  instrument: SchwabInstrument;
  instruction: string;
  positionEffect?: string;
  quantity: number;
  quantityType?: string;
  divCapGains?: string;
  toSymbol?: string;
}

export interface SchwabOrderActivity {
  activityType: string;
  activityId: number;
  executionType: string;
  quantity: number;
  orderRemainingQuantity: number;
  executionLegs: SchwabExecutionLeg[];
}

export interface SchwabExecutionLeg {
  legId: number;
  price: number;
  quantity: number;
  mismarkedQuantity: number;
  instrumentId: number;
  time: string;
}

export interface SchwabOrder {
  session: string;
  duration: string;
  orderType: SchwabOrderType;
  cancelTime?: string;
  complexOrderStrategyType?: string;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  requestedDestination?: string;
  destinationLinkName?: string;
  releaseTime?: string;
  stopPrice?: number;
  stopPriceLinkBasis?: string;
  stopPriceLinkType?: string;
  stopPriceOffset?: number;
  stopType?: string;
  priceLinkBasis?: string;
  priceLinkType?: string;
  price?: number;
  taxLotMethod?: string;
  orderLegCollection: SchwabOrderLeg[];
  activationPrice?: number;
  specialInstruction?: string;
  orderStrategyType: string;
  orderId: number;
  cancelable: boolean;
  editable: boolean;
  status: SchwabOrderStatus;
  enteredTime: string;
  closeTime?: string;
  tag?: string;
  accountNumber: number;
  orderActivityCollection?: SchwabOrderActivity[];
  replacingOrderCollection?: SchwabOrder[];
  childOrderStrategies?: SchwabOrder[];
  statusDescription?: string;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export type SchwabTransactionType =
  | 'TRADE'
  | 'RECEIVE_AND_DELIVER'
  | 'DIVIDEND_OR_INTEREST'
  | 'ACH_RECEIPT'
  | 'ACH_DISBURSEMENT'
  | 'CASH_RECEIPT'
  | 'CASH_DISBURSEMENT'
  | 'ELECTRONIC_FUND'
  | 'WIRE_OUT'
  | 'WIRE_IN'
  | 'JOURNAL'
  | 'MEMORANDUM'
  | 'MARGIN_CALL'
  | 'MONEY_MARKET'
  | 'SMA_ADJUSTMENT';

export interface SchwabTransactionInstrument extends SchwabInstrument {
  underlyingSymbol?: string;
  optionExpirationDate?: string;
  optionStrikePrice?: number;
  putCall?: 'PUT' | 'CALL';
}

export interface SchwabTransactionItem {
  accountId: number;
  amount: number;
  price: number;
  cost: number;
  parentOrderId?: number;
  parentChildIndicator?: string;
  instruction?: string;
  positionEffect?: string;
  instrument: SchwabTransactionInstrument;
}

export interface SchwabTransaction {
  activityId: number;
  time: string;
  user?: { cdDomainId: string; login: string; type: string; userId: number; systemUserName: string; firstName: string; lastName: string; brokerRepCode: string };
  description: string;
  accountNumber: string;
  type: SchwabTransactionType;
  status: string;
  subAccount: string;
  tradeDate: string;
  settlementDate?: string;
  positionId?: number;
  orderId?: number;
  netAmount: number;
  activityType?: string;
  transferItems: SchwabTransactionItem[];
}

// ---------------------------------------------------------------------------
// Market Data — Quotes
// ---------------------------------------------------------------------------

export interface SchwabQuote {
  assetMainType: SchwabAssetType;
  assetSubType?: string;
  quoteType?: string;
  realtime: boolean;
  ssid: number;
  symbol: string;
  extended?: {
    askPrice: number;
    askSize: number;
    bidPrice: number;
    bidSize: number;
    lastPrice: number;
    lastSize: number;
    mark: number;
    quoteTime: number;
    totalVolume: number;
    tradeTime: number;
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
    fundStrategy: string;
    nextDivExDate: string;
    nextDivPayDate: string;
    peRatio: number;
  };
  quote: {
    "52WeekHigh": number;
    "52WeekLow": number;
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
    lastTime: number;
    lowPrice: number;
    mark: number;
    markChange: number;
    markPercentChange: number;
    netChange: number;
    netPercentChange: number;
    openPrice: number;
    postMarketChange: number;
    postMarketPercentChange: number;
    quoteTime: number;
    securityStatus: string;
    totalVolume: number;
    tradeTime: number;
  };
  reference?: {
    contractType?: string;
    cusip: string;
    daysToExpiration?: number;
    deliverables?: string;
    description: string;
    exchange: string;
    exchangeName: string;
    exerciseType?: string;
    expirationDay?: number;
    expirationMonth?: number;
    expirationYear?: number;
    isPennyPilot?: boolean;
    lastTradingDay?: number;
    multiplier?: number;
    settlementType?: string;
    strikePrice?: number;
    underlying?: string;
    underlyingPercent?: number;
    uvExpirationType?: string;
  };
  regular?: {
    regularMarketLastPrice: number;
    regularMarketLastSize: number;
    regularMarketNetChange: number;
    regularMarketPercentChange: number;
    regularMarketTradeTime: number;
  };
}

export type SchwabQuotesResponse = Record<string, SchwabQuote>;

// ---------------------------------------------------------------------------
// Market Data — Price History
// ---------------------------------------------------------------------------

export interface SchwabPriceCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Unix timestamp in milliseconds */
  datetime: number;
}

export interface SchwabPriceHistoryResponse {
  symbol: string;
  empty: boolean;
  candles: SchwabPriceCandle[];
}

// ---------------------------------------------------------------------------
// Market Data — Movers
// ---------------------------------------------------------------------------

export interface SchwabMover {
  change: number;
  description: string;
  direction: 'up' | 'down';
  last: number;
  symbol: string;
  totalVolume: number;
}

export interface SchwabMoversResponse {
  screeners: SchwabMover[];
}

// ---------------------------------------------------------------------------
// Market Data — Instruments
// ---------------------------------------------------------------------------

export interface SchwabFundamentalData {
  symbol: string;
  high52: number;
  low52: number;
  dividendAmount: number;
  dividendYield: number;
  dividendDate: string;
  peRatio: number;
  pegRatio: number;
  pbRatio: number;
  prRatio: number;
  pcfRatio: number;
  grossMarginTTM: number;
  grossMarginMRQ: number;
  netProfitMarginTTM: number;
  netProfitMarginMRQ: number;
  operatingMarginTTM: number;
  operatingMarginMRQ: number;
  returnOnEquity: number;
  returnOnAssets: number;
  returnOnInvestment: number;
  quickRatio: number;
  currentRatio: number;
  interestCoverage: number;
  totalDebtToCapital: number;
  ltDebtToEquity: number;
  totalDebtToEquity: number;
  epsTTM: number;
  epsChangePercentTTM: number;
  epsChangeYear: number;
  epsChange: number;
  revChangeYear: number;
  revChangeTTM: number;
  revChangeIn: number;
  sharesOutstanding: number;
  marketCapFloat: number;
  marketCap: number;
  bookValuePerShare: number;
  shortIntToFloat: number;
  shortIntDayToCover: number;
  divGrowthRate3Year: number;
  dividendPayAmount: number;
  dividendPayDate: string;
  beta: number;
  vol1DayAvg: number;
  vol10DayAvg: number;
  vol3MonthAvg: number;
}

export interface SchwabInstrumentSearchResult {
  bondFactor?: string;
  bondMultiplier?: string;
  bondPrice?: number;
  cusip: string;
  description: string;
  exchange: string;
  exchangeName: string;
  fundamental?: SchwabFundamentalData;
  instrumentId: number;
  netChange?: number;
  peRatio?: number;
  symbol: string;
  type: string;
}

export type SchwabInstrumentsResponse = Record<string, SchwabInstrumentSearchResult>;

// ---------------------------------------------------------------------------
// Market Hours
// ---------------------------------------------------------------------------

export interface SchwabSessionHours {
  start: string;
  end: string;
}

export interface SchwabMarketSession {
  date: string;
  marketType: string;
  exchange: string;
  category: string;
  isOpen: boolean;
  sessionHours: Record<string, SchwabSessionHours[]>;
}

export type SchwabMarketHoursResponse = Record<string, Record<string, SchwabMarketSession>>;

// ---------------------------------------------------------------------------
// Internal / Storage
// ---------------------------------------------------------------------------

/** Stored encrypted token record */
export interface SchwabStoredTokens {
  userId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  scope: string;
  tokenType: string;
  createdAt: Date;
  updatedAt: Date;
}
