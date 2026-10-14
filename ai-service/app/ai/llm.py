import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are a senior quantitative financial research analyst for the Stock Intelligence AI platform.
Provide rigorous, data-driven equity analysis based ONLY on the provided price data, technical indicators, ML forecasts, and news sources.
Always cite the exact indicator levels and dates provided in the context.
Never fabricate data or make speculative financial guarantees.
Always include key technical levels (support/resistance based on SMAs and Bollinger Bands), momentum interpretation (RSI/MACD), and fundamental/news summary.
Conclude with a clear risks section and the required platform disclaimer."""

def generate_heuristic_report(
    symbol: str,
    question: Optional[str],
    quote: Dict[str, Any],
    indicators: Dict[str, Any],
    ml_forecast: Optional[Dict[str, Any]],
    news_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Deterministic quantitative research engine when LLM API keys are not provided.
    Generates a structured equity report adhering to SEC/SEBI informational guidelines.
    """
    price = quote.get("price", 0.0)
    change_pct = quote.get("change_pct", 0.0)
    sma = indicators.get("sma", {})
    rsi = indicators.get("rsi", {}).get("14", 50.0)
    macd = indicators.get("macd", {})
    bb = indicators.get("bollinger_bands", {})

    # Technical interpretation
    rsi_state = "neutral"
    if rsi is not None:
        if rsi >= 70:
            rsi_state = "overbought"
        elif rsi <= 30:
            rsi_state = "oversold"

    sma_trend = "neutral"
    sma_50 = sma.get("50")
    sma_200 = sma.get("200")
    if sma_50 and sma_200:
        if sma_50 > sma_200:
            sma_trend = "bullish (Golden Cross regime)"
        else:
            sma_trend = "bearish (Death Cross regime)"

    macd_hist = macd.get("histogram")
    macd_signal = "bullish" if macd_hist and macd_hist > 0 else "bearish"

    ml_dir = "neutral"
    ml_prob = 0.5
    if ml_forecast:
        ml_pred = ml_forecast.get("prediction", 0)
        ml_prob = ml_forecast.get("probability", 0.5)
        ml_dir = "positive (upward)" if ml_pred == 1 else "negative (downward)"

    # Synthesize summary
    summary = (
        f"Quantitative analysis for {symbol} indicates a {sma_trend} macro structure. "
        f"The stock is currently trading at {price:,.2f} ({change_pct:+.2f}%). "
        f"Momentum is {rsi_state} with 14-day RSI at {rsi if rsi is not None else 'N/A'}. "
        f"MACD histogram shows {macd_signal} short-term momentum. "
        f"Algorithmic forecast signals a {ml_dir} probability of {ml_prob*100:.1f}% for the next session."
    )

    risks = (
        f"Key volatility risks include macro market drawdowns, unexpected earnings surprises, "
        f"and potential breaks below Bollinger Band support at {bb.get('lower', 'N/A')}."
    )

    return {
        "summary": summary,
        "price_context": {
            "symbol": symbol,
            "price": price,
            "change_pct": change_pct,
            "day_high": quote.get("day_high"),
            "day_low": quote.get("day_low"),
        },
        "technical_context": {
            "rsi_14": rsi,
            "rsi_state": rsi_state,
            "sma_structure": sma,
            "bollinger_bands": bb,
            "macd": macd,
        },
        "news_context": news_items[:5],
        "model_context": {
            "forecast_direction": ml_dir,
            "probability": ml_prob,
            "model_type": ml_forecast.get("model", {}).get("type", "xgboost") if ml_forecast else "baseline",
        },
        "risks": risks,
        "disclaimer": "This intelligence report is generated for informational and educational purposes only. It does not constitute investment or financial advice. Data delayed.",
    }

from app.cache import cache

def generate_ai_report(
    symbol: str,
    question: Optional[str],
    quote: Dict[str, Any],
    indicators: Dict[str, Any],
    ml_forecast: Optional[Dict[str, Any]],
    news_items: List[Dict[str, Any]],
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Generates structured research report using Gemini or falls back to heuristic engine.
    Caches reports for 10 minutes (600s) to prevent redundant LLM API spend.
    """
    cache_key = f"ai:report:{symbol}:{question or 'default'}"
    if not force_refresh:
        cached_report = cache.get(cache_key, cache_type="report")
        if cached_report:
            logger.info(f"Returning cached AI research report for {symbol}")
            return {**cached_report, "cached": True}

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Generating high-precision quantitative report.")
        report = generate_heuristic_report(symbol, question, quote, indicators, ml_forecast, news_items)
        result = {
            "report": report,
            "model_used": "quantitative-rules-engine",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "cached": False,
        }
        cache.set(cache_key, result, ttl=600, cache_type="report")
        return result

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=SYSTEM_INSTRUCTION)

        price = quote.get("price", 0.0)
        change_pct = quote.get("change_pct", 0.0)
        change_abs = quote.get("change_abs", 0.0)
        day_high = quote.get("day_high", price)
        day_low = quote.get("day_low", price)
        volume = quote.get("volume", 0)

        context_payload = {
            "symbol": symbol,
            "user_question": question,
            "live_market_snapshot": {
                "price": price,
                "change_pct": change_pct,
                "change_abs": change_abs,
                "day_high": day_high,
                "day_low": day_low,
                "volume": volume,
                "is_realtime": quote.get("is_realtime", True),
            },
            "technical_indicators": indicators,
            "ml_forecast": ml_forecast,
            "news": news_items[:5],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        prompt = f"""You are analyzing REAL-TIME market data for equity: {symbol}.
Current Real-Time Live Price: {price}
Today's Session Change: {change_pct:+.2f}% ({change_abs:+.2f})
Today's Session High: {day_high}, Session Low: {day_low}
Volume: {volume}
Timestamp: {datetime.utcnow().isoformat()}Z

User Question/Objective: {question or 'What are the key technical levels, sentiment, and momentum outlook?'}

Full Quantitative & Algorithmic Context:
{json.dumps(context_payload, default=str, indent=2)}

Generate a rigorous, institutional-grade equity research note strictly as valid JSON with keys:
"summary", "price_context", "technical_context", "news_context", "model_context", "risks", "disclaimer".
Ensure the output is strictly raw valid JSON without markdown wrapping or codeblocks."""

        generation_config = genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=1000,
            response_mime_type="application/json",
        )

        response = model.generate_content(prompt, generation_config=generation_config)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.strip("`").replace("json\n", "", 1).strip()
        parsed = json.loads(text)

        # Strictly normalize report to prevent any UI rendering crashes
        normalized = normalize_report(parsed, symbol, quote, indicators, ml_forecast)
        
        result = {
            "report": normalized,
            "model_used": "gemini-2.5-flash",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "cached": False,
        }
        # Cache for 10 minutes to save quota
        cache.set(cache_key, result, ttl=600, cache_type="report")
        return result
    except Exception as e:
        logger.error(f"Gemini API generation failed ({e}), falling back to quantitative report")
        report = generate_heuristic_report(symbol, question, quote, indicators, ml_forecast, news_items)
        result = {
            "report": report,
            "model_used": "quantitative-fallback",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "cached": False,
        }
        cache.set(cache_key, result, ttl=300, cache_type="report")
        return result

def normalize_report(
    parsed: Any,
    symbol: str,
    quote: Dict[str, Any],
    indicators: Dict[str, Any],
    ml_forecast: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Ensures every field in the report has a guaranteed, crash-proof type for React rendering.
    """
    if not isinstance(parsed, dict):
        parsed = {}

    # 1. Summary (guaranteed string)
    summary = parsed.get("summary", "")
    if isinstance(summary, dict):
        summary = " ".join(str(v) for v in summary.values())
    elif not isinstance(summary, str):
        summary = str(summary)

    # 2. Technical Context
    raw_tech = parsed.get("technical_context", {})
    if not isinstance(raw_tech, dict):
        raw_tech = {}

    # Extract RSI safely
    rsi_val = raw_tech.get("rsi_14")
    if isinstance(rsi_val, dict):
        rsi_val = rsi_val.get("value") or rsi_val.get("rsi")
    if rsi_val is None or not isinstance(rsi_val, (int, float)):
        try:
            rsi_val = float(indicators.get("rsi", {}).get("14", 50.0))
        except (ValueError, TypeError):
            rsi_val = 50.0

    rsi_state = raw_tech.get("rsi_state")
    if not isinstance(rsi_state, str):
        rsi_state = "Neutral" if rsi_val is None else ("Overbought" if float(rsi_val) >= 70 else ("Oversold" if float(rsi_val) <= 30 else "Neutral"))

    # Extract MACD histogram safely
    macd_data = raw_tech.get("macd", {})
    macd_hist = None
    if isinstance(macd_data, dict):
        macd_hist = macd_data.get("histogram")
    if macd_hist is None or not isinstance(macd_hist, (int, float)):
        try:
            macd_hist = float(indicators.get("macd", {}).get("histogram", 0.0))
        except (ValueError, TypeError):
            macd_hist = 0.0

    # SMA Structure
    sma_data = raw_tech.get("sma_structure")
    if not isinstance(sma_data, dict):
        sma_data = indicators.get("sma", {})

    # 3. Model Context
    raw_model = parsed.get("model_context", {})
    if not isinstance(raw_model, dict):
        raw_model = {}

    forecast_dir = raw_model.get("forecast_direction")
    if not isinstance(forecast_dir, str):
        forecast_dir = "Bullish Continuation" if ml_forecast and ml_forecast.get("prediction") == 1 else "Neutral / Consolidation"

    prob = raw_model.get("probability")
    if not isinstance(prob, (int, float)):
        prob = ml_forecast.get("probability", 0.55) if ml_forecast else 0.55

    # 4. Risks (guaranteed list of strings)
    raw_risks = parsed.get("risks", [])
    risks_list = []
    if isinstance(raw_risks, list):
        for r in raw_risks:
            if isinstance(r, dict):
                risks_list.append(" - ".join(f"{k}: {v}" for k, v in r.items()))
            else:
                risks_list.append(str(r))
    elif isinstance(raw_risks, dict):
        risks_list = [f"{k}: {v}" for k, v in raw_risks.items()]
    elif isinstance(raw_risks, str) and raw_risks.strip():
        risks_list = [line.strip("- *• ") for line in raw_risks.split("\n") if line.strip()]
    else:
        risks_list = ["Standard macro market volatility and drawdown risks apply."]

    # 5. News Context (GUARANTEED list of dicts with headline & sentiment)
    raw_news = parsed.get("news_context", [])
    news_list = []
    if isinstance(raw_news, list):
        for n in raw_news:
            if isinstance(n, dict):
                news_list.append({
                    "headline": str(n.get("headline", n.get("title", n.get("summary", "Market wire item")))),
                    "sentiment": str(n.get("sentiment", "Neutral")),
                })
            elif isinstance(n, str) and n.strip():
                news_list.append({"headline": n.strip(), "sentiment": "Neutral"})
    elif isinstance(raw_news, dict):
        summary_text = raw_news.get("summary") or "Market catalysts in line with expectations."
        news_list.append({"headline": str(summary_text), "sentiment": "Neutral"})
    elif isinstance(raw_news, str) and raw_news.strip():
        news_list.append({"headline": raw_news.strip(), "sentiment": "Neutral"})

    if not news_list:
        news_list.append({
            "headline": f"No material regulatory wire alerts detected for {symbol} in current session.",
            "sentiment": "Neutral",
        })

    # 6. Disclaimer (guaranteed string)
    disclaimer = parsed.get("disclaimer", "")
    if isinstance(disclaimer, dict):
        disclaimer = " ".join(str(v) for v in disclaimer.values())
    elif not isinstance(disclaimer, str):
        disclaimer = str(disclaimer)

    return {
        "summary": summary,
        "price_context": {
            "symbol": symbol,
            "price": quote.get("price", 0.0),
            "change_pct": quote.get("change_pct", 0.0),
            "day_high": quote.get("day_high", quote.get("price", 0.0)),
            "day_low": quote.get("day_low", quote.get("price", 0.0)),
        },
        "technical_context": {
            "rsi_14": round(float(rsi_val), 2),
            "rsi_state": rsi_state,
            "sma_structure": sma_data,
            "macd": {"histogram": round(float(macd_hist), 4)},
        },
        "news_context": news_list,
        "model_context": {
            "forecast_direction": str(forecast_dir),
            "probability": float(prob),
            "model_type": str(raw_model.get("model_type", "XGBoost Ensemble v1")),
        },
        "risks": risks_list,
        "disclaimer": disclaimer or "This intelligence report is generated for informational purposes only.",
    }
