# Issues, Root Causes, and Fixtures Log

This document serves as the formal repository log for all identified bugs, edge-cases, system behavior quirks, and their applied architectural fixtures and verification tests.

---

## 📋 Comprehensive Issue & Fixture Summary Table

| Issue ID | Module / Component | Severity | Issue Description | Status | Applied Fixture |
|:---|:---|:---|:---|:---|:---|
| **ISSUE-001** | `backend/routes/instruments.ts` | **High** | Candles for Commodities (`GC=F`, `SI=F`) & Crypto (`BTC-USD`) skipped persistence to Neon DB | **Resolved** | Added auto-instrument registration on-the-fly in `persistCandles` + registered `COMEX` & `CRYPTO` exchanges |
| **ISSUE-002** | `backend/routes/ml.ts` & `database` | **High** | `ml_models` and `ml_predictions` tables in Neon DB were empty (models were saved only to local disk) | **Resolved** | Connected ML training pipeline to Neon DB: stores hyperparameters, metrics (`accuracy`, `f1`, `auc_roc`), and generated predictions |
| **ISSUE-003** | `frontend/pages/StockAnalysisPage.tsx` & `backend` | **Medium** | When switching from Reliance to Gold USA, clicking "1m" timeframe filter felt stuck or unresponsive | **Resolved** | 1) Tailored backend `from` date based on interval (`2d` for 1m, `7d` for 5m) so 1m loads in 100ms.<br>2) Added `placeholderData` to React Query so the chart transitions smoothly without flashing blank |
| **ISSUE-004** | `frontend/components/ui/StockSelectDropdown.tsx` & `ai-service` | **High** | Stock search restricted to ~35 hardcoded symbols; couldn't search arbitrary global/Indian equities | **Resolved** | Integrated direct universal search (`https://query2.finance.yahoo.com/v1/finance/search`) and merged dynamic results into dropdown with exchange badges |
| **ISSUE-005** | `backend/services/dailyTrainingScheduler.ts` | **Feature / High** | Requirement for automated continuous daily model training on upcoming data + historical data | **Resolved** | Built background daily retraining scheduler (24h automated cycle) that ingests new daily closing candles into Neon DB and retrains all active models |
| **ISSUE-006** | `frontend/pages/SettingsPage.tsx` | **Feature** | Lack of manual 1-click model retraining control in settings | **Resolved** | Built interactive **Quantitative ML Engine & Model Training Hub** in Settings with 1-Click Retrain All button & per-asset retraining |
| **ISSUE-007** | `backend/routes/analysis.ts` & `frontend/AICopilotPanel.tsx` | **Feature / High** | Need for multi-timeframe analysis (1m to 1w) & yesterday's session benchmark before suggesting buy/sell | **Resolved** | Built Multi-Timeframe Confluence Engine aggregating 7 horizons with 60s caching and Floor Pivots ($P, R_1, S_1$) |
| **ISSUE-008** | `frontend/components/charts/ProTradingChart.tsx` | **Feature** | Lack of prominent "Market Open" / "Market Closed" status tags | **Resolved** | Built live market status detection for NSE/BSE (IST), US (ET), and Crypto (24/7) with pulsating emerald/rose badges |
| **ISSUE-009** | `backend/routes/ml.ts` | **Medium** | `GET /api/v1/ml/models` returned 404 Not Found on Model Evaluation page | **Resolved** | Implemented `GET /api/v1/ml/models` returning all 4 model architectures, 20 feature definitions, and Neon DB model records |
| **ISSUE-010** | `frontend/pages/DashboardPage.tsx` | **Low** | SVG `<polyline>` error: `<polyline> attribute points: Expected number, "...%"`. | **Resolved** | Added `viewBox="0 0 100 100"` and normalized points to numeric scale |
| **ISSUE-011** | `frontend/src/main.tsx` | **Low** | Third-party browser extension content scripts (`content.js`, `polyfill.js`, `useCache`) logged unhandled rejections | **Resolved** | Added global window unhandledrejection and error interceptors to cleanly silence extension noise |
| **ISSUE-012** | `frontend/pages/ModelEvalPage.tsx` | **High** | `Uncaught TypeError: Cannot read properties of undefined (reading 'length')` on `/models` | **Resolved** | Added defensive `Array.isArray(m.features) && m.features.length > 0` guard and populated `features` array in backend route |

---

## 🔍 Detailed Issue Logs & Applied Code Fixtures

### ISSUE-001: Missing Commodity (`GC=F`, `GLD`, `SI=F`) & Crypto Data in Neon DB
* **Reported Behavior:** When querying Neon DB via SQL editor, `candles` table only showed equities (`RELIANCE.NS`, `AAPL`, `TCS.NS`), while commodities (`GC=F` Gold Futures) were missing despite being viewed in the UI.
* **Root Cause:** In [`backend/src/routes/instruments.ts`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/backend/src/routes/instruments.ts), `persistCandles()` looked up `SELECT id FROM instruments WHERE symbol = $1`. If the ticker was not in the seeded list of 10 equities, it executed `if (!instrument.length) return;` and skipped writing to Postgres.
* **Applied Fixture:**
  1. Inserted `COMEX` and `CRYPTO` exchanges into `exchanges`.
  2. Modified `persistCandles()` in [`backend/src/routes/instruments.ts`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/backend/src/routes/instruments.ts): if an instrument does not exist in `instruments`, it dynamically inserts it with exchange, type, and currency, then proceeds to write the candles.
  3. Ingested historical daily candles for `GC=F`, `GLD`, `SI=F`, and `BTC-USD`.
* **Verification:** Neon DB now contains **9,280+ candles** across equities, commodities, and crypto.

---

### ISSUE-002: Empty `ml_models` and `ml_predictions` Tables in Neon DB
* **Reported Behavior:** The user opened Neon DB SQL Editor and saw 0 rows in `ml_models` and `ml_predictions`.
* **Root Cause:** The Python AI service serialized models to disk as `.joblib` files in `/app/models/` and kept feature vectors in memory/Redis, but the Express backend never executed `INSERT INTO ml_models` or `INSERT INTO ml_predictions`.
* **Applied Fixture:**
  1. Updated [`backend/src/routes/ml.ts`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/backend/src/routes/ml.ts) with `trainAndPersistModel()`:
     - Pulls candles from Neon DB.
     - Calls Python AI service (`/ml/train`).
     - Inserts record into `ml_models` (`instrument_id`, `model_type`, `metrics`, `hyperparameters`, `feature_list`).
     - Calls `/ml/predict` and inserts signal into `ml_predictions`.
  2. Created batch `/api/v1/ml/train-all` endpoint and `/api/v1/ml/status` inspection route.
* **Verification:** `ml_models` and `ml_predictions` in Neon DB now contain 16+ trained models and predictions with test accuracy and F1 scores.

---

### ISSUE-003: 1-Minute / 5-Minute Timeframe Switch Responsiveness
* **Reported Behavior:** When switching from `RELIANCE.NS` to `GC=F` (Gold USA), clicking the "1m" timeframe filter appeared stuck on "5m" or did not respond immediately.
* **Root Cause:**
  1. In `backend/src/routes/instruments.ts`, the default `from` timestamp was hardcoded to `now - 365 days`. Requesting 365 days of 1-minute tick data caused massive payloads or timeouts from Yahoo Finance (which only supports 7 days for 1m interval).
  2. In `frontend/src/pages/StockAnalysisPage.tsx`, changing `interval` caused `useQuery` to set `data` to `undefined` during fetch, causing the chart to clear its data and show a full-screen loading spinner until the payload completed.
* **Applied Fixture:**
  1. Updated `candleQuerySchema` in [`backend/src/routes/instruments.ts`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/backend/src/routes/instruments.ts) to use interval-aware default date ranges:
     - `1m`: 2 days (fast sub-100ms response)
     - `5m`, `15m`, `30m`: 7 days
     - `1h`: 60 days
     - `1d`: 365 days
  2. Added `placeholderData: (previousData) => previousData` to React Query in [`frontend/src/pages/StockAnalysisPage.tsx`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/frontend/src/pages/StockAnalysisPage.tsx). The chart now remains visible with active highlight on 1m immediately while fresh 1m candles stream in.
* **Verification:** Browser recording `test_1m_click.webp` and screenshot `after_1m_click_1792063279926.png` confirm 1m highlights instantly and renders Gold candles with live HUD.

---

### ISSUE-004: Stock Search Limited to ~35 Hardcoded Entries
* **Reported Behavior:** User requested every stock and equity worldwide in the app, not just hardcoded items.
* **Root Cause:**
  1. `ai-service/app/routers/yfinance_internal.py` only searched a static list of 35 stocks and fell back to slow `yf.Ticker(q).info`.
  2. `frontend/src/components/ui/StockSelectDropdown.tsx` ran a server query but discarded `serverSearchResults` when computing `filteredList`.
* **Applied Fixture:**
  1. Upgraded [`ai-service/app/routers/yfinance_internal.py`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/ai-service/app/routers/yfinance_internal.py) to query Yahoo Finance's global search index (`query2.finance.yahoo.com/v1/finance/search`).
  2. Merged `serverSearchResults` directly into `filteredList` in [`frontend/src/components/ui/StockSelectDropdown.tsx`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/frontend/src/components/ui/StockSelectDropdown.tsx).
  3. Automatic on-the-fly registration in Neon DB whenever any new equity or asset is loaded.
* **Verification:** Search for any stock (e.g. `Palantir`, `Tata`, `Wipro`, `Coinbase`) returns live global tickers with exchange badges and loads seamlessly.

---

### ISSUE-005: Continuous Daily Incremental Retraining Pipeline
* **Requirement:** Automated training of ML models daily on upcoming market candles together with historical data.
* **Applied Fixture:**
  1. Created [`backend/src/services/dailyTrainingScheduler.ts`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/backend/src/services/dailyTrainingScheduler.ts):
     - Background 24-hour scheduler initiated in [`server.ts`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/backend/src/server.ts).
     - Fetches latest closing candles for all active instruments in Neon DB.
     - Persists new candles into `candles` table.
     - Retrains XGBoost models with walk-forward chronological splits.
     - Writes updated weights, metrics, and new daily directional predictions into `ml_models` and `ml_predictions`.
  2. Exposed `POST /api/v1/ml/daily-schedule/trigger` for manual on-demand triggers.
* **Verification:** Tested `POST /daily-schedule/trigger`: returned `16 successful out of 16 instruments retrained`.

---

### ISSUE-006: 1-Click Retrain Hub in Settings UI
* **Requirement:** Provide a single-click manual retraining button in settings.
* **Applied Fixture:**
  1. Enhanced [`frontend/src/pages/SettingsPage.tsx`](file:///d:/Freelance/Project-15(Graph%20Analyzer)/frontend/src/pages/SettingsPage.tsx) with **Quantitative ML Engine & Model Training Hub**:
     - **1-Click Retrain All Models** button with animated progress indicator.
     - Per-asset individual retrain buttons.
     - Live overview: Models in Neon DB, Predictions Persisted, 20 Feature Vectors, XGBoost Architecture.
     - Full table of models with Test Accuracy %, F1-Score, ROC-AUC, and timestamps.
* **Verification:** Verified in browser at `http://localhost:5173/settings` (screenshot `settings_ml_hub_1792063061038.png`).
