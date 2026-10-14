import { MarketDataProvider } from "./base";
import { YFinanceProvider } from "./yfinance/yfinanceProvider";
import { FinnhubProvider } from "./finnhub/finnhubProvider";
import { logger } from "../utils/logger";
import { config } from "../config";
import { InstrumentNotSupportedError } from "../middleware/errorHandler";

/**
 * Routes instrument requests to the appropriate provider.
 * Provider selection is based on the symbol suffix and exchange.
 */
class ProviderRegistry {
  private providers: MarketDataProvider[] = [];

  constructor() {
    if (config.YFINANCE_ENABLED) {
      this.providers.push(new YFinanceProvider());
      logger.info("YFinance provider registered");
    }
    if (config.FINNHUB_API_KEY) {
      this.providers.push(new FinnhubProvider());
      logger.info("Finnhub provider registered");
    }
  }

  /**
   * Select the best provider for a given symbol.
   * Priority: Finnhub for US real-time, YFinance for everything else.
   */
  getProvider(symbol: string): MarketDataProvider {
    // Finnhub for plain US tickers (no dot suffix, not an index)
    const isUSSymbol = !symbol.includes(".") && !symbol.startsWith("^");
    const finnhub = this.providers.find((p) => p.name === "finnhub");
    if (isUSSymbol && finnhub) {
      return finnhub;
    }

    // YFinance for Indian (.NS, .BO), indices (^), international
    const yfinance = this.providers.find((p) => p.name === "yfinance");
    if (yfinance) {
      return yfinance;
    }

    // Fallback to first available
    if (this.providers.length > 0) {
      return this.providers[0];
    }

    throw new InstrumentNotSupportedError(symbol);
  }

  getProviderForSymbol(symbol: string): MarketDataProvider {
    return this.getProvider(symbol);
  }

  getAllProviders(): MarketDataProvider[] {
    return this.providers;
  }
}

export const providerRegistry = new ProviderRegistry();
