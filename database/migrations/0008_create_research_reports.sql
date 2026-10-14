-- Migration 0008: Create research_reports table
CREATE TABLE IF NOT EXISTS research_reports (
  id              BIGSERIAL PRIMARY KEY,
  instrument_id   INTEGER REFERENCES instruments(id) ON DELETE SET NULL,
  question        TEXT,
  report_text     TEXT NOT NULL,
  model_name      VARCHAR(64) NOT NULL,       -- gemini-1.5-flash, etc.
  model_version   VARCHAR(32),
  data_context    JSONB,                      -- structured context sent to LLM
  news_sources    JSONB,                      -- retrieved RAG documents
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_reports_instrument ON research_reports(instrument_id, generated_at DESC);
