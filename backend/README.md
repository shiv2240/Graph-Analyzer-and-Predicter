# 🖥️ Backend API Gateway (`backend`)

The **Backend Service** is a TypeScript and Node.js REST API gateway built with **Express**, **Zod**, and **PostgreSQL** (with Neon cloud DB support). It coordinates market data providers, manages caching tiers, exposes institutional REST endpoints to the frontend, orchestrates machine learning model registries, and proxies requests to the Python AI service.

---

## 🎯 Key Responsibilities

1. **Market Data Provider Registry (`src/providers/`):**
   - Pluggable provider architecture (`yfinanceProvider`, `finnhubProvider`, `upstoxProvider`).
   - Automatically selects the optimal provider based on symbol format (e.g. `.NS`/`.BO` for Indian exchanges, US tickers, Crypto, Commodity futures).
   - Normalized quote response standardizing data engine keys into camelCase interfaces (`changePct`, `changeAbs`, `dayHigh`, `dayLow`, `prevClose`) with full fallback support.
   - Graceful fallback and health status monitoring.

2. **Multi-Timeframe Confluence Engine (`src/routes/analysis.ts`):**
   - Endpoint: `GET /api/v1/analysis/:symbol/multi-timeframe`
   - Sequential candle ingestion across 7 timeframes (`1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1wk`).
   - Calculates moving average alignment (SMA 20, 50), RSI(14) momentum, and directional bias per timeframe.
   - Computes **Yesterday's Session Benchmark** (Date, Open, High, Low, Close, Volume, and Floor Pivots $P, R_1, R_2, S_1, S_2$).
   - Returns master verdict, strategy advice, confluence score, and execution boundaries with 60-second in-memory endpoint caching.

3. **Machine Learning Model Registry & Retraining (`src/routes/ml.ts`):**
   - **`GET /api/v1/ml/models`:** Returns available model architectures with complete feature metadata and historical trained model records stored in Neon DB (`ml_models` and `ml_predictions`).
   - **`POST /api/v1/ml/train`:** Executes model training pipeline with chronological walk-forward splitting and persists weights/metrics in PostgreSQL.
   - **`GET /api/v1/ml/predict/:symbol`:** Computes dynamic directional forecast on live market candles.
   - **`POST /api/v1/ml/daily-schedule/trigger` & `/training-job`:** Background retraining scheduler for automated daily incremental model retraining.

4. **Expanded Quantitative Screener (`src/routes/screener.ts`):**
   - Powers multi-market screening over 95+ Indian (NIFTY 50) and US equities with live search, country/exchange filtering, sorting, and pagination.

5. **Multi-Tier Intelligent Caching (`src/cache/cacheService.ts`):**
   - **L1 Cache:** In-memory NodeCache for sub-millisecond local responses.
   - **L2 Cache:** Distributed Redis cache (with seamless fallback to L1 if Redis is offline).
   - **Data vs. Analysis Separation:** Caches raw candle graph data and provider responses while keeping AI predictions adaptive to live market shifts.

6. **Database & Persistence (`src/db/`):**
   - PostgreSQL / Neon connection pool using `pg`.
   - Sequential schema migrations for instruments, candles, quotes, portfolios, ML models, and backtest results.

---

## 📂 Directory Layout

```
backend/
├── src/
│   ├── cache/                   # Multi-tier cache service (NodeCache L1 + Redis L2)
│   ├── controllers/             # Endpoint controllers (health, status)
│   ├── db/                      # PostgreSQL client pool and migration runner
│   ├── middleware/              # Error handling and request logging middleware
│   ├── providers/               # Market data abstraction layer
│   │   ├── base.ts              # Abstract base provider interface
│   │   ├── finnhub/             # Finnhub API integration
│   │   ├── registry.ts          # Provider registry and routing logic
│   │   ├── upstox/              # Indian market Upstox v2 integration
│   │   └── yfinance/            # Internal AI-service Yahoo Finance proxy
│   ├── routes/                  # Express REST routes
│   │   ├── analysis.ts          # Multi-timeframe confluence & equity research reports
│   │   ├── backtest.ts          # Strategy backtesting endpoints
│   │   ├── health.ts            # System health checks
│   │   ├── indicators.ts        # Indicator calculation proxy
│   │   ├── indices.ts           # Global indices snapshot
│   │   ├── instruments.ts       # Search, quote, and candle retrieval
│   │   ├── ml.ts                # ML model registry, prediction, and daily training
│   │   ├── news.ts              # Financial news feed
│   │   ├── portfolio.ts         # Mock paper portfolio management
│   │   └── screener.ts          # Asset screener filters
│   ├── services/                # Background training and scheduler services
│   │   ├── backgroundTrainingService.ts # Worker thread / job tracking for training
│   │   └── dailyTrainingScheduler.ts    # Cron / daily incremental retraining
│   ├── types/                   # TypeScript interfaces (Candle, Quote, Instrument)
│   ├── utils/                   # Structured logger and helpers
│   ├── app.ts                   # Express app configuration & middleware pipeline
│   ├── config.ts                # Environment configuration & Zod schema validation
│   └── server.ts                # HTTP server bootstrap and graceful shutdown
├── Dockerfile                   # Docker container definition
├── package.json                 # Node dependencies and scripts
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # This document
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Node.js `>= 20.x`
- npm `>= 10.x` (or pnpm `>= 9.x`)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Ensure `.env` exists in the project root or `./backend/.env`:
```env
PORT=3001
AI_SERVICE_URL=http://localhost:8000
DATABASE_URL=postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel
REDIS_ENABLED=false
```

### 3. Run the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3001` with hot-reload enabled via `tsx`.

### 4. Build for Production
```bash
npm run build
npm start
```
