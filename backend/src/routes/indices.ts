import { Router, Request, Response, NextFunction } from "express";
import { cache } from "../cache/cacheService";
import { providerRegistry } from "../providers/registry";

const router = Router();

// Supported indices with their yfinance/provider symbols
const INDICES = [
  { symbol: "^NSEI",   name: "NIFTY 50",          exchange: "NSE", currency: "INR" },
  { symbol: "^BSESN",  name: "BSE SENSEX",         exchange: "BSE", currency: "INR" },
  { symbol: "^NSEBANK",name: "NIFTY BANK",          exchange: "NSE", currency: "INR" },
  { symbol: "^CNXIT",  name: "NIFTY IT",            exchange: "NSE", currency: "INR" },
  { symbol: "^GSPC",   name: "S&P 500",             exchange: "NYSE", currency: "USD" },
  { symbol: "^IXIC",   name: "NASDAQ Composite",    exchange: "NASDAQ", currency: "USD" },
  { symbol: "^DJI",    name: "Dow Jones",           exchange: "NYSE", currency: "USD" },
];

/**
 * GET /api/v1/indices
 * Returns supported indices with latest available prices.
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = "indices:all";
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ indices: cached, cached: true });
      return;
    }

    const results = await Promise.allSettled(
      INDICES.map(async (idx) => {
        const provider = providerRegistry.getProvider(idx.symbol);
        const quote = await provider.getLatestQuote(idx.symbol);
        return {
          ...idx,
          price: quote.price,
          changeAbs: quote.changeAbs,
          changePct: quote.changePct,
          dataQuality: quote.dataQuality,
        };
      })
    );

    const indices = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            ...INDICES[i],
            price: null,
            changePct: null,
            error: "Data unavailable",
          }
    );

    cache.set(cacheKey, indices, 300);
    res.json({ indices });
  } catch (err) {
    next(err);
  }
});

export default router;
