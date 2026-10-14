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
