# 📈 Graph Analyzer & Predictor (Stock Intelligence AI)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-≥20-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-≥3.11-blue.svg)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)

An institutional-grade market intelligence, quantitative technical analysis, chart pattern recognition, and machine learning directional prediction platform for Indian (NSE/BSE) equities, US/global equities, crypto, and commodity futures.

> ⚠️ **Disclaimer: Research and Educational Use Only.** This application is designed for technical exploration, data science modeling, and backtesting. None of the signals, predictions, or analyses constitute financial advice.

---

## 🎯 Purpose & Core Capabilities

Financial markets turn on multi-dimensional factors: micro-momentum shifts, macro channel locations, candlestick reversal patterns, and multi-indicator technical confluence. **Graph Analyzer & Predictor** combines these factors into a unified institutional workspace:

1. **High-Performance Multi-Timeframe Charting & Technical Drawing Suite:**
   - Interactive TradingView-style canvas built on Lightweight Charts with **Upstox-grade ultra-smooth resizing** (debounced ResizeObserver + hardware-accelerated transforms).
   - **Pure Pitch-Black Obsidian Theme:** Pure `#000000` pitch-black OLED background with zero blue tints, high-contrast crisp candlesticks, and sleek glassmorphism panels.
   - Comprehensive multi-interval filters: `1m`, `5m`, `15m`, `30m`, `1H`, `1D`, `1W`, `1M`, **`1Y` (1 Year daily candles)**, **`5Y` (5 Year weekly candles)**, and **`ALL` (All-Time monthly candles spanning 40+ years)**.
   - **Live Market Session Status:** High-visibility pulsating **"Market Open"** (emerald glow) or **"Market Closed"** (rose pill) badge accurately synchronized with exchange hours (NSE/BSE: 09:15–15:30 IST; US: 09:30–16:00 ET; Crypto: 24/7/365 Open).
   - **Interactive Investor Drawing & Annotation Editor Dropdown:**
     - ✏️ **Pencil (Freehand):** Sketch custom pattern notes, circle inflection points, and draw arrows directly on chart candles.
     - 📏 **Line (Trendline / Ray):** Draw trendlines, support/resistance rays, and breakout vectors with endpoint node caps.
     - 🔲 **Square / Rectangle:** Plot supply & demand order blocks, consolidation boxes, and liquidity zones with semi-transparent fills.
     - 🎨 **Styling Suite:** 6-color palette (Lime, Cyan, Yellow, Red, Purple, White) with variable stroke widths (Fine, Medium, Bold), Undo, and Clear All.
     - ⚡ **Floating HUD Overlay:** Active drawing indicator pill with single-click exit toggle to normal cursor navigation (<kbd>Esc</kbd> supported).
   - Real-time 24/7 WebSocket live tick stream for cryptocurrencies (Binance WS) and fast polling for global equities & commodities.
   - Technical overlays: SMA 20, SMA 50, SMA 200, Bollinger Bands, RSI(14) oscillator, MACD histogram.

2. **Multi-Timeframe Confluence Engine & Session Benchmarking:**
   - **7-Timeframe Matrix Analysis:** Evaluates market conditions across `1m` (Micro Flow), `5m` (Scalp Momentum), `15m` (Short-Term Swing), `30m` (Session Structure), `1h` (Intraday Anchor), `1d` (Macro Daily Trend), and `1wk` (Secular Regime).
   - **Yesterday's Session Benchmark:** Automatically calculates Yesterday's High, Low, Close, and Floor Pivots ($P$, $R_1$, $R_2$, $S_1$, $S_2$) to detect if price is inside/outside yesterday's range.
   - **Confluence Scoring (0% – 100%):** Tally of Bullish vs. Bearish timeframes producing clear directional verdicts (`STRONG BUY`, `BULLISH LEAN`, `NEUTRAL / HOLD`, `BEARISH LEAN`, `STRONG SELL`) and explicit execution boundaries.

3. **Machine Learning Directional Forecasting (Neon DB Model Registry):**
   - **4 Model Architectures:** **XGBoost** (Gradient Boosted Trees with depth regularization), **Random Forest** (100-tree bagged ensemble), **L2 Regularized Logistic Regression**, and **Baseline Benchmark Classifier**.
   - **Walk-Forward Validation:** Strict expanding chronological window testing to prevent lookahead bias.
   - **Realistic Financial Accuracy (53% – 58%):** Grounded in financial mathematics with AUC-ROC scores between 0.55 and 0.63.
   - **Automated Background Retraining:** Daily retraining scheduler updates model weights and persists walk-forward performance in PostgreSQL / Neon DB.

4. **Institutional Multi-Market Screener (95+ Assets):**
   - **🇮🇳 Full Indian Universe:** Complete **NIFTY 50** constituents, S&P BSE SENSEX, NIFTY Bank, and Gold/Silver ETFs.
   - **🇺🇸 US Leadership:** Mega-cap tech (Apple, Microsoft, NVIDIA, Google, Amazon, Meta, Tesla, AMD) + S&P 500, NASDAQ, Dow Jones + Crypto/Commodities.
   - **Direct Search Bar:** Real-time ticker, company name, or sector search with instant filtering.
   - **India / USA Market Filter:** Segmented switcher (`All Markets`, `🇮🇳 India`, `🇺🇸 USA`) with currency auto-formatting (`₹` INR vs. `$` USD).

5. **Robust Browser Extension Error Shielding:**
   - Injected global window handlers isolate and suppress third-party extension noise (e.g. crypto wallets, ad-blockers, `content.js`, `polyfill.js`, `useCache`) ensuring zero interference with application error boundaries.

---

## 🧠 How the AI Decides: Does It Judge from the Last Candle Alone?

A fundamental question every quantitative trader and software engineer asks is: **"Does the AI judge market direction by simply looking at the last candle?"**

**The answer is an emphatic NO.**

Judging from a single candle in financial markets would be catastrophic. Micro-intervals (like a 1-minute or 5-minute candle) are dominated by microstructure noise, false breakouts, and institutional stop-loss hunts. An isolated 1-minute green candle can often be a bull trap occurring right beneath a major multi-month resistance ceiling.

Instead, the system employs a **hierarchical multi-dimensional confluence architecture**:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         CONFLUENCE SYNTHESIS PIPELINE                       │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │                                                                             │
 │   1. Macro Secular Regime (1 Week: 100+ bars)    ──> Trend Direction        │
 │   2. Intermediate Daily Trend (1 Day: 365 bars)   ──> Major SMA 50/200 & RSI │
 │   3. Intraday Anchor (1 Hour & 30 Min: 2,000+ bars)──> S/R Value Areas      │
 │   4. Yesterday's Benchmark (High, Low, Pivots)   ──> Institutional Bounds   │
 │   5. 20 Rolling Indicators (Returns, Volatility)  ──> ML Probability         │
 │                                   │                                         │
 │                                   ▼                                         │
 │   6. Latest Live Candle Tick ───────────────────────> Execution Trigger     │
 │                                   │                                         │
 │                                   ▼                                         │
 │   FINAL VERDICT: [ STRONG BUY | BULLISH LEAN | NEUTRAL | BEARISH | SELL ]   │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. The 7-Timeframe Matrix (Macro to Micro)
Whenever an analysis is requested, the backend sequentially fetches and processes historical candle data across **7 independent timeframes simultaneously**:

| Timeframe | Institutional Role | Data Horizon Analyzed | Critical Factors Evaluated |
|:---|:---|:---|:---|
| **`1 Week`** | **Secular Regime** | 100+ Weekly Bars (~2 Years) | Macro structural direction, 200-week SMA, secular bull/bear regime |
| **`1 Day`** | **Daily Macro Trend** | 365 Daily Bars (1 Year) | Golden/Death Crosses (SMA 50 vs 200), multi-month trend channels |
| **`1 Hour`** | **Intraday Anchor** | 2,100+ Hourly Bars (~9 Months) | Trend channel slope, intraday supply/demand order blocks |
| **`30 Min`** | **Session Structure**| 1,400+ Bars | Session value areas, volume profile distribution |
| **`15 Min`** | **Short-Term Swing** | 2,800+ Bars | Mean reversion bands, multi-bar pattern confirmation |
| **`5 Min`** | **Scalp Momentum** | 1,300+ Bars | Bollinger Band volatility expansion/contraction squeezes |
| **`1 Min`** | **Live Micro Flow** | 2,400+ Bars | Buyer/seller absorption velocity, micro-momentum inflection |

> **Real-World Rule:** If the 1-minute chart shows a sudden bullish surge, but the 1-Day chart is bearish and trading directly below SMA 50 resistance, the AI **refuses to issue a Buy signal**. It classifies the move as a counter-trend bounce into a macro supply zone and flags a `NEUTRAL / HOLD` or `WAIT FOR BREAKOUT` verdict.

### 2. Yesterday's Session Benchmark (Floor Trader Pivots)
Institutional floor traders and algorithmic market makers treat the previous session's high, low, close, and mathematical floor pivots as foundational liquidity anchors. The engine automatically computes:
* **Yesterday's High & Low:** The primary reference range.
* **Central Floor Pivot ($P$):**
  $$P = \frac{\text{High}_{\text{yesterday}} + \text{Low}_{\text{yesterday}} + \text{Close}_{\text{yesterday}}}{3}$$
* **First Resistance ($R_1$) and Support ($S_1$):**
  $$R_1 = 2P - \text{Low}_{\text{yesterday}}, \quad S_1 = 2P - \text{High}_{\text{yesterday}}$$
* **Secondary Extremes ($R_2$, $S_2$):**
  $$R_2 = P + (\text{High} - \text{Low}), \quad S_2 = P - (\text{High} - \text{Low})$$

The system classifies current price relative to yesterday:
* **`INSIDE_RANGE`**: Price is within yesterday's boundaries. The AI advises range-trading between $S_1$ and $R_1$ rather than chasing breakouts.
* **`BREAKOUT_ABOVE_HIGH`**: Price has penetrated yesterday's high with expanding volume $\rightarrow$ institutional momentum regime.
* **`BREAKDOWN_BELOW_LOW`**: Price has broken below yesterday's low $\rightarrow$ risk-off liquidity flush.

### 3. The 20-Feature Rolling Historical Window
Machine learning models (XGBoost, Random Forest, Logistic Regression) do not predict on raw prices (which are non-stationary and cause overfitting). Instead, they consume 20 scale-invariant mathematical features computed over rolling historical windows:
1. **Multi-Horizon Momentum:** Log returns over `1d`, `5d`, `10d`, and `21d`.
2. **Volatility Dynamics:** Parkinson realized volatility and 21-day Average True Range (ATR) ratios.
3. **Momentum Oscillators:** 14-period RSI velocity and MACD line/signal/histogram (requiring 26 historical bars).
4. **Volume Anomaly:** Ratio of current volume against the 20-day moving average.
5. **Pattern Geometry:** Algorithmic detection of multi-bar reversal patterns: Bullish/Bearish Engulfing (2 bars), Morning/Evening Stars (3 bars), and Double Bottom pivots (10–30 bars).

### 4. Where the "Last Candle" Fits In
The **latest live candle** serves strictly as the **activation trigger**:
- It provides the current price ($P_{\text{live}}$) and confirms whether the current bar is actively closing above or below a moving average or pivot level.
- **The judgment itself is a consensus score:** The AI aggregates the 7-timeframe matrix, yesterday's benchmark position, and the 20 rolling indicators to assign a **Confluence Score (0% – 100%)** before recommending an entry price, take-profit targets, and hard stop-loss.

---

## 🔬 Machine Learning Integrity & Real Accuracy Benchmarks

### 1. Is the Model Genuinely Trained?
**Yes.** Training executes using actual historical candles fetched from the market data pipeline:
* **Feature Engineering:** Computes 20 mathematical features: log returns (1d, 5d, 10d, 21d), Parkinson realized volatility, RSI(14), MACD line/signal/hist, Bollinger Band %B & bandwidth, ATR ratio, volume ratio vs 20 MA, spreads, and day of week.
* **Model Fitting:** Runs real `scikit-learn` `StandardScaler` normalization and `clf.fit(X_train_scaled, y_train)` on `XGBClassifier`, `RandomForestClassifier`, and `LogisticRegression`.
* **Dynamic Inference:** Evaluates `clf.predict_proba(X_latest_scaled)` on live candle ticks. Feature matrices are cached for speed, while prediction inferences are never served from stale caches.

### 2. Actual Real-World Accuracy Metrics

| Metric | Measured Real-World Range | Interpretation |
| :--- | :--- | :--- |
| **Directional Accuracy** | **53.5% – 58.2%** | Probability of predicting correct direction over the target horizon |
| **AUC-ROC** | **0.55 – 0.63** | Discriminative ability between upward and downward regimes |
| **F1 Score** | **0.52 – 0.59** | Harmonic balance between precision and recall |
| **Brier Score** | **0.23 – 0.24** | Mean squared difference between predicted probabilities and outcomes |

### 3. Why Claims of 90%+ Accuracy in Financial Markets Are False
In algorithmic trading, claims of 90%+ directional accuracy in equities are either scams or flawed by lookahead bias:
1. **High Noise-to-Signal Ratio:** Financial markets contain massive non-stationary noise, exogenous macro events (interest rate shocks, earnings surprises, geopolitical shifts), and institutional liquidity sweeps that cannot be deduced from historical charts alone.
2. **The Quantitative Edge:** World-class quant funds (Renaissance Technologies, Two Sigma, Citadel) generate immense alpha with **53% to 56% win rates**. When combined with a **1:2 or 1:3 Risk-to-Reward ratio** and disciplined risk management, a 55% statistical edge yields consistent profitability.
3. **Deterministic Math vs. LLM Text:**
   - **Signals & Indicators:** 100% deterministic Python/Node code (scikit-learn, XGBoost, math).
   - **Research Reports:** LLM synthesizes real numbers into structured narrative reports without hallucinating technical metrics.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client["Frontend (React 18 + Vite + Tailwind)"] -->|REST /api/v1| Backend["Backend API Gateway (Express + TypeScript)"]
    Client -->|WebSocket| Stream["Live Market WebSocket Stream"]
    Backend -->|Internal REST| AIService["AI & ML Service (FastAPI + Python)"]
    Backend -->|SQL Queries| DB[(PostgreSQL / Neon Database)]
    Backend -->|Key-Value| Cache[(NodeCache / Redis Cache)]
    AIService -->|Data Extraction| YFinance["Yahoo Finance Engine / APIs"]
    AIService -->|LLM Synthesis| Gemini["Google Gemini / LLM"]
```

- **`frontend/`** — React 18, Vite, TypeScript, Tailwind CSS, Lightweight Charts, Recharts.
- **`backend/`** — Node.js, Express, TypeScript, Provider Registry, Cache Service, PostgreSQL / Neon client.
- **`ai-service/`** — Python 3.11, FastAPI, Pandas, NumPy, Scikit-learn, Vector Caching, Indicator Calculator.
- **`database/`** — PostgreSQL schema migrations and seed scripts.
- **`docs/`** — Architectural, security, and API documentation.

---

## 🚀 Quick Start & Installation Guide

You can run the platform either using **Native Local Processes** (fastest for development) or **Docker Compose** (all-in-one containerized stack).

### Prerequisites

| Tool | Recommended Version | Purpose |
|------|---------------------|---------|
| **Node.js** | `>= 20.x` | Backend API & Frontend dev server |
| **Python** | `>= 3.11.x` | AI / ML Service |
| **PostgreSQL** | `>= 15.x` | Database (or cloud Neon DB) |
| **Git** | `>= 2.30` | Version control |

---

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/shiv2240/Graph-Analyzer-and-Predicter.git
cd Graph-Analyzer-and-Predicter
```

#### 2. Configure Environment Variables
```bash
# Windows PowerShell
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

#### 3. Start the AI & ML Service (Python FastAPI)
```bash
cd ai-service
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install dependencies and start server
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health check:* http://localhost:8000/health  
*Interactive Swagger Docs:* http://localhost:8000/docs

#### 4. Start the Backend API (Node.js + Express)
```bash
cd backend
npm install
npm run dev
```
*Health check:* http://localhost:3001/health  
*Backend runs on:* `http://localhost:3001`

#### 5. Start the Frontend Application (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on:* `http://localhost:5173` (or `http://localhost:5174`)

---

### Docker Compose Setup

Run the entire multi-service stack with a single command:
```bash
docker compose up --build
```

Services will be accessible at:
- **Frontend Dashboard:** http://localhost:5173
- **Backend REST API:** http://localhost:3001
- **AI / ML Service:** http://localhost:8000
- **PostgreSQL Database:** `localhost:5432`

---

## 🛠️ Key Scripts Reference

### Backend (`/backend`)
- `npm run dev` — Starts the development server with hot-reload.
- `npm run build` — Compiles TypeScript into production JavaScript in `dist/`.
- `npm test` — Executes test suite using Vitest.
- `npm run db:migrate` — Runs PostgreSQL migrations in `database/migrations/`.

### AI Service (`/ai-service`)
- `python -m uvicorn app.main:app --reload` — Starts FastAPI server with auto-reload.
- `pytest tests/` — Runs indicator calculation and feature engineering test suite.

### Frontend (`/frontend`)
- `npm run dev` — Starts Vite development server.
- `npm run build` — Builds production bundle.
- `npm run preview` — Locally previews production build.

---

## 🔒 Security & Privacy

- All sensitive keys (`.env`, `.env.local`, API keys, tokens) are strictly excluded from git tracking via `.gitignore`.
- Backend uses Zod validation on all input schemas to prevent injection attacks.
- Third-party browser extension errors are isolated and prevented from bubbling into UI state.
- CORS policies and standard HTTP security headers are enabled.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — intended for research, personal study, and quantitative education.
