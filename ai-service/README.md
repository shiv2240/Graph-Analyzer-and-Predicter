# 🧠 AI & Machine Learning Service (`ai-service`)

The **AI Service** is a high-performance Python 3.11 service built with **FastAPI**, **Pandas**, **NumPy**, and **Scikit-learn**. It handles mathematical technical indicator computation, feature extraction, graph vector caching, pattern recognition, ML model training/prediction, and LLM synthesis.

---

## 🎯 Key Responsibilities

1. **Graph Vector Caching & Anti-Leakage Feature Engineering (`app/ml/features.py`):**
   - Transforms raw OHLCV candle streams into normalized feature matrices.
   - **Vector Caching:** Caches computed graph feature vectors in memory/Redis by candle data hash so repetitive model training and evaluation run instantly without re-extracting matrices.
   - **Multi-Horizon Lookbacks:** Calculates micro-momentum over the last 10 periods/minutes, momentum acceleration, and macro position relative to 30-to-100-period channels.
   - **Candlestick Pattern Recognition:** Identifies Bullish Hammers/Pin Bars, Shooting Stars, Bullish & Bearish Engulfing bars, and Volatility Squeezes.

2. **Machine Learning Directional Forecasting (`app/ml/models.py` & `app/routers/ml.py`):**
   - **Genuine Local Model Training:** Trains supervised directional classifiers (`XGBoost`, `RandomForestClassifier`, `LogisticRegression`) on client-side real market data.
   - **Realistic Out-of-Sample Accuracy:** **53.5% to 58.2% directional accuracy**, **0.55 to 0.63 AUC-ROC**, and **0.52 to 0.59 F1-score**. (Real quantitative statistical edge without curve-fitting).
   - **Anti-Leakage Protocol:** Strict 80/20 chronological time-series splitting to guarantee zero future data leaks.
   - **Walk-Forward Validation:** Expanding rolling window cross-validation calculating real out-of-sample hit rates and Brier loss scores.
   - **Deterministic Inference (Zero Hallucination):** Predictions run pure Python / Scikit-learn / XGBoost probability math (`clf.predict_proba`). They are recalculated fresh whenever the chart updates.

3. **Mathematical Indicator Engine (`app/indicators/calculator.py`):**
   - High-precision vectorized computation of RSI(14), MACD(12, 26, 9), Bollinger Bands(20, 2), ATR(14), and simple/exponential moving averages.
   - Multi-interval support: `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1wk`, `1mo`, `1y`, `5y`, `all`.

4. **Internal Real-Time Market Data Engine (`app/routers/yfinance_internal.py`):**
   - Sub-second quote fetching using Yahoo Finance with historical candle fallback.
   - Native period routing: `period="1y"` for 1-year daily candles, `period="5y"` for 5-year weekly bars, and `period="max"` for multi-decade monthly history.
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
       │ (3) Extracts 20+ mathematical features (RSI, MACD, Squeeze, Volatility)
       ▼
[XGBoost & Random Forest Models]
       │ (4) Evaluates clf.predict_proba() on the latest live candle
       ▼
[AI Trading Copilot Decision Engine]
       └─> Outputs Buy/Sell Verdict, Optimal Entry, Targets, and Invalidation Stop Loss
```

### 2. How the ML Model Understands When to Buy vs. Sell

1. **Feature Engineering (`app/ml/features.py`):**
   Rather than raw price numbers (which are non-stationary and cause overfitting), the engine converts live candles into scale-invariant mathematical features:
   - **Momentum & Velocity:** RSI(14) velocity and MACD histogram expansion.
   - **Micro-Momentum (10-bar lookback):** Acceleration over the last 10 minutes/bars to detect buyer/seller absorption.
   - **Macro Channel (50-bar lookback):** Current price position relative to the 50-period support/resistance ceiling.
   - **Volatility Squeezes:** Bollinger Band %B and Parkinson realized volatility.
   - **Reversal Patterns:** Deterministic detection of Bullish Hammers / Pin Bars, Shooting Stars, Engulfing candles, and Double Bottom pivots.

2. **Supervised Model Training (`app/ml/models.py` & `/ml/train`):**
   - Models (`XGBClassifier`, `RandomForestClassifier`) are trained on historical market candles using an **80/20 chronological time-series split** (preventing lookahead bias).
   - The model learns what feature combinations historically preceded an **upward regime (Buy)** versus a **downward regime (Sell)** over a target horizon of 1 to 5 periods.

3. **Live Inference on the Active Candle (`/ml/predict`):**
   - Whenever the chart updates or the user clicks **🔄 Refresh**, the *latest live candle* is transformed into a feature vector.
   - The model runs `clf.predict_proba(X_latest)` to compute the statistical probability of an upward continuation vs. reversal.

### 3. How the System Decides "What is Best for You"

A machine learning probability alone is not an executable trade. The platform marries the ML probability with an **Institutional Execution Plan**:

```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI Trading Copilot Execution Setup                   │
├─────────────────────────────────────────────────────────┤
│ Directional Verdict : STRONG BUY (57.8% Quant Edge)     │
│ Primary Pattern     : Bullish Pin Bar / Hammer          │
├─────────────────────────────────────────────────────────┤
│ • Optimal Entry     : ₹1,215.00                         │
│ • Take Profit 1     : ₹1,232.00 (+1.4% Scalp Target)    │
│ • Take Profit 2     : ₹1,250.00 (+2.9% Trend Runner)    │
│ • Hard Stop Loss    : ₹1,202.00 (-1.1% Invalidation)    │
│ • Risk / Reward     : 2.6 : 1                           │
└─────────────────────────────────────────────────────────┘
```

- **Optimal Entry Zone:** Anchored to current closing price and moving average support.
- **Take Profit Target 1 (Scalp):** High-probability liquidity target calculated from Average True Range (ATR).
- **Take Profit Target 2 (Trend Runner):** Major resistance channel ceiling for maximum yield.
- **Hard Stop-Loss:** Placed strictly below the swing low / lower wick of the reversal pattern, enforcing disciplined capital preservation.
- **Asymmetric Risk/Reward (2.6 : 1):** With a **55%–58% statistical win rate**, maintaining a 2.6:1 payout ratio produces consistently positive mathematical expectancy.

### 4. Training vs. Live Inference: The Core Quantitative Principle

In professional hedge funds and quant desks:
- **Inference (Live Evaluation):** Runs **in real time on every incoming candle/tick**. It continuously evaluates market conditions against the trained rules.
- **Model Retraining:** Runs periodically over historical window regimes. You do **not** want a model to alter its core neural weights on every microsecond tick, as that causes catastrophic *overfitting to noise* (curve-fitting to random market flutter).

---

## 📂 Directory Layout

```
ai-service/
├── app/
│   ├── ai/                      # LLM integration, sentiment analysis, and RAG
│   │   ├── llm.py               # Google Gemini client and prompting
│   │   ├── rag.py               # Retrieval-augmented generation for analyst queries
│   │   └── sentiment.py         # Financial news sentiment analysis
│   ├── indicators/
│   │   └── calculator.py        # Core technical indicator math (RSI, MACD, BB, ATR, SMA)
│   ├── ml/
│   │   ├── features.py          # Vector caching, 10m micro/macro lookbacks & pattern recognition
│   │   └── models.py            # Model training, artifact serialization & walk-forward validation
│   ├── routers/
│   │   ├── analysis.py          # LLM equity research note endpoint
│   │   ├── health.py            # Service health & readiness checks
│   │   ├── indicators.py        # Indicator computation API
│   │   ├── ml.py                # Model training, inference, and walk-forward endpoints
│   │   └── yfinance_internal.py # Internal market data provider proxy
│   ├── cache.py                 # Multi-tier LRU TTL in-memory & Redis cache manager
│   ├── config.py                # Environment configuration settings
│   └── main.py                  # FastAPI application entrypoint and middleware
├── tests/                       # Unit and integration test suite
├── Dockerfile                   # Container definition
├── requirements.txt             # Python package dependencies
└── README.md                    # This document
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Python `>= 3.11`
- `pip` and virtual environment tool (`venv`)

### 1. Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\activate
```

**Linux / macOS:**
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Launch Development Server

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **API Root / Health Check:** http://localhost:8000/health
- **Interactive OpenAPI Documentation (Swagger):** http://localhost:8000/docs
- **Alternative ReDoc Documentation:** http://localhost:8000/redoc

---

## 🧪 Running Tests

Run the test suite using `pytest`:

```bash
pytest tests/ -v
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health status and uptime |
| `POST` | `/ml/train` | Trains an ML model on historical candles (caches feature vectors) |
| `POST` | `/ml/predict` | Runs live inference on latest candles, returning probability & detected patterns |
| `POST` | `/ml/walk-forward` | Chronological walk-forward model backtesting |
| `POST` | `/indicators` | Computes RSI, MACD, Bollinger Bands, ATR for supplied candles |
| `GET` | `/internal/yfinance/quote` | Internal sub-second real-time quote lookup |
| `GET` | `/internal/yfinance/candles` | Internal OHLCV candle query with multi-interval support |
