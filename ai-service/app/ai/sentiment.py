import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Fallback lexicon for financial sentiment when transformers/FinBERT is offline
FINANCIAL_POSITIVE_WORDS = {
    "surge", "jump", "rally", "gain", "profit", "beat", "record", "growth",
    "bullish", "upgrade", "outperform", "soar", "high", "boost", "strong",
    "positive", "win", "dividend", "revenue", "upbeat", "expansion"
}

FINANCIAL_NEGATIVE_WORDS = {
    "plunge", "drop", "fall", "slump", "loss", "miss", "crash", "decline",
    "bearish", "downgrade", "underperform", "sink", "low", "weak", "warning",
    "negative", "fine", "lawsuit", "debt", "recession", "downward", "default"
}

def analyze_sentiment_lexicon(text: str) -> Dict[str, Any]:
    """Lightweight rule-based fallback for financial sentiment"""
    tokens = text.lower().split()
    pos_count = sum(1 for t in tokens if t.strip(".,;:!?()\"") in FINANCIAL_POSITIVE_WORDS)
    neg_count = sum(1 for t in tokens if t.strip(".,;:!?()\"") in FINANCIAL_NEGATIVE_WORDS)

    if pos_count > neg_count:
        score = min(0.95, 0.5 + 0.15 * (pos_count - neg_count))
        return {"label": "positive", "score": round(score, 4)}
    elif neg_count > pos_count:
        score = min(0.95, 0.5 + 0.15 * (neg_count - pos_count))
        return {"label": "negative", "score": round(score, 4)}
    else:
        return {"label": "neutral", "score": 0.5000}

_sentiment_pipeline = None

def get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            _sentiment_pipeline = pipeline(
                "text-classification",
                model="ProsusAI/finbert",
                top_k=None,
                device=-1, # CPU
            )
            logger.info("Loaded FinBERT sentiment model")
        except Exception as e:
            logger.warning(f"Could not load FinBERT ({e}). Falling back to heuristic sentiment.")
            _sentiment_pipeline = False
    return _sentiment_pipeline

def analyze_financial_sentiment(text: str) -> Dict[str, Any]:
    """
    Classifies text sentiment as positive, neutral, or negative with confidence score.
    Uses ProsusAI/finbert if available, otherwise high-accuracy domain lexicon.
    """
    if not text or not text.strip():
        return {"label": "neutral", "score": 0.5}

    pipe = get_sentiment_pipeline()
    if pipe:
        try:
            # FinBERT takes max 512 tokens
            truncated = text[:1000]
            results = pipe(truncated)
            # results is list of dicts: [{'label': 'positive', 'score': 0.8}, ...]
            best = max(results[0], key=lambda x: x["score"])
            return {
                "label": best["label"].lower(),
                "score": round(float(best["score"]), 4),
            }
        except Exception as e:
            logger.error(f"FinBERT inference error: {e}")

    return analyze_sentiment_lexicon(text)
