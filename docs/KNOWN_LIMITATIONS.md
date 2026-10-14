# Known Limitations
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## Data Limitations

### KL-01: yfinance Terms of Service
**Severity:** High  
**Impact:** Cannot redistribute data commercially.  
**Detail:** yfinance wraps Yahoo Finance. Yahoo's ToS prohibits commercial redistribution of market data. This application is for personal/research use only.  
**Workaround:** Switch to a licensed data vendor for commercial use.

### KL-02: Indian Real-Time Data Requires Upstox Account
**Severity:** Medium  
**Impact:** Indian market data is delayed 15+ minutes without Upstox OAuth.  
**Detail:** Upstox requires an Indian brokerage account and OAuth2 authorization. The adapter is implemented but requires user setup.  
**User action:** Follow `docs/DATA_SOURCES.md#upstox` setup instructions.

### KL-03: Alpha Vantage 25 Requests/Day on Free Tier
**Severity:** Medium  
**Impact:** Limited to 25 API calls per day on the free standard key.  
**Detail:** Used supplementally for US fundamentals. Daily candles cached to minimize calls.  
**Workaround:** Use the `DEMO` key for testing; obtain a free key for production use.

### KL-04: No Free Indian News Source Available
**Severity:** Medium  
**Impact:** News sentiment for Indian stocks uses US-focused Finnhub data.  
**Detail:** No evaluated provider offers free, machine-readable Indian financial news.  
**Workaround:** Users can configure an RSS feed URL in settings (future feature).

### KL-05: yfinance Intraday Data Limited to 60 Days
**Severity:** Low  
**Impact:** Intraday chart data unavailable beyond 60 days for 1-minute bars.  
**Detail:** Yahoo Finance restricts intraday history. Daily data available for decades.

### KL-06: yfinance Reliability
**Severity:** Medium  
**Impact:** Yahoo may change endpoints without notice, causing data failures.  
**Detail:** yfinance has had multiple breaking changes historically. The adapter includes retry logic and explicit error states.

---

## AI/ML Limitations

### KL-07: LLM Cannot Access Live Internet
**Severity:** Low  
**Impact:** AI analysis is limited to data passed in the structured context object.  
**Detail:** Gemini/HuggingFace inference is stateless; the model only sees what the backend sends. No live web browsing.

### KL-08: FinBERT English-Only
**Severity:** Medium  
**Impact:** Sentiment analysis unreliable for non-English news.  
**Detail:** ProsusAI/FinBERT is trained on English financial text. Hindi, regional language, or mixed-language news will produce lower-quality sentiment scores.

### KL-09: ML Models Are Not Predictive of Future Returns
**Severity:** High  
**Impact:** Model outputs are illustrative, not actionable signals.  
**Detail:** Financial markets are complex, non-stationary systems. Historical pattern-based models have no guaranteed out-of-sample predictive value. Clearly disclosed in every prediction response.

### KL-10: FAISS Index Not Filtered by Metadata
**Severity:** Low  
**Impact:** Semantic search may return news from different companies or time periods.  
**Detail:** FAISS `IndexFlatIP` does not support metadata filtering. Post-retrieval filtering applied in Python code.

### KL-11: Gemini API Rate Limits
**Severity:** Medium  
**Impact:** AI analysis limited to 15 requests/minute on free tier.  
**Detail:** Exceeded requests queued; if queue full, return 429 with retry-after.

---

## Infrastructure Limitations

### KL-12: Single-Machine Deployment Only
**Severity:** Low (MVP)  
**Impact:** No horizontal scaling or high availability.  
**Detail:** Docker Compose on a single host. Sufficient for personal research use. HA requires Kubernetes (out of scope for MVP).

### KL-13: No TimescaleDB in MVP
**Severity:** Low  
**Impact:** Time-series queries may slow beyond 50M candles.  
**Detail:** Schema is TimescaleDB-compatible; upgrade path documented in `DEPLOYMENT.md`.

### KL-14: AI Service Startup Time
**Severity:** Low  
**Impact:** First request to AI service may take 30–120 seconds due to model loading.  
**Detail:** FinBERT and Sentence Transformer models are loaded into memory on startup. Cold start is slow. Health endpoint reports `{"status":"starting"}` until models are loaded.

---

## Feature Limitations (MVP Non-Goals)

### KL-15: No Broker Integration
Real trade execution is not implemented and not planned for MVP.

### KL-16: No User Accounts
Portfolio is shared; no per-user isolation.

### KL-17: No Options, Futures, or Forex Data
Only equity and index instruments in MVP.

### KL-18: No Automated Trading
No algorithmic order routing exists or will be added.
