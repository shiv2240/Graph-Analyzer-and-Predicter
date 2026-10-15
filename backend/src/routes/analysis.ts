import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { providerRegistry } from "../providers/registry";
import { query } from "../db/client";
import { cache } from "../cache/cacheService";
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

// Helper to compute quick indicators on candle bars
function computeTfSummary(candles: any[]) {
  if (!candles || candles.length < 5) {
    return {
      signal: "NEUTRAL" as const,
      rsi: 50.0,
      trend: "Insufficient Data",
      changePct: 0,
      priceAboveSma20: false,
      priceAboveSma50: false,
      lastClose: 0,
    };
  }

  const closes = candles.map((c) => Number(c.close));
  const latest = closes[closes.length - 1];
  const first = closes[0];
  const changePct = first ? ((latest - first) / first) * 100 : 0;

  // SMA 20 & 50
  const n20 = Math.min(closes.length, 20);
  const sma20 = closes.slice(-n20).reduce((a, b) => a + b, 0) / n20;

  const n50 = Math.min(closes.length, 50);
  const sma50 = closes.slice(-n50).reduce((a, b) => a + b, 0) / n50;

  // RSI 14
  let gains = 0;
  let losses = 0;
  const rsiPeriod = Math.min(closes.length - 1, 14);
  for (let i = closes.length - rsiPeriod; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / (rsiPeriod || 1);
  const avgLoss = losses / (rsiPeriod || 1);
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = Math.round((100 - 100 / (1 + rs)) * 10) / 10;

  const priceAboveSma20 = latest >= sma20;
  const priceAboveSma50 = latest >= sma50;
  const isGolden = sma20 >= sma50;

  let signal: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let trend = "Consolidation";

  if (priceAboveSma20 && isGolden && rsi >= 45 && rsi <= 72) {
    signal = "BULLISH";
    trend = "Bullish Trend Continuation";
  } else if (priceAboveSma20 && rsi < 38) {
    signal = "BULLISH";
    trend = "Oversold Rebound Pivot";
  } else if (!priceAboveSma20 && !isGolden && rsi <= 55) {
    signal = "BEARISH";
    trend = "Bearish Distribution Trend";
  } else if (rsi >= 75) {
    signal = "BEARISH";
    trend = "Overbought Exhaustion / Take-Profit";
  } else {
    trend = priceAboveSma20 ? "Mild Bullish Bias" : "Mild Bearish Bias";
    signal = priceAboveSma20 ? "BULLISH" : "BEARISH";
  }

  return {
    signal,
    rsi,
    trend,
    changePct: Math.round(changePct * 100) / 100,
    priceAboveSma20,
    priceAboveSma50,
    lastClose: latest,
  };
}

/**
 * GET /api/v1/analysis/:symbol/multi-timeframe
 * Gathers 1m, 5m, 15m, 30m, 1h, 1d, 1wk candles and computes multi-timeframe confluence + yesterday's key levels
 */
router.get("/:symbol/multi-timeframe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawSymbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
    const symbol = (rawSymbol || "").trim().toUpperCase();

    // 1. Check endpoint cache first (60s TTL)
    const cacheKey = `analysis:mtf:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const provider = providerRegistry.getProviderForSymbol(symbol);
    const now = new Date();
    const intervals = ["1m", "5m", "15m", "30m", "1h", "1d", "1wk"] as const;

    // Fetch timeframes sequentially with per-interval caching to prevent Python thread-pool starvation
    const results: Array<{ interval: string; candles: any[] }> = [];
    for (const intv of intervals) {
      const candleCacheKey = `candles:${symbol}:${intv}`;
      const cachedCandles = cache.get<any[]>(candleCacheKey);
      if (cachedCandles && cachedCandles.length > 0) {
        results.push({ interval: intv, candles: cachedCandles });
        continue;
      }

      let fromDate: Date;
      if (intv === "1m") {
        fromDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      } else if (["5m", "15m", "30m"].includes(intv)) {
        fromDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      } else if (intv === "1h") {
        fromDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      } else if (intv === "1wk") {
        fromDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      } else {
        // 1d
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      try {
        const candles = await provider.getCandles({
          symbol,
          interval: intv,
          from: fromDate,
          to: now,
        });
        const validCandles = candles || [];
        if (validCandles.length > 0) {
          cache.set(candleCacheKey, validCandles, intv.includes("m") ? 30 : 120);
        }
        results.push({ interval: intv, candles: validCandles });
      } catch (_) {
        results.push({ interval: intv, candles: [] });
      }
    }

    const timeframes: Record<string, any> = {};
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    const tfLabels: Record<string, string> = {
      "1m": "1 Min (Live Micro Flow)",
      "5m": "5 Min (Scalp Momentum)",
      "15m": "15 Min (Short-Term Swing)",
      "30m": "30 Min (Session Structure)",
      "1h": "1 Hour (Intraday Anchor)",
      "1d": "1 Day (Macro Daily Trend)",
      "1wk": "1 Week (Secular Regime)",
    };

    results.forEach(({ interval, candles }) => {
      const summary = computeTfSummary(candles);
      if (summary.signal === "BULLISH") bullishCount++;
      else if (summary.signal === "BEARISH") bearishCount++;
      else neutralCount++;

      timeframes[interval] = {
        interval,
        label: tfLabels[interval] || interval,
        signal: summary.signal,
        rsi: summary.rsi,
        trend: summary.trend,
        changePct: summary.changePct,
        priceAboveSma20: summary.priceAboveSma20,
        priceAboveSma50: summary.priceAboveSma50,
        lastClose: summary.lastClose,
        candleCount: candles.length,
      };
    });

    // ── Yesterday's Benchmark Analysis ─────────────────────────────────────
    const dailyCandles = results.find((r) => r.interval === "1d")?.candles || [];
    let yesterdayData = {
      date: "Prior Session",
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0,
      changePct: 0,
      pivot: 0,
      r1: 0,
      r2: 0,
      s1: 0,
      s2: 0,
      positionVsYesterday: "INSIDE_RANGE" as "ABOVE_HIGH" | "BELOW_LOW" | "INSIDE_RANGE",
    };

    const currentPrice = timeframes["1m"]?.lastClose || timeframes["5m"]?.lastClose || timeframes["1d"]?.lastClose || 0;

    if (dailyCandles.length >= 2) {
      // Prior day completed candle is at length - 2 (or length - 1 if session just opened)
      const yest = dailyCandles[dailyCandles.length - 2];
      const yOpen = Number(yest.open);
      const yHigh = Number(yest.high);
      const yLow = Number(yest.low);
      const yClose = Number(yest.close);
      const yVol = Number(yest.volume);
      const yChg = yOpen ? ((yClose - yOpen) / yOpen) * 100 : 0;

      // Floor Pivots
      const pivot = (yHigh + yLow + yClose) / 3;
      const r1 = 2 * pivot - yLow;
      const r2 = pivot + (yHigh - yLow);
      const s1 = 2 * pivot - yHigh;
      const s2 = pivot - (yHigh - yLow);

      let pos: "ABOVE_HIGH" | "BELOW_LOW" | "INSIDE_RANGE" = "INSIDE_RANGE";
      if (currentPrice > yHigh) pos = "ABOVE_HIGH";
      else if (currentPrice < yLow) pos = "BELOW_LOW";

      yesterdayData = {
        date: typeof yest.ts === "string" ? yest.ts.split("T")[0] : new Date(yest.ts).toISOString().split("T")[0],
        open: Math.round(yOpen * 100) / 100,
        high: Math.round(yHigh * 100) / 100,
        low: Math.round(yLow * 100) / 100,
        close: Math.round(yClose * 100) / 100,
        volume: yVol,
        changePct: Math.round(yChg * 100) / 100,
        pivot: Math.round(pivot * 100) / 100,
        r1: Math.round(r1 * 100) / 100,
        r2: Math.round(r2 * 100) / 100,
        s1: Math.round(s1 * 100) / 100,
        s2: Math.round(s2 * 100) / 100,
        positionVsYesterday: pos,
      };
    }

    // ── Confluence Score & Institutional Recommendation ────────────────────
    const totalTf = intervals.length;
    const confluenceScore = Math.round((Math.max(bullishCount, bearishCount) / totalTf) * 1000) / 10;

    let masterVerdict: "STRONG BUY" | "BUY" | "NEUTRAL / HOLD" | "SELL / TAKE PROFIT" | "STRONG SELL" = "NEUTRAL / HOLD";
    let masterAction = "HOLD / MONITOR CHANNELS";
    let strategyAdvice = "";

    const dailyBullish = timeframes["1d"]?.signal === "BULLISH";
    const hourlyBullish = timeframes["1h"]?.signal === "BULLISH";
    const microBullish = timeframes["1m"]?.signal === "BULLISH" && timeframes["5m"]?.signal === "BULLISH";

    if (bullishCount >= 5) {
      masterVerdict = "STRONG BUY";
      masterAction = "ENTER LONG ACCUMULATION";
      strategyAdvice = `Full Multi-Timeframe Confluence (${bullishCount}/${totalTf} Bullish). Macro (1W/1D) and execution (1M/5M) are synchronously aligned. ${yesterdayData.positionVsYesterday === "ABOVE_HIGH" ? "Trading above yesterday's high confirms breakout expansion." : "Targeting yesterday's high with stop below daily pivot."}`;
    } else if (dailyBullish && hourlyBullish && !microBullish) {
      masterVerdict = "BUY";
      masterAction = "ACCUMULATE ON DIP";
      strategyAdvice = `Higher timeframes (1D & 1H) are in a strong uptrend while lower timeframes (1M/5M) are experiencing a routine pullback. Look for value entries near Daily Pivot (${yesterdayData.pivot || "S1"}).`;
    } else if (!dailyBullish && microBullish) {
      masterVerdict = "NEUTRAL / HOLD";
      masterAction = "CAUTION: COUNTER-TREND PULLBACK";
      strategyAdvice = `Lower timeframes (1M/5M) show a short bounce, but Macro 1-Day structure remains Bearish. High risk of bull trap. Do not hold swing longs.`;
    } else if (bearishCount >= 5) {
      masterVerdict = "STRONG SELL";
      masterAction = "TAKE FULL PROFIT / SHORT HEDGE";
      strategyAdvice = `Multi-Timeframe Breakdown (${bearishCount}/${totalTf} Bearish). Price is breaking below key daily support levels. Immediate profit-taking recommended.`;
    } else if (bearishCount >= 4) {
      masterVerdict = "SELL / TAKE PROFIT";
      masterAction = "BOOK PROFITS / TIGHTEN STOPS";
      strategyAdvice = `Bearish distribution across ${bearishCount} timeframes. Consider trimming positions and raising stop loss to break-even.`;
    } else {
      masterVerdict = "NEUTRAL / HOLD";
      masterAction = "WAIT FOR DIRECTIONAL BREAK";
      strategyAdvice = `Market is in an equilibrium range. Timeframes are split (${bullishCount} Bullish, ${bearishCount} Bearish). Trade boundaries between S1 (${yesterdayData.s1}) and R1 (${yesterdayData.r1}).`;
    }

    const result = {
      symbol,
      currentPrice,
      confluenceScore,
      bullishCount,
      bearishCount,
      neutralCount,
      totalTimeframes: totalTf,
      masterVerdict,
      masterAction,
      strategyAdvice,
      timeframes,
      yesterday: yesterdayData,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, "Multi-timeframe analysis error");
    next(err);
  }
});

export default router;
