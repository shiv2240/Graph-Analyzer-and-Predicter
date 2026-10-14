-- Migration 0010: Create backtest_configs and backtest_results tables
CREATE TABLE IF NOT EXISTS backtest_configs (
  id              SERIAL PRIMARY KEY,
  instrument_id   INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  strategy_name   VARCHAR(64) NOT NULL,
  params          JSONB NOT NULL,             -- strategy-specific params
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  initial_capital NUMERIC(20,6) NOT NULL,
  commission_pct  NUMERIC(6,4) NOT NULL DEFAULT 0.1,
  slippage_pct    NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backtest_results (
  id               SERIAL PRIMARY KEY,
  config_id        INTEGER NOT NULL REFERENCES backtest_configs(id) ON DELETE CASCADE,
  total_return     NUMERIC(10,4),
  cagr             NUMERIC(10,4),
  max_drawdown     NUMERIC(10,4),
  sharpe_ratio     NUMERIC(10,4),
  num_trades       INTEGER,
  win_rate         NUMERIC(6,4),
  equity_curve     JSONB,                      -- [{date, value}]
  benchmark_return NUMERIC(10,4),
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_results_config ON backtest_results(config_id);
