# Architecture Decision Records
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## ADR-001: Python AI Service as Separate Process

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** ML libraries (scikit-learn, XGBoost, Transformers) and data processing (Pandas, NumPy) are vastly better supported in Python than Node.js. However, the backend API layer is Node.js for team familiarity and ecosystem.

**Decision:** Run a separate Python FastAPI service for all ML, NLP, and indicator computation. Backend calls AI service over HTTP on the internal Docker network.

**Consequences:**
- Added network hop for AI operations (acceptable on localhost).
- Clear separation: Node handles routing/caching/DB, Python handles computation.
- Cannot share in-process state; must serialize through HTTP JSON.

---

## ADR-002: yfinance as Primary Data Provider for MVP

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** Multiple providers evaluated. yfinance provides free, no-key access to both NSE/BSE (`.NS`/`.BO` suffixes) and US equities. It covers historical daily data adequate for MVP.

**Decision:** Use yfinance as the primary historical data provider. Finnhub for US real-time. Upstox stub for Indian real-time.

**Consequences:**
- Yahoo Finance ToS prohibits commercial redistribution — MVP is personal/research use only.
- No guaranteed SLA; Yahoo may change endpoints.
- Indian live data unavailable without Upstox OAuth account.
- Clearly documented in `DATA_SOURCES.md`.

---

## ADR-003: FAISS for Local Vector Retrieval

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** A vector database is required for RAG. Options: Pinecone (paid), Weaviate (complex), Chroma (lightweight), FAISS (local).

**Decision:** Use `faiss-cpu` for local vector storage. Index stored in Docker volume.

**Consequences:**
- No external service dependency.
- Not horizontally scalable — acceptable for single-machine MVP.
- Index must be rebuilt when articles are deleted (append-only until rebuild).
- No built-in metadata filtering — filter after retrieval in Python.

---

## ADR-004: Gemini 1.5 Flash as Primary LLM

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** LLM options on free tier: Gemini (15 req/min, 1M tokens/day), OpenAI GPT-4o (no meaningful free tier), HuggingFace Inference API (rate-limited, smaller models).

**Decision:** Use `gemini-1.5-flash` as primary. Fallback to HuggingFace `flan-t5-large` if Gemini key not configured.

**Consequences:**
- Gemini key required for full AI features — documented in `.env.example`.
- flan-t5-large fallback is less capable but runs without external key if self-hosted.
- Model may change capabilities; pin to documented version.

---

## ADR-005: No Authentication in MVP

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** PRD explicitly prohibits login/registration/JWT/OAuth.

**Decision:** No authentication system. Application is single-user, self-hosted.

**Consequences:**
- Portfolio data is not isolated per user — single shared portfolio.
- API keys must be protected at the network level (not expose ports publicly).
- Not suitable for multi-user or public internet deployment without auth added later.

---

## ADR-006: PostgreSQL Without TimescaleDB for MVP

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** TimescaleDB adds excellent time-series performance but adds deployment complexity. Standard PostgreSQL is sufficient for MVP data volumes.

**Decision:** Use PostgreSQL 16. Schema designed for TimescaleDB compatibility (time-partitioning-friendly). Upgrade path documented.

**Consequences:**
- At scale (>50M candles), queries may slow. Addressed by indexing strategy.
- Migration to TimescaleDB requires hypertable conversion — documented as future step.

---

## ADR-007: pnpm as Node Package Manager

**Status:** Accepted  
**Date:** 2026-10-14

**Decision:** Use pnpm for both frontend and backend. Reasons: disk efficiency, strict dependency isolation, monorepo workspace support.

---

## ADR-008: Chronological Train/Test Split (No Random Shuffle)

**Status:** Accepted  
**Date:** 2026-10-14

**Context:** Randomly shuffling time-series observations causes future-data leakage — a model trained on 2024 data that "predicts" 2023 values is not a valid predictor.

**Decision:** All ML splits are strictly chronological. Walk-forward validation with expanding window.

**Consequences:**
- Less training data than random splits for small datasets.
- Results are more conservative and realistic.
- This is the only valid approach for financial time-series modeling.
