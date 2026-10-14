-- Migration 0011: Seed exchanges and initial instruments
INSERT INTO exchanges (code, name, country, currency, timezone, open_time, close_time)
VALUES
  ('NSE', 'National Stock Exchange of India', 'IN', 'INR', 'Asia/Kolkata', '09:15:00', '15:30:00'),
  ('BSE', 'Bombay Stock Exchange', 'IN', 'INR', 'Asia/Kolkata', '09:15:00', '15:30:00'),
  ('NYSE', 'New York Stock Exchange', 'US', 'USD', 'America/New_York', '09:30:00', '16:00:00'),
  ('NASDAQ', 'NASDAQ Stock Market', 'US', 'USD', 'America/New_York', '09:30:00', '16:00:00')
ON CONFLICT (code) DO NOTHING;

-- Seed prominent instruments
INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'RELIANCE.NS', 'Reliance Industries Ltd.', e.id, 'EQUITY', 'INR', TRUE, '{"yfinance_symbol": "RELIANCE.NS"}'::jsonb
FROM exchanges e WHERE e.code = 'NSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'TCS.NS', 'Tata Consultancy Services Ltd.', e.id, 'EQUITY', 'INR', TRUE, '{"yfinance_symbol": "TCS.NS"}'::jsonb
FROM exchanges e WHERE e.code = 'NSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'INFY.NS', 'Infosys Ltd.', e.id, 'EQUITY', 'INR', TRUE, '{"yfinance_symbol": "INFY.NS"}'::jsonb
FROM exchanges e WHERE e.code = 'NSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'HDFCBANK.NS', 'HDFC Bank Ltd.', e.id, 'EQUITY', 'INR', TRUE, '{"yfinance_symbol": "HDFCBANK.NS"}'::jsonb
FROM exchanges e WHERE e.code = 'NSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT '^NSEI', 'NIFTY 50', e.id, 'INDEX', 'INR', TRUE, '{"yfinance_symbol": "^NSEI"}'::jsonb
FROM exchanges e WHERE e.code = 'NSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT '^BSESN', 'S&P BSE SENSEX', e.id, 'INDEX', 'INR', TRUE, '{"yfinance_symbol": "^BSESN"}'::jsonb
FROM exchanges e WHERE e.code = 'BSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'AAPL', 'Apple Inc.', e.id, 'EQUITY', 'USD', TRUE, '{"yfinance_symbol": "AAPL", "finnhub_symbol": "AAPL"}'::jsonb
FROM exchanges e WHERE e.code = 'NASDAQ'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'MSFT', 'Microsoft Corporation', e.id, 'EQUITY', 'USD', TRUE, '{"yfinance_symbol": "MSFT", "finnhub_symbol": "MSFT"}'::jsonb
FROM exchanges e WHERE e.code = 'NASDAQ'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT 'NVDA', 'NVIDIA Corporation', e.id, 'EQUITY', 'USD', TRUE, '{"yfinance_symbol": "NVDA", "finnhub_symbol": "NVDA"}'::jsonb
FROM exchanges e WHERE e.code = 'NASDAQ'
ON CONFLICT (symbol, exchange_id) DO NOTHING;

INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active, provider_meta)
SELECT '^GSPC', 'S&P 500', e.id, 'INDEX', 'USD', TRUE, '{"yfinance_symbol": "^GSPC"}'::jsonb
FROM exchanges e WHERE e.code = 'NYSE'
ON CONFLICT (symbol, exchange_id) DO NOTHING;
