-- Migration 0004: Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id              BIGSERIAL PRIMARY KEY,
  instrument_id   INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  price           NUMERIC(20,6) NOT NULL,
  change_abs      NUMERIC(20,6),
  change_pct      NUMERIC(10,4),
  volume          BIGINT,
  bid             NUMERIC(20,6),
  ask             NUMERIC(20,6),
  day_high        NUMERIC(20,6),
  day_low         NUMERIC(20,6),
  prev_close      NUMERIC(20,6),
  source          VARCHAR(32) NOT NULL,
  is_delayed      BOOLEAN NOT NULL DEFAULT TRUE,
  delay_minutes   INTEGER,
  exchange_ts     TIMESTAMPTZ,               -- exchange-reported time
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_instrument_ts
  ON quotes(instrument_id, recorded_at DESC);
