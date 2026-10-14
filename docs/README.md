# 📚 Project Documentation Hub (`docs`)

This directory contains the complete institutional, architectural, and engineering documentation for the **Stock Intelligence AI & Graph Analyzer** platform.

---

## 📑 Documentation Index

| Document | Purpose & Core Content |
|----------|------------------------|
| **[PRD.md](PRD.md)** | Product Requirements Document outlining functional scope, target personas, and market coverage. |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Detailed system architecture, data flow diagrams, caching tiers, and multi-service topology. |
| **[API_SPECIFICATION.md](API_SPECIFICATION.md)** | OpenAPI-aligned REST endpoint contracts, query parameters, payloads, and error codes. |
| **[AI_ML_DESIGN.md](AI_ML_DESIGN.md)** | Quantitative modeling architecture, feature engineering rules, anti-leakage splitting, and walk-forward validation. |
| **[DATA_SOURCES.md](DATA_SOURCES.md)** | Coverage breakdown across Yahoo Finance, Finnhub, Alpha Vantage, and Upstox with rate-limit handling. |
| **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** | Detailed relational schema, column types, composite time-series indexes, and constraints. |
| **[SECURITY.md](SECURITY.md)** | Threat model, secret management, input validation, CORS policies, and compliance controls. |
| **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** | Comprehensive testing pyramid: backend Vitest unit tests, Python pytest mathematical tests, and e2e checks. |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Local process orchestration, Docker Compose deployment, and production hardening guidelines. |
| **[DECISIONS.md](DECISIONS.md)** | Architectural Decision Records (ADRs) documenting technology selections and tradeoffs. |
| **[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)** | Documented data gaps, upstream API quirks, and exchange market-hour nuances. |
| **[ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md)** | Definition of Done (DoD) per capability and feature checklist. |
| **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** | Engineering phase progression from foundational APIs to institutional charting. |
| **[DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)** | Chronological log of engineering progress, bug fixes, and milestones. |

---

## 💡 Quick Navigation

- Want to understand how the services communicate? See **[ARCHITECTURE.md](ARCHITECTURE.md)**.
- Want to inspect or integrate with backend endpoints? See **[API_SPECIFICATION.md](API_SPECIFICATION.md)**.
- Want to see how the ML model prevents lookahead leakage? See **[AI_ML_DESIGN.md](AI_ML_DESIGN.md)**.
- Deploying the stack to a server? See **[DEPLOYMENT.md](DEPLOYMENT.md)**.
