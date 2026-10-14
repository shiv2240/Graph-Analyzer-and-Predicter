-- Migration 0003: Create candles table
CREATE TABLE IF NOT EXISTS candles (
  id            BIGSERIAL PRIMARY KEY,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  interval      VARCHAR(8) NOT NULL,          -- 1d, 1wk, 1mo, 1h, 15m, 5m
  ts            TIMESTAMPTZ NOT NULL,         -- candle open time (UTC)
  open          NUMERIC(20,6) NOT NULL,
  high          NUMERIC(20,6) NOT NULL,
  low           NUMERIC(20,6) NOT NULL,
  close         NUMERIC(20,6) NOT NULL,
  volume        BIGINT NOT NULL,
  adj_close     NUMERIC(20,6),               -- adjusted for splits/dividends
  source        VARCHAR(32) NOT NULL,         -- yfinance, finnhub, alphavantage, etc.
  is_complete   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instrument_id, interval, ts)
);

CREATE INDEX IF NOT EXISTS idx_candles_instrument_interval_ts
  ON candles(instrument_id, interval, ts DESC);
