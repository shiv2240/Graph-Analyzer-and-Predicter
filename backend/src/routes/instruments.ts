import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { providerRegistry } from "../providers/registry";
import { cache } from "../cache/cacheService";
import { config } from "../config";
import { query } from "../db/client";
import { CandleResponse, Quote } from "../types/market";
import { InstrumentNotSupportedError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();

// ─── Validation schemas ────────────────────────────────────────────────────

const symbolSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[\w^.=\/-]+$/, "Invalid symbol format");

const candleQuerySchema = z.object({
  interval: z
    .enum(["1d", "1wk", "1mo", "1h", "30m", "15m", "5m", "1m", "1y", "5y", "all"])
    .default("1d"),
  from: z
    .string()
    .optional()
    .transform((v) =>
      v ? new Date(v) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    ),
  to: z.string().optional().transform((v) => (v ? new Date(v) : new Date())),
});

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  exchange: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/instruments/search
 */
router.get(
  "/search",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = searchQuerySchema.parse(req.query);
      const cacheKey = `search:${params.q}:${params.exchange ?? "any"}`;
      const cached = cache.get<ReturnType<typeof normalizeSearchResults>>(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }

      // Try all providers for search
      const allResults = await Promise.allSettled(
        providerRegistry.getAllProviders().map((p) =>
          p.searchInstruments(params.q, params.exchange)
        )
      );

      const results = allResults
        .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
        .slice(0, params.limit);

      const response = normalizeSearchResults(results);
      cache.set(cacheKey, response, 300);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/instruments/:symbol
 */
router.get(
  "/:symbol",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol);

      // Look up in database first
      const rows = await query<{
        symbol: string;
        name: string;
        code: string;
        instrument_type: string;
        currency: string;
        isin: string | null;
      }>(
        `SELECT i.symbol, i.name, e.code, i.instrument_type, i.currency, i.isin
         FROM instruments i
         JOIN exchanges e ON i.exchange_id = e.id
         WHERE i.symbol = $1 AND i.is_active = true
         LIMIT 1`,
        [symbol]
      );

      if (rows.length > 0) {
        const row = rows[0];
        res.json({
          symbol: row.symbol,
          name: row.name,
          exchange: row.code,
          instrumentType: row.instrument_type,
          currency: row.currency,
          isin: row.isin,
        });
        return;
      }

      // Try provider
      const provider = providerRegistry.getProvider(symbol);
      const supported = await provider.isSupported(symbol);
      if (!supported) {
        throw new InstrumentNotSupportedError(symbol);
      }

      res.json({ symbol, name: symbol, exchange: "UNKNOWN", instrumentType: "EQUITY", currency: "USD" });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Candles ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/candles/:symbol
 */
router.get(
  "/:symbol/candles",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol);
      const { interval, from, to } = candleQuerySchema.parse(req.query);

      const cacheKey = `candles:${symbol}:${interval}:${from.toDateString()}:${to.toDateString()}`;
      const cached = cache.get<CandleResponse>(cacheKey);
      if (cached) {
        const response = { ...cached, dataQuality: { ...cached.dataQuality, isCached: true } };
        res.json(response);
        return;
      }

      const provider = providerRegistry.getProvider(symbol);
      const candles = await provider.getCandles({ symbol, interval, from, to });

      if (!candles.length) {
        res.json({
          symbol,
          interval,
          from: from.toISOString(),
          to: to.toISOString(),
          candles: [],
          dataQuality: {
            source: provider.name,
            isDelayed: true,
            isCached: false,
            lastRefreshed: new Date().toISOString(),
          },
        });
        return;
      }

      // Persist to database (async, don't await)
      persistCandles(symbol, interval, candles, provider.name).catch((err) =>
        logger.error({ err }, "Failed to persist candles")
      );

      const response: CandleResponse = {
        symbol,
        interval,
        from: from.toISOString(),
        to: to.toISOString(),
        candles,
        dataQuality: {
          source: provider.name,
          isDelayed: provider.name === "yfinance",
          delayMinutes: provider.name === "yfinance" ? 15 : undefined,
          isCached: false,
          isAdjusted: provider.name === "yfinance",
          lastRefreshed: new Date().toISOString(),
        },
      };

      const ttl = interval === "1d" ? 3600 : 60;
      cache.set(cacheKey, response, ttl);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Quotes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/instruments/:symbol/quote
 */
router.get(
  "/:symbol/quote",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol);
      const cacheKey = `quote:${symbol}`;
      const cached = cache.get<Quote>(cacheKey);
      if (cached) {
        res.json({ ...cached, dataQuality: { ...cached.dataQuality, isCached: true } });
        return;
      }

      const provider = providerRegistry.getProvider(symbol);
      const quote = await provider.getLatestQuote(symbol);
      cache.set(cacheKey, quote, config.QUOTE_CACHE_TTL);
      res.json(quote);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeSearchResults(results: import("../types/market").Instrument[]) {
  return { results, count: results.length };
}

async function persistCandles(
  symbol: string,
  interval: string,
  candles: { ts: string; open: number; high: number; low: number; close: number; volume: number; adjClose?: number }[],
  source: string
): Promise<void> {
  // Look up instrument_id
  const instrument = await query<{ id: number }>(
    "SELECT id FROM instruments WHERE symbol = $1 LIMIT 1",
    [symbol]
  );
  if (!instrument.length) return; // Not yet persisted; skip

  const instrumentId = instrument[0].id;
  for (const c of candles) {
    await query(
      `INSERT INTO candles (instrument_id, interval, ts, open, high, low, close, volume, adj_close, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (instrument_id, interval, ts) DO UPDATE SET
         open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low,
         close = EXCLUDED.close, volume = EXCLUDED.volume,
         adj_close = EXCLUDED.adj_close, source = EXCLUDED.source`,
      [instrumentId, interval, c.ts, c.open, c.high, c.low, c.close, c.volume, c.adjClose ?? null, source]
    );
  }
}

export default router;
