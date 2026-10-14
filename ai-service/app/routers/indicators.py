from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.indicators.calculator import compute_all_indicators, compute_indicator_series

router = APIRouter(prefix="/indicators", tags=["indicators"])

class CandleBarModel(BaseModel):
    ts: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    adj_close: Optional[float] = None

class ComputeRequest(BaseModel):
    symbol: str
    interval: str = "1d"
    candles: List[CandleBarModel]

class SeriesRequest(BaseModel):
    symbol: str
    interval: str = "1d"
    candles: List[CandleBarModel]
    indicators: List[str]

@router.post("/compute")
def compute_indicators(req: ComputeRequest):
    if not req.candles:
        raise HTTPException(status_code=400, detail="Candles array cannot be empty")

    data = [c.model_dump() for c in req.candles]
    df = pd.DataFrame(data)

    results = compute_all_indicators(df)
    last_candle_date = req.candles[-1].ts if req.candles else ""

    return {
        "symbol": req.symbol,
        "interval": req.interval,
        "as_of": last_candle_date,
        "indicators": results,
        "data_quality": {
            "candles_used": len(df),
            "as_of": last_candle_date,
        },
    }

@router.post("/series")
def get_indicator_series(req: SeriesRequest):
    if not req.candles:
        raise HTTPException(status_code=400, detail="Candles array cannot be empty")

    data = [c.model_dump() for c in req.candles]
    df = pd.DataFrame(data)

    series = compute_indicator_series(df, req.indicators)

    return {
        "symbol": req.symbol,
        "series": series,
    }
