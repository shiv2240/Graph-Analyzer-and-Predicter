import { z } from "zod";
import { apiClient } from "./apiClient";

// ─── Zod schemas ──────────────────────────────────────────────────────────

export const DataQualitySchema = z.object({
  source: z.string(),
  isDelayed: z.boolean(),
  delayMinutes: z.number().optional(),
  isCached: z.boolean(),
  isAdjusted: z.boolean().optional(),
  lastRefreshed: z.string(),
});

export const CandleBarSchema = z.object({
  ts: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  adjClose: z.number().optional(),
});

export const CandleResponseSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  from: z.string(),
  to: z.string(),
  candles: z.array(CandleBarSchema),
  dataQuality: DataQualitySchema,
});

export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  changeAbs: z.number().optional(),
  changePct: z.number().optional(),
  volume: z.number().optional(),
  dayHigh: z.number().optional(),
  dayLow: z.number().optional(),
  prevClose: z.number().optional(),
  currency: z.string().optional(),
  dataQuality: DataQualitySchema,
});

export const InstrumentSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchange: z.string(),
  instrumentType: z.string(),
  currency: z.string(),
  isin: z.string().optional().nullable(),
});

export const SearchResultSchema = z.object({
  results: z.array(InstrumentSchema),
  count: z.number(),
});

export const IndexEntrySchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchange: z.string(),
  currency: z.string(),
  price: z.number().nullable(),
  changePct: z.number().nullable().optional(),
  changeAbs: z.number().nullable().optional(),
  dataQuality: DataQualitySchema.optional(),
  error: z.string().optional(),
});

export const IndicesResponseSchema = z.object({
  indices: z.array(IndexEntrySchema),
  cached: z.boolean().optional(),
});

export type DataQuality = z.infer<typeof DataQualitySchema>;
export type CandleBar = z.infer<typeof CandleBarSchema>;
export type CandleResponse = z.infer<typeof CandleResponseSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type Instrument = z.infer<typeof InstrumentSchema>;
export type IndexEntry = z.infer<typeof IndexEntrySchema>;

// ─── API functions ─────────────────────────────────────────────────────────

export async function fetchCandles(
  symbol: string,
  interval = "1d",
  from?: string,
  to?: string
): Promise<CandleResponse> {
  const { data } = await apiClient.get(`/instruments/${encodeURIComponent(symbol)}/candles`, {
    params: { interval, from, to },
  });
  return CandleResponseSchema.parse(data);
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const { data } = await apiClient.get(`/instruments/${encodeURIComponent(symbol)}/quote`);
  return QuoteSchema.parse(data);
}

export async function searchInstruments(
  q: string,
  exchange?: string
): Promise<Instrument[]> {
  const { data } = await apiClient.get("/instruments/search", {
    params: { q, exchange },
  });
  return SearchResultSchema.parse(data).results;
}

export async function fetchIndices() {
  const { data } = await apiClient.get("/indices");
  return IndicesResponseSchema.parse(data);
}

export async function fetchHealth() {
  const { data } = await apiClient.get("/../../health");
  return data as {
    status: string;
    dependencies: { postgres: string; ai_service: string };
  };
}

export async function fetchIndicators(symbol: string, interval = "1d") {
  const { data } = await apiClient.get(`/indicators/${encodeURIComponent(symbol)}`, {
    params: { interval },
  });
  return data;
}

export async function fetchIndicatorSeries(symbol: string, interval = "1d", indicators = "sma_20,sma_50,rsi_14,macd,bb") {
  const { data } = await apiClient.get(`/indicators/${encodeURIComponent(symbol)}/series`, {
    params: { interval, indicators },
  });
  return data;
}

export async function fetchNews(symbol?: string) {
  const { data } = await apiClient.get("/news", {
    params: { symbol, limit: 10 },
  });
  return data;
}

export async function generateAIReport(symbol: string, question?: string, forceRefresh?: boolean) {
  const { data } = await apiClient.post("/analysis/report", {
    symbol,
    question,
    force_refresh: forceRefresh,
  });
  return data;
}

export async function fetchMLModels() {
  const { data } = await apiClient.get("/ml/models");
  return data;
}

export async function fetchMLPrediction(symbol: string, modelType = "xgboost") {
  const { data } = await apiClient.get(`/ml/predict/${encodeURIComponent(symbol)}`, {
    params: { model_type: modelType },
  });
  return data;
}

export async function trainMLModel(symbol: string, modelType = "xgboost", targetHorizon = 1) {
  const { data } = await apiClient.post("/ml/train", {
    symbol,
    model_type: modelType,
    target_horizon: targetHorizon,
  });
  return data;
}

export async function runScreener(
  filters: any[] = [],
  sort?: { field: string; direction: "asc" | "desc" },
  page = 1,
  limit = 20,
  search = ""
) {
  const { data } = await apiClient.post("/screener", { filters, sort, page, limit, search });
  return data;
}

export async function fetchPortfolio() {
  const { data } = await apiClient.get("/portfolio");
  return data;
}

export async function addPortfolioPosition(pos: {
  symbol: string;
  quantity: number;
  entry_price: number;
  entry_date?: string;
  notes?: string;
}) {
  const { data } = await apiClient.post("/portfolio/positions", pos);
  return data;
}

export async function deletePortfolioPosition(id: number) {
  const { data } = await apiClient.delete(`/portfolio/positions/${id}`);
  return data;
}

export async function fetchPortfolioPerformance() {
  const { data } = await apiClient.get("/portfolio/performance");
  return data;
}

export async function runBacktest(payload: {
  symbol: string;
  strategy_name: string;
  params?: any;
  initial_capital?: number;
  commission_pct?: number;
  slippage_pct?: number;
}) {
  const { data } = await apiClient.post("/backtest", payload);
  return data;
}

export async function fetchMLStatus() {
  const { data } = await apiClient.get("/ml/status");
  return data;
}

export async function trainAllModels(modelType = "xgboost") {
  const { data } = await apiClient.post("/ml/train-all", { model_type: modelType });
  return data;
}

export async function trainSingleModel(symbol: string, modelType = "xgboost") {
  const { data } = await apiClient.post("/ml/train", { symbol, model_type: modelType });
  return data;
}

export async function fetchTrainingJobStatus() {
  const { data } = await apiClient.get("/ml/training-job");
  return data;
}

export async function stopTrainingJob() {
  const { data } = await apiClient.post("/ml/training-job/stop");
  return data;
}

export async function toggleContinuousTraining(enabled: boolean, intervalMinutes = 60) {
  const { data } = await apiClient.post("/ml/training-job/continuous", {
    enabled,
    interval_minutes: intervalMinutes,
  });
  return data;
}

export interface TimeframeSignal {
  interval: string;
  label: string;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  rsi: number;
  trend: string;
  changePct: number;
  priceAboveSma20: boolean;
  priceAboveSma50: boolean;
  lastClose: number;
  candleCount: number;
}

export interface YesterdayContext {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePct: number;
  pivot: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
  positionVsYesterday: "ABOVE_HIGH" | "BELOW_LOW" | "INSIDE_RANGE";
}

export interface MultiTimeframeReport {
  symbol: string;
  currentPrice: number;
  confluenceScore: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  totalTimeframes: number;
  masterVerdict: "STRONG BUY" | "BUY" | "NEUTRAL / HOLD" | "SELL / TAKE PROFIT" | "STRONG SELL";
  masterAction: string;
  strategyAdvice: string;
  timeframes: Record<string, TimeframeSignal>;
  yesterday: YesterdayContext;
  generatedAt: string;
}

export async function fetchMultiTimeframeAnalysis(symbol: string): Promise<MultiTimeframeReport> {
  const { data } = await apiClient.get(`/analysis/${encodeURIComponent(symbol)}/multi-timeframe`);
  return data;
}


