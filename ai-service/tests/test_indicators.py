import pytest
import numpy as np
import pandas as pd
from app.indicators.calculator import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_atr,
    compute_all_indicators,
)

@pytest.fixture
def sample_ohlcv_data():
    # 30-day realistic test sequence
    np.random.seed(42)
    base_price = 100.0
    prices = [base_price]
    for _ in range(35):
        change = np.random.normal(0.001, 0.02)
        prices.append(prices[-1] * (1 + change))

    prices = np.array(prices)
    highs = prices * (1 + np.abs(np.random.normal(0, 0.008, len(prices))))
    lows = prices * (1 - np.abs(np.random.normal(0, 0.008, len(prices))))
    opens = (highs + lows) / 2
    volumes = np.random.randint(100000, 500000, len(prices))
    dates = pd.date_range("2026-01-01", periods=len(prices), freq="D")

    return pd.DataFrame({
        "ts": dates.strftime("%Y-%m-%d"),
        "open": opens,
        "high": highs,
        "low": lows,
        "close": prices,
        "volume": volumes,
    })

def test_sma_calculation():
    s = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    sma3 = calculate_sma(s, 3)
    assert np.isnan(sma3.iloc[0])
    assert np.isnan(sma3.iloc[1])
    assert pytest.approx(sma3.iloc[2], 0.0001) == 20.0
    assert pytest.approx(sma3.iloc[3], 0.0001) == 30.0
    assert pytest.approx(sma3.iloc[4], 0.0001) == 40.0

def test_ema_calculation():
    s = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    ema3 = calculate_ema(s, 3)
    # EMA with span=3 has alpha = 2/(3+1) = 0.5
    # ema[0] = 10
    # ema[1] = 0.5*20 + 0.5*10 = 15
    # ema[2] = 0.5*30 + 0.5*15 = 22.5
    assert pytest.approx(ema3.iloc[0], 0.001) == 10.0
    assert pytest.approx(ema3.iloc[1], 0.001) == 15.0
    assert pytest.approx(ema3.iloc[2], 0.001) == 22.5

def test_rsi_bounds(sample_ohlcv_data):
    rsi = calculate_rsi(sample_ohlcv_data["close"], 14)
    valid_rsi = rsi.dropna()
    assert len(valid_rsi) > 0
    assert (valid_rsi >= 0.0).all()
    assert (valid_rsi <= 100.0).all()

def test_bollinger_bands_ordering(sample_ohlcv_data):
    bb = calculate_bollinger_bands(sample_ohlcv_data["close"], 20, 2.0)
    valid_idx = bb["upper"].dropna().index
    for idx in valid_idx:
        upper = bb["upper"].loc[idx]
        middle = bb["middle"].loc[idx]
        lower = bb["lower"].loc[idx]
        assert upper >= middle
        assert middle >= lower

def test_macd_relationship(sample_ohlcv_data):
    macd = calculate_macd(sample_ohlcv_data["close"], 12, 26, 9)
    valid_idx = macd["histogram"].dropna().index
    for idx in valid_idx:
        diff = macd["macd_line"].loc[idx] - macd["signal_line"].loc[idx]
        hist = macd["histogram"].loc[idx]
        assert pytest.approx(diff, 0.0001) == hist

def test_compute_all_indicators(sample_ohlcv_data):
    result = compute_all_indicators(sample_ohlcv_data)
    assert "sma" in result
    assert "rsi" in result
    assert "macd" in result
    assert "bollinger_bands" in result
    assert "atr" in result
    assert "volume_spike" in result
