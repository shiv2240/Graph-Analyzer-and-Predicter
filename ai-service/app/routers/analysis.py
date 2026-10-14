from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.ai.sentiment import analyze_financial_sentiment
from app.ai.rag import rag_vector_store
from app.ai.llm import generate_ai_report

router = APIRouter(prefix="/analysis", tags=["analysis"])

class SentimentRequest(BaseModel):
    text: str

class RAGIndexRequest(BaseModel):
    documents: List[Dict[str, Any]]

class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5

class ReportRequest(BaseModel):
    symbol: str
    question: Optional[str] = None
    quote: Dict[str, Any]
    indicators: Dict[str, Any]
    ml_forecast: Optional[Dict[str, Any]] = None
    news_items: Optional[List[Dict[str, Any]]] = None
    force_refresh: Optional[bool] = False

@router.post("/sentiment")
def get_sentiment(req: SentimentRequest):
    return analyze_financial_sentiment(req.text)

@router.post("/rag/index")
def index_documents(req: RAGIndexRequest):
    count = rag_vector_store.add_documents(req.documents)
    return {"status": "success", "indexed_count": count}

@router.post("/rag/search")
def search_documents(req: RAGSearchRequest):
    results = rag_vector_store.search(req.query, top_k=req.top_k)
    return {"results": results, "count": len(results)}

@router.post("/report")
def generate_report(req: ReportRequest):
    news = req.news_items or []
    # If no news provided, perform quick RAG search in vector store
    if not news:
        news = rag_vector_store.search(req.symbol, top_k=5)

    result = generate_ai_report(
        symbol=req.symbol,
        question=req.question,
        quote=req.quote,
        indicators=req.indicators,
        ml_forecast=req.ml_forecast,
        news_items=news,
        force_refresh=req.force_refresh or False,
    )
    return result
