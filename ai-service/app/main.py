from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, yfinance_internal, indicators, ml, analysis

app = FastAPI(
    title="Stock Intelligence AI Service",
    description="Microservice for financial indicator calculation, machine learning forecasting, and AI analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(yfinance_internal.router)
app.include_router(indicators.router)
app.include_router(ml.router)
app.include_router(analysis.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
