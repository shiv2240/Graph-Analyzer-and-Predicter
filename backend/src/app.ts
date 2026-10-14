import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import instrumentsRouter from "./routes/instruments";
import indicesRouter from "./routes/indices";
import indicatorsRouter from "./routes/indicators";
import analysisRouter from "./routes/analysis";
import newsRouter from "./routes/news";
import mlRouter from "./routes/ml";
import screenerRouter from "./routes/screener";
import portfolioRouter from "./routes/portfolio";
import backtestRouter from "./routes/backtest";

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or localhost/127.0.0.1 on any port
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ─── Request parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// ─── Logging ─────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    redact: ["req.headers.authorization", "req.headers.cookie"],
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : "info"),
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" } },
});
app.use("/api", apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/api/v1/instruments", instrumentsRouter);
app.use("/api/v1/indices", indicesRouter);
app.use("/api/v1/indicators", indicatorsRouter);
app.use("/api/v1/analysis", analysisRouter);
app.use("/api/v1/news", newsRouter);
app.use("/api/v1/ml", mlRouter);
app.use("/api/v1/screener", screenerRouter);
app.use("/api/v1/portfolio", portfolioRouter);
app.use("/api/v1/backtest", backtestRouter);

// v1 candle / quote convenience routes
app.use("/api/v1/candles/:symbol", (req, res, next) => {
  const sym = req.params.symbol;
  const queryPart = req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";
  req.url = `/${sym}/candles${queryPart}`;
  instrumentsRouter(req, res, next);
});

app.use("/api/v1/quotes/:symbol", (req, res, next) => {
  const sym = req.params.symbol;
  const queryPart = req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";
  req.url = `/${sym}/quote${queryPart}`;
  instrumentsRouter(req, res, next);
});

// ─── 404 catch-all ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// ─── Error handler ────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
