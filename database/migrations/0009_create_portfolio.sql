-- Migration 0009: Create portfolio_positions table
CREATE TABLE IF NOT EXISTS portfolio_positions (
  id              SERIAL PRIMARY KEY,
  instrument_id   INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  quantity        NUMERIC(20,6) NOT NULL,
  entry_price     NUMERIC(20,6) NOT NULL,
  entry_date      DATE NOT NULL,
  exit_price      NUMERIC(20,6),
  exit_date       DATE,
  notes           TEXT,
  is_open         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_instrument ON portfolio_positions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_is_open ON portfolio_positions(is_open);
