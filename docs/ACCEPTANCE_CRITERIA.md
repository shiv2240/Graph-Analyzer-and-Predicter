# Acceptance Criteria
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

Each criterion is tagged with a phase (P4–P12) and feature area.

---

## Infrastructure (Phase 4)

- [ ] **AC-001** `docker compose up --build` starts all services without error on a clean machine with only `.env` populated.
- [ ] **AC-002** `GET http://localhost:3001/health` returns HTTP 200 `{"status":"ok","dependencies":{"postgres":"ok","ai_service":"ok"}}`.
- [ ] **AC-003** `GET http://localhost:8000/health` returns HTTP 200 `{"status":"ok"}`.
- [ ] **AC-004** `GET http://localhost:5173` returns React app HTML.
- [ ] **AC-005** All database migrations run successfully: `docker compose exec backend pnpm run db:migrate`.
- [ ] **AC-006** TypeScript type check passes: `pnpm type-check` in frontend and backend.
- [ ] **AC-007** ESLint passes: `pnpm lint` in frontend and backend.
- [ ] **AC-008** Ruff check passes: `ruff check .` in ai-service.
- [ ] **AC-009** pytest passes: `pytest` in ai-service.

---

## Market Data (Phase 5)

- [ ] **AC-010** `GET /api/v1/candles/RELIANCE.NS?interval=1d` returns ≥ 200 candle records with valid OHLCV.
- [ ] **AC-011** `GET /api/v1/candles/AAPL?interval=1d` returns ≥ 200 candle records.
- [ ] **AC-012** `GET /api/v1/quotes/RELIANCE.NS` returns price, change_abs, change_pct, and data_quality.
- [ ] **AC-013** `GET /api/v1/instruments/search?q=reliance` returns ≥ 1 result with symbol `RELIANCE.NS`.
- [ ] **AC-014** `GET /api/v1/candles/INVALID_SYMBOL_XYZ` returns HTTP 404 with `{"error":{"code":"INSTRUMENT_NOT_SUPPORTED"}}`.
- [ ] **AC-015** Candle records stored in PostgreSQL after first fetch; second fetch returns cached data without calling provider.
- [ ] **AC-016** `data_quality.is_delayed` is `true` for yfinance data; never `false`.
- [ ] **AC-017** `GET /api/v1/indices` returns at least NIFTY 50, SENSEX, S&P 500 with prices.

---

## Technical Indicators (Phase 6)

- [ ] **AC-018** RSI(14) computed on fixture sequence matches reference value within 0.01.
- [ ] **AC-019** SMA(20) computed on fixture sequence matches reference value within 0.001.
- [ ] **AC-020** MACD line, signal, and histogram computed correctly against fixture.
- [ ] **AC-021** Bollinger Band upper = SMA(20) + 2σ within 0.001% tolerance.
- [ ] **AC-022** `GET /api/v1/indicators/RELIANCE.NS` returns all required indicator fields.
- [ ] **AC-023** Indicator series endpoint returns time-series arrays for SMA and RSI.
- [ ] **AC-024** TradingView chart renders with ≥ 1 indicator overlay without JavaScript error.
- [ ] **AC-025** Empty state displayed when no candles available.
- [ ] **AC-026** Error state displayed when provider returns error.

---

## AI Analysis (Phase 7)

- [ ] **AC-027** `POST /api/v1/analysis/report` with valid symbol and question returns HTTP 200 with report text.
- [ ] **AC-028** Report includes `instrument_name`, `as_of` timestamp, `price_context`, `technical_context`.
- [ ] **AC-029** Report `disclaimer` field is non-empty and references "not financial advice".
- [ ] **AC-030** Report `model_used` field identifies the LLM model name.
- [ ] **AC-031** If Gemini key not configured, endpoint returns HTTP 503 with `{"error":{"code":"LLM_NOT_CONFIGURED"}}`.
- [ ] **AC-032** If news unavailable for symbol, `news_context` is an empty array and `news_unavailable` is `true`.
- [ ] **AC-033** Sentiment score for news article is in [0.0, 1.0].
- [ ] **AC-034** Research report logged to `research_reports` table in database.

---

## ML Forecasting (Phase 8)

- [ ] **AC-035** `POST /api/v1/ml/train` with XGBoost model for RELIANCE.NS returns job ID without error.
- [ ] **AC-036** Training completes and metrics stored in `ml_models` table.
- [ ] **AC-037** Walk-forward folds have no temporal overlap (verified by test).
- [ ] **AC-038** Features at time t contain no data from t+1 or later (anti-leakage test).
- [ ] **AC-039** `GET /api/v1/ml/predict/RELIANCE.NS` returns prediction 0 or 1 and probability in [0, 1].
- [ ] **AC-040** Prediction response includes disclaimer text.
- [ ] **AC-041** AUC-ROC metric present in model evaluation results.

---

## Screener (Phase 8)

- [ ] **AC-042** `POST /api/v1/screener` with `rsi_14 < 30` filter returns valid results for NSE instruments.
- [ ] **AC-043** Screener response includes `data_quality.as_of` date for each result.
- [ ] **AC-044** Screener with unsupported filter field returns HTTP 400.
- [ ] **AC-045** Results are paginated; `page=2` returns different results from `page=1`.

---

## Portfolio (Phase 9)

- [ ] **AC-046** `POST /api/v1/portfolio/positions` adds a position to the database.
- [ ] **AC-047** `GET /api/v1/portfolio` returns positions with current valuation from latest quote.
- [ ] **AC-048** Unrealized P&L = (current_price − entry_price) × quantity.
- [ ] **AC-049** Portfolio response includes disclaimer "Simulated / Virtual Position."
- [ ] **AC-050** `DELETE /api/v1/portfolio/positions/:id` removes the position.
- [ ] **AC-051** `GET /api/v1/portfolio/performance` returns volatility and max drawdown values.

---

## Backtesting (Phase 9)

- [ ] **AC-052** `POST /api/v1/backtest` SMA crossover on RELIANCE.NS returns equity curve with ≥ 1 trade.
- [ ] **AC-053** Backtest result includes `total_return`, `cagr`, `max_drawdown`, `sharpe_ratio`, `num_trades`, `win_rate`.
- [ ] **AC-054** Backtest with `commission_pct=0.1` produces lower return than `commission_pct=0` (correctly accounts for costs).
- [ ] **AC-055** No future data used in strategy decisions (look-ahead bias test).
- [ ] **AC-056** Benchmark return (buy-and-hold) included in results.
- [ ] **AC-057** Result includes disclaimer "Simulated Historical Performance."

---

## Live Data (Phase 10)

- [ ] **AC-058** WebSocket connection established at `ws://localhost:3001`.
- [ ] **AC-059** Subscribing to AAPL quotes receives `quote_update` events within 30 seconds.
- [ ] **AC-060** `is_delayed` field correctly reflects whether data is real-time.
- [ ] **AC-061** Reconnection occurs automatically after dropped connection.

---

## Quality and Security

- [ ] **AC-062** `VITE_` environment variables contain no provider API keys.
- [ ] **AC-063** SQL injection attempt on `symbol` parameter returns 400 without database error.
- [ ] **AC-064** Request with `symbol` longer than 32 characters returns HTTP 400.
- [ ] **AC-065** `pnpm build` in frontend produces production bundle without error.
- [ ] **AC-066** All three service health endpoints return `{"status":"ok"}` after clean startup.
