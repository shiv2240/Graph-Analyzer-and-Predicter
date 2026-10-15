# 🗄️ PostgreSQL Database & Migrations (`database`)

This directory contains the database initialization scripts, table definitions, and sequential schema migrations for the **Stock Intelligence AI & Graph Analyzer** platform, with native support for local PostgreSQL and cloud-hosted **Neon DB**.

---

## 🎯 Design Principles

1. **Precision & Consistency:**
   - All financial prices, valuations, and quantities use `NUMERIC(20,6)` to prevent floating-point rounding errors.
   - All timestamps are stored in UTC using `TIMESTAMPTZ` (ISO 8601 strings in application layers).
2. **Time-Series Indexing:**
   - Composite indexes on `(instrument_id, interval, ts DESC)` ensure sub-10ms queries for multi-timeframe candle lookups and backtesting.
3. **Machine Learning Model Versioning:**
   - The `ml_models` table records every trained model run, architecture type (`xgboost`, `rf`, `logistic`, `baseline`), training date ranges, and verified out-of-sample metrics (`accuracy`, `precision`, `recall`, `f1`, `auc_roc`, `brier_score`).
   - The `ml_predictions` table stores out-of-sample predictions and directional accuracy records.
4. **Idempotent Sequential Migrations:**
   - Numbered sequentially (`0001_...` through `0011_...`).
   - Run tracked in a `schema_migrations` table to guarantee safe, repeatable deployment.

---

## 📂 Directory Layout & Migration Order

```
database/
├── init/
│   └── 00_create_db.sql                 # Docker bootstrap script creating database & user
├── migrations/
│   ├── 0001_create_exchanges.sql        # Global exchanges (NSE, BSE, NASDAQ, NYSE, COMEX, etc.)
│   ├── 0002_create_instruments.sql      # Equities, commodities, indices, ETFs, crypto
│   ├── 0003_create_candles.sql          # Time-series OHLCV bars table with composite indexes
│   ├── 0004_create_quotes.sql           # Real-time tick & snapshot table
│   ├── 0005_create_indicator_snapshots.sql # Precomputed technical indicator cache
│   ├── 0006_create_news_articles.sql    # Scraped & fetched financial news
│   ├── 0007_create_ml_models_predictions.sql # ML model versions & prediction logs
│   ├── 0008_create_research_reports.sql # Generated institutional equity research reports
│   ├── 0009_create_portfolio.sql       # Mock paper trading portfolios & trade history
│   ├── 0010_create_backtests.sql       # Backtest execution runs & performance metrics
│   └── 0011_seed_exchanges.sql         # Seed data for global exchanges & benchmark assets
└── README.md                            # This document
```

---

## ⚙️ Running Migrations

### Method 1: Using the Backend Runner (Recommended)

From the project root or `./backend`:

```bash
cd backend
npm run db:migrate
```

### Method 2: Inside Docker Compose

If running via Docker:

```bash
docker compose exec backend npm run db:migrate
```

### Method 3: Cloud Neon DB Deployment

Provide your cloud database connection string in `.env`:
```env
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/stockintel?sslmode=require
```
Then execute:
```bash
npm run db:migrate
```

---

## 🔒 Security Best Practices

- Never commit production database passwords or credentials to version control.
- Use environment variables (`DATABASE_URL`, `POSTGRES_PASSWORD`) configured in `.env`.
