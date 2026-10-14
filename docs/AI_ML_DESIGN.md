# AI/ML Design Document
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## 1. Overview

The AI service (`ai-service/`) provides:
1. **Technical indicator computation** — validated Pandas-based calculations.
2. **Forecasting models** — binary classification of next-period positive returns.
3. **Financial sentiment** — FinBERT inference on news articles.
4. **RAG pipeline** — FAISS retrieval + LLM response generation.
5. **Structured analysis reports** — LLM-generated research with cited, validated data.

---

## 2. Technical Indicators

### 2.1 Implementation

All calculations are in `ai-service/app/indicators/calculator.py`.

| Indicator | Formula | Library |
|-----------|---------|---------|
| SMA | Simple rolling mean | Pandas |
| EMA | Exponential weighted mean | Pandas `ewm(span=n)` |
| RSI | Wilder's RSI (14-period) | Manual Pandas |
| MACD | EMA(12) − EMA(26) signal=EMA(9,MACD) | Pandas |
| Bollinger Bands | SMA(20) ± 2σ | Pandas |
| ATR | Wilder's ATR (14-period) | Pandas |
| Realized Volatility | Std(log returns) × √252 (annualized) | NumPy |
| Max Drawdown | (Peak − Trough) / Peak over window | Pandas |
| Volume SMA | Rolling mean(volume, 20) | Pandas |

### 2.2 Validation

Test fixtures in `ai-service/tests/fixtures/indicator_fixtures.py`.  
Each indicator tested against:
- TA-Lib reference values (where available).
- Manually computed values for known OHLCV sequences.
- Tolerance: absolute error < 0.001 × value.

---

## 3. Forecasting Models

### 3.1 Problem Statement

Binary classification:
- **Target:** `y = 1` if `close[t+horizon] > close[t]`, else `y = 0`.
- **Horizon:** Default 1 trading day ahead.
- **Instrument:** Per-instrument or global model.

### 3.2 Feature Engineering

All features computed from historical data only (no lookahead):

| Feature | Formula |
|---------|---------|
| `rsi_14` | RSI at time t |
| `macd_hist` | MACD histogram at t |
| `bb_position` | (close − bb_lower) / (bb_upper − bb_lower) |
| `return_1d` | log(close[t]/close[t-1]) |
| `return_5d` | log(close[t]/close[t-5]) |
| `return_21d` | log(close[t]/close[t-21]) |
| `vol_ratio` | volume[t] / sma_volume_20[t] |
| `atr_pct` | atr_14[t] / close[t] |
| `above_sma_50` | 1 if close > sma_50 else 0 |
| `above_sma_200` | 1 if close > sma_200 else 0 |
| `day_of_week` | 0–4 (Monday–Friday) |

### 3.3 Data Split Strategy

**CRITICAL: No random shuffling of time-series data.**

```
Full historical data: 2015-01-01 → 2026-10-14
├── Training:   2015-01-01 → 2024-06-30  (70%)
├── Validation: 2024-07-01 → 2025-06-30  (15%)
└── Test:       2025-07-01 → 2026-10-14  (15%)
```

Walk-forward validation:
- Window size: 252 trading days.
- Step size: 63 trading days (quarterly).
- Retrain on expanding window.

### 3.4 Models

| Model | Library | Notes |
|-------|---------|-------|
| Majority baseline | Custom | Always predict majority class |
| Logistic Regression | sklearn | C=0.1, max_iter=1000 |
| Random Forest | sklearn | n_estimators=100, max_depth=8 |
| XGBoost | xgboost | n_estimators=200, max_depth=5, lr=0.05 |

### 3.5 Metrics

Reported per model per walk-forward fold:
- Accuracy
- Precision (positive class)
- Recall (positive class)
- F1 score
- AUC-ROC
- Brier score (calibration)

### 3.6 Model Persistence

- Saved with `joblib` to `ai-service/models/{symbol}_{model_type}_v{n}.joblib`.
- Metadata stored in `ml_models` table.
- Prediction logged to `ml_predictions` table with features used.

### 3.7 Anti-Leakage Checklist

- [ ] Features computed only from past data at each time step.
- [ ] Train/val/test split is strictly chronological.
- [ ] Scaler fit only on training data; applied to val/test.
- [ ] No future candles included in feature window.
- [ ] Incomplete (partial) candles excluded.
- [ ] Target label computed before model training, not during.

---

## 4. Financial Sentiment — FinBERT

### 4.1 Model

- **Model:** `ProsusAI/finbert` (HuggingFace)
- **Labels:** `positive`, `neutral`, `negative`
- **Output:** label + softmax probability

### 4.2 Pipeline

```python
from transformers import pipeline
sentiment_pipe = pipeline(
    "text-classification",
    model="ProsusAI/finbert",
    return_all_scores=True
)
result = sentiment_pipe(headline + ". " + summary[:512])
```

### 4.3 Limitations

- FinBERT is trained on English financial texts. Non-English content may produce unreliable results.
- Sentiment classification ≠ factual verification. A "positive" headline may be misleading.
- Clearly label all sentiment scores as model output, not ground truth.

---

## 5. RAG Pipeline

### 5.1 Embedding Model

- **Model:** `sentence-transformers/all-MiniLM-L6-v2`
- **Dimension:** 384
- **Throughput:** ~1,000 docs/sec on CPU

### 5.2 Vector Store

- **Library:** `faiss-cpu`
- **Index type:** `IndexFlatIP` (cosine similarity via normalized vectors)
- **Persistence:** Serialized to `ai-service/faiss_index/` (Docker volume)
- **Re-index trigger:** Nightly or when > 100 new articles added

### 5.3 Retrieval

```python
query_vector = embedder.encode([question])  # shape (1, 384)
faiss.normalize_L2(query_vector)
distances, indices = index.search(query_vector, k=5)
# Retrieve article rows from DB by indices
```

### 5.4 Context Window Management

Retrieved documents are ranked by score, truncated to fit within LLM context (8,192 tokens for Gemini Flash).

---

## 6. LLM Integration

### 6.1 Primary LLM

- **Model:** `gemini-1.5-flash` (free tier: 15 requests/minute, 1 million tokens/day)
- **Fallback:** `google/flan-t5-large` via HuggingFace Inference API (free tier)
- **Library:** `google-generativeai`

### 6.2 Structured Context Schema

```python
class AnalysisContext(BaseModel):
    symbol: str
    instrument_name: str
    exchange: str
    as_of: datetime
    latest_price: float
    price_change_pct: float
    indicators: IndicatorSnapshot
    recent_candles: list[CandleBar]        # last 10 bars
    news_snippets: list[NewsSnippet]       # top 5 RAG results
    ml_prediction: Optional[MLPrediction]
    question: str
```

### 6.3 Prompt Engineering

```
You are a financial research assistant. You have access to the following 
validated, real market data for {symbol} as of {as_of}. Do not invent 
prices, events, or facts not present in the data provided.

Data:
{structured_context_json}

User question: {question}

Provide a structured analysis with:
1. Price and trend summary
2. Technical indicator interpretation
3. Relevant news context (cite sources)
4. ML model signal (if available) — clearly labeled as probabilistic
5. Key risks and alternative interpretations
6. Disclaimer: not financial advice

Be concise. Flag any uncertainty explicitly.
```

### 6.4 Safety Constraints

- System prompt explicitly forbids inventing data.
- Response validated against schema (Pydantic) before returning.
- If LLM response fails validation, return error rather than invalid report.
- Rate limit: 1 report per 5 seconds per client IP.

---

## 7. Model Evaluation Page

Exposed via `GET /api/v1/ml/models` and `GET /api/v1/ml/models/:id/metrics`.

Displays:
- Walk-forward equity curve of model accuracy over time.
- Confusion matrix for test period.
- Feature importance (for tree-based models).
- Calibration curve.
- Comparison against majority-class baseline.

---

## 8. Disclaimers

All model outputs must include:

> "This prediction is a probabilistic estimate based on historical patterns. It is not a guarantee of future performance. This is not financial advice."
