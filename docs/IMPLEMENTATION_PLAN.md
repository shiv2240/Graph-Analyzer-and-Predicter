# Implementation Plan
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## Phase Status Overview

| Phase | Name | Status | Target |
|-------|------|--------|--------|
| 0 | Repository Inspection | ✅ Done | 2026-10-14 |
| 1 | Product Specification | ✅ Done | 2026-10-14 |
| 2 | Technical Design | ✅ Done | 2026-10-14 |
| 3 | Data-Source Verification | ✅ Done | 2026-10-14 |
| 4 | Foundation | ✅ Done | 2026-10-15 |
| 5 | Historical Market Data | ✅ Done | 2026-10-15 |
| 6 | Dashboard and Indicators | ✅ Done | 2026-10-15 |
| 7 | AI Analysis | ✅ Done | 2026-10-15 |
| 8 | Forecasting and Screening | ✅ Done | 2026-10-15 |
| 9 | Portfolio and Backtesting | ✅ Done | 2026-10-15 |
| 10 | Live Data | ✅ Done | 2026-10-15 |
| 11 | Quality Assurance | ✅ Done | 2026-10-15 |
| 12 | Deployment | ✅ Done | 2026-10-15 |

---

## Phase 4: Foundation

### Objectives
- Initialize all three service projects with correct toolchains.
- Configure Docker Compose and PostgreSQL.
- Add health endpoints to all services.
- Set up linting, formatting, TypeScript, and testing frameworks.
- Run database migrations.

### Files to Create

**Backend:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.eslintrc.json`
- `backend/Dockerfile`
- `backend/src/app.ts` — Express app
- `backend/src/server.ts` — HTTP server
- `backend/src/routes/health.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/middleware/requestLogger.ts`
- `backend/src/db/client.ts` — pg pool
- `backend/src/config.ts` — typed env config

**Frontend:**
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/tailwind.config.ts`
- `frontend/Dockerfile`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx` — Router setup
- `frontend/src/pages/` — Placeholder pages

**AI Service:**
- `ai-service/requirements.txt`
- `ai-service/pyproject.toml`
- `ai-service/Dockerfile`
- `ai-service/app/main.py` — FastAPI app
- `ai-service/app/routers/health.py`
- `ai-service/app/db/session.py`
- `ai-service/app/config.py`

**Database:**
- `database/migrations/0001_create_exchanges.sql` through `0011_seed_exchanges.sql`
- `database/init/00_create_db.sql`

### Acceptance Criteria for Phase 4

- [ ] `docker compose up --build` starts all 4 containers without error.
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok"}`.
- [ ] `curl http://localhost:8000/health` returns `{"status":"ok"}`.
- [ ] `curl http://localhost:5173` returns the React app HTML.
- [ ] `docker compose exec backend pnpm run db:migrate` runs all migrations without error.
- [ ] `pnpm type-check` passes in both frontend and backend.
- [ ] `pnpm lint` passes in both frontend and backend.
- [ ] `pytest` passes in ai-service.

---

## Phase 5: Historical Market Data

### Objectives
- Implement yfinance adapter in AI service.
- Backend provider registry and candle/quote endpoints.
- Database persistence with idempotent upserts.
- Caching layer.
- Instrument search.

### Acceptance Criteria
- [ ] `GET /api/v1/candles/RELIANCE.NS` returns valid OHLCV data.
- [ ] `GET /api/v1/quotes/AAPL` returns valid quote data.
- [ ] Candles persisted to database; second call hits cache.
- [ ] Response includes `data_quality` object with source and delay.
- [ ] Unknown symbol returns `{"error":{"code":"INSTRUMENT_NOT_SUPPORTED"}}`.

---

## Phase 6: Dashboard and Indicators

### Objectives
- Frontend dashboard with TradingView chart.
- Indicator calculation endpoint.
- Overlay indicators on chart.
- Loading/error/empty states.
- Indicator numerical tests.

### Acceptance Criteria
- [ ] Candlestick chart renders for NIFTY 50 and AAPL.
- [ ] SMA, EMA, RSI, MACD, BB overlays toggle on/off.
- [ ] Indicator values match fixture tests within 0.001%.
- [ ] Empty state shown for zero candles.
- [ ] Error state shown when provider fails.

---

## Phase 7: AI Analysis

### Objectives
- Gemini API integration.
- Structured context builder.
- News ingestion (Finnhub).
- FinBERT sentiment.
- FAISS index.
- Report endpoint.

### Acceptance Criteria
- [ ] POST `/api/v1/analysis/report` returns structured report.
- [ ] Report includes cited data timestamp.
- [ ] News sentiment scores included when available.
- [ ] Disclaimer present in every response.
- [ ] If LLM unavailable, return structured error.

---

## Phase 8: Forecasting and Screening

### Objectives
- ML training pipeline.
- Walk-forward validation.
- Screener endpoint.
- Model evaluation page.

### Acceptance Criteria
- [ ] Train XGBoost model for RELIANCE.NS without error.
- [ ] Walk-forward folds are strictly chronological.
- [ ] Screener returns results with RSI < 30 filter on NSE instruments.
- [ ] Model metrics stored in database.

---

## Phase 9: Portfolio and Backtesting

### Objectives
- Virtual portfolio CRUD.
- Portfolio P&L calculation.
- SMA crossover backtest.
- Backtest results with equity curve.

### Acceptance Criteria
- [ ] Add position → shows in portfolio with current valuation.
- [ ] Backtest SMA(20,50) on RELIANCE.NS returns Sharpe > −∞.
- [ ] Backtest includes commission and slippage in P&L.
- [ ] Equity curve data present in response.

---

## Phase 10: Live Data

### Objectives
- Finnhub WebSocket for US equities.
- Socket.IO relay to frontend.
- Upstox adapter stub with OAuth setup docs.

### Acceptance Criteria
- [ ] AAPL quote updates via WebSocket in browser.
- [ ] Stale connection detected and reconnected.
- [ ] Delayed data never labeled as real-time.

---

## Phase 11: Quality Assurance

### Acceptance Criteria
- [ ] `pnpm test` passes in frontend and backend.
- [ ] `pytest` passes in ai-service.
- [ ] `pnpm type-check` passes in frontend and backend.
- [ ] `pnpm build` produces production bundle without error.
- [ ] All Phase 4–10 acceptance criteria satisfied.

---

## Phase 12: Deployment

### Acceptance Criteria
- [ ] `docker compose up --build` works on fresh clone with only `.env` populated.
- [ ] Health endpoints respond on all services.
- [ ] `DEPLOYMENT.md` documents exact commands for local and cloud deployment.
