# Database Schema
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14  
**Database:** PostgreSQL 16  
**Migration tool:** Sequential SQL files in `database/migrations/`

---

## Schema Conventions

- All timestamps stored in UTC (`TIMESTAMPTZ`).
- All monetary values stored as `NUMERIC(20,6)` to avoid floating-point errors.
- `created_at` and `updated_at` on every table; `updated_at` maintained by trigger.
- Soft-delete via `is_active` flag where appropriate.
- Idempotent upserts using `ON CONFLICT DO UPDATE`.

---

## Tables

### exchanges

```sql
CREATE TABLE exchanges (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(16) NOT NULL UNIQUE,   -- e.g. NSE, BSE, NYSE
  name         VARCHAR(128) NOT NULL,
  country      CHAR(2) NOT NULL,               -- ISO 3166-1 alpha-2
  currency     CHAR(3) NOT NULL,               -- ISO 4217
  timezone     VARCHAR(64) NOT NULL,           -- IANA timezone
  open_time    TIME NOT NULL,
  close_time   TIME NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Seed: NSE, BSE, NYSE, NASDAQ.

---

### instruments

```sql
CREATE TABLE instruments (
  id              SERIAL PRIMARY KEY,
  symbol          VARCHAR(32) NOT NULL,         -- provider-native symbol
  isin            VARCHAR(12),                  -- optional
  name            VARCHAR(256) NOT NULL,
  exchange_id     INTEGER NOT NULL REFERENCES exchanges(id),
  instrument_type VARCHAR(32) NOT NULL,         -- EQUITY, INDEX, ETF, FUTURE
  currency        CHAR(3) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  provider_meta   JSONB,                        -- provider-specific metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, exchange_id)
);

CREATE INDEX idx_instruments_symbol ON instruments(symbol);
CREATE INDEX idx_instruments_exchange ON instruments(exchange_id);
CREATE INDEX idx_instruments_isin ON instruments(isin) WHERE isin IS NOT NULL;
```

---

### candles

```sql
CREATE TABLE candles (
  id            BIGSERIAL PRIMARY KEY,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id),
  interval      VARCHAR(8) NOT NULL,          -- 1d, 1wk, 1mo, 1h, 15m
  ts            TIMESTAMPTZ NOT NULL,         -- candle open time (UTC)
  open          NUMERIC(20,6) NOT NULL,
  high          NUMERIC(20,6) NOT NULL,
  low           NUMERIC(20,6) NOT NULL,
  close         NUMERIC(20,6) NOT NULL,
  volume        BIGINT NOT NULL,
  adj_close     NUMERIC(20,6),               -- adjusted for splits/dividends
  source        VARCHAR(32) NOT NULL,         -- yfinance, alphavantage, etc.
  is_complete   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instrument_id, interval, ts)
);

CREATE INDEX idx_candles_instrument_interval_ts
  ON candles(instrument_id, interval, ts DESC);
```

---

### quotes

```sql
CREATE TABLE quotes (
  id              BIGSERIAL PRIMARY KEY,
  instrument_id   INTEGER NOT NULL REFERENCES instruments(id),
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

CREATE INDEX idx_quotes_instrument_ts
  ON quotes(instrument_id, recorded_at DESC);
```

---

### indicator_snapshots

```sql
CREATE TABLE indicator_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id),
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
```

---

### news_articles

```sql
CREATE TABLE news_articles (
  id              BIGSERIAL PRIMARY KEY,
  source_provider VARCHAR(32) NOT NULL,        -- finnhub, rss, etc.
  external_id     VARCHAR(256),               -- provider article ID
  headline        TEXT NOT NULL,
  summary         TEXT,
  url             TEXT,
  image_url       TEXT,
  published_at    TIMESTAMPTZ NOT NULL,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_symbols TEXT[],                      -- array of symbols
  sentiment_label VARCHAR(16),                 -- positive, neutral, negative
  sentiment_score NUMERIC(5,4),               -- FinBERT confidence
  embedding_id    INTEGER,                     -- reference to FAISS index
  is_indexed      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (source_provider, external_id)
);

CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_symbols ON news_articles USING GIN(related_symbols);
```

---

### ml_models

```sql
CREATE TABLE ml_models (
  id              SERIAL PRIMARY KEY,
  instrument_id   INTEGER REFERENCES instruments(id),  -- NULL = global model
  model_type      VARCHAR(64) NOT NULL,        -- logistic, rf, xgboost, baseline
  version         VARCHAR(32) NOT NULL,
  target_horizon  INTEGER NOT NULL DEFAULT 1,  -- days ahead
  train_from      TIMESTAMPTZ NOT NULL,
  train_to        TIMESTAMPTZ NOT NULL,
  feature_list    TEXT[] NOT NULL,
  hyperparameters JSONB,
  artifact_path   TEXT NOT NULL,               -- path inside Docker volume
  metrics         JSONB NOT NULL,              -- accuracy, f1, auc, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### ml_predictions

```sql
CREATE TABLE ml_predictions (
  id            BIGSERIAL PRIMARY KEY,
  model_id      INTEGER NOT NULL REFERENCES ml_models(id),
  instrument_id INTEGER NOT NULL REFERENCES instruments(id),
  predicted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_date   DATE NOT NULL,
  prediction    SMALLINT NOT NULL,            -- 0 or 1
  probability   NUMERIC(6,4) NOT NULL,        -- P(class=1)
  features_used JSONB
);

CREATE INDEX idx_predictions_instrument_model
  ON ml_predictions(instrument_id, model_id, target_date DESC);
```

---

### research_reports

```sql
CREATE TABLE research_reports (
  id              BIGSERIAL PRIMARY KEY,
  instrument_id   INTEGER REFERENCES instruments(id),
  question        TEXT,
  report_text     TEXT NOT NULL,
  model_name      VARCHAR(64) NOT NULL,       -- gemini-pro, etc.
  model_version   VARCHAR(32),
  data_context    JSONB,                      -- structured context sent to LLM
  news_sources    JSONB,                      -- retrieved RAG documents
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### portfolio_positions

```sql
CREATE TABLE portfolio_positions (
  id              SERIAL PRIMARY KEY,
  instrument_id   INTEGER NOT NULL REFERENCES instruments(id),
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

CREATE INDEX idx_portfolio_instrument ON portfolio_positions(instrument_id);
```

---

### backtest_configs

```sql
CREATE TABLE backtest_configs (
  id              SERIAL PRIMARY KEY,
  instrument_id   INTEGER NOT NULL REFERENCES instruments(id),
  strategy_name   VARCHAR(64) NOT NULL,
  params          JSONB NOT NULL,             -- strategy-specific params
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  initial_capital NUMERIC(20,6) NOT NULL,
  commission_pct  NUMERIC(6,4) NOT NULL DEFAULT 0.1,
  slippage_pct    NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### backtest_results

```sql
CREATE TABLE backtest_results (
  id              SERIAL PRIMARY KEY,
  config_id       INTEGER NOT NULL REFERENCES backtest_configs(id),
  total_return    NUMERIC(10,4),
  cagr            NUMERIC(10,4),
  max_drawdown    NUMERIC(10,4),
  sharpe_ratio    NUMERIC(10,4),
  num_trades      INTEGER,
  win_rate        NUMERIC(6,4),
  equity_curve    JSONB,                      -- [{date, value}]
  benchmark_return NUMERIC(10,4),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| candles | (instrument_id, interval, ts DESC) | Time-series range queries |
| quotes | (instrument_id, recorded_at DESC) | Latest quote lookup |
| news_articles | (published_at DESC) | Chronological news feed |
| news_articles | GIN(related_symbols) | Symbol-based news lookup |
| instruments | (symbol) | Search by symbol |
| ml_predictions | (instrument_id, model_id, target_date DESC) | Latest prediction |

---

## Migrations

Files in `database/migrations/` are prefixed with 4-digit sequence numbers:

```
0001_create_exchanges.sql
0002_create_instruments.sql
0003_create_candles.sql
0004_create_quotes.sql
0005_create_indicator_snapshots.sql
0006_create_news_articles.sql
0007_create_ml_models_predictions.sql
0008_create_research_reports.sql
0009_create_portfolio.sql
0010_create_backtests.sql
0011_seed_exchanges.sql
```

Apply with: `docker compose exec backend pnpm run db:migrate`
