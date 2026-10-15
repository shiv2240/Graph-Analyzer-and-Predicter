import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { providerRegistry } from "../providers/registry";
import { config } from "../config";
import { logger } from "../utils/logger";

import { query } from "../db/client";

const router = Router();

const symbolSchema = z.string().min(1).max(32);

const trainRequestSchema = z.object({
  symbol: z.string().min(1).max(32),
  model_type: z.enum(["logistic", "rf", "xgboost", "baseline"]).default("xgboost"),
  target_horizon: z.number().int().min(1).max(30).default(1),
});

/**
 * Helper to train and persist a model into Neon DB ml_models & ml_predictions
 */
export async function trainAndPersistModel(
  symbol: string,
  modelType = "xgboost",
  targetHorizon = 1
) {
  // 1. Look up instrument in Neon DB
  const instrumentRows = await query<{ id: number; symbol: string; name: string }>(
    "SELECT id, symbol, name FROM instruments WHERE symbol = $1 LIMIT 1",
    [symbol]
  );
  const instrumentId: number | null = instrumentRows.length ? instrumentRows[0].id : null;

  // 2. Query stored candles from Neon DB
  let candles: { ts: string; open: number; high: number; low: number; close: number; volume: number; adjClose?: number }[] = [];
  if (instrumentId) {
    const res = await query<{
      ts: Date;
      open: string;
      high: string;
      low: string;
      close: string;
      volume: string;
      adj_close: string | null;
    }>(
      `SELECT ts, open::float, high::float, low::float, close::float, volume::bigint, adj_close::float
       FROM candles WHERE instrument_id = $1 ORDER BY ts ASC`,
      [instrumentId]
    );
    candles = res.map((c) => ({
      ts: c.ts instanceof Date ? c.ts.toISOString() : new Date(c.ts).toISOString(),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume),
      adjClose: c.adj_close ? Number(c.adj_close) : undefined,
    }));
  }

  // If not enough candles in Neon DB, pull via market provider
  if (candles.length < 60) {
    const provider = providerRegistry.getProviderForSymbol(symbol);
    const fetched = await provider.getCandles({
      symbol,
      interval: "1d",
      from: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000),
      to: new Date(),
    });
    if (fetched && fetched.length >= 60) {
      candles = fetched.map((c) => ({
        ts: typeof c.ts === "string" ? c.ts : new Date(c.ts).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        adjClose: c.adjClose,
      }));
    }
  }

  if (candles.length < 60) {
    throw new Error(`Insufficient data for ${symbol}: only ${candles.length} candles available (minimum 60 required)`);
  }

  // 3. Dispatch training to Python AI Service
  const aiRes = await axios.post(
    `${config.AI_SERVICE_URL}/ml/train`,
    { symbol, model_type: modelType, target_horizon: targetHorizon, candles },
    { timeout: 90000 }
  );

  const trainData = aiRes.data;
  const trainFrom = new Date(candles[0].ts);
  const trainTo = new Date(candles[candles.length - 1].ts);

  // 4. Persist trained model record into Neon DB ml_models table
  let savedModelId: number | null = null;
  if (instrumentId) {
    const modelInsert = await query<{ id: number }>(
      `INSERT INTO ml_models (
        instrument_id, model_type, version, target_horizon, train_from, train_to,
        feature_list, hyperparameters, artifact_path, metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        instrumentId,
        modelType,
        "v1.0.0",
        targetHorizon,
        trainFrom,
        trainTo,
        trainData.features,
        JSON.stringify({ n_estimators: 150, max_depth: 5, learning_rate: 0.05 }),
        trainData.artifact_path,
        JSON.stringify(trainData.metrics),
      ]
    );
    if (modelInsert.length) {
      savedModelId = modelInsert[0].id;
    }

    // 5. Generate and persist the latest prediction to ml_predictions table
    try {
      const predRes = await axios.post(
        `${config.AI_SERVICE_URL}/ml/predict`,
        { symbol, model_type: modelType, candles },
        { timeout: 15000 }
      );
      if (predRes.data && savedModelId) {
        const pred = predRes.data;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + targetHorizon);

        await query(
          `INSERT INTO ml_predictions (
            model_id, instrument_id, target_date, prediction, probability, features_used
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            savedModelId,
            instrumentId,
            targetDate.toISOString().split("T")[0],
            pred.prediction,
            pred.probability,
            JSON.stringify(pred.model?.detected_patterns || {}),
          ]
        );
      }
    } catch (predErr) {
      logger.warn({ predErr }, "Could not record initial prediction in Neon DB");
    }
  }

  return {
    ...trainData,
    model_id: savedModelId,
    instrument_id: instrumentId,
    train_samples: candles.length,
    train_from: trainFrom.toISOString(),
    train_to: trainTo.toISOString(),
  };
}

/**
 * GET /api/v1/ml/models - Return available ML models and model records
 */
router.get("/models", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await query(
      `SELECT m.id, m.model_type, m.version, m.target_horizon, m.train_from, m.train_to,
              m.metrics, m.created_at, i.symbol, i.name as instrument_name
       FROM ml_models m
       JOIN instruments i ON m.instrument_id = i.id
       ORDER BY m.created_at DESC`
    );

    const standardFeatures = [
      "return_1d",
      "return_5d",
      "return_10d",
      "return_21d",
      "rsi_14",
      "macd",
      "macd_signal",
      "macd_hist",
      "bb_upper_ratio",
      "bb_lower_ratio",
      "bb_bandwidth",
      "atr_ratio",
      "volatility_21d",
      "sma_20_ratio",
      "sma_50_ratio",
      "sma_200_ratio",
      "volume_ratio_20d",
      "high_low_spread",
      "close_open_spread",
      "day_of_week",
    ];

    res.json({
      available_models: [
        {
          id: "xgboost",
          name: "XGBoost Gradient Boosted Trees",
          type: "GRADIENT_BOOSTED_TREES",
          description: "High-performance tree ensemble using shallow depth (max_depth=3) with L1/L2 regularization to mitigate financial overfitting.",
          features: standardFeatures,
          default: true,
        },
        {
          id: "rf",
          name: "Random Forest Ensemble (100 Trees)",
          type: "BAGGED_TREES",
          description: "Bootstrap-aggregated ensemble of 100 decorrelated decision trees with out-of-bag validation and feature subsampling.",
          features: standardFeatures,
          default: false,
        },
        {
          id: "logistic",
          name: "L2 Regularized Logistic Regression",
          type: "LINEAR_CLASSIFIER",
          description: "Calibrated probabilistic linear classifier with StandardScaler pipeline and L2 ridge penalty to prevent co-linearity.",
          features: standardFeatures,
          default: false,
        },
        {
          id: "baseline",
          name: "Majority Class Baseline Classifier",
          type: "BENCHMARK_DUMMY",
          description: "Zero-rule naive directional benchmark reflecting underlying secular market drift to establish minimum alpha threshold.",
          features: standardFeatures.slice(0, 4),
          default: false,
        },
      ],
      models,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/ml/status - Inspect all trained models and predictions in Neon DB
 */
router.get("/status", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await query(
      `SELECT m.id, m.model_type, m.version, m.target_horizon, m.train_from, m.train_to,
              m.metrics, m.created_at, i.symbol, i.name as instrument_name
       FROM ml_models m
       JOIN instruments i ON m.instrument_id = i.id
       ORDER BY m.created_at DESC`
    );

    const distinctInstrumentsCount = new Set(models.map((m: any) => m.symbol)).size;
    const totalInstrumentsCount = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM instruments WHERE is_active = true"
    );
    const predictionsCount = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM ml_predictions"
    );

    res.json({
      total_models: models.length,
      distinct_instruments_trained: distinctInstrumentsCount,
      total_active_instruments: parseInt(totalInstrumentsCount[0]?.count || "49", 10),
      total_predictions: parseInt(predictionsCount[0]?.count || "0", 10),
      models,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ml/train-all - 1-Click Retrain All Active Instruments in the Background
 */
router.post("/train-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelType = (req.body.model_type as string) || "xgboost";
    const { triggerBackgroundTraining } = await import("../services/backgroundTrainingService");
    const result = triggerBackgroundTraining(modelType);
    res.status(202).json(result);
  } catch (err) {
    logger.error({ err }, "Batch ML training trigger error");
    next(err);
  }
});

/**
 * GET /api/v1/ml/training-job - Get live progress and status of background training
 */
router.get("/training-job", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getTrainingJobStatus } = await import("../services/backgroundTrainingService");
    res.json(getTrainingJobStatus());
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ml/training-job/stop - Stop active background training
 */
router.post("/training-job/stop", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { stopBackgroundTraining } = await import("../services/backgroundTrainingService");
    res.json(stopBackgroundTraining());
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ml/training-job/continuous - Toggle continuous background training
 */
router.post("/training-job/continuous", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enabled = Boolean(req.body.enabled);
    const intervalMinutes = req.body.interval_minutes ? Number(req.body.interval_minutes) : 60;
    const { setContinuousMode } = await import("../services/backgroundTrainingService");
    res.json(setContinuousMode(enabled, intervalMinutes));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ml/daily-schedule/trigger - Trigger daily incremental data ingestion & model retraining
 */
router.post("/daily-schedule/trigger", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { triggerDailyRetraining } = await import("../services/dailyTrainingScheduler");
    const summary = await triggerDailyRetraining();
    res.json(summary);
  } catch (err) {
    logger.error({ err }, "Error triggering daily retraining");
    next(err);
  }
});

/**
 * POST /api/v1/ml/train
 */
router.post("/train", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol, model_type, target_horizon } = trainRequestSchema.parse(req.body);
    const result = await trainAndPersistModel(symbol, model_type, target_horizon);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "ML training error");
    next(err);
  }
});

/**
 * GET /api/v1/ml/predict/:symbol
 */
router.get("/predict/:symbol", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = symbolSchema.parse(req.params.symbol);
    const modelType = (req.query.model_type as string) || "xgboost";
    const provider = providerRegistry.getProviderForSymbol(symbol);

    const candles = await provider.getCandles({
      symbol,
      interval: "1d",
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      to: new Date(),
    });

    if (!candles || candles.length < 30) {
      res.status(400).json({ error: { code: "INSUFFICIENT_DATA", message: "At least 30 candles required" } });
      return;
    }

    const aiRes = await axios.post(
      `${config.AI_SERVICE_URL}/ml/predict`,
      { symbol, model_type: modelType, candles },
      { timeout: config.PROVIDER_REQUEST_TIMEOUT_MS }
    );

    res.json(aiRes.data);
  } catch (err) {
    logger.error({ err }, "ML prediction error");
    next(err);
  }
});

/**
 * POST /api/v1/ml/walk-forward
 */
router.post("/walk-forward", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = symbolSchema.parse(req.body.symbol);
    const modelType = (req.body.model_type as string) || "rf";
    const provider = providerRegistry.getProviderForSymbol(symbol);

    const candles = await provider.getCandles({
      symbol,
      interval: "1d",
      from: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000),
      to: new Date(),
    });

    const aiRes = await axios.post(
      `${config.AI_SERVICE_URL}/ml/walk-forward`,
      { symbol, model_type: modelType, candles },
      { timeout: 60000 }
    );

    res.json(aiRes.data);
  } catch (err) {
    logger.error({ err }, "Walk forward validation error");
    next(err);
  }
});

export default router;
