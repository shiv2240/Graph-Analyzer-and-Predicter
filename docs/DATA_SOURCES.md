# Data Sources Documentation
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## 1. Provider Evaluation Summary

| Provider | Market Coverage | Free Tier | API Key | Real-Time | Delay | Terms |
|----------|----------------|-----------|---------|-----------|-------|-------|
| yfinance (Python) | NSE, BSE, NYSE, NASDAQ, LSE, + more | Yes (no key) | No | No | 15–60 min | Yahoo ToS — no commercial redistribution |
| Alpha Vantage | NYSE, NASDAQ, some global | 25 req/day (free) | Yes | No | 15–60 min | Free for personal/research |
| Finnhub | US equities, FOREX, crypto | 60 req/min (free) | Yes | Yes (US only) | Real-time for US | Free for personal use |
| Upstox Developer API | NSE, BSE | Yes (authorized account) | Yes + OAuth2 | Yes (WebSocket) | Real-time | Requires Upstox brokerage account |

---

## 2. Detailed Provider Profiles

### 2.1 yfinance

**Library:** `yfinance >= 0.2.x`  
**Underlying source:** Yahoo Finance  
**Access model:** No API key; Python library call.

**Supported operations:**
- `yf.Ticker(symbol).history(period, interval)` — OHLCV candles
- `yf.Ticker(symbol).info` — basic fundamentals (market cap, PE, etc.)
- `yf.download([symbols], ...)` — bulk download
- `yf.search(query)` — instrument search

**Indian symbols:**
- NSE: append `.NS` (e.g., `RELIANCE.NS`, `TCS.NS`)
- BSE: append `.BO` (e.g., `RELIANCE.BO`)

**US symbols:** Plain ticker (e.g., `AAPL`, `MSFT`).

**Indices:**
| Index | Symbol |
|-------|--------|
| NIFTY 50 | `^NSEI` |
| SENSEX | `^BSESN` |
| NIFTY BANK | `^NSEBANK` |
| S&P 500 | `^GSPC` |
| NASDAQ Composite | `^IXIC` |
| Dow Jones | `^DJI` |

**Intervals supported:** `1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo`

**Intraday history limit:** Last 60 days for 1m; last 730 days for 1h.

**Rate limits:** Unofficial; Yahoo may throttle at ~2,000 req/hour. Use caching.

**Known limitations:**
- Not suitable for commercial redistribution (Yahoo Finance ToS).
- Data quality issues: adjusted vs. unadjusted prices, dividend handling varies.
- Intraday data may have gaps.
- `info` endpoint is unreliable for some Indian instruments.
- No guaranteed SLA; Yahoo may change endpoints without notice.
- **Use case: Historical research and prototyping only.**

**Implementation status:** `ai-service/app/providers/yfinance_adapter.py`

---

### 2.2 Alpha Vantage

**Base URL:** `https://www.alphavantage.co/query`  
**Auth:** `apikey` query parameter  
**Registration:** https://www.alphavantage.co/support/#api-key

**Free tier constraints:**
- 25 requests per day (standard free key)
- 500 requests per day (premium, ~$50/month)
- No intraday data on free tier for most international markets
- Rate: 5 requests/minute

**Supported operations (free tier):**
- `TIME_SERIES_DAILY_ADJUSTED` — daily OHLCV with splits/dividends
- `SYMBOL_SEARCH` — instrument search
- `GLOBAL_QUOTE` — latest quote
- `OVERVIEW` — company fundamentals

**Indian market coverage:** Limited. Some NSE tickers available with `.NSE` suffix via premium tier.  
**Use case:** Supplemental US equity fundamentals; not primary for Indian data.

**Implementation status:** `backend/src/providers/alphavantage/`

---

### 2.3 Finnhub

**Base URL:** `https://finnhub.io/api/v1`  
**Auth:** `X-Finnhub-Token` header or `token` query param  
**Registration:** https://finnhub.io/register  
**Documentation:** https://finnhub.io/docs/api

**Free tier constraints:**
- 60 API calls/minute
- Real-time US equity quotes via WebSocket
- Historical US candles: up to 1 year
- News: company news, market news

**Supported operations:**
- `GET /stock/candle` — OHLCV
- `GET /quote` — real-time quote (US)
- `GET /search` — symbol lookup
- `GET /company-news` — news articles
- `GET /stock/profile2` — company profile
- WebSocket: `wss://ws.finnhub.io` — live trades

**Indian market coverage:** None on free tier.  
**Use case:** US equity live quotes, news ingestion for US stocks.

**Implementation status:** `backend/src/providers/finnhub/`

---

### 2.4 Upstox Developer API

**Base URL:** `https://api.upstox.com/v2`  
**WebSocket:** `wss://api.upstox.com/v2/feed/market-data-streamer`  
**Auth:** OAuth2 — requires Upstox brokerage account  
**Documentation:** https://upstox.com/developer/api-documentation/

**Account requirements:**
- Must have an Upstox brokerage account (free to open, Indian residents only).
- Must create an app in the Upstox Developer Portal.
- OAuth2 authorization code flow required for access token.
- Access token expires; refresh token rotation required.

**Free tier constraints:**
- All API calls free for account holders.
- Rate limits: ~10 req/sec per endpoint.

**Supported operations:**
- `GET /historical-candle/{symbol}/{interval}/{toDate}/{fromDate}` — OHLCV
- `GET /market-quote/quotes?symbol=...` — latest quote
- `GET /market-quote/ltp?symbol=...` — LTP (last traded price)
- `GET /option-chain-derivative/...` — options data
- WebSocket: protobuf-based market feed for subscribed instruments

**Symbol format:** `NSE_EQ|{ISIN}` or `NSE_EQ|RELIANCE` (depends on endpoint version)

**Coverage:** Full NSE and BSE equity coverage for Indian account holders.

**Known limitations:**
- Requires Indian residency and brokerage account.
- OAuth2 flow is mandatory — no server-to-server API key.
- Access tokens expire every 1 day.
- Not available for non-Indian users.
- MVP implementation: adapter stub with clear OAuth setup instructions.

**Implementation status:** `backend/src/providers/upstox/` — adapter with OAuth stub.

---

## 3. Market Coverage Matrix

| Feature | Indian NSE/BSE | US NYSE/NASDAQ |
|---------|---------------|----------------|
| Historical daily OHLCV | yfinance ✓ | yfinance ✓, Finnhub ✓ |
| Latest quote (delayed) | yfinance ✓ | yfinance ✓ |
| Latest quote (real-time) | Upstox ✓ (account required) | Finnhub ✓ |
| Intraday candles | yfinance (limited) ✓ | Finnhub ✓ |
| Live streaming | Upstox WebSocket ✓ (account required) | Finnhub WebSocket ✓ |
| Company fundamentals | yfinance (partial) ✓ | Alpha Vantage ✓, Finnhub ✓ |
| News | Finnhub (US only) ✓ | Finnhub ✓ |
| Indices | yfinance ✓ | yfinance ✓ |

---

## 4. Features Requiring Paid Access or Special Account

| Feature | Constraint | Workaround in MVP |
|---------|-----------|-------------------|
| NSE/BSE real-time data | Upstox account | yfinance delayed data |
| Alpha Vantage intraday (global) | Paid subscription | Skip for MVP |
| Alpha Vantage > 25 req/day | Paid subscription | Cache aggressively |
| Indian news feed | No free Indian news API found | Finnhub US news + disclaimer |

---

## 5. Data Quality Standards

All ingested data must include:

```json
{
  "symbol": "RELIANCE.NS",
  "source": "yfinance",
  "exchange": "NSE",
  "currency": "INR",
  "interval": "1d",
  "timestamp": "2026-10-14T09:15:00+05:30",
  "data_quality": {
    "is_delayed": true,
    "delay_minutes": 15,
    "is_cached": false,
    "is_adjusted": true,
    "last_refreshed": "2026-10-14T15:30:00Z"
  }
}
```

**Never label delayed data as real-time.**  
**Never fabricate missing OHLCV values.**  
**If a symbol is unsupported, return `{ "error": "INSTRUMENT_NOT_SUPPORTED" }`.**

---

## 6. Rate Limiting and Caching Implementation

- All provider calls wrapped with `p-retry` (exponential backoff, max 3 retries).
- Each provider has a per-minute and per-day request counter.
- Cache keys: `{provider}:{symbol}:{interval}:{date}`.
- Database acts as second-level cache for daily candles.
- Requests exceeding rate limits return HTTP 429 with `Retry-After` header.
