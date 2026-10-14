-- Migration 0006: Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id              BIGSERIAL PRIMARY KEY,
  source_provider VARCHAR(32) NOT NULL,        -- finnhub, rss, etc.
  external_id     VARCHAR(256),               -- provider article ID
  headline        TEXT NOT NULL,
  summary         TEXT,
  url             TEXT,
  image_url       TEXT,
  published_at    TIMESTAMPTZ NOT NULL,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_symbols TEXT[],                      -- array of symbols
  sentiment_label VARCHAR(16),                 -- positive, neutral, negative
  sentiment_score NUMERIC(5,4),               -- FinBERT confidence
  embedding_id    INTEGER,                     -- reference to FAISS index
  is_indexed      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (source_provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_symbols ON news_articles USING GIN(related_symbols);
