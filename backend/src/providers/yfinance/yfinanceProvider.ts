import axios from "axios";
import pRetry from "p-retry";
import { MarketDataProvider } from "../base";
import {
  Instrument,
  CandleBar,
  CandleParams,
  Quote,
  Fundamentals,
  DataQuality,
} from "../../types/market";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { InstrumentNotSupportedError, ProviderError, RateLimitError } from "../../middleware/errorHandler";

const AI_SERVICE_BASE = config.AI_SERVICE_URL;

/**
 * YFinance provider adapter.
 * Routes all yfinance calls through the Python AI service
 * because yfinance is a Python library.
 * 
 * Data is delayed 15+ minutes per Yahoo Finance ToS.
 * Not for commercial redistribution.
 */
export class YFinanceProvider implements MarketDataProvider {
  readonly name = "yfinance";
  readonly supportedExchanges = ["NSE", "BSE", "NYSE", "NASDAQ", "LSE", "TSX"];

  async searchInstruments(query: string, exchange?: string): Promise<Instrument[]> {
    try {
      const response = await pRetry(
        () =>
          axios.get(`${AI_SERVICE_BASE}/internal/yfinance/search`, {
            params: { q: query, exchange },
            timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
          }),
        { retries: 2, minTimeout: 1000 }
      );
      return response.data.results as Instrument[];
    } catch (err) {
      this.handleError(err, "searchInstruments");
    }
  }

  async getCandles(params: CandleParams): Promise<CandleBar[]> {
    try {
      const response = await pRetry(
        () =>
          axios.get(`${AI_SERVICE_BASE}/internal/yfinance/candles`, {
            params: {
              symbol: params.symbol,
              interval: params.interval,
              from: params.from.toISOString(),
              to: params.to.toISOString(),
            },
            timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
          }),
        { retries: 2, minTimeout: 1000 }
      );

      if (response.data.error === "INSTRUMENT_NOT_SUPPORTED") {
        throw new InstrumentNotSupportedError(params.symbol);
      }

      return response.data.candles as CandleBar[];
    } catch (err) {
      if (err instanceof InstrumentNotSupportedError) throw err;
      this.handleError(err, "getCandles");
    }
  }

  async getLatestQuote(symbol: string): Promise<Quote> {
    try {
      const response = await pRetry(
        () =>
          axios.get(`${AI_SERVICE_BASE}/internal/yfinance/quote`, {
            params: { symbol },
            timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
          }),
        { retries: 2, minTimeout: 1000 }
      );

      if (response.data.error === "INSTRUMENT_NOT_SUPPORTED") {
        throw new InstrumentNotSupportedError(symbol);
      }

      return {
        ...response.data,
        dataQuality: this.buildDataQuality(response.data),
      } as Quote;
    } catch (err) {
      if (err instanceof InstrumentNotSupportedError) throw err;
      this.handleError(err, "getLatestQuote");
    }
  }

  async getFundamentals(symbol: string): Promise<Fundamentals> {
    try {
      const response = await axios.get(
        `${AI_SERVICE_BASE}/internal/yfinance/fundamentals`,
        {
          params: { symbol },
          timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
        }
      );
      return response.data as Fundamentals;
    } catch (err) {
      this.handleError(err, "getFundamentals");
    }
  }

  async isSupported(symbol: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${AI_SERVICE_BASE}/internal/yfinance/supported`,
        {
          params: { symbol },
          timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
        }
      );
      return response.data.supported === true;
    } catch {
      return false;
    }
  }

  private buildDataQuality(data: Record<string, unknown>): DataQuality {
    return {
      source: "yfinance",
      isDelayed: true,
      delayMinutes: 15,
      isCached: false,
      isAdjusted: true,
      lastRefreshed: (data.last_refreshed as string) ?? new Date().toISOString(),
    };
  }

  private handleError(err: unknown, operation: string): never {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) {
        throw new RateLimitError(this.name);
      }
      logger.error({ err: err.message, operation, provider: this.name }, "Provider HTTP error");
      throw new ProviderError(this.name, err.message);
    }
    logger.error({ err, operation, provider: this.name }, "Provider error");
    throw new ProviderError(this.name, String(err));
  }
}
