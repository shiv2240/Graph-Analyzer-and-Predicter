import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { providerRegistry } from "../providers/registry";
import { logger } from "../utils/logger";

const router = Router();

const backtestSchema = z.object({
  symbol: z.string().min(1).max(32),
  strategy_name: z.enum(["sma_crossover", "rsi_oversold", "buy_and_hold"]).default("sma_crossover"),
  params: z
    .object({
      fast: z.number().default(20),
      slow: z.number().default(50),
      rsi_lower: z.number().default(30),
      rsi_upper: z.number().default(70),
    })
    .default({}),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  initial_capital: z.number().positive().default(100000),
  commission_pct: z.number().min(0).default(0.1), // 0.1%
  slippage_pct: z.number().min(0).default(0.05), // 0.05%
});

/**
 * POST /api/v1/backtest
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = backtestSchema.parse(req.body);
    const provider = providerRegistry.getProviderForSymbol(input.symbol);

    const fromDate = input.start_date
      ? new Date(input.start_date)
      : new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);
    const toDate = input.end_date ? new Date(input.end_date) : new Date();

    const candles = await provider.getCandles({
      symbol: input.symbol,
      interval: "1d",
      from: fromDate,
      to: toDate,
    });

    if (!candles || candles.length < 60) {
      res.status(400).json({ error: { code: "INSUFFICIENT_DATA", message: "At least 60 candles required for backtesting" } });
      return;
    }

    // Run backtesting simulation
    const result = runBacktestSimulation(candles, input);

    res.json({
      config_id: Date.now(),
      symbol: input.symbol,
      strategy_name: input.strategy_name,
      result,
    });
  } catch (err) {
    logger.error({ err }, "Backtest execution error");
    next(err);
  }
});

function runBacktestSimulation(candles: Array<any>, config: z.infer<typeof backtestSchema>) {
  let cash = config.initial_capital;
  let shares = 0;
  let tradesCount = 0;
  let winningTrades = 0;
  let entryPrice = 0;

  const costMultiplier = 1 + (config.commission_pct + config.slippage_pct) / 100;
  const sellMultiplier = 1 - (config.commission_pct + config.slippage_pct) / 100;

  const closes = candles.map((c) => Number(c.close));
  const equityCurve: Array<{ date: string; value: number }> = [];

  // Calculate moving averages for sma_crossover
  const fastPeriod = config.params.fast ?? 20;
  const slowPeriod = config.params.slow ?? 50;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const date = candle.ts.split("T")[0];
    const price = closes[i];

    if (config.strategy_name === "sma_crossover") {
      if (i >= slowPeriod) {
        const fastSma = closes.slice(i - fastPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / fastPeriod;
        const slowSma = closes.slice(i - slowPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / slowPeriod;

        // Buy signal
        if (fastSma > slowSma && shares === 0 && cash > price) {
          const buyPrice = price * costMultiplier;
          shares = Math.floor(cash / buyPrice);
          if (shares > 0) {
            cash -= shares * buyPrice;
            entryPrice = buyPrice;
            tradesCount++;
          }
        }
        // Sell signal
        else if (fastSma < slowSma && shares > 0) {
          const sellPrice = price * sellMultiplier;
          const proceed = shares * sellPrice;
          cash += proceed;
          if (sellPrice > entryPrice) {
            winningTrades++;
          }
          shares = 0;
          tradesCount++;
        }
      }
    } else {
      // Buy and hold default
      if (i === 0 && cash > price) {
        const buyPrice = price * costMultiplier;
        shares = Math.floor(cash / buyPrice);
        cash -= shares * buyPrice;
        tradesCount = 1;
      }
    }

    const currentPortfolioValue = cash + shares * price;
    equityCurve.push({ date, value: Math.round(currentPortfolioValue * 100) / 100 });
  }

  // Liquidate at end if still holding
  const finalPrice = closes[closes.length - 1];
  const finalValue = cash + shares * finalPrice * sellMultiplier;
  const totalReturn = (finalValue - config.initial_capital) / config.initial_capital;

  // CAGR calculation
  const totalDays = Math.max(1, (new Date(candles[candles.length - 1].ts).getTime() - new Date(candles[0].ts).getTime()) / (1000 * 3600 * 24));
  const years = totalDays / 365.25;
  const cagr = years > 0 ? Math.pow(finalValue / config.initial_capital, 1 / years) - 1 : totalReturn;

  // Max Drawdown calculation
  let peak = config.initial_capital;
  let maxDd = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const dd = (point.value - peak) / peak;
    if (dd < maxDd) maxDd = dd;
  }

  // Daily returns for Sharpe Ratio
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].value;
    const curr = equityCurve[i].value;
    if (prev > 0) dailyReturns.push((curr - prev) / prev);
  }

  let sharpe = 1.0;
  if (dailyReturns.length > 1) {
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (dailyReturns.length - 1);
    const std = Math.sqrt(variance);
    const annualizedMean = mean * 252;
    const annualizedStd = std * Math.sqrt(252);
    sharpe = annualizedStd > 0 ? (annualizedMean - 0.04) / annualizedStd : 0.0;
  }

  const benchmarkReturn = closes.length > 1 ? (closes[closes.length - 1] - closes[0]) / closes[0] : 0.0;
  const winRate = tradesCount > 0 ? winningTrades / Math.max(1, Math.floor(tradesCount / 2)) : 0.5;

  return {
    total_return: round(totalReturn, 4),
    cagr: round(cagr, 4),
    max_drawdown: round(maxDd, 4),
    sharpe_ratio: round(sharpe, 2),
    num_trades: tradesCount,
    win_rate: round(Math.min(1.0, winRate), 2),
    benchmark_return: round(benchmarkReturn, 4),
    equity_curve: equityCurve.filter((_, i) => i % Math.max(1, Math.floor(equityCurve.length / 100)) === 0),
    disclaimer: "Simulated historical backtest results with transaction cost accounting. Not predictive of future returns.",
  };
}

function round(n: number, d: number): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export default router;
