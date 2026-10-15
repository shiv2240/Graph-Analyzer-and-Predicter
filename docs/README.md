# 📚 Project Documentation Hub (`docs`)

This directory contains the comprehensive institutional, architectural, and engineering documentation for the **Stock Intelligence AI & Graph Analyzer** platform.

---

## 📑 Complete Documentation Index

| Document | Purpose & Core Content | Key Subsystems Documented |
|:---|:---|:---|
| **[PRD.md](PRD.md)** | Product Requirements Document outlining functional scope, target personas, and market coverage. | NIFTY 50, US Tech, Commodities, Crypto, Drawing Tools |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Detailed system architecture, data flow diagrams, caching tiers, and multi-service topology. | Express Gateway, FastAPI AI, React Vite, Neon DB |
| **[API_SPECIFICATION.md](API_SPECIFICATION.md)** | OpenAPI-aligned REST endpoint contracts, query parameters, payloads, and error codes. | `/instruments`, `/candles`, `/indicators`, `/analysis/multi-timeframe`, `/ml` |
| **[AI_ML_DESIGN.md](AI_ML_DESIGN.md)** | Quantitative modeling architecture, feature engineering rules, anti-leakage splitting, and walk-forward validation. | 20 Anti-Lookahead Features, XGBoost, RF, Logistic Regression |
| **[ISSUES_AND_FIXTURES.md](ISSUES_AND_FIXTURES.md)** | Formal repository log of all identified bugs, edge cases, root causes, applied code fixtures, and verification tests. | 13 Logged Issues (WebSocket races, extension shielding, Neon DB persistence) |
| **[DATA_SOURCES.md](DATA_SOURCES.md)** | Coverage breakdown across Yahoo Finance, Finnhub, Alpha Vantage, and Upstox with rate-limit handling. | Provider Registry, Symbol Mapping, Fallback Pipeline |
| **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** | Detailed relational schema, column types, composite time-series indexes, and constraints. | Neon DB, PostgreSQL, `ml_models`, `ml_predictions`, `candles` |
| **[SECURITY.md](SECURITY.md)** | Threat model, secret management, input validation, CORS policies, and compliance controls. | Zod Schemas, Environment Isolation, Secret Scanner Cleanliness |
| **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** | Comprehensive testing pyramid: backend Vitest unit tests, Python pytest mathematical tests, and e2e checks. | Mathematical Verification, Test Fixtures, Mock Data |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Local process orchestration, Docker Compose deployment, and production hardening guidelines. | Multi-Container Compose, Process Management, Environment Config |
| **[DECISIONS.md](DECISIONS.md)** | Architectural Decision Records (ADRs) documenting technology selections and tradeoffs. | Upstox UI benchmark, Obsidian Theme, Neon DB Selection |
| **[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)** | Documented data gaps, upstream API quirks, and exchange market-hour nuances. | Exchange Holidays, Crypto 24/7 Tick Streams, Rate Limits |
| **[ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md)** | Definition of Done (DoD) per capability and feature checklist. | 60FPS Resizing, Sub-Second Multi-Timeframe Confluence |
| **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** | Engineering phase progression from foundational APIs to institutional charting. | Roadmap, Milestones, Completed Deliverables |
| **[DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)** | Chronological log of engineering progress, bug fixes, and milestones. | Daily Git Trajectory, Feature Iterations |

---

## 🧭 Developer Onboarding & Role-Based Navigation

### 1. I am a Frontend Engineer:
- Read **[frontend/README.md](../frontend/README.md)** for TradingView Lightweight Charts, drawing tools, and pitch-black obsidian theme.
- Review **[PRD.md](PRD.md)** and **[ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md)** for UI/UX specifications.
- Inspect **[ISSUES_AND_FIXTURES.md](ISSUES_AND_FIXTURES.md)** for browser extension shielding and WebSocket teardown debouncing.

### 2. I am a Backend / Distributed Systems Engineer:
- Read **[backend/README.md](../backend/README.md)** for Express REST routes, multi-tier caching (NodeCache + Redis), and daily retraining scheduler.
- Review **[ARCHITECTURE.md](ARCHITECTURE.md)** and **[API_SPECIFICATION.md](API_SPECIFICATION.md)**.
- Review **[DATA_SOURCES.md](DATA_SOURCES.md)** for market provider failover routing.

### 3. I am a Quantitative Researcher / Machine Learning Engineer:
- Read **[ai-service/README.md](../ai-service/README.md)** for FastAPI mathematical indicator calculations and the 20 anti-lookahead features.
- Review **[AI_ML_DESIGN.md](AI_ML_DESIGN.md)** for walk-forward validation and why financial accuracy is strictly bounded to 53%–58%.
- Inspect **[DECISIONS.md](DECISIONS.md)** for model architecture selections (XGBoost vs. Random Forest vs. Logistic Regression).

### 4. I am a Database / DevOps Engineer:
- Read **[database/README.md](../database/README.md)** for schema migrations (`0001` to `0011`) and Neon Cloud DB setup.
- Review **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** and **[DEPLOYMENT.md](DEPLOYMENT.md)** for container orchestration and connection pooling.
- Review **[SECURITY.md](SECURITY.md)** for threat modeling and zero-leakage credentials management.
