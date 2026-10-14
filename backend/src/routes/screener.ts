import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { providerRegistry } from "../providers/registry";
import { cache } from "../cache/cacheService";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(["gt", "lt", "eq", "gte", "lte"]),
  value: z.union([z.number(), z.string()]),
});

const screenerRequestSchema = z.object({
  filters: z.array(filterSchema).default([]),
  sort: z.object({
    field: z.string().default("change_pct"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

const UNIVERSE = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "INFY.NS", name: "Infosys Ltd", exchange: "NSE" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", exchange: "NSE" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
];

/**
 * POST /api/v1/screener
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filters, sort, page, limit } = screenerRequestSchema.parse(req.body);

    const candidates = await Promise.allSettled(
      UNIVERSE.map(async (item) => {
        const cacheKey = `screener_item:${item.symbol}`;
        const cached = cache.get<any>(cacheKey);
        if (cached) return cached;

        const provider = providerRegistry.getProviderForSymbol(item.symbol);
        const [quoteRes, candleRes] = await Promise.allSettled([
          provider.getLatestQuote(item.symbol),
          provider.getCandles({
            symbol: item.symbol,
            interval: "1d",
            from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            to: new Date(),
          }),
        ]);

        const quote = quoteRes.status === "fulfilled" ? quoteRes.value : { price: 0, changePct: 0, volume: 0 };
        const candles = candleRes.status === "fulfilled" ? candleRes.value : [];

        let rsi14 = 50.0;
        if (candles.length >= 15) {
          try {
            const aiRes = await axios.post(
              `${config.AI_SERVICE_URL}/indicators/compute`,
              { symbol: item.symbol, interval: "1d", candles },
              { timeout: 3000 }
            );
            rsi14 = aiRes.data.indicators?.rsi?.["14"] ?? 50.0;
          } catch {
            rsi14 = 50.0;
          }
        }

        const data = {
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange,
          close: quote.price,
          change_pct: quote.changePct ?? 0,
          volume: quote.volume ?? 0,
          rsi_14: rsi14,
          data_quality: {
            source: provider.name,
            as_of: new Date().toISOString(),
          },
        };

        cache.set(cacheKey, data, 300);
        return data;
      })
    );

    let results = candidates
      .filter((c) => c.status === "fulfilled")
      .map((c) => (c as PromiseFulfilledResult<any>).value);

    // Apply filters
    for (const f of filters) {
      results = results.filter((item) => {
        const val = item[f.field];
        if (val === undefined || val === null) return false;

        if (f.operator === "eq") {
          return String(val).toLowerCase() === String(f.value).toLowerCase();
        }
        const numVal = Number(val);
        const targetVal = Number(f.value);
        if (isNaN(numVal) || isNaN(targetVal)) return false;

        if (f.operator === "gt") return numVal > targetVal;
        if (f.operator === "lt") return numVal < targetVal;
        if (f.operator === "gte") return numVal >= targetVal;
        if (f.operator === "lte") return numVal <= targetVal;
        return true;
      });
    }

    // Sort results
    if (sort) {
      const field = sort.field;
      const dir = sort.direction === "asc" ? 1 : -1;
      results.sort((a, b) => {
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    res.json({
      results: paginated,
      total,
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "Screener execution error");
    next(err);
  }
});

export default router;
