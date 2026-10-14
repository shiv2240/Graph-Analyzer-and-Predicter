import axios from "axios";
import pRetry from "p-retry";
import { MarketDataProvider, UnsupportedOperationError } from "../base";
import {
  Instrument,
  CandleBar,
  CandleParams,
  Quote,
  QuoteCallback,
  Unsubscribe,
  DataQuality,
} from "../../types/market";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { InstrumentNotSupportedError, ProviderError, RateLimitError } from "../../middleware/errorHandler";

const BASE_URL = "https://finnhub.io/api/v1";

/**
 * Finnhub provider adapter.
 * Supports US equities with real-time quotes (free tier: 60 req/min).
 * WebSocket streaming available for authorized symbols.
 * 
 * Free tier: No Indian/NSE coverage.
 */
export class FinnhubProvider implements MarketDataProvider {
  readonly name = "finnhub";
  readonly supportedExchanges = ["NYSE", "NASDAQ", "US"];

  private get headers() {
    return { "X-Finnhub-Token": config.FINNHUB_API_KEY };
  }

  async searchInstruments(query: string): Promise<Instrument[]> {
    if (!config.FINNHUB_API_KEY) {
      throw new ProviderError(this.name, "FINNHUB_API_KEY not configured");
    }
    try {
      const response = await pRetry(
        () =>
          axios.get(`${BASE_URL}/search`, {
            headers: this.headers,
            params: { q: query },
            timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
          }),
        { retries: 2 }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data.result ?? []).map((r: any) => ({
        symbol: r.symbol,
        name: r.description,
        exchange: r.primaryExchange ?? "US",
        instrumentType: "EQUITY" as const,
        currency: "USD",
      }));
    } catch (err) {
      this.handleError(err, "searchInstruments");
    }
  }

  async getCandles(params: CandleParams): Promise<CandleBar[]> {
    if (!config.FINNHUB_API_KEY) {
      throw new ProviderError(this.name, "FINNHUB_API_KEY not configured");
    }
    try {
      const from = Math.floor(params.from.getTime() / 1000);
      const to = Math.floor(params.to.getTime() / 1000);
      const resolution = this.intervalToResolution(params.interval);

      const response = await pRetry(
        () =>
          axios.get(`${BASE_URL}/stock/candle`, {
            headers: this.headers,
            params: { symbol: params.symbol, resolution, from, to },
            timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
          }),
        { retries: 2 }
      );

      if (response.data.s === "no_data") {
        throw new InstrumentNotSupportedError(params.symbol);
      }

      const { t, o, h, l, c, v } = response.data;
      return (t as number[]).map((ts, i) => ({
        ts: new Date(ts * 1000).toISOString(),
        open: o[i],
        high: h[i],
        low: l[i],
        close: c[i],
        volume: v[i],
      }));
    } catch (err) {
      if (err instanceof InstrumentNotSupportedError) throw err;
      this.handleError(err, "getCandles");
    }
  }

  async getLatestQuote(symbol: string): Promise<Quote> {
    if (!config.FINNHUB_API_KEY) {
      throw new ProviderError(this.name, "FINNHUB_API_KEY not configured");
    }
    try {
      const response = await pRetry(
        () =>
          axios.get(`${BASE_URL}/quote`, {
            headers: this.headers,
            params: { symbol },
            timeout: config.PROVIDER_REQUEST_TIMEOUT_MS,
          }),
        { retries: 2 }
      );

      const d = response.data;
      if (!d.c || d.c === 0) {
        throw new InstrumentNotSupportedError(symbol);
      }

      const dataQuality: DataQuality = {
        source: "finnhub",
        isDelayed: false, // Finnhub free tier is real-time for US
        isCached: false,
        isAdjusted: false,
        lastRefreshed: new Date(d.t * 1000).toISOString(),
      };

      return {
        symbol,
        price: d.c,
        changeAbs: d.d,
        changePct: d.dp,
        dayHigh: d.h,
        dayLow: d.l,
        prevClose: d.pc,
        dataQuality,
      };
    } catch (err) {
      if (err instanceof InstrumentNotSupportedError) throw err;
      this.handleError(err, "getLatestQuote");
    }
  }

  subscribeToQuotes(_symbols: string[], _callback: QuoteCallback): Unsubscribe {
    // WebSocket streaming implementation in Phase 10
    throw new UnsupportedOperationError(this.name, "subscribeToQuotes (Phase 10)");
  }

  async isSupported(symbol: string): Promise<boolean> {
    // Heuristic: plain uppercase symbols without dots are likely US equities
    return !symbol.includes(".") && !symbol.startsWith("^");
  }

  private intervalToResolution(interval: string): string {
    const map: Record<string, string> = {
      "1m": "1",
      "5m": "5",
      "15m": "15",
      "30m": "30",
      "1h": "60",
      "1d": "D",
      "1wk": "W",
      "1mo": "M",
    };
    return map[interval] ?? "D";
  }

  private handleError(err: unknown, operation: string): never {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) {
        throw new RateLimitError(this.name);
      }
      logger.error({ err: err.message, operation, provider: this.name }, "Finnhub HTTP error");
      throw new ProviderError(this.name, err.message);
    }
    throw new ProviderError(this.name, String(err));
  }
}
