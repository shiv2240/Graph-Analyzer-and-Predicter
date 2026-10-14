# Security Document
# Stock Intelligence AI

**Version:** 1.0  
**Date:** 2026-10-14

---

## 1. Threat Model

| Threat | Impact | Mitigations |
|--------|--------|-------------|
| API key exposure in frontend | Critical | Keys only in backend env; never in VITE_ vars |
| SQL injection | High | Parameterized queries (pg placeholders) |
| Provider API key logging | High | Pino redact list; keys never in log objects |
| CORS bypass | Medium | Strict origin allowlist from env var |
| Input injection (LLM prompt) | Medium | Structured context object; never raw user text |
| Rate-limit abuse | Medium | Per-IP rate limiter (express-rate-limit) |
| Path traversal in file reads | Low | Artifacts written to fixed Docker volume paths |
| Dependency vulnerability | Medium | `pnpm audit` + `pip-audit` in CI |

---

## 2. Secret Management

- All provider API keys stored in `.env` (gitignored).
- `.env.example` contains placeholders only — never real keys.
- Backend reads secrets from `process.env` at startup.
- AI service reads secrets from `os.environ`.
- **VITE_ prefixed vars** (exposed to browser): only `VITE_BACKEND_URL` and `VITE_APP_TITLE`. No keys.
- Docker secrets: managed via environment block in `docker-compose.yml` — no key values hard-coded.

---

## 3. Input Validation

- **Backend:** Zod schema validation on every route handler.
- **AI service:** Pydantic model validation on every FastAPI endpoint.
- Validation errors return HTTP 400 with field-level messages.
- User-supplied strings: length limits enforced (symbol max 32 chars, question max 1,000 chars).

---

## 4. SQL Security

- All database queries use parameterized placeholders:
  ```typescript
  // Correct
  await db.query('SELECT * FROM instruments WHERE symbol = $1', [symbol]);
  // Never
  await db.query(`SELECT * FROM instruments WHERE symbol = '${symbol}'`);
  ```
- ORM (SQLAlchemy) used in AI service with bound parameters.
- No dynamic table name construction.

---

## 5. LLM Prompt Injection Prevention

- User question is placed in a structured `question` field inside a validated JSON object.
- The LLM prompt separates user content from system instructions with clear delimiters.
- User input is sanitized: max 1,000 characters, no raw HTML, no code execution.
- LLM output is parsed via Pydantic; unstructured responses are rejected.

---

## 6. CORS Configuration

Backend (`backend/src/middleware/cors.ts`):
```typescript
cors({
  origin: process.env.VITE_BACKEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
})
```

---

## 7. Rate Limiting

- **Provider calls:** Per-provider rate-limit tracker prevents exceeding free-tier quotas.
- **API rate limit:** `express-rate-limit` — 100 requests/minute per IP for data endpoints.
- **AI analysis:** 1 report/5 seconds per IP (resource-intensive).
- **Backtest:** 2 concurrent backtests per IP.

---

## 8. Logging Security

Pino redact configuration:
```typescript
pino({
  redact: ['*.api_key', '*.token', '*.secret', '*.password', 'req.headers.authorization']
})
```

---

## 9. Network Security

- PostgreSQL not exposed outside Docker network in production.
- AI service not exposed outside Docker network in production (backend calls it internally).
- `docker-compose.yml` production profile: only port 3001 (backend) and 5173 (frontend) exposed.

---

## 10. Dependency Checks

Run before deployment:
```bash
pnpm audit --prod           # Node dependencies
pip-audit -r requirements.txt  # Python dependencies
```

---

## 11. Automated Trading Prevention

- No order-routing code exists in the codebase.
- Portfolio is virtual-only; no brokerage connection in MVP.
- Upstox adapter reads market data only; no order API calls.
- CI lint rule: ban import of any order-routing SDK.

---

## 12. Disclaimer Enforcement

Every API response involving model predictions includes:
```json
{ "disclaimer": "This is not financial advice. Predictions are probabilistic estimates for educational purposes only." }
```

Frontend renders this disclaimer prominently on AI analysis and ML prediction pages.
