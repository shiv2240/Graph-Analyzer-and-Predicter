import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

def calculate_sma(series: pd.Series, period: int) -> pd.Series:
    """Simple Moving Average"""
    return series.rolling(window=period, min_periods=period).mean()

def calculate_ema(series: pd.Series, period: int) -> pd.Series:
    """Exponential Moving Average using span"""
    return series.ewm(span=period, adjust=False).mean()

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """
    Wilder's Relative Strength Index (RSI).
    Formula:
      delta = price[t] - price[t-1]
      gain = delta if delta > 0 else 0
      loss = -delta if delta < 0 else 0
      avg_gain = ewm(gain, alpha=1/period)
      avg_loss = ewm(loss, alpha=1/period)
      rs = avg_gain / avg_loss
      rsi = 100 - (100 / (1 + rs))
    """
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    # Wilder's smoothing corresponds to alpha = 1 / period
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    # Where loss is 0 and gain > 0, rsi is 100
    rsi = rsi.fillna(100.0)
    return rsi

def calculate_macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> Dict[str, pd.Series]:
    """Moving Average Convergence Divergence (MACD)"""
    ema_fast = calculate_ema(series, fast)
    ema_slow = calculate_ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = calculate_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return {
        "macd_line": macd_line,
        "signal_line": signal_line,
        "histogram": histogram,
    }

def calculate_bollinger_bands(
    series: pd.Series, period: int = 20, num_std: float = 2.0
) -> Dict[str, pd.Series]:
    """Bollinger Bands (Upper, Middle, Lower)"""
    middle = series.rolling(window=period, min_periods=period).mean()
    std = series.rolling(window=period, min_periods=period).std()
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)
    return {
        "upper": upper,
        "middle": middle,
        "lower": lower,
    }

def calculate_atr(
    high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
) -> pd.Series:
    """
    Wilder's Average True Range (ATR).
    TR = max(high - low, abs(high - close_prev), abs(low - close_prev))
    """
    close_prev = close.shift(1)
    tr1 = high - low
    tr2 = (high - close_prev).abs()
    tr3 = (low - close_prev).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    return atr

def calculate_realized_volatility(close: pd.Series, window: int = 21) -> pd.Series:
    """Annualized realized volatility based on log returns"""
    log_returns = np.log(close / close.shift(1))
    rolling_std = log_returns.rolling(window=window, min_periods=window).std()
    return rolling_std * np.sqrt(252)

def calculate_max_drawdown(close: pd.Series, window: int = 252) -> pd.Series:
    """Rolling maximum drawdown over specified lookback window"""
    rolling_max = close.rolling(window=window, min_periods=1).max()
    drawdown = (close - rolling_max) / rolling_max
    return drawdown.rolling(window=window, min_periods=1).min()

def compute_all_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes all standard indicators from OHLCV dataframe.
    Expected columns: ['open', 'high', 'low', 'close', 'volume'] with 'ts' index or column.
    """
    if len(df) == 0:
        return {}

    close = df["close"].astype(float)
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    volume = df["volume"].astype(float)

    # 1. Moving Averages
    sma_20 = calculate_sma(close, 20)
    sma_50 = calculate_sma(close, 50)
    sma_200 = calculate_sma(close, 200)
    ema_12 = calculate_ema(close, 12)
    ema_26 = calculate_ema(close, 26)

    # 2. RSI
    rsi_14 = calculate_rsi(close, 14)

    # 3. MACD
    macd = calculate_macd(close, 12, 26, 9)

    # 4. Bollinger Bands
    bb = calculate_bollinger_bands(close, 20, 2.0)

    # 5. ATR
    atr_14 = calculate_atr(high, low, close, 14)

    # 6. Volatility & Drawdown
    vol_21 = calculate_realized_volatility(close, 21)
    max_dd = calculate_max_drawdown(close, min(252, len(close)))

    # 7. Volume SMA
    vol_sma_20 = calculate_sma(volume, 20)

    # Latest values
    def get_latest(s: pd.Series) -> Optional[float]:
        val = s.iloc[-1]
        if pd.isna(val) or np.isinf(val):
            return None
        return round(float(val), 4)

    latest_vol = volume.iloc[-1] if len(volume) > 0 else 0
    latest_vol_sma = vol_sma_20.iloc[-1] if len(vol_sma_20) > 0 else 0
    is_vol_spike = bool(
        latest_vol > (1.5 * latest_vol_sma)
    ) if (not pd.isna(latest_vol_sma) and latest_vol_sma > 0) else False

    return {
        "sma": {
            "20": get_latest(sma_20),
            "50": get_latest(sma_50),
            "200": get_latest(sma_200),
        },
        "ema": {
            "12": get_latest(ema_12),
            "26": get_latest(ema_26),
        },
        "rsi": {
            "14": get_latest(rsi_14),
        },
        "macd": {
            "line": get_latest(macd["macd_line"]),
            "signal": get_latest(macd["signal_line"]),
            "histogram": get_latest(macd["histogram"]),
        },
        "bollinger_bands": {
            "upper": get_latest(bb["upper"]),
            "middle": get_latest(bb["middle"]),
            "lower": get_latest(bb["lower"]),
        },
        "atr": {
            "14": get_latest(atr_14),
        },
        "volatility_21d": get_latest(vol_21),
        "max_drawdown": get_latest(max_dd),
        "volume_sma_20": int(latest_vol_sma) if not pd.isna(latest_vol_sma) else None,
        "volume_spike": is_vol_spike,
    }

def compute_indicator_series(df: pd.DataFrame, requested: List[str]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Returns time series of requested indicators for charting.
    Supported indicator names: sma_20, sma_50, sma_200, ema_12, ema_26, rsi_14, macd, bb
    """
    results: Dict[str, List[Dict[str, Any]]] = {}
    if len(df) == 0:
        return results

    close = df["close"].astype(float)
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    timestamps = df["ts"].astype(str).tolist()

    def series_to_points(s: pd.Series) -> List[Dict[str, Any]]:
        points = []
        for ts, val in zip(timestamps, s):
            if not pd.isna(val) and not np.isinf(val):
                points.append({"ts": ts, "value": round(float(val), 4)})
        return points

    for req in requested:
        req = req.strip().lower()
        if req == "sma_20":
            results["sma_20"] = series_to_points(calculate_sma(close, 20))
        elif req == "sma_50":
            results["sma_50"] = series_to_points(calculate_sma(close, 50))
        elif req == "sma_200":
            results["sma_200"] = series_to_points(calculate_sma(close, 200))
        elif req == "ema_12":
            results["ema_12"] = series_to_points(calculate_ema(close, 12))
        elif req == "ema_26":
            results["ema_26"] = series_to_points(calculate_ema(close, 26))
        elif req == "rsi_14":
            results["rsi_14"] = series_to_points(calculate_rsi(close, 14))
        elif req == "macd":
            macd = calculate_macd(close, 12, 26, 9)
            results["macd_line"] = series_to_points(macd["macd_line"])
            results["macd_signal"] = series_to_points(macd["signal_line"])
            results["macd_histogram"] = series_to_points(macd["histogram"])
        elif req == "bb":
            bb = calculate_bollinger_bands(close, 20, 2.0)
            results["bb_upper"] = series_to_points(bb["upper"])
            results["bb_middle"] = series_to_points(bb["middle"])
            results["bb_lower"] = series_to_points(bb["lower"])

    return results
