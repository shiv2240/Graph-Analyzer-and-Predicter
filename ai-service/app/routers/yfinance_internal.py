import logging
from typing import Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import yfinance as yf
from fastapi import APIRouter, Query, HTTPException
from app.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/internal/yfinance", tags=["yfinance"])

# Map common index / symbol names to yfinance tickers
SYMBOL_ALIASES = {
    "NIFTY": "^NSEI",
    "NIFTY50": "^NSEI",
    "BANKNIFTY": "^NSEBANK",
    "SENSEX": "^BSESN",
    "SPX": "^GSPC",
    "SP500": "^GSPC",
    "NASDAQ": "^IXIC",
    "DOW": "^DJI",
    "VIX": "^VIX",
    "GOLD": "GC=F",
    "GOLD/USA": "GC=F",
    "GOLDVSUSA": "GC=F",
    "GOLD-USA": "GC=F",
    "GOLD-USD": "GC=F",
    "GOLD/USD": "GC=F",
    "XAUUSD": "GC=F",
    "SILVER": "SI=F",
    "SILVER/USA": "SI=F",
    "SILVERVSUSA": "SI=F",
    "OIL": "CL=F",
    "CRUDE": "CL=F",
    "CRUDEOIL": "CL=F",
    "BRENT": "BZ=F",
    "NATGAS": "NG=F",
    "COPPER": "HG=F",
    "BITVSUSA": "BTC-USD",
    "BIT-USA": "BTC-USD",
    "BIT/USA": "BTC-USD",
    "BITCOIN": "BTC-USD",
    "BTC": "BTC-USD",
    "BTCUSD": "BTC-USD",
    "BTC/USD": "BTC-USD",
    "ETH": "ETH-USD",
    "ETHEREUM": "ETH-USD",
    "ETHUSD": "ETH-USD",
    "ETH/USD": "ETH-USD",
    "SOL": "SOL-USD",
    "SOLANA": "SOL-USD",
}

def resolve_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    return SYMBOL_ALIASES.get(cleaned, cleaned)

@router.get("/supported")
def is_supported(symbol: str = Query(...)):
    ticker_sym = resolve_symbol(symbol)
    try:
        t = yf.Ticker(ticker_sym)
        hist = t.history(period="5d")
        return {"supported": len(hist) > 0}
    except Exception:
        return {"supported": False}

@router.get("/search")
def search(q: str = Query(...), exchange: Optional[str] = Query(None)):
    query = q.strip().upper()
    results = []

    # Known common instruments index for fast, comprehensive search
    KNOWN_STOCKS = [
        # 🇮🇳 Indian Bluechips
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "ITC.NS", "name": "ITC Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "LT.NS", "name": "Larsen & Toubro Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Limited", "exchange": "NSE", "instrument_type": "EQUITY", "currency": "INR"},
        {"symbol": "GOLDBEES.NS", "name": "Nippon India ETF Gold BeES", "exchange": "NSE", "instrument_type": "COMMODITY_ETF", "currency": "INR"},
        {"symbol": "SILVERBEES.NS", "name": "Nippon India ETF Silver BeES", "exchange": "NSE", "instrument_type": "COMMODITY_ETF", "currency": "INR"},
        {"symbol": "^NSEI", "name": "NIFTY 50", "exchange": "NSE", "instrument_type": "INDEX", "currency": "INR"},
        {"symbol": "^NSEBANK", "name": "NIFTY Bank", "exchange": "NSE", "instrument_type": "INDEX", "currency": "INR"},
        {"symbol": "^BSESN", "name": "S&P BSE SENSEX", "exchange": "BSE", "instrument_type": "INDEX", "currency": "INR"},

        # 🪙 Commodities & Precious Metals
        {"symbol": "GC=F", "name": "Gold Futures (COMEX / USA)", "exchange": "COMEX", "instrument_type": "COMMODITY", "currency": "USD"},
        {"symbol": "GLD", "name": "SPDR Gold Shares ETF (USA)", "exchange": "NYSE", "instrument_type": "COMMODITY_ETF", "currency": "USD"},
        {"symbol": "IAU", "name": "iShares Gold Trust", "exchange": "NYSE", "instrument_type": "COMMODITY_ETF", "currency": "USD"},
        {"symbol": "GOLD", "name": "Barrick Gold Corporation", "exchange": "NYSE", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "SI=F", "name": "Silver Futures (COMEX / USA)", "exchange": "COMEX", "instrument_type": "COMMODITY", "currency": "USD"},
        {"symbol": "SLV", "name": "iShares Silver Trust ETF", "exchange": "NYSE", "instrument_type": "COMMODITY_ETF", "currency": "USD"},
        {"symbol": "CL=F", "name": "Crude Oil WTI Futures (NYMEX)", "exchange": "NYMEX", "instrument_type": "COMMODITY", "currency": "USD"},
        {"symbol": "BZ=F", "name": "Brent Crude Oil Futures (ICE)", "exchange": "ICE", "instrument_type": "COMMODITY", "currency": "USD"},
        {"symbol": "NG=F", "name": "Natural Gas Futures", "exchange": "NYMEX", "instrument_type": "COMMODITY", "currency": "USD"},

        # 🇺🇸 US Tech Giants & International Bluechips
        {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "GOOGL", "name": "Alphabet Inc. (Google)", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "META", "name": "Meta Platforms Inc. (Facebook)", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "AMD", "name": "Advanced Micro Devices, Inc.", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "NFLX", "name": "Netflix, Inc.", "exchange": "NASDAQ", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "PLTR", "name": "Palantir Technologies Inc.", "exchange": "NYSE", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway Inc.", "exchange": "NYSE", "instrument_type": "EQUITY", "currency": "USD"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "exchange": "NYSE", "instrument_type": "EQUITY", "currency": "USD"},

        # 📈 Global Benchmark Indices & ETFs
        {"symbol": "^GSPC", "name": "S&P 500 Index (USA)", "exchange": "NYSE", "instrument_type": "INDEX", "currency": "USD"},
        {"symbol": "^IXIC", "name": "NASDAQ Composite Index", "exchange": "NASDAQ", "instrument_type": "INDEX", "currency": "USD"},
        {"symbol": "^DJI", "name": "Dow Jones Industrial Average", "exchange": "NYSE", "instrument_type": "INDEX", "currency": "USD"},
        {"symbol": "^VIX", "name": "CBOE Volatility Index", "exchange": "CBOE", "instrument_type": "INDEX", "currency": "USD"},
        {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "exchange": "NYSE", "instrument_type": "ETF", "currency": "USD"},
        {"symbol": "QQQ", "name": "Invesco QQQ Trust (NASDAQ 100)", "exchange": "NASDAQ", "instrument_type": "ETF", "currency": "USD"},

        # ⚡ Cryptocurrencies & Forex (Bit vs USA, Gold vs USA, etc.)
        {"symbol": "BTC-USD", "name": "Bitcoin USD (Bit vs USA)", "exchange": "CRYPTO", "instrument_type": "CRYPTOCURRENCY", "currency": "USD"},
        {"symbol": "ETH-USD", "name": "Ethereum USD", "exchange": "CRYPTO", "instrument_type": "CRYPTOCURRENCY", "currency": "USD"},
        {"symbol": "SOL-USD", "name": "Solana USD", "exchange": "CRYPTO", "instrument_type": "CRYPTOCURRENCY", "currency": "USD"},
        {"symbol": "EURUSD=X", "name": "EUR / USD Forex", "exchange": "FOREX", "instrument_type": "CURRENCY", "currency": "USD"},
        {"symbol": "USDINR=X", "name": "USD / INR Forex", "exchange": "FOREX", "instrument_type": "CURRENCY", "currency": "INR"},
    ]

    # 1. Direct Alias Match
    resolved_alias = SYMBOL_ALIASES.get(query)
    if resolved_alias:
        for item in KNOWN_STOCKS:
            if item["symbol"].upper() == resolved_alias.upper() and item not in results:
                results.append(item)

    # 2. Tokenized search across KNOWN_STOCKS
    import re
    query_tokens = [t for t in re.split(r'[\s/,-]+', query) if t]

    for item in KNOWN_STOCKS:
        if exchange and item["exchange"] != exchange:
            continue
        if item in results:
            continue
        target_text = f"{item['symbol']} {item['name']} {item['exchange']}".upper()
        # Direct substring
        if query in target_text:
            results.append(item)
        # All tokens present
        elif query_tokens and all(tok in target_text for tok in query_tokens):
            results.append(item)

    # 3. If nothing matched in static list, query yfinance ticker directly
    if not results and len(query) >= 2:
        try:
            target_query = resolved_alias if resolved_alias else query
            t = yf.Ticker(target_query)
            info = t.info
            if info and ("shortName" in info or "regularMarketPrice" in info):
                curr = info.get("currency", "USD")
                exch = "NSE" if target_query.endswith(".NS") else ("BSE" if target_query.endswith(".BO") else "US")
                results.append({
                    "symbol": target_query,
                    "name": info.get("shortName", target_query),
                    "exchange": exch,
                    "instrument_type": "EQUITY",
                    "currency": curr,
                })
        except Exception as e:
            logger.debug(f"yfinance dynamic search failed for {query}: {e}")

    return {"results": results, "count": len(results)}

@router.get("/candles")
def get_candles(
    symbol: str = Query(...),
    interval: str = Query("1d"),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    ticker_sym = resolve_symbol(symbol)
    try:
        t = yf.Ticker(ticker_sym)

        # Map interval
        yf_interval = interval
        if interval == "1w":
            yf_interval = "1wk"

        # Cache key
        cache_key = f"yf:candles:{symbol}:{interval}:{from_date}:{to_date}"
        cached_result = cache.get(cache_key, cache_type="medium")
        if cached_result:
            return cached_result

        # Intraday limits for Yahoo Finance:
        # 1m: max 7 days, default period="2d"
        # 5m: max 60 days, default period="5d"
        # 15m, 30m: max 60 days, default period="30d"
        # 1h: max 730 days, default period="90d"
        now = datetime.utcnow()
        if interval == "1y":
            hist = t.history(period="1y", interval="1d")
        elif interval == "5y":
            hist = t.history(period="5y", interval="1wk")
        elif interval in ["all", "max"]:
            hist = t.history(period="max", interval="1mo")
        elif yf_interval == "1m":
            hist = t.history(period="2d", interval="1m")
        elif yf_interval == "5m":
            hist = t.history(period="5d", interval="5m")
        elif yf_interval in ["15m", "30m"]:
            hist = t.history(period="30d", interval=yf_interval)
        elif yf_interval in ["60m", "1h"]:
            hist = t.history(period="90d", interval="1h")
        else:
            start_dt = from_date
            end_dt = to_date
            if start_dt and "T" in start_dt:
                start_dt = start_dt.split("T")[0]
            if end_dt and "T" in end_dt:
                end_dt = end_dt.split("T")[0]
            if not start_dt:
                start_dt = (now - timedelta(days=365)).strftime("%Y-%m-%d")
            hist = t.history(start=start_dt, end=end_dt, interval=yf_interval)

        if hist.empty:
            empty_res = {"candles": [], "symbol": symbol, "interval": interval}
            return empty_res

        candles = []
        for index, row in hist.iterrows():
            try:
                if hasattr(index, "tz_convert"):
                    ts_iso = index.tz_convert("UTC").strftime("%Y-%m-%dT%H:%M:%SZ")
                elif hasattr(index, "tz_localize"):
                    ts_iso = index.tz_localize("UTC").strftime("%Y-%m-%dT%H:%M:%SZ")
                else:
                    ts_iso = pd.to_datetime(index, utc=True).strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                ts_iso = str(index).replace("+00:00", "Z")

            candles.append({
                "ts": ts_iso,
                "open": round(float(row["Open"]), 4),
                "high": round(float(row["High"]), 4),
                "low": round(float(row["Low"]), 4),
                "close": round(float(row["Close"]), 4),
                "volume": int(row["Volume"]),
                "adj_close": round(float(row.get("Adj Close", row["Close"])), 4),
            })

        result = {
            "symbol": symbol,
            "interval": interval,
            "candles": candles,
            "count": len(candles),
        }
        cache.set(cache_key, result, ttl=180, cache_type="medium")
        return result
    except Exception as e:
        logger.error(f"Error fetching candles for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def safe_float(val, default=0.0) -> float:
    if val is None or pd.isna(val) or np.isinf(val):
        return default
    return float(val)

def safe_int(val, default=0) -> int:
    if val is None or pd.isna(val) or np.isinf(val):
        return default
    return int(val)

@router.get("/quote")
def get_quote(symbol: str = Query(...)):
    cache_key = f"yf:quote:{symbol}"
    cached_quote = cache.get(cache_key, cache_type="quote")
    if cached_quote:
        return {**cached_quote, "cached": True}

    ticker_sym = resolve_symbol(symbol)
    try:
        t = yf.Ticker(ticker_sym)
        
        # 1. Primary: Try fast_info for sub-second real-time market data
        price = None
        prev_close = None
        day_high = None
        day_low = None
        volume = 0

        try:
            fast = getattr(t, "fast_info", None)
            if fast:
                price = safe_float(fast.get("last_price"))
                prev_close = safe_float(fast.get("previous_close"), price)
                day_high = safe_float(fast.get("day_high"), price)
                day_low = safe_float(fast.get("day_low"), price)
                volume = safe_int(fast.get("last_volume"), 0)
        except Exception as fe:
            logger.debug(f"fast_info unavailable for {symbol} ({fe}), falling back to history")

        # 2. Fallback to 5-day history if fast_info was empty
        if not price or price <= 0:
            hist = t.history(period="5d")
            if hist.empty:
                raise HTTPException(status_code=404, detail="INSTRUMENT_NOT_SUPPORTED")

            hist = hist.dropna(subset=["Close"])
            if hist.empty:
                raise HTTPException(status_code=404, detail="INSTRUMENT_NOT_SUPPORTED")

            latest = hist.iloc[-1]
            prev = hist.iloc[-2] if len(hist) > 1 else latest

            price = safe_float(latest["Close"])
            prev_close = safe_float(prev["Close"], price)
            day_high = safe_float(latest.get("High"), price)
            day_low = safe_float(latest.get("Low"), price)
            volume = safe_int(latest.get("Volume"), 0)

        change_abs = price - prev_close
        change_pct = (change_abs / prev_close) * 100 if prev_close != 0 else 0.0

        quote_data = {
            "symbol": symbol,
            "price": round(price, 4),
            "change_abs": round(change_abs, 4),
            "change_pct": round(change_pct, 4),
            "volume": volume,
            "day_high": round(day_high, 4),
            "day_low": round(day_low, 4),
            "prev_close": round(prev_close, 4),
            "is_realtime": True,
            "last_refreshed": datetime.utcnow().isoformat() + "Z",
        }

        # Cache for 30s to keep real-time freshness while preventing redundant API queries
        cache.set(cache_key, quote_data, ttl=30, cache_type="quote")
        return {**quote_data, "cached": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fundamentals")
def get_fundamentals(symbol: str = Query(...)):
    cache_key = f"yf:fundamentals:{symbol}"
    cached_fund = cache.get(cache_key, cache_type="medium")
    if cached_fund:
        return cached_fund

    ticker_sym = resolve_symbol(symbol)
    try:
        t = yf.Ticker(ticker_sym)
        info = t.info or {}
        result = {
            "symbol": symbol,
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "market_cap": info.get("marketCap"),
            "dividend_yield": info.get("dividendYield"),
            "eps": info.get("trailingEps"),
            "beta": info.get("beta"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }
        cache.set(cache_key, result, ttl=3600, cache_type="medium")
        return result
    except Exception as e:
        logger.error(f"Error fetching fundamentals for {symbol}: {e}")
        return {"symbol": symbol}
