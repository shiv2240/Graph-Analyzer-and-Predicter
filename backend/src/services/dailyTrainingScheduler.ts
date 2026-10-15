import { query } from "../db/client";
import { providerRegistry } from "../providers/registry";
import { trainAndPersistModel } from "../routes/ml";
import { logger } from "../utils/logger";

interface RetrainResult {
  symbol: string;
  success: boolean;
  modelId?: number;
  accuracy?: number;
  f1?: number;
  error?: string;
}

/**
 * Executes a full daily incremental data ingestion and walk-forward retraining run
 * across all active instruments in Neon DB.
 */
export async function triggerDailyRetraining(): Promise<{
  timestamp: string;
  totalInstruments: number;
  successful: number;
  failed: number;
  results: RetrainResult[];
}> {
  logger.info("Starting automated daily market candle ingestion & ML retraining pipeline...");

  const instruments = await query<{ id: number; symbol: string; name: string }>(
    "SELECT id, symbol, name FROM instruments WHERE is_active = true ORDER BY id ASC"
  );

  const results: RetrainResult[] = [];

  for (const inst of instruments) {
    try {
      logger.info({ symbol: inst.symbol }, "Ingesting latest daily candle and retraining model...");
      
      // 1. Fetch latest daily candle from provider to capture latest upcoming market data
      const provider = providerRegistry.getProviderForSymbol(inst.symbol);
      const recentCandles = await provider.getCandles({
        symbol: inst.symbol,
        interval: "1d",
        from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // last 14 days to bridge any weekends/holidays
        to: new Date(),
      });

      // 2. Persist new candles into Neon DB
      for (const c of recentCandles) {
        await query(
          `INSERT INTO candles (instrument_id, interval, ts, open, high, low, close, volume, adj_close, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (instrument_id, interval, ts) DO UPDATE SET
             open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low,
             close = EXCLUDED.close, volume = EXCLUDED.volume,
             adj_close = EXCLUDED.adj_close, source = EXCLUDED.source`,
          [inst.id, "1d", c.ts, c.open, c.high, c.low, c.close, c.volume, c.adjClose ?? null, "daily_auto_pipeline"]
        );
      }

      // 3. Train on complete historical + new upcoming candles
      const trained = await trainAndPersistModel(inst.symbol, "xgboost", 1);

      results.push({
        symbol: inst.symbol,
        success: true,
        modelId: trained.model_id ?? undefined,
        accuracy: trained.metrics?.accuracy,
        f1: trained.metrics?.f1,
      });

      logger.info(
        { symbol: inst.symbol, accuracy: trained.metrics?.accuracy, modelId: trained.model_id },
        "Automated daily model training completed successfully"
      );
    } catch (err: any) {
      logger.warn({ symbol: inst.symbol, err: err.message }, "Daily retraining skipped for symbol");
      results.push({
        symbol: inst.symbol,
        success: false,
        error: err.message,
      });
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totalInstruments: instruments.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };

  logger.info(summary, "Automated daily ML training pipeline finished");
  return summary;
}

/**
 * Starts the daily background retraining scheduler (executes every 24 hours)
 */
export function startDailyTrainingScheduler(): void {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  logger.info("Initializing Daily ML Continuous Training Scheduler (24h cycle)...");

  // Schedule daily interval
  setInterval(async () => {
    try {
      await triggerDailyRetraining();
    } catch (err) {
      logger.error({ err }, "Error in daily retraining scheduler cycle");
    }
  }, TWENTY_FOUR_HOURS);
}
