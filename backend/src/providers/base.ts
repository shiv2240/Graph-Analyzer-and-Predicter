import {
  Instrument,
  CandleBar,
  CandleParams,
  Quote,
  Fundamentals,
  QuoteCallback,
  Unsubscribe,
} from "../types/market";

/**
 * Common interface all market data providers must implement.
 * Methods not supported by a provider throw UnsupportedOperationError.
 */
export interface MarketDataProvider {
  /** Unique identifier for this provider */
  readonly name: string;
  /** Exchange codes this provider supports (e.g., "NSE", "NYSE") */
  readonly supportedExchanges: string[];

  /**
   * Search for instruments by name or symbol.
   */
  searchInstruments(query: string, exchange?: string): Promise<Instrument[]>;

  /**
   * Retrieve OHLCV candles for the given parameters.
   * Must throw InstrumentNotSupportedError if symbol not available.
   */
  getCandles(params: CandleParams): Promise<CandleBar[]>;

  /**
   * Retrieve the latest available quote.
   * Must return dataQuality.isDelayed correctly.
   */
  getLatestQuote(symbol: string): Promise<Quote>;

  /**
   * Retrieve fundamental data (optional).
   */
  getFundamentals?(symbol: string): Promise<Fundamentals>;

  /**
   * Subscribe to live quote updates (optional — providers with streaming only).
   */
  subscribeToQuotes?(symbols: string[], callback: QuoteCallback): Unsubscribe;

  /**
   * Check whether this provider supports the given symbol.
   */
  isSupported(symbol: string): Promise<boolean>;
}

export class UnsupportedOperationError extends Error {
  constructor(provider: string, operation: string) {
    super(`Provider '${provider}' does not support operation: ${operation}`);
    this.name = "UnsupportedOperationError";
  }
}
