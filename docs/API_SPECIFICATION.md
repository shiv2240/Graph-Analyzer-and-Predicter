# API Specification
# Stock Intelligence AI

**Version:** v1  
**Base URL:** `http://localhost:3001/api/v1`  
**Format:** JSON  
**Auth:** None (server-to-server API keys managed in backend env)

---

## Conventions

- All timestamps: ISO 8601 UTC string (`"2026-10-14T09:00:00Z"`).
- Pagination: `?page=1&limit=50` (default limit 50, max 200).
- Errors: `{ "error": { "code": "ERROR_CODE", "message": "..." } }`.
- HTTP 200 for success; 400 validation error; 404 not found; 429 rate limit; 502 provider error; 500 internal.
- Stale/delayed data always includes `data_quality` object.

---

## Health

### `GET /health`

Returns service health.

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-10-14T09:00:00Z",
  "dependencies": {
    "postgres": "ok",
    "ai_service": "ok"
  }
}
```

---

## Instruments

### `GET /api/v1/instruments/search`

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | Yes | Search query (name or symbol) |
| exchange | string | No | Filter by exchange code |
| limit | integer | No | Max results (default 20) |

**Response 200:**
```json
{
  "results": [
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries Limited",
      "exchange": "NSE",
      "instrument_type": "EQUITY",
      "currency": "INR"
    }
  ],
  "count": 1
}
```

---

### `GET /api/v1/instruments/:symbol`

Returns instrument metadata.

**Path param:** `symbol` — URL-encoded (e.g., `RELIANCE.NS` → `RELIANCE.NS`)

**Response 200:**
```json
{
  "symbol": "RELIANCE.NS",
  "name": "Reliance Industries Limited",
  "exchange": "NSE",
  "instrument_type": "EQUITY",
  "currency": "INR",
  "isin": "INE002A01018",
  "provider_meta": { "yfinance_symbol": "RELIANCE.NS" }
}
```

---

## Market Data

### `GET /api/v1/candles/:symbol`

Returns OHLCV candles.

**Query params:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| interval | string | No | `1d` | 1d, 1wk, 1mo, 1h, 15m |
| from | string | No | 1 year ago | ISO date or datetime |
| to | string | No | today | ISO date or datetime |

**Response 200:**
```json
{
  "symbol": "RELIANCE.NS",
  "interval": "1d",
  "from": "2025-10-14",
  "to": "2026-10-14",
  "candles": [
    {
      "ts": "2025-10-14T09:15:00+05:30",
      "open": 2850.00,
      "high": 2890.50,
      "low": 2840.00,
      "close": 2875.25,
      "volume": 12500000,
      "adj_close": 2875.25
    }
  ],
  "data_quality": {
    "source": "yfinance",
    "is_delayed": true,
    "delay_minutes": 15,
    "is_cached": false,
    "last_refreshed": "2026-10-14T10:00:00Z"
  }
}
```

---

### `GET /api/v1/quotes/:symbol`

Returns latest available quote.

**Response 200:**
```json
{
  "symbol": "RELIANCE.NS",
  "price": 2875.25,
  "change_abs": 25.25,
  "change_pct": 0.89,
  "volume": 12500000,
  "day_high": 2890.50,
  "day_low": 2840.00,
  "prev_close": 2850.00,
  "data_quality": {
    "source": "yfinance",
    "is_delayed": true,
    "delay_minutes": 15,
    "exchange_ts": "2026-10-14T15:30:00+05:30",
    "recorded_at": "2026-10-14T10:03:00Z"
  }
}
```

---

### `GET /api/v1/quotes/batch`

**Query params:** `symbols=RELIANCE.NS,TCS.NS,INFY.NS` (comma-separated, max 20)

**Response 200:** Array of quote objects (same schema as above).

---

### `GET /api/v1/indices`

Returns supported indices with latest prices.

**Response 200:**
```json
{
  "indices": [
    {
      "symbol": "^NSEI",
      "name": "NIFTY 50",
      "exchange": "NSE",
      "price": 24500.00,
      "change_pct": 0.45,
      "data_quality": { ... }
    }
  ]
}
```

---

## Technical Indicators

### `GET /api/v1/indicators/:symbol`

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| interval | string | `1d` | Candle interval |
| from | string | 1 year ago | Date range start |
| to | string | today | Date range end |

**Response 200:**
```json
{
  "symbol": "RELIANCE.NS",
  "interval": "1d",
  "as_of": "2026-10-14",
  "indicators": {
    "sma": { "20": 2810.5, "50": 2750.3, "200": 2600.1 },
    "ema": { "12": 2840.2, "26": 2790.5 },
    "rsi": { "14": 62.4 },
    "macd": { "line": 49.7, "signal": 42.1, "histogram": 7.6 },
    "bollinger_bands": { "upper": 2950.0, "middle": 2810.5, "lower": 2671.0 },
    "atr": { "14": 45.2 },
    "volatility_21d": 0.0182,
    "max_drawdown": -0.124,
    "volume_sma_20": 11800000,
    "volume_spike": false
  },
  "data_quality": {
    "source": "yfinance",
    "candles_used": 252,
    "as_of": "2026-10-14T00:00:00Z"
  }
}
```

---

### `GET /api/v1/indicators/:symbol/series`

Returns indicator time series (for charting).

**Query params:** Same as above, plus `indicators` (comma-separated list).

**Response 200:**
```json
{
  "symbol": "RELIANCE.NS",
  "series": {
    "sma_20": [{ "ts": "2026-10-10", "value": 2800.0 }, ...],
    "rsi_14": [{ "ts": "2026-10-10", "value": 61.2 }, ...]
  }
}
```

---

## AI Analysis

### `POST /api/v1/analysis/report`

**Request body:**
```json
{
  "symbol": "RELIANCE.NS",
  "question": "What are the key technical levels and recent sentiment?"
}
```

**Response 200:**
```json
{
  "report_id": 42,
  "symbol": "RELIANCE.NS",
  "question": "...",
  "report": {
    "summary": "...",
    "price_context": { ... },
    "technical_context": { ... },
    "news_context": [ { "headline": "...", "sentiment": "positive", "url": "...", "published_at": "..." } ],
    "model_context": { "prediction": 1, "probability": 0.62, "model_version": "rf_v1" },
    "risks": "...",
    "disclaimer": "This is not financial advice. Data as of 2026-10-14."
  },
  "model_used": "gemini-1.5-flash",
  "generated_at": "2026-10-14T10:15:00Z"
}
```

---

## News

### `GET /api/v1/news`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| symbol | string | Filter by symbol |
| from | string | Date range start |
| limit | integer | Max results (default 20) |

**Response 200:**
```json
{
  "articles": [
    {
      "id": 1,
      "headline": "Reliance Q2 results beat estimates",
      "summary": "...",
      "url": "https://...",
      "published_at": "2026-10-13T12:00:00Z",
      "source_provider": "finnhub",
      "sentiment_label": "positive",
      "sentiment_score": 0.87
    }
  ],
  "count": 1
}
```

---

## ML Models

### `GET /api/v1/ml/models`

Returns available trained models.

### `POST /api/v1/ml/train`

**Request body:**
```json
{
  "symbol": "RELIANCE.NS",
  "model_type": "xgboost",
  "target_horizon": 1,
  "train_from": "2020-01-01",
  "train_to": "2025-12-31"
}
```

**Response 202 (async):**
```json
{ "job_id": "train_abc123", "status": "queued" }
```

### `GET /api/v1/ml/predict/:symbol`

**Query params:** `model_id` (optional, defaults to latest for symbol)

**Response 200:**
```json
{
  "symbol": "RELIANCE.NS",
  "prediction": 1,
  "probability": 0.67,
  "target_date": "2026-10-15",
  "model": { "id": 5, "type": "xgboost", "version": "v1", "trained_on": "2026-09-30" },
  "features_used": { "rsi_14": 62.4, "macd_hist": 7.6, ... },
  "disclaimer": "Probabilistic estimate. Not a guarantee."
}
```

---

## Screener

### `POST /api/v1/screener`

**Request body:**
```json
{
  "filters": [
    { "field": "rsi_14", "operator": "lt", "value": 30 },
    { "field": "close", "operator": "gt", "value": 100 },
    { "field": "exchange", "operator": "eq", "value": "NSE" }
  ],
  "sort": { "field": "change_pct", "direction": "desc" },
  "page": 1,
  "limit": 50
}
```

**Response 200:**
```json
{
  "results": [
    {
      "symbol": "INFY.NS",
      "name": "Infosys Ltd",
      "close": 1520.0,
      "change_pct": -2.1,
      "rsi_14": 28.4,
      "volume": 5000000,
      "data_quality": { "source": "yfinance", "as_of": "2026-10-14" }
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 50
}
```

---

## Portfolio

### `GET /api/v1/portfolio`

Returns all open positions with current valuation.

### `POST /api/v1/portfolio/positions`

Add a position.

**Request body:**
```json
{
  "symbol": "TCS.NS",
  "quantity": 10,
  "entry_price": 3500.00,
  "entry_date": "2026-09-01",
  "notes": "Long-term hold"
}
```

### `DELETE /api/v1/portfolio/positions/:id`

Remove a position.

### `GET /api/v1/portfolio/performance`

Returns portfolio P&L, volatility, drawdown, and allocation.

---

## Backtesting

### `POST /api/v1/backtest`

**Request body:**
```json
{
  "symbol": "RELIANCE.NS",
  "strategy_name": "sma_crossover",
  "params": { "fast": 20, "slow": 50 },
  "start_date": "2020-01-01",
  "end_date": "2025-12-31",
  "initial_capital": 100000,
  "commission_pct": 0.1,
  "slippage_pct": 0.05
}
```

**Response 200:**
```json
{
  "config_id": 3,
  "result": {
    "total_return": 0.842,
    "cagr": 0.131,
    "max_drawdown": -0.234,
    "sharpe_ratio": 1.24,
    "num_trades": 47,
    "win_rate": 0.55,
    "benchmark_return": 0.651,
    "equity_curve": [{ "date": "2020-01-01", "value": 100000 }, ...],
    "disclaimer": "Simulated historical performance. Not predictive of future returns."
  }
}
```

---

## WebSocket Events

**Endpoint:** `ws://localhost:3001` (Socket.IO)

### Subscribe to quote updates

```js
socket.emit("subscribe_quotes", { symbols: ["RELIANCE.NS", "TCS.NS"] })
socket.on("quote_update", (data) => { /* QuotePayload */ })
socket.on("heartbeat", () => { /* keep-alive */ })
```

### QuotePayload schema

```json
{
  "symbol": "RELIANCE.NS",
  "price": 2876.50,
  "change_pct": 0.92,
  "volume": 12800000,
  "ts": "2026-10-14T10:05:00Z",
  "is_delayed": true
}
```
