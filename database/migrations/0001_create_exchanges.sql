-- Migration 0001: Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(16) NOT NULL UNIQUE,   -- e.g. NSE, BSE, NYSE, NASDAQ
  name         VARCHAR(128) NOT NULL,
  country      CHAR(2) NOT NULL,               -- ISO 3166-1 alpha-2
  currency     CHAR(3) NOT NULL,               -- ISO 4217
  timezone     VARCHAR(64) NOT NULL,           -- IANA timezone e.g. Asia/Kolkata
  open_time    TIME NOT NULL,
  close_time   TIME NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
