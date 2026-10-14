# Stock Intelligence AI

A production-minded, modular web application for Indian and international stock market intelligence, financial data analysis, machine learning experimentation, and AI-assisted equity research.

> **Research and Educational Use Only.** This application is not financial advice. All model outputs, backtests, and portfolio simulations are for learning purposes.

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Docker | ≥ 24 |
| Docker Compose | ≥ 2.20 |
| Node.js | ≥ 20 |
| Python | ≥ 3.11 |
| pnpm | ≥ 9 |

### 1. Clone and configure

```bash
git clone <repo-url>
cd stock-intelligence-ai
cp .env.example .env
# Edit .env and fill in your API keys (see docs/DATA_SOURCES.md)
```

### 2. Start all services

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| AI Service | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

### 3. Run database migrations

```bash
docker compose exec backend pnpm run db:migrate
```

### 4. Verify health

```bash
curl http://localhost:3001/health
curl http://localhost:8000/health
```

---

## Services

- **`frontend/`** — React + Vite + TypeScript + Tailwind CSS dashboard
- **`backend/`** — Node.js + Express + TypeScript REST API
- **`ai-service/`** — Python + FastAPI ML and NLP service
- **`database/`** — PostgreSQL migrations

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements and scope |
| [Architecture](docs/ARCHITECTURE.md) | System design and data flows |
| [Data Sources](docs/DATA_SOURCES.md) | Provider coverage and limitations |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Tables, indexes, and migrations |
| [API Specification](docs/API_SPECIFICATION.md) | REST endpoint contracts |
| [AI/ML Design](docs/AI_ML_DESIGN.md) | Model design and evaluation |
| [Security](docs/SECURITY.md) | Security decisions and controls |
| [Testing Strategy](docs/TESTING_STRATEGY.md) | Test plan and coverage |
| [Deployment](docs/DEPLOYMENT.md) | Local and cloud deployment |
| [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) | Phase-by-phase build plan |
| [Decisions](docs/DECISIONS.md) | Architecture decision records |
| [Known Limitations](docs/KNOWN_LIMITATIONS.md) | Provider gaps and data quality issues |
| [Acceptance Criteria](docs/ACCEPTANCE_CRITERIA.md) | Definition of done per feature |
| [Development Log](docs/DEVELOPMENT_LOG.md) | Progress, blockers, and next steps |

## License

MIT — for educational and research use only. Not for commercial financial services.
