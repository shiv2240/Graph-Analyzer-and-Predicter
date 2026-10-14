import os
import logging
from typing import List, Dict, Any, Optional
import numpy as np

logger = logging.getLogger(__name__)

_embedder = None
_faiss_index = None
_metadata_store: List[Dict[str, Any]] = []

def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            logger.info("Loaded sentence-transformers embedder")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Embeddings unavailable.")
            _embedder = False
    return _embedder

class VectorStore:
    def __init__(self, dimension: int = 384, storage_dir: str = "/app/faiss_index"):
        self.dimension = dimension
        self.storage_dir = storage_dir
        self.index = None
        self.documents: List[Dict[str, Any]] = []
        self._init_faiss()

    def _init_faiss(self):
        try:
            import faiss
            self.index = faiss.IndexFlatIP(self.dimension)
            logger.info(f"Initialized FAISS IndexFlatIP(dim={self.dimension})")
        except Exception as e:
            logger.warning(f"FAISS not available: {e}")
            self.index = None

    def add_documents(self, docs: List[Dict[str, Any]]) -> int:
        """
        Expects docs: [{'id': 1, 'text': '...', 'headline': '...', 'published_at': '...', 'url': '...'}]
        """
        embedder = get_embedder()
        if not embedder or self.index is None:
            # Fallback: store text for basic keyword matching
            self.documents.extend(docs)
            return len(docs)

        import faiss
        texts = [d.get("text", d.get("headline", "")) for d in docs]
        vectors = embedder.encode(texts, convert_to_numpy=True)
        faiss.normalize_L2(vectors)
        self.index.add(vectors.astype(np.float32))
        self.documents.extend(docs)
        return len(docs)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Searches vector index and returns top k closest documents"""
        if not self.documents:
            return []

        embedder = get_embedder()
        if not embedder or self.index is None or self.index.ntotal == 0:
            # Simple substring fallback
            q_lower = query.lower()
            matches = [
                d for d in self.documents
                if q_lower in d.get("headline", "").lower() or q_lower in d.get("summary", "").lower()
            ]
            return matches[:top_k]

        import faiss
        query_vector = embedder.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_vector)
        distances, indices = self.index.search(query_vector.astype(np.float32), min(top_k, self.index.ntotal))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(self.documents):
                doc = dict(self.documents[idx])
                doc["similarity_score"] = round(float(dist), 4)
                results.append(doc)
        return results

rag_vector_store = VectorStore()
