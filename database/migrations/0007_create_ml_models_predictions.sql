-- Migration 0007: Create ml_models and ml_predictions tables
CREATE TABLE IF NOT EXISTS ml_models (
  id              SERIAL PRIMARY KEY,
  instrument_id   INTEGER REFERENCES instruments(id) ON DELETE SET NULL,  -- NULL = global model
  model_type      VARCHAR(64) NOT NULL,        -- logistic, rf, xgboost, baseline
  version         VARCHAR(32) NOT NULL,
  target_horizon  INTEGER NOT NULL DEFAULT 1,  -- days ahead
  train_from      TIMESTAMPTZ NOT NULL,
  train_to        TIMESTAMPTZ NOT NULL,
  feature_list    TEXT[] NOT NULL,
  hyperparameters JSONB,
  artifact_path   TEXT NOT NULL,               -- path inside Docker volume
  metrics         JSONB NOT NULL,              -- accuracy, f1, auc, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_predictions (
  id            BIGSERIAL PRIMARY KEY,
  model_id      INTEGER NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  predicted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_date   DATE NOT NULL,
  prediction    SMALLINT NOT NULL,            -- 0 (down) or 1 (up)
  probability   NUMERIC(6,4) NOT NULL,        -- P(class=1)
  features_used JSONB
);

CREATE INDEX IF NOT EXISTS idx_predictions_instrument_model
  ON ml_predictions(instrument_id, model_id, target_date DESC);
