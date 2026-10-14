# Testing Strategy
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## 1. Testing Layers

| Layer | Tool | Scope |
|-------|------|-------|
| Frontend unit | Vitest + React Testing Library | Components, hooks, utils |
| Backend unit | Vitest | Services, utilities, validators |
| Backend integration | Supertest | Express routes with test DB |
| AI service unit | pytest | Indicator calculations, ML pipeline |
| AI service integration | pytest + httpx | FastAPI endpoints |
| End-to-end | (Post-MVP) | Full user flows |

---

## 2. Frontend Testing

### 2.1 Tools

- **Vitest** — test runner (fast, Vite-compatible)
- **@testing-library/react** — component rendering
- **@testing-library/user-event** — user interaction simulation
- **msw** (Mock Service Worker) — API mocking

### 2.2 What to Test

- Chart components render without error for valid/empty data.
- Hooks return loading/error/success states correctly.
- Formatters (price, percentage, date) produce expected strings.
- Error state components render correct messages.
- Screener filter logic.

### 2.3 Coverage Target

Line coverage ≥ 70% for `src/utils/`, `src/hooks/`, `src/components/`.

### 2.4 Run Command

```bash
cd frontend && pnpm test
cd frontend && pnpm test:coverage
```

---

## 3. Backend Testing

### 3.1 Tools

- **Vitest** — unit test runner
- **Supertest** — HTTP integration tests
- **pg** test database — `stockintel_test` schema
- **jest-mock-extended** (or manual mocks) — provider adapter mocks

### 3.2 What to Test

- Route validation: missing params → 400, valid params → 200.
- Provider adapter: mock responses → correct normalized output.
- Cache: first call hits provider, second call hits cache.
- Database upsert: duplicate candles do not duplicate rows.
- Rate-limit handler: throttled provider returns 429 or retry.

### 3.3 Test Database Setup

```bash
# In .env.test
DATABASE_URL=postgresql://stockintel:test@localhost:5432/stockintel_test
```

Run migrations before tests:
```bash
pnpm run db:migrate:test
```

### 3.4 Coverage Target

Line coverage ≥ 75% for `src/services/`, `src/routes/`, `src/providers/`.

### 3.5 Run Command

```bash
cd backend && pnpm test
cd backend && pnpm test:integration
```

---

## 4. AI Service Testing

### 4.1 Tools

- **pytest** — test runner
- **httpx** — async HTTP client for FastAPI endpoint tests
- **numpy.testing** — numerical assertion with tolerance

### 4.2 Critical: Indicator Validation

Every indicator must have a deterministic fixture test:

```python
# ai-service/tests/test_indicators.py
def test_rsi_known_sequence():
    """RSI computed on known sequence must match reference values."""
    closes = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.15,
              43.61, 44.33, 44.83, 45.10, 45.15, 44.34, 44.09]
    result = calculate_rsi(closes, period=14)
    # Reference: TA-Lib value
    assert abs(result[-1] - 70.46) < 0.01
```

### 4.3 ML Pipeline Tests

- Feature engineering produces no NaN for valid input.
- Train/val/test splits are strictly chronological.
- Scaler is fit only on training data.
- Predictions are in [0, 1] range.
- Walk-forward folds do not overlap.
- Model can be saved and reloaded with identical predictions.

### 4.4 Lookahead Bias Tests

```python
def test_no_future_data_in_features():
    """Features at time t must not include data from t+1 or later."""
    features = engineer_features(candles, as_of_index=100)
    for feature_ts in features.index:
        assert feature_ts <= candles.index[100]
```

### 4.5 Sentiment Tests

- FinBERT returns valid label and score for standard financial headline.
- Empty/null headline handled without exception.
- Non-English text flagged or handled gracefully.

### 4.6 Coverage Target

Line coverage ≥ 80% for `app/indicators/`, `app/forecasting/`.

### 4.7 Run Command

```bash
cd ai-service && pytest
cd ai-service && pytest --cov=app --cov-report=html
```

---

## 5. Contract Testing

Backend and AI service exchange data through internal HTTP calls.  
Pydantic schemas in `ai-service/app/schemas/` are the source of truth.  
Backend Zod schemas mirror AI service responses — any mismatch caught in integration tests.

---

## 6. CI Configuration

`.github/workflows/ci.yml` runs on every push and pull request:

```yaml
jobs:
  frontend:
    - pnpm install
    - pnpm type-check
    - pnpm lint
    - pnpm test
    - pnpm build

  backend:
    - pnpm install
    - pnpm type-check
    - pnpm lint
    - pnpm test

  ai-service:
    - pip install -r requirements.txt
    - ruff check .
    - mypy app/
    - pytest --cov=app
```

---

## 7. Type Checking

| Service | Tool | Config |
|---------|------|--------|
| Frontend | `tsc --noEmit` | `tsconfig.json` strict |
| Backend | `tsc --noEmit` | `tsconfig.json` strict |
| AI service | `mypy app/` | `mypy.ini` strict |

---

## 8. Linting and Formatting

| Service | Linter | Formatter |
|---------|--------|-----------|
| Frontend | ESLint | Prettier |
| Backend | ESLint | Prettier |
| AI service | Ruff | Ruff format |

---

## 9. Test Data Policy

- Tests use isolated fixtures, never production data.
- No API keys required for unit or integration tests (all provider calls mocked).
- Test OHLCV data stored in `tests/fixtures/` as JSON files.
- Never commit real API responses containing real user data.
