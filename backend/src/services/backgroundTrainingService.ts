import { query } from "../db/client";
import { trainAndPersistModel } from "../routes/ml";
import { logger } from "../utils/logger";
import { io } from "../server";

export interface TrainingJobState {
  jobId: string | null;
  status: "idle" | "running" | "completed" | "failed";
  modelType: string;
  startTime: string | null;
  completedTime: string | null;
  totalInstruments: number;
  completedCount: number;
  failedCount: number;
  currentSymbol: string | null;
  results: Array<{ symbol: string; success: boolean; accuracy?: number; f1?: number; error?: string }>;
  isContinuous: boolean;
  intervalMinutes: number;
  message: string | null;
}

const state: TrainingJobState = {
  jobId: null,
  status: "idle",
  modelType: "xgboost",
  startTime: null,
  completedTime: null,
  totalInstruments: 0,
  completedCount: 0,
  failedCount: 0,
  currentSymbol: null,
  results: [],
  isContinuous: true,
  intervalMinutes: 60, // runs continuous cycles every 60m by default
  message: null,
};

let continuousTimer: ReturnType<typeof setInterval> | null = null;
let isStopping = false;

function emitProgress() {
  try {
    if (io) {
      io.emit("ml_training_progress", { ...state });
    }
  } catch (err) {
    // ignore socket emit error
  }
}

/**
 * Executes a full background training cycle asynchronously across all instruments.
 */
export async function executeTrainingCycle(modelType = state.modelType): Promise<void> {
  if (state.status === "running") {
    logger.warn("Training job cycle already in progress. Skipping duplicate start.");
    return;
  }

  const jobId = `job_${Date.now()}`;
  state.jobId = jobId;
  state.status = "running";
  state.modelType = modelType;
  state.startTime = new Date().toISOString();
  state.completedTime = null;
  state.completedCount = 0;
  state.failedCount = 0;
  state.currentSymbol = null;
  state.results = [];
  state.message = "Initializing background training cycle across Neon DB instruments...";
  isStopping = false;

  logger.info({ jobId, modelType }, "Background ML continuous training cycle started");
  emitProgress();

  try {
    // 1. Fetch all active instruments
    const instruments = await query<{ id: number; symbol: string; name: string }>(
      `SELECT i.id, i.symbol, i.name
       FROM instruments i
       WHERE i.is_active = true
       ORDER BY i.id ASC`
    );

    state.totalInstruments = instruments.length;
    emitProgress();

    // 2. Process each instrument sequentially in the background
    for (let i = 0; i < instruments.length; i++) {
      if (isStopping) {
        logger.info({ jobId }, "Background training job stopped by user request");
        state.message = "Training job cancelled by user";
        break;
      }

      const inst = instruments[i];
      state.currentSymbol = inst.symbol;
      state.message = `Training model for ${inst.symbol} (${i + 1}/${instruments.length})...`;
      emitProgress();

      try {
        const trained = await trainAndPersistModel(inst.symbol, modelType, 1);
        state.completedCount++;
        state.results.unshift({
          symbol: inst.symbol,
          success: true,
          accuracy: trained.metrics?.accuracy,
          f1: trained.metrics?.f1,
        });
        logger.info(
          { symbol: inst.symbol, accuracy: trained.metrics?.accuracy, count: state.completedCount },
          "Background model training succeeded"
        );
      } catch (err: any) {
        state.failedCount++;
        state.results.unshift({
          symbol: inst.symbol,
          success: false,
          error: err.message,
        });
        logger.warn({ symbol: inst.symbol, err: err.message }, "Background model training skipped for instrument");
      }

      emitProgress();
    }

    state.status = "completed";
    state.completedTime = new Date().toISOString();
    state.currentSymbol = null;
    state.message = `Cycle complete: trained ${state.completedCount} models, ${state.failedCount} failed`;
    logger.info({ jobId, completed: state.completedCount, failed: state.failedCount }, "Background training cycle finished");
    emitProgress();
  } catch (err: any) {
    state.status = "failed";
    state.completedTime = new Date().toISOString();
    state.currentSymbol = null;
    state.message = `Training cycle failed: ${err.message}`;
    logger.error({ err, jobId }, "Background training cycle error");
    emitProgress();
  }
}

/**
 * Returns the current background training state and progress.
 */
export function getTrainingJobStatus(): TrainingJobState {
  return { ...state };
}

/**
 * Starts a background training run immediately without holding HTTP request open.
 */
export function triggerBackgroundTraining(modelType = "xgboost"): {
  success: boolean;
  message: string;
  job: TrainingJobState;
} {
  if (state.status === "running") {
    return {
      success: true,
      message: `Background training is already actively running for ${state.currentSymbol || "instruments"}.`,
      job: getTrainingJobStatus(),
    };
  }

  // Launch asynchronously in background (fire-and-forget)
  setImmediate(() => {
    executeTrainingCycle(modelType).catch((err) => {
      logger.error({ err }, "Unhandled error in background training execution");
    });
  });

  return {
    success: true,
    message: "Background training job started successfully.",
    job: {
      ...state,
      status: "running",
      startTime: new Date().toISOString(),
      message: "Job queued and starting...",
    },
  };
}

/**
 * Stops or cancels the current background training run.
 */
export function stopBackgroundTraining(): { success: boolean; message: string; job: TrainingJobState } {
  if (state.status === "running") {
    isStopping = true;
    state.message = "Stopping training job...";
    emitProgress();
    return { success: true, message: "Stopping current training cycle.", job: getTrainingJobStatus() };
  }
  return { success: false, message: "No training job is currently running.", job: getTrainingJobStatus() };
}

/**
 * Toggles continuous background training loop (runs automatically every intervalMinutes).
 */
export function setContinuousMode(enabled: boolean, intervalMinutes = 60): TrainingJobState {
  state.isContinuous = enabled;
  state.intervalMinutes = Math.max(5, intervalMinutes);

  if (continuousTimer) {
    clearInterval(continuousTimer);
    continuousTimer = null;
  }

  if (enabled) {
    const ms = state.intervalMinutes * 60 * 1000;
    logger.info({ intervalMinutes: state.intervalMinutes }, "Continuous ML background training loop enabled");
    continuousTimer = setInterval(() => {
      if (state.status !== "running") {
        logger.info("Continuous scheduler triggering background retraining cycle...");
        executeTrainingCycle().catch((err) => logger.error({ err }, "Continuous training cycle error"));
      }
    }, ms);
  } else {
    logger.info("Continuous ML background training loop disabled");
  }

  emitProgress();
  return getTrainingJobStatus();
}

/**
 * Initializes the background continuous training scheduler on server start.
 */
export function initBackgroundTrainingService(): void {
  logger.info("Initializing Continuous Background ML Training Service (default: 60m cycle)...");
  setContinuousMode(true, 60);
}
