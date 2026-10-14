/**
 * Core market data types shared across the application.
 * All monetary values use number (JavaScript). Database stores NUMERIC(20,6).
 * All timestamps in UTC ISO 8601 strings.
 */

export interface Instrument {
  symbol: string;
  name: string;
  exchange: string;
  instrumentType: "EQUITY" | "INDEX" | "ETF" | "FUTURE";
  currency: string;
  isin?: string;
}

export interface CandleBar {
  ts: string; // ISO 8601 UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface DataQuality {
  source: string;
  isDelayed: boolean;
  delayMinutes?: number;
  isCached: boolean;
  isAdjusted?: boolean;
  lastRefreshed: string; // ISO 8601 UTC
}

export interface Quote {
  symbol: string;
  price: number;
  changeAbs?: number;
  changePct?: number;
  volume?: number;
  bid?: number;
  ask?: number;
  dayHigh?: number;
  dayLow?: number;
  prevClose?: number;
  dataQuality: DataQuality;
}

export interface CandleParams {
  symbol: string;
  interval: "1d" | "1wk" | "1mo" | "1h" | "15m" | "5m" | "1m";
  from: Date;
  to: Date;
}

export interface CandleResponse {
  symbol: string;
  interval: string;
  from: string;
  to: string;
  candles: CandleBar[];
  dataQuality: DataQuality;
}

export interface Fundamentals {
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  sector?: string;
  industry?: string;
}

export interface IndicatorSnapshot {
  sma: Record<string, number | null>;      // key: period string
  ema: Record<string, number | null>;
  rsi: Record<string, number | null>;
  macd: { line: number | null; signal: number | null; histogram: number | null };
  bollingerBands: { upper: number | null; middle: number | null; lower: number | null };
  atr: Record<string, number | null>;
  volatility21d: number | null;
  maxDrawdown: number | null;
  volumeSma20: number | null;
  volumeSpike: boolean;
}

export type QuoteCallback = (quote: Omit<Quote, "dataQuality"> & { isDelayed: boolean }) => void;
export type Unsubscribe = () => void;
