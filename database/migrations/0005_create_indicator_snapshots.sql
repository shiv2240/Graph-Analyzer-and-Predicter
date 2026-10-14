-- Migration 0005: Create indicator_snapshots table
CREATE TABLE IF NOT EXISTS indicator_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  interval      VARCHAR(8) NOT NULL,
  as_of         TIMESTAMPTZ NOT NULL,          -- last candle date used
  sma_20        NUMERIC(20,6),
  sma_50        NUMERIC(20,6),
  sma_200       NUMERIC(20,6),
  ema_12        NUMERIC(20,6),
  ema_26        NUMERIC(20,6),
  rsi_14        NUMERIC(8,4),
  macd_line     NUMERIC(20,6),
  macd_signal   NUMERIC(20,6),
  macd_hist     NUMERIC(20,6),
  bb_upper      NUMERIC(20,6),
  bb_middle     NUMERIC(20,6),
  bb_lower      NUMERIC(20,6),
  atr_14        NUMERIC(20,6),
  volatility_21 NUMERIC(10,6),               -- realized vol
  max_drawdown  NUMERIC(10,6),               -- max drawdown over lookback
  volume_sma_20 BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instrument_id, interval, as_of)
);

CREATE INDEX IF NOT EXISTS idx_indicators_instrument_interval_asof
  ON indicator_snapshots(instrument_id, interval, as_of DESC);
