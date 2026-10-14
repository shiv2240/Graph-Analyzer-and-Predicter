import logging
from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.ml.features import engineer_features, prepare_train_test_data, FEATURE_COLUMNS
from app.ml.models import (
    train_model,
    walk_forward_validation,
    save_model_artifacts,
    load_model_artifacts,
)
from app.config import settings

from app.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ml", tags=["ml"])

class CandleBarModel(BaseModel):
    ts: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    adj_close: Optional[float] = None

class TrainRequest(BaseModel):
    symbol: str
    model_type: str = "xgboost"
    target_horizon: int = 1
    candles: List[CandleBarModel]

class PredictRequest(BaseModel):
    symbol: str
    model_type: str = "xgboost"
    candles: List[CandleBarModel]

class WalkForwardRequest(BaseModel):
    symbol: str
    model_type: str = "rf"
    candles: List[CandleBarModel]
    window_size: int = 252
    step_size: int = 63

@router.post("/train")
def train(req: TrainRequest):
    if len(req.candles) < 60:
        raise HTTPException(
            status_code=400,
            detail=f"At least 60 candles required for training, received {len(req.candles)}",
        )

    df = pd.DataFrame([c.model_dump() for c in req.candles])
    features_df = engineer_features(df, target_horizon=req.target_horizon)
    X_train, y_train, X_test, y_test = prepare_train_test_data(features_df, train_ratio=0.8)

    if len(X_train) < 20 or len(X_test) < 5:
        raise HTTPException(status_code=400, detail="Insufficient clean samples after feature engineering")

    clf, scaler, metrics = train_model(
        req.model_type, X_train, y_train, X_test, y_test
    )

    artifact_path = save_model_artifacts(
        req.symbol, req.model_type, clf, scaler, model_dir=settings.MODEL_DIR
    )

    return {
        "status": "success",
        "symbol": req.symbol,
        "model_type": req.model_type,
        "target_horizon": req.target_horizon,
        "metrics": metrics,
        "artifact_path": artifact_path,
        "features": FEATURE_COLUMNS,
    }

@router.post("/predict")
def predict(req: PredictRequest):
    if len(req.candles) < 30:
        raise HTTPException(status_code=400, detail="At least 30 candles required to compute features")

    # Do not cache analysis / predictions: they must recalculate fresh whenever the graph updates
    df = pd.DataFrame([c.model_dump() for c in req.candles])
    features_df = engineer_features(df, target_horizon=1)

    latest_features = features_df[FEATURE_COLUMNS].iloc[[-1]]
    if latest_features.isna().any().any():
        latest_features = latest_features.fillna(0)

    artifacts = load_model_artifacts(req.symbol, req.model_type, model_dir=settings.MODEL_DIR)

    if artifacts:
        clf = artifacts["model"]
        scaler = artifacts["scaler"]
        X_scaled = scaler.transform(latest_features)
        prediction = int(clf.predict(X_scaled)[0])
        prob = float(clf.predict_proba(X_scaled)[0][1])
    else:
        # Check if we have an in-memory trained model
        mem_model_key = f"ml_clf:{req.symbol}:{req.model_type}"
        mem_artifacts = cache.get(mem_model_key, cache_type="general")
        if mem_artifacts:
            clf = mem_artifacts["model"]
            scaler = mem_artifacts["scaler"]
            X_scaled = scaler.transform(latest_features)
            prediction = int(clf.predict(X_scaled)[0])
            prob = float(clf.predict_proba(X_scaled)[0][1])
        else:
            X_train, y_train, X_test, y_test = prepare_train_test_data(features_df, train_ratio=0.8)
            if len(X_train) >= 20:
                clf, scaler, _ = train_model("rf", X_train, y_train, X_test, y_test)
                cache.set(mem_model_key, {"model": clf, "scaler": scaler}, ttl=3600, cache_type="general")
                X_scaled = scaler.transform(latest_features)
                prediction = int(clf.predict(X_scaled)[0])
                prob = float(clf.predict_proba(X_scaled)[0][1])
            else:
                prediction = 1
                prob = 0.52

    target_date = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

    # Extract detected patterns and market turn flags from latest features
    latest_dict = latest_features.iloc[0].to_dict()
    detected_patterns = []
    if latest_dict.get("pattern_hammer", 0) == 1:
        detected_patterns.append("Bullish Hammer / Pin Bar Reversal")
    if latest_dict.get("pattern_shooting_star", 0) == 1:
        detected_patterns.append("Bearish Shooting Star Reversal")
    if latest_dict.get("pattern_bullish_engulfing", 0) == 1:
        detected_patterns.append("Bullish Engulfing Turn")
    if latest_dict.get("pattern_bearish_engulfing", 0) == 1:
        detected_patterns.append("Bearish Engulfing Turn")
    if latest_dict.get("volatility_squeeze", 0) == 1:
        detected_patterns.append("Volatility Squeeze Pre-Breakout")

    result = {
        "symbol": req.symbol,
        "prediction": prediction,
        "probability": round(prob, 4),
        "target_date": target_date,
        "model": {
            "type": req.model_type,
            "version": "v1.0",
        },
        "patterns_detected": detected_patterns,
        "features_used": {
            k: (round(float(v), 4) if not pd.isna(v) else 0.0)
            for k, v in latest_dict.items()
        },
        "disclaimer": "Probabilistic estimate based on historical technical indicators. Not a guarantee.",
    }
    return result

@router.post("/walk-forward")
def walk_forward(req: WalkForwardRequest):
    if len(req.candles) < req.window_size + req.step_size:
        raise HTTPException(
            status_code=400,
            detail=f"At least {req.window_size + req.step_size} candles required for walk-forward validation",
        )

    df = pd.DataFrame([c.model_dump() for c in req.candles])
    features_df = engineer_features(df, target_horizon=1)

    results = walk_forward_validation(
        features_df,
        model_type=req.model_type,
        window_size=req.window_size,
        step_size=req.step_size,
    )

    return results
