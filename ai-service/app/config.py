import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    MODEL_DIR: str = os.getenv("MODEL_DIR", "/app/models")
    FAISS_DIR: str = os.getenv("FAISS_DIR", "/app/faiss_index")

settings = Settings()
