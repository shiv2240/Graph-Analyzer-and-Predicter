# Product Requirements Document (PRD)
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14  
**Status:** Approved for MVP implementation

---

## 1. Executive Summary

Stock Intelligence AI is a modular, self-hosted web application that provides individual researchers and developers with tools to explore Indian and international equities, analyze market trends, understand financial news through AI-assisted sentiment, evaluate machine-learning forecasting models, and conduct historical strategy backtesting.

The application is not a brokerage, does not execute real trades, and does not provide personalized financial advice. All model outputs and portfolio simulations are for educational and research purposes.

---

## 2. Problem Statement

Retail investors and researchers face:
- Fragmented data across multiple paid terminals.
- Lack of transparent, reproducible backtesting tools.
- No accessible NLP tooling for financial sentiment on Indian equities.
- Black-box ML models with no explainability or validation evidence.

This product addresses all four gaps using open-source tooling, free-tier APIs, and a transparent, test-driven architecture.

---

## 3. Target Users

| User Type | Primary Need |
|-----------|-------------|
| Individual equity researcher | Historical data, technical indicators, AI-generated analysis |
| Developer / quant student | Backtesting, ML model experimentation, reproducible pipelines |
| Retail investor (self-directed) | Virtual portfolio tracking, screener |

No institutional or regulated-entity users are targeted.

---

## 4. Scope

### 4.1 In Scope (MVP)

| Feature | Priority |
|---------|----------|
| Market dashboard with Indian + US indices | P0 |
| Historical OHLCV candlestick charts | P0 |
| Technical indicators (SMA, EMA, RSI, MACD, BB, ATR) | P0 |
| AI stock analyst (Gemini / HuggingFace LLM) | P0 |
| News sentiment (FinBERT) + RAG (FAISS) | P1 |
| ML forecasting (Logistic, RF, XGBoost) | P1 |
| Stock screener | P1 |
| Virtual portfolio + risk analysis | P1 |
| Historical backtesting | P1 |
| Model evaluation page | P2 |
| Live streaming quotes (where provider supports) | P2 |

### 4.2 Out of Scope (Non-Goals)

- Real broker integration or trade execution.
- User authentication, registration, or session management.
- Multi-tenant data isolation.
- Paid provider APIs (unless user supplies key in .env).
- Automated trading bots or algorithmic order routing.
- Regulatory compliance (SEBI, SEC advice disclaimers beyond text).
- Mobile native apps (responsive web only).
- Redis, Kafka, Kubernetes in MVP.

---

## 5. Functional Requirements

### FR-01: Market Dashboard
- FR-01-1: Display at least 5 Indian indices (NIFTY 50, SENSEX, NIFTY BANK, NIFTY IT, NIFTY MIDCAP 100) and 3 US indices (S&P 500, NASDAQ, Dow Jones).
- FR-01-2: Show latest available price, absolute change, percentage change.
- FR-01-3: Display data timestamp and source label (e.g., "yfinance, 15-min delay").
- FR-01-4: Provide stock search across supported instruments.
- FR-01-5: Render interactive candlestick chart using TradingView Lightweight Charts.
- FR-01-6: Support date range: 1W, 1M, 3M, 6M, 1Y, 5Y, Custom.
- FR-01-7: Support intervals: 1d, 1wk, 1mo (per provider capability).
- FR-01-8: Show volume bars below price chart.
- FR-01-9: Indicate explicitly when data is delayed, cached, or unavailable.

### FR-02: Technical Analysis
- FR-02-1: Calculate SMA (20, 50, 200), EMA (12, 26), RSI (14), MACD (12,26,9), Bollinger Bands (20, 2σ), ATR (14).
- FR-02-2: Calculate realized volatility (21-day), maximum drawdown, historical returns.
- FR-02-3: Calculate volume change % and flag volume spikes (>2× 20-day avg).
- FR-02-4: All indicators computed server-side from validated OHLCV data.
- FR-02-5: Overlay indicators on chart; separate panel for oscillators.
- FR-02-6: Indicator calculations must pass numerical fixture tests.

### FR-03: AI Stock Analyst
- FR-03-1: User selects a stock and asks a natural language question.
- FR-03-2: Backend composes a structured context object (price, indicators, news snippets, model output if available).
- FR-03-3: Structured context is sent to LLM (Gemini or HuggingFace).
- FR-03-4: Response includes: instrument ID, data timestamp, price summary, indicator values, news context, uncertainty disclaimer, source references.
- FR-03-5: LLM must not invent prices, fundamentals, or news; only references verified backend data.
- FR-03-6: Each report generation is logged with model name, version, and timestamp.

### FR-04: News Sentiment and RAG
- FR-04-1: Ingest financial news from at least one documented free source (e.g., Finnhub news API).
- FR-04-2: Normalize, deduplicate, and timestamp all ingested documents.
- FR-04-3: Apply FinBERT sentiment classification (positive/neutral/negative + score).
- FR-04-4: Generate embeddings using `sentence-transformers/all-MiniLM-L6-v2`.
- FR-04-5: Store embeddings in FAISS local index.
- FR-04-6: Retrieve top-k relevant documents at query time.
- FR-04-7: Display source links and publication timestamps.
- FR-04-8: If news unavailable, display "News analysis unavailable for this instrument."

### FR-05: ML Forecasting
- FR-05-1: Target: binary classification — positive vs non-positive next-day returns.
- FR-05-2: Implement: Majority-class baseline, Logistic Regression, Random Forest, XGBoost.
- FR-05-3: Use chronological splits only (no random shuffling of time-series).
- FR-05-4: Walk-forward validation with expanding window.
- FR-05-5: Feature engineering using only past data (no lookahead).
- FR-05-6: Metrics: Accuracy, Precision, Recall, F1, AUC-ROC per model.
- FR-05-7: Store model versions, training timestamp, evaluation metrics, target horizon.
- FR-05-8: Serve prediction with confidence (probability) and model metadata.
- FR-05-9: Clearly disclaim that predictions are probabilistic, not guarantees.

### FR-06: Stock Screener
- FR-06-1: Filter by: price range, % change, RSI range, above/below SMA/EMA, volume threshold, volatility, market/exchange.
- FR-06-2: Operate only on real data with documented freshness.
- FR-06-3: Show when a filter cannot be applied due to missing data.
- FR-06-4: Paginated results table with sortable columns.

### FR-07: Virtual Portfolio
- FR-07-1: Add/remove/edit positions: symbol, quantity, entry price, transaction date, notes.
- FR-07-2: Calculate current value using latest available supported price.
- FR-07-3: Show unrealized P&L per position and total.
- FR-07-4: Show asset allocation (pie chart).
- FR-07-5: Show historical portfolio value over time.
- FR-07-6: Calculate portfolio volatility and max drawdown.
- FR-07-7: Label all entries as "Simulated / Virtual Position."
- FR-07-8: Persist portfolio data in PostgreSQL.

### FR-08: Backtesting
- FR-08-1: Configure: initial capital, strategy rules, date range, commission (%), slippage (%).
- FR-08-2: Implement at least: SMA crossover, RSI mean-reversion strategies.
- FR-08-3: Output: equity curve, total return, CAGR, max drawdown, Sharpe ratio, # trades, win rate.
- FR-08-4: Compare against benchmark (buy-and-hold of same instrument).
- FR-08-5: Prevent look-ahead bias by processing data strictly chronologically.
- FR-08-6: Account for transaction costs in P&L calculation.
- FR-08-7: Label results as "Simulated Historical Performance — Not predictive of future returns."

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Dashboard initial load < 3 s on LAN; chart render < 1 s after data |
| Availability | Single-machine Docker Compose; no HA requirement in MVP |
| Data freshness | Dashboard quotes refreshed every 5 min; intraday not guaranteed |
| Accuracy | Indicator values within 0.001% of reference implementation |
| Security | No secrets in browser bundle; parameterized SQL; input validation |
| Observability | Structured JSON logs on all services; /health endpoints |
| Maintainability | TypeScript strict mode; ESLint; Ruff; pytest; Vitest |
| Portability | Works on Linux, macOS, Windows via Docker Compose |

---

## 7. Acceptance Criteria Summary

See [ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md) for the complete machine-testable list.

---

## 8. Unresolved Decisions at PRD Sign-Off

| ID | Decision | Owner | Target |
|----|----------|-------|--------|
| D-01 | Primary LLM: Gemini vs HuggingFace Inference API | Tech | Phase 7 |
| D-02 | Upstox OAuth vs yfinance for Indian live data | Tech | Phase 5 |
| D-03 | News source for Indian equities | Tech | Phase 7 |
| D-04 | TimescaleDB upgrade timing | Tech | Post-MVP |

---

## 9. Disclaimers

All content generated by this application — including but not limited to indicator values, model predictions, AI analysis, news sentiment scores, and backtest results — is for **educational and research purposes only**. It does not constitute financial advice. Past performance is not indicative of future results.
