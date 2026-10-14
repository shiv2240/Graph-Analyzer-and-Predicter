# 🖥️ Backend API Gateway (`backend`)

The **Backend Service** is a TypeScript and Node.js REST API gateway built with **Express**, **Zod**, and **PostgreSQL**. It coordinates market data providers, manages caching tiers, exposes institutional REST endpoints to the frontend, and proxies requests to the Python AI service.

---

## 🎯 Key Responsibilities

1. **Market Data Provider Registry (`src/providers/`):**
   - Pluggable provider architecture (`yfinanceProvider`, `finnhubProvider`, `upstoxProvider`).
   - Automatically selects the optimal provider based on symbol format (e.g. `.NS`/`.BO` for Indian exchanges, US tickers, Crypto, Commodity futures).
   - Normalized quote response standardizing data engine keys into camelCase interfaces (`changePct`, `changeAbs`, `dayHigh`, `dayLow`, `prevClose`) with full fallback support.
   - Graceful fallback and health status monitoring.

2. **Expanded Quantitative Screener & Multi-Timeframe Engine (`src/routes/`):**
   - **`screener.ts`:** Powers multi-market screening over 95+ Indian (NIFTY 50) and US equities with live search, country/exchange filtering, sorting, and pagination.
   - **`indicators.ts` & `instruments.ts`:** Full multi-timeframe candle and technical indicator support across `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1wk`, `1mo`, `1y` (1 Year daily), `5y` (5 Year weekly), and `all` (All-Time monthly) with provider resolution routing.

3. **Multi-Tier Intelligent Caching (`src/cache/cacheService.ts`):**
   - **L1 Cache:** In-memory NodeCache for sub-millisecond local responses.
   - **L2 Cache:** Distributed Redis cache (with seamless fallback to L1 if Redis is offline).
   - **Data vs. Analysis Separation:** Caches raw candle graph data and provider responses while bypassing stale caches for AI analysis so predictions always adapt to graph changes.

4. **Database & Persistence (`src/db/`):**
   - PostgreSQL connection pool using `pg`.
   - Sequential schema migrations for instruments, candles, quotes, portfolios, and backtest results.

5. **Input Validation & Security (`src/middleware/`):**
   - Strict Zod schemas validating all incoming query parameters and request bodies.
   - Centralized error handling and structured JSON logging with Pino.

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
│   │   ├── analysis.py          # AI equity research report route (always fresh)
│   │   ├── backtest.ts          # Strategy backtesting endpoints
│   │   ├── health.ts            # System health checks
│   │   ├── indicators.ts        # Indicator calculation proxy
│   │   ├── indices.ts           # Global indices snapshot
│   │   ├── instruments.ts       # Search, quote, and candle retrieval
│   │   ├── ml.ts                # Machine learning prediction proxy
│   │   ├── news.ts              # Financial news feed
│   │   ├── portfolio.ts         # Mock paper portfolio management
│   │   └── screener.ts          # Asset screener filters
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
Ensure `.env` exists in the project root or `./backend/.env`. Key parameters:
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
```
Compiles TypeScript files into production-ready JavaScript in `./dist`.

---

## 🧪 Testing & Database Migrations

- **Run Tests:**
  ```bash
  npm test
  ```
- **Execute Database Migrations:**
  ```bash
  npm run db:migrate
  ```

---

## 📡 REST API Route Overview

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | `GET` | Health check & provider connection statuses |
| `/api/v1/instruments/search` | `GET` | Multi-asset search across NSE, BSE, US, and Crypto |
| `/api/v1/instruments/:symbol/quote` | `GET` | Real-time quote data (price, change, volume) |
| `/api/v1/instruments/:symbol/candles` | `GET` | Historical OHLCV bars (`1m` to `1mo`) |
| `/api/v1/indicators/:symbol` | `GET` | Technical indicators (RSI, MACD, BBands) |
| `/api/v1/analysis/report` | `POST` | Fresh AI equity research generation |
| `/api/v1/screener` | `GET` | Multi-metric stock & asset filtering |
| `/api/v1/portfolio` | `GET/POST` | Paper trading portfolio simulation |
