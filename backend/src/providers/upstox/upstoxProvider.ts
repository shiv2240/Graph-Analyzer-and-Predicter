/**
 * Upstox provider adapter stub.
 * Full implementation requires:
 *   1. An Upstox brokerage account (Indian residents only)
 *   2. OAuth2 authorization flow
 *   3. UPSTOX_API_KEY, UPSTOX_API_SECRET, UPSTOX_ACCESS_TOKEN in .env
 * 
 * See docs/DATA_SOURCES.md#upstox for setup instructions.
 */
import { MarketDataProvider, UnsupportedOperationError } from "../base";
import { Instrument, CandleBar, CandleParams, Quote } from "../../types/market";
import { config } from "../../config";
import { ProviderError } from "../../middleware/errorHandler";

export class UpstoxProvider implements MarketDataProvider {
  readonly name = "upstox";
  readonly supportedExchanges = ["NSE", "BSE"];

  private isConfigured(): boolean {
    return !!(config.UPSTOX_API_KEY && config.UPSTOX_ACCESS_TOKEN);
  }

  async searchInstruments(_query: string): Promise<Instrument[]> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        this.name,
        "Upstox OAuth not configured. See docs/DATA_SOURCES.md for setup."
      );
    }
    throw new UnsupportedOperationError(this.name, "searchInstruments (stub)");
  }

  async getCandles(_params: CandleParams): Promise<CandleBar[]> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        this.name,
        "Upstox OAuth not configured. See docs/DATA_SOURCES.md for setup."
      );
    }
    // TODO: Implement in Phase 10
    throw new UnsupportedOperationError(this.name, "getCandles (stub)");
  }

  async getLatestQuote(_symbol: string): Promise<Quote> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        this.name,
        "Upstox OAuth not configured. See docs/DATA_SOURCES.md for setup."
      );
    }
    // TODO: Implement in Phase 10
    throw new UnsupportedOperationError(this.name, "getLatestQuote (stub)");
  }

  async isSupported(symbol: string): Promise<boolean> {
    return symbol.endsWith(".NS") || symbol.endsWith(".BO");
  }
}
