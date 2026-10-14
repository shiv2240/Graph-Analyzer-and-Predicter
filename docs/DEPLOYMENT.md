# Deployment Guide
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## Local Development

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | ≥ 24 | https://docs.docker.com/get-docker/ |
| Docker Compose | ≥ 2.20 | Included with Docker Desktop |
| Node.js | ≥ 20 LTS | https://nodejs.org/ |
| pnpm | ≥ 9 | `npm install -g pnpm` |
| Python | ≥ 3.11 | https://python.org/ |

### Step-by-Step

```bash
# 1. Clone
git clone <repo-url>
cd stock-intelligence-ai

# 2. Configure environment
cp .env.example .env
# Edit .env:
#   - Set POSTGRES_PASSWORD to a strong value
#   - Add GEMINI_API_KEY (get free at https://ai.google.dev/)
#   - Add FINNHUB_API_KEY (get free at https://finnhub.io/register)
#   - Leave ALPHA_VANTAGE_API_KEY=DEMO for testing

# 3. Build and start
docker compose up --build

# 4. Run migrations (first time only)
docker compose exec backend pnpm run db:migrate

# 5. Verify
curl http://localhost:3001/health
curl http://localhost:8000/health
open http://localhost:5173
```

---

## Development Without Docker

### Backend

```bash
cd backend
pnpm install
pnpm run dev     # hot-reload with ts-node-dev
```

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev     # Vite dev server
```

### AI Service

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Environment Variables Reference

See [`.env.example`](../.env.example) for all variables with descriptions.

Critical variables:
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — Required for AI analysis features
- `FINNHUB_API_KEY` — Required for US real-time quotes and news

---

## Database Migrations

```bash
# Apply all migrations
docker compose exec backend pnpm run db:migrate

# Rollback last migration
docker compose exec backend pnpm run db:rollback

# Migration status
docker compose exec backend pnpm run db:status
```

Migrations are in `database/migrations/` as numbered SQL files.

---

## Health Checks

| Service | URL | Expected |
|---------|-----|---------|
| Backend | http://localhost:3001/health | `{"status":"ok"}` |
| AI Service | http://localhost:8000/health | `{"status":"ok"}` |
| Frontend | http://localhost:5173 | HTML page |

---

## Production Deployment Notes

> **Note:** Full production deployment verification pending Phase 12.

### Render / Railway (Backend + AI Service)
- Both services can be deployed as Docker containers.
- Free tier has cold-start delays (30+ seconds).
- AI service requires ~2GB RAM for transformer models.

### Supabase / Neon (PostgreSQL)
- Free tier: 500MB storage, no sleep.
- Compatible with `DATABASE_URL` connection string.

### Vercel / Netlify (Frontend)
- Build command: `cd frontend && pnpm build`
- Output directory: `frontend/dist`
- Set `VITE_BACKEND_URL` to deployed backend URL.

### AI Service Model Loading
- First startup downloads FinBERT (~440MB) and Sentence Transformers (~90MB).
- Use a Docker volume to persist downloaded models between restarts.
- Set `TRANSFORMERS_CACHE=/app/models` in environment.

---

## TimescaleDB Upgrade Path (Post-MVP)

```sql
-- Convert candles to hypertable
SELECT create_hypertable('candles', 'ts', if_not_exists => TRUE);

-- Enable compression
ALTER TABLE candles SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'ts DESC'
);
```

---

## CI/CD (GitHub Actions)

See `.github/workflows/ci.yml` (created in Phase 11).

Runs on push:
- Type check, lint, test for all three services.
- Build frontend production bundle.
- Docker build validation.
