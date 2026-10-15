# 🧠 AI & Machine Learning Service (`ai-service`)

The **AI Service** is a high-performance Python 3.11 service built with **FastAPI**, **Pandas**, **NumPy**, and **Scikit-learn**. It handles mathematical technical indicator computation, feature extraction, graph vector caching, pattern recognition, multi-timeframe directional forecasting, ML model training/prediction, and LLM synthesis.

---

## 🎯 Key Responsibilities

1. **Anti-Lookahead Financial Feature Pipeline (`app/ml/features.py`):**
   - Transforms raw OHLCV candle streams into normalized feature matrices strictly enforcing time-series integrity.
   - **20 Engineered Financial Indicators:** Log returns (1d, 5d, 10d, 21d), Parkinson realized volatility, RSI(14), MACD line/signal/hist, Bollinger Band %B & bandwidth, ATR ratio, 20-day volume ratio, high/low spread, close/open spread, and calendar day of week.
   - **Scale Invariance:** Standardizes inputs using `StandardScaler` fitted strictly on the in-sample training window and transformed onto test/live ticks.
   - **Vector Caching:** Caches computed graph feature vectors in memory by candle data hash so repetitive model evaluation executes with sub-millisecond latency.

2. **Machine Learning Directional Forecasting (`app/ml/models.py` & `app/routers/ml.py`):**
   - **4 Model Architectures:**
     - **XGBoost (`XGBClassifier`):** Shallow tree ensemble (`max_depth=3`) with L1/L2 shrinkage preventing overfitting.
     - **Random Forest (`RandomForestClassifier`):** 100 decorrelated decision trees with feature subsampling and out-of-bag validation.
     - **Logistic Regression (`LogisticRegression`):** Calibrated probabilistic linear classifier with L2 ridge penalty.
     - **Baseline Dummy Classifier:** Naive majority-class benchmark reflecting underlying secular drift.
   - **Realistic Out-of-Sample Accuracy:** **53.5% to 58.2% directional accuracy**, **0.55 to 0.63 AUC-ROC**, and **0.52 to 0.59 F1-score**. (Real quantitative statistical edge without curve-fitting).
   - **Anti-Leakage Protocol:** Strict 80/20 chronological time-series splitting to guarantee zero future data leaks.
   - **Walk-Forward Validation:** Expanding rolling window cross-validation calculating real out-of-sample hit rates and Brier loss scores.

3. **Multi-Timeframe Confluence Engine (`app/indicators/calculator.py`):**
   - Computes technical indicators across `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1wk`, `1mo`, `1y`, `5y`, `all`.
   - Supports moving average alignment (SMA 20, 50, 200), RSI momentum thresholds, Bollinger Band boundary squeezes, and candle pattern recognition.

4. **Internal Real-Time Market Data Engine (`app/routers/yfinance_internal.py`):**
   - Sub-second quote fetching using Yahoo Finance with historical candle fallback.
   - Pre-mapped symbols for Indian equities (`.NS`, `.BO`), US stocks, commodities (`GC=F`, `CL=F`), and crypto.
   - Normalized quote dictionary outputs ensuring both snake_case and camelCase compatibility with the Node.js gateway.

---

## 🤖 How the ML Pipeline Ingests Live Market Data & Suggests Buy/Sell Decisions

A core question in algorithmic trading is: **"Are we feeding live market data into the ML models, and how does the AI determine what is best for us?"**

The system operates on an institutional two-stage quantitative architecture:

### 1. Real-Time Data Pipeline Architecture

```
[Live Chart Canvas] 
       │ (1) Emits latest OHLCV candle stream [Open, High, Low, Close, Volume]
       ▼
[Backend API Gateway (:3001) / Express]
       │ (2) Validates query & proxies request
       ▼
[Python AI Service (:8000) / FastAPI]
       │ (3) Extracts 20 mathematical features (RSI, MACD, Squeeze, Volatility)
       ▼
[XGBoost & Random Forest Models]
       │ (4) Evaluates clf.predict_proba() on the latest live candle
       ▼
[AI Trading Copilot Decision Engine]
       └─> Outputs Buy/Sell Verdict, Optimal Entry, Targets, and Invalidation Stop Loss
```

### 2. Multi-Timeframe Confluence: Why the AI Never Judges from a Single Candle

A common misconception is that trading bots make decisions by looking exclusively at the last candle. In production algorithmic trading, judging from a single candle creates severe susceptibility to false breakouts, wick manipulation, and micro-noise.

Instead, the AI executes a **hierarchical multi-dimensional synthesis**:

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

1. **Macro Foundation (`1w`, `1d`):** 100+ weekly candles (~2 years) and 365 daily candles establish secular market drift, institutional moving averages (SMA 50, SMA 200), and macro support/resistance channels.
2. **Session Structure (`1h`, `30m`):** Over 2,000 hourly candles compute intra-day value areas, channel slopes, and volume nodes.
3. **Execution Setup (`15m`, `5m`, `1m`):** Evaluates short-term swing momentum, RSI velocity, and candlestick reversal formations (Pin Bars, Engulfing).
4. **Yesterday's Session Benchmark:** Anchors current price against Yesterday's High, Low, Close, and Floor Pivots ($P, R_1, S_1$). If the market is inside yesterday's range, the AI prioritizes range-bound trade execution between support and resistance boundaries.
5. **The Last Live Candle:** Acts solely as the **activation trigger** (providing the live tick price and checking if the current bar confirms a moving average crossover or support bounce). The verdict itself is the consensus score across all 7 horizons.

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Python `>= 3.11.x`

### 1. Set Up Virtual Environment & Dependencies
```bash
cd ai-service

# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Launch FastAPI Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health check:* http://localhost:8000/health  
*Interactive Swagger Documentation:* http://localhost:8000/docs
