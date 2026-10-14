import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { providerRegistry } from "../providers/registry";
import { query } from "../db/client";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

const reportRequestSchema = z.object({
  symbol: z.string().min(1).max(32),
  question: z.string().optional().default("What are the key technical levels, sentiment, and outlook?"),
  force_refresh: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/analysis/report
 */
router.post("/report", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol, question, force_refresh } = reportRequestSchema.parse(req.body);
    // Do not cache analysis: analysis must always update fresh when the market graph changes
    const provider = providerRegistry.getProviderForSymbol(symbol);

    // 1. Fetch latest quote & candles in parallel
    const [quoteResult, candlesResult] = await Promise.allSettled([
      provider.getLatestQuote(symbol),
      provider.getCandles({
        symbol,
        interval: "1d",
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    ]);

    const quote = quoteResult.status === "fulfilled" ? quoteResult.value : { price: 0, change_pct: 0 };
    const candles = candlesResult.status === "fulfilled" ? candlesResult.value : [];

    // 2. Fetch indicators and ML prediction in parallel to minimize latency
    const [indSettled, mlSettled] = await Promise.allSettled([
      candles.length > 0
        ? axios.post(
            `${config.AI_SERVICE_URL}/indicators/compute`,
            { symbol, interval: "1d", candles },
            { timeout: config.PROVIDER_REQUEST_TIMEOUT_MS }
          )
        : Promise.reject(new Error("No candles")),
      candles.length >= 30
        ? axios.post(
            `${config.AI_SERVICE_URL}/ml/predict`,
            { symbol, model_type: "xgboost", candles },
            { timeout: config.PROVIDER_REQUEST_TIMEOUT_MS }
          )
        : Promise.reject(new Error("Insufficient candles for ML")),
    ]);

    const indicators = indSettled.status === "fulfilled" ? (indSettled.value.data.indicators || {}) : {};
    const mlForecast = mlSettled.status === "fulfilled" ? mlSettled.value.data : null;

    // 4. Call AI service /analysis/report
    const reportResponse = await axios.post(
      `${config.AI_SERVICE_URL}/analysis/report`,
      {
        symbol,
        question,
        quote,
        indicators,
        ml_forecast: mlForecast,
        force_refresh,
      },
      { timeout: 30000 }
    );

    const generated = reportResponse.data;

    // 5. Persist to research_reports table (best effort)
    let reportId = Date.now();
    try {
      const instRow = await query<{ id: number }>(
        "SELECT id FROM instruments WHERE symbol = $1 LIMIT 1",
        [symbol]
      );
      const instrumentId = instRow[0]?.id ?? null;

      const insRes = await query<{ id: number }>(
        `INSERT INTO research_reports (instrument_id, question, report_text, model_name, data_context, news_sources)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          instrumentId,
          question,
          JSON.stringify(generated.report),
          generated.model_used ?? "gemini-2.5-flash",
          JSON.stringify({ quote, indicators, mlForecast }),
          JSON.stringify(generated.report?.news_context ?? []),
        ]
      );
      if (insRes.length > 0) {
        reportId = insRes[0].id;
      }
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "Could not persist research report to database");
    }

    const responsePayload = {
      report_id: reportId,
      symbol,
      question,
      report: generated.report,
      model_used: generated.model_used,
      generated_at: generated.generated_at,
      cached: false,
      realtime_quote: quote,
    };

    res.json(responsePayload);
  } catch (err) {
    logger.error({ err }, "Report generation error");
    next(err);
  }
});

export default router;
