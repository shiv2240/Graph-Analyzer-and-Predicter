import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { providerRegistry } from "../providers/registry";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

const symbolSchema = z.string().min(1).max(32);

const trainRequestSchema = z.object({
  symbol: z.string().min(1).max(32),
  model_type: z.enum(["logistic", "rf", "xgboost", "baseline"]).default("xgboost"),
  target_horizon: z.number().int().min(1).max(30).default(1),
});

/**
 * GET /api/v1/ml/models
 */
router.get("/models", (_req: Request, res: Response) => {
  res.json({
    available_models: [
      {
        id: "xgboost_v1",
        name: "Extreme Gradient Boosting (XGBoost)",
        type: "xgboost",
        description: "Ensemble decision tree model optimized for non-linear momentum & volatility interactions.",
        features: ["rsi_14", "macd_hist", "bb_position", "return_1d", "vol_ratio", "atr_pct", "above_sma_50"],
        default_horizon: 1,
      },
      {
        id: "rf_v1",
        name: "Random Forest Classifier",
        type: "rf",
        description: "Bagging ensemble of decision trees with high resistance to financial market noise.",
        features: ["rsi_14", "macd_hist", "bb_position", "return_1d", "vol_ratio", "above_sma_200"],
        default_horizon: 1,
      },
      {
        id: "logistic_v1",
        name: "L2 Regularized Logistic Regression",
        type: "logistic",
        description: "Linear probabilistic baseline classifier for directional odds.",
        features: ["rsi_14", "macd_hist", "return_1d"],
        default_horizon: 1,
      },
      {
        id: "baseline_majority",
        name: "Majority Class Benchmark",
        type: "baseline",
        description: "Unconditional majority class predictor used to verify non-trivial statistical alpha.",
        features: [],
        default_horizon: 1,
      },
    ],
  });
});

/**
 * POST /api/v1/ml/train
 */
router.post("/train", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol, model_type, target_horizon } = trainRequestSchema.parse(req.body);
    const provider = providerRegistry.getProviderForSymbol(symbol);

    const candles = await provider.getCandles({
      symbol,
      interval: "1d",
      from: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
      to: new Date(),
    });

    if (!candles || candles.length < 60) {
      res.status(400).json({ error: { code: "INSUFFICIENT_DATA", message: "At least 60 candles required" } });
      return;
    }

    const aiRes = await axios.post(
      `${config.AI_SERVICE_URL}/ml/train`,
      { symbol, model_type, target_horizon, candles },
      { timeout: 60000 }
    );

    res.json(aiRes.data);
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
