import numpy as np
import pandas as pd
from typing import Tuple, List
from app.indicators.calculator import (
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_atr,
    calculate_sma,
)

from app.cache import cache

FEATURE_COLUMNS = [
    "rsi_14",
    "macd_hist",
    "bb_position",
    "return_1d",
    "return_5d",
    "return_10p",
    "return_21d",
    "micro_accel_10",
    "macro_range_pos",
    "vol_ratio",
    "atr_pct",
    "above_sma_50",
    "above_sma_200",
    "sma_trend_slope",
    "volatility_squeeze",
    "pattern_hammer",
    "pattern_shooting_star",
    "pattern_bullish_engulfing",
    "pattern_bearish_engulfing",
    "day_of_week",
]

def engineer_features(df: pd.DataFrame, target_horizon: int = 1) -> pd.DataFrame:
    """
    Computes anti-leakage features for time-series forecasting and pattern recognition.
    Input df must contain: ['ts', 'open', 'high', 'low', 'close', 'volume']
    sorted chronologically (ascending).
    Caches computed graph feature vectors so the model can train and adapt easily.
    """
    df = df.copy().sort_values("ts").reset_index(drop=True)
    if len(df) == 0:
        return pd.DataFrame()

    # 0. Check cached graph feature vectors
    first_ts = str(df["ts"].iloc[0])
    last_ts = str(df["ts"].iloc[-1])
    last_close = float(df["close"].iloc[-1])
    vec_cache_key = f"feat_vec:{len(df)}:{first_ts}:{last_ts}:{last_close:.2f}:{target_horizon}"
    cached_vectors = cache.get(vec_cache_key, cache_type="medium")
    if cached_vectors is not None:
        return cached_vectors.copy()

    close = df["close"].astype(float)
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    open_p = df["open"].astype(float) if "open" in df.columns else close
    volume = df["volume"].astype(float)

    # 1. Technical Indicators
    rsi_14 = calculate_rsi(close, 14)
    macd = calculate_macd(close, 12, 26, 9)
    bb = calculate_bollinger_bands(close, 20, 2.0)
    atr = calculate_atr(high, low, close, 14)
    sma_20 = calculate_sma(close, 20)
    sma_50 = calculate_sma(close, 50)
    sma_200 = calculate_sma(close, 200)
    vol_sma_20 = calculate_sma(volume, 20)

    # 2. Features construction (strictly no lookahead)
    features_df = pd.DataFrame(index=df.index)
    features_df["ts"] = df["ts"]
    features_df["close"] = close
    features_df["rsi_14"] = rsi_14
    features_df["macd_hist"] = macd["histogram"]
    
    # BB position: (close - lower) / (upper - lower)
    bb_range = bb["upper"] - bb["lower"]
    features_df["bb_position"] = ((close - bb["lower"]) / bb_range.replace(0, np.nan)).fillna(0.5)
    
    # Returns (Multi-horizon: 1-period, 5-period, 10-period micro, 21-period macro)
    features_df["return_1d"] = np.log(close / close.shift(1)).fillna(0.0)
    features_df["return_5d"] = np.log(close / close.shift(5)).fillna(0.0)
    features_df["return_10p"] = np.log(close / close.shift(10)).fillna(0.0)
    features_df["return_21d"] = np.log(close / close.shift(21)).fillna(0.0)

    # Micro acceleration: change in 10-period velocity over last 3 periods (market inflection detection)
    features_df["micro_accel_10"] = (features_df["return_10p"] - features_df["return_10p"].shift(3)).fillna(0.0)

    # Macro range position: where price is relative to the 30-period rolling high-low channel
    rolling_high_30 = high.rolling(30, min_periods=5).max()
    rolling_low_30 = low.rolling(30, min_periods=5).min()
    range_30 = rolling_high_30 - rolling_low_30
    features_df["macro_range_pos"] = ((close - rolling_low_30) / range_30.replace(0, np.nan)).fillna(0.5)

    # Volume ratio (safe neutral 1.0 fallback when volume is 0 or unavailable, e.g. Forex/VIX)
    features_df["vol_ratio"] = (volume / vol_sma_20.replace(0, np.nan)).fillna(1.0)

    # ATR percentage
    features_df["atr_pct"] = (atr / close.replace(0, np.nan)).fillna(0.0)

    # Above moving averages
    features_df["above_sma_50"] = (close > sma_50).astype(int)
    features_df["above_sma_200"] = (close > sma_200).astype(int)

    # SMA trend slope (trend curvature)
    features_df["sma_trend_slope"] = ((sma_20 - sma_20.shift(5)) / close.replace(0, np.nan)).fillna(0.0)

    # Volatility squeeze: BB width relative to ATR (coiling energy before market turn)
    features_df["volatility_squeeze"] = ((bb_range / atr.replace(0, np.nan)) < 3.0).fillna(False).astype(int)

    # Candlestick pattern recognition
    candle_body = (close - open_p).abs()
    candle_range = (high - low).replace(0, np.nan)
    lower_wick = np.minimum(close, open_p) - low
    upper_wick = high - np.maximum(close, open_p)

    # Hammer / Pin-bar: Lower wick >= 2x body, upper wick <= 20% range (bullish rejection of lows)
    features_df["pattern_hammer"] = ((lower_wick >= 2 * candle_body) & (upper_wick <= 0.25 * candle_range)).astype(int)

    # Shooting Star / Inverted Pin-bar: Upper wick >= 2x body, lower wick <= 20% range (bearish rejection of highs)
    features_df["pattern_shooting_star"] = ((upper_wick >= 2 * candle_body) & (lower_wick <= 0.25 * candle_range)).astype(int)

    # Bullish Engulfing: Prior bar red, current bar green, current body fully wraps prior body
    prev_open = open_p.shift(1)
    prev_close = close.shift(1)
    features_df["pattern_bullish_engulfing"] = (
        (prev_close < prev_open) & (close > open_p) & (close >= prev_open) & (open_p <= prev_close)
    ).astype(int)

    # Bearish Engulfing: Prior bar green, current bar red, current body fully wraps prior body
    features_df["pattern_bearish_engulfing"] = (
        (prev_close > prev_open) & (close < open_p) & (open_p >= prev_close) & (close <= prev_open)
    ).astype(int)

    # Day of week
    if pd.api.types.is_datetime64_any_dtype(df["ts"]):
        features_df["day_of_week"] = df["ts"].dt.dayofweek
    else:
        clean_ts = df["ts"].astype(str).str.replace(r"Z+$", "", regex=True)
        features_df["day_of_week"] = pd.to_datetime(clean_ts, utc=True).dt.dayofweek

    # 3. Target: 1 if close[t + horizon] > close[t], else 0
    # Shift backwards so target is aligned with row t
    future_close = close.shift(-target_horizon)
    features_df["target"] = (future_close > close).astype(float)
    # The last `target_horizon` rows have NaN future_close
    features_df.loc[features_df.index[-target_horizon:], "target"] = np.nan

    # Cache graph feature vectors for fast model training and incremental evaluation
    cache.set(vec_cache_key, features_df, ttl=300, cache_type="medium")
    return features_df

def prepare_train_test_data(
    features_df: pd.DataFrame, train_ratio: float = 0.8
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    """
    Chronological train/test split (NEVER random shuffle).
    Fills stray feature NaNs and drops rows with NaN target.
    """
    df_copy = features_df.copy()
    # Gracefully fill any initial indicator lookback NaNs without lookahead
    df_copy[FEATURE_COLUMNS] = df_copy[FEATURE_COLUMNS].ffill().bfill().fillna(0.0)
    clean_df = df_copy.dropna(subset=["target"]).copy()
    n = len(clean_df)
    train_size = int(n * train_ratio)

    train_data = clean_df.iloc[:train_size]
    test_data = clean_df.iloc[train_size:]

    X_train = train_data[FEATURE_COLUMNS]
    y_train = train_data["target"].astype(int)
    X_test = test_data[FEATURE_COLUMNS]
    y_test = test_data["target"].astype(int)

    return X_train, y_train, X_test, y_test
