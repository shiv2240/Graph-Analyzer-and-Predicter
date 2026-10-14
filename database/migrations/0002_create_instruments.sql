-- Migration 0002: Create instruments table
CREATE TABLE IF NOT EXISTS instruments (
  id              SERIAL PRIMARY KEY,
  symbol          VARCHAR(32) NOT NULL,         -- provider-native symbol e.g. RELIANCE.NS, AAPL
  isin            VARCHAR(12),                  -- optional international securities ID
  name            VARCHAR(256) NOT NULL,
  exchange_id     INTEGER NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  instrument_type VARCHAR(32) NOT NULL,         -- EQUITY, INDEX, ETF, FUTURE
  currency        CHAR(3) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  provider_meta   JSONB,                        -- provider-specific metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, exchange_id)
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_exchange ON instruments(exchange_id);
CREATE INDEX IF NOT EXISTS idx_instruments_isin ON instruments(isin) WHERE isin IS NOT NULL;
