# Architecture Document
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                            │
│  React + Vite + TypeScript + Tailwind + TradingView Lightweight      │
│  Charts + Recharts + React Router + TanStack Query                   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP REST / WebSocket
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js / Express)                   │
│  TypeScript · REST endpoints · Zod validation · Socket.IO            │
│  Provider adapters · In-memory cache · Rate limiting                 │
└──────┬───────────────────────────────┬───────────────────────────────┘
       │ HTTP                          │ SQL (pg)
       ▼                              ▼
┌──────────────────────┐   ┌──────────────────────────────────────────┐
│  AI Service          │   │            PostgreSQL 16                 │
│  Python · FastAPI    │   │  instruments · candles · quotes          │
│  Pandas · NumPy      │   │  indicators · news · models              │
│  scikit-learn        │   │  portfolio · backtests · reports         │
│  XGBoost · FinBERT   │   └──────────────────────────────────────────┘
│  Sentence Transformers│
│  FAISS               │
└──────────────────────┘
       │
       ▼ (external HTTP)
┌──────────────────────────────────────────────────────────────────────┐
│                     Market Data Providers                            │
│  yfinance (Python)  │  Alpha Vantage REST  │  Finnhub REST           │
│  Upstox REST/WS (Indian, requires OAuth)                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Boundaries

### 2.1 Frontend (`frontend/`)
- **Responsibility:** Render UI, manage client state, call backend REST endpoints.
- **Does NOT:** Call market-data providers directly. All data fetched through backend.
- **Key libraries:** React 18, Vite, TypeScript strict, Tailwind CSS, TradingView Lightweight Charts v4, Recharts, React Router v6, TanStack Query v5, Zod.

### 2.2 Backend (`backend/`)
- **Responsibility:** REST API, provider-adapter orchestration, caching, WebSocket relay, database read/write.
- **Does NOT:** Run ML training or FAISS inference (delegated to ai-service).
- **Key libraries:** Express 4, TypeScript, Zod, pg (postgres), pino (logging), node-cache, socket.io.

### 2.3 AI Service (`ai-service/`)
- **Responsibility:** Technical indicators calculation, ML training and inference, FinBERT sentiment, FAISS retrieval, LLM context composition, structured report generation.
- **Does NOT:** Directly call market-data provider APIs (it receives pre-validated data from the backend or reads from the shared PostgreSQL database).
- **Key libraries:** FastAPI, Pandas, NumPy, scikit-learn, XGBoost, transformers (FinBERT), sentence-transformers, faiss-cpu, SQLAlchemy, psycopg, google-generativeai.

### 2.4 PostgreSQL (`database/`)
- Shared database for all three services.
- Schema versioned through migration files in `database/migrations/`.
- Backend uses `pg` driver; AI service uses SQLAlchemy + psycopg.

---

## 3. Data Flow

### 3.1 Historical Candle Request
```
Frontend → GET /api/v1/candles/{symbol}?interval=1d&from=...&to=...
  → Backend validates params (Zod)
  → Backend checks in-memory cache (TTL 5 min)
  → If miss: Backend calls Provider Adapter (yfinance via ai-service /internal/candles OR direct REST)
  → Provider returns OHLCV array
  → Backend validates response schema
  → Backend upserts candles into PostgreSQL
  → Backend returns normalized CandleResponse to frontend
  → Frontend renders TradingView chart
```

### 3.2 AI Analysis Request
```
Frontend → POST /api/v1/analysis/report
  { symbol, question }
  → Backend fetches: latest quote, candles, computed indicators, recent news
  → Backend calls POST http://ai-service:8000/analysis/report
  { structured_context }
  → AI service: runs RAG retrieval (FAISS), builds LLM prompt, calls Gemini API
  → AI service returns structured AnalysisReport
  → Backend logs report to DB, returns to frontend
```

### 3.3 ML Training Flow
```
POST /api/v1/ml/train { symbol, model_type, params }
  → Backend delegates to POST http://ai-service:8000/ml/train
  → AI service: fetches candles from DB, engineers features, chronological split
  → Trains model, computes metrics, saves artifact + records to DB
  → Returns ModelTrainResult { model_id, metrics, training_timestamp }
```

---

## 4. Provider Adapter Pattern

```typescript
interface MarketDataProvider {
  name: string;
  supportedExchanges: string[];
  searchInstruments(query: string): Promise<Instrument[]>;
  getCandles(params: CandleParams): Promise<CandleBar[]>;
  getLatestQuote(symbol: string): Promise<Quote>;
  getFundamentals?(symbol: string): Promise<Fundamentals>;
  subscribeToQuotes?(symbols: string[], cb: QuoteCallback): Unsubscribe;
}
```

Each provider is in `backend/src/providers/<name>/`.  
A `ProviderRegistry` selects the appropriate adapter per instrument exchange.

---

## 5. Caching Strategy

| Data Type | Cache Layer | TTL |
|-----------|-------------|-----|
| Latest quote | In-memory (node-cache) | 5 min |
| Daily candles | PostgreSQL | Refreshed once per trading day |
| Intraday candles | In-memory | 1 min |
| Indicator snapshots | In-memory | 5 min |
| News documents | PostgreSQL | 30 min refresh |
| FAISS index | Disk (Docker volume) | Rebuilt nightly |
| Screener results | In-memory | 5 min |

---

## 6. Security Boundary

- All provider API keys live in environment variables on the backend/ai-service.
- Frontend has zero access to API keys.
- CORS: backend allows only `VITE_BACKEND_URL` origin.
- SQL: parameterized queries only.
- Input: Zod validation on every request.
- Logs: API keys are never logged; masked in error outputs.

---

## 7. Directory Structure

```
stock-intelligence-ai/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── charts/         # Chart wrappers
│   │   ├── hooks/          # TanStack Query + custom hooks
│   │   ├── services/       # API client functions (typed)
│   │   ├── types/          # Shared TypeScript types
│   │   ├── utils/          # Formatters, constants
│   │   └── App.tsx
│   ├── tests/
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/         # Express routers (v1/)
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── providers/      # Market data adapters
│   │   │   ├── base.ts     # Interface definition
│   │   │   ├── yfinance/
│   │   │   ├── alphavantage/
│   │   │   ├── finnhub/
│   │   │   └── upstox/
│   │   ├── middleware/     # Auth (none), rate-limit, error, logging
│   │   ├── db/             # pg client, query helpers
│   │   ├── cache/          # node-cache wrapper
│   │   ├── jobs/           # Background ingestion jobs
│   │   └── app.ts
│   └── tests/
│
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/        # FastAPI routers
│   │   ├── indicators/     # TA calculation (pandas-ta or manual)
│   │   ├── forecasting/    # ML pipeline
│   │   ├── sentiment/      # FinBERT, news ingestion
│   │   ├── rag/            # FAISS + retrieval
│   │   ├── analysis/       # LLM context builder + report
│   │   ├── db/             # SQLAlchemy models and session
│   │   └── schemas/        # Pydantic models
│   └── tests/
│
└── database/
    ├── migrations/         # Numbered SQL migration files
    └── init/               # Docker init scripts
```

---

## 8. WebSocket / Streaming Design

- Socket.IO server lives in the backend.
- Client subscribes to room `quotes:{symbol}`.
- Backend polls provider (where streaming unavailable) on a 10-second interval and emits `quote_update` events.
- Where Upstox WebSocket is available and authorized, backend acts as relay.
- Stale connection detection: server emits a `heartbeat` every 30 seconds; client reconnects on missed heartbeat.

---

## 9. Technology Decisions Record

See [DECISIONS.md](DECISIONS.md) for full ADR list.
