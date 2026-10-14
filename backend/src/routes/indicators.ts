import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { providerRegistry } from "../providers/registry";
import { cache } from "../cache/cacheService";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

const symbolSchema = z.string().min(1).max(32);

const indicatorQuerySchema = z.object({
  interval: z.enum(["1d", "1wk", "1mo", "1h", "30m", "15m", "5m", "1m"]).default("1d"),
  from: z.string().optional().transform((v) => (v ? new Date(v) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))),
  to: z.string().optional().transform((v) => (v ? new Date(v) : new Date())),
  indicators: z.string().optional().default("sma_20,sma_50,sma_200,ema_12,ema_26,rsi_14,macd,bb"),
});

/**
 * GET /api/v1/indicators/:symbol
 */
router.get("/:symbol", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = symbolSchema.parse(req.params.symbol);
    const queryParams = indicatorQuerySchema.parse(req.query);

    const cacheKey = `indicators:${symbol}:${queryParams.interval}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const provider = providerRegistry.getProviderForSymbol(symbol);
    const candles = await provider.getCandles({
      symbol,
      interval: queryParams.interval,
      from: queryParams.from,
      to: queryParams.to,
    });

    if (!candles || candles.length === 0) {
      res.status(404).json({ error: { code: "NO_CANDLE_DATA", message: "No candle data available" } });
      return;
    }

    // Call AI service to compute validated indicators
    const aiResponse = await axios.post(
      `${config.AI_SERVICE_URL}/indicators/compute`,
      {
        symbol,
        interval: queryParams.interval,
        candles,
      },
      { timeout: config.PROVIDER_REQUEST_TIMEOUT_MS }
    );

    const result = {
      ...aiResponse.data,
      data_quality: {
        source: provider.name,
        candles_used: candles.length,
        as_of: candles[candles.length - 1]?.ts ?? new Date().toISOString(),
      },
    };

    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Indicator computation error");
    next(err);
  }
});

/**
 * GET /api/v1/indicators/:symbol/series
 */
router.get("/:symbol/series", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = symbolSchema.parse(req.params.symbol);
    const queryParams = indicatorQuerySchema.parse(req.query);

    const provider = providerRegistry.getProviderForSymbol(symbol);
    const candles = await provider.getCandles({
      symbol,
      interval: queryParams.interval,
      from: queryParams.from,
      to: queryParams.to,
    });

    if (!candles || candles.length === 0) {
      res.status(404).json({ error: { code: "NO_CANDLE_DATA", message: "No candle data available" } });
      return;
    }

    const requestedList = queryParams.indicators.split(",").map((s) => s.trim());

    const aiResponse = await axios.post(
      `${config.AI_SERVICE_URL}/indicators/series`,
      {
        symbol,
        interval: queryParams.interval,
        candles,
        indicators: requestedList,
      },
      { timeout: config.PROVIDER_REQUEST_TIMEOUT_MS }
    );

    res.json(aiResponse.data);
  } catch (err) {
    logger.error({ err }, "Indicator series error");
    next(err);
  }
});

export default router;
