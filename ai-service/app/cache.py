import os
import json
import logging
from typing import Any, Optional, Callable
from cachetools import TTLCache

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "true").lower() in ("true", "1", "yes")

class CacheManager:
    """
    Two-Tier Hybrid Cache:
    1. L1: Fast in-memory TTLCache (zero setup, sub-millisecond, fail-safe).
    2. L2: Redis distributed cache (if REDIS_URL is reachable).
    Gracefully and silently falls back to in-memory cache if Redis is not running.
    """
    def __init__(self):
        # In-memory LRU + TTL caches:
        # short_cache for real-time quotes (30s)
        self.quote_cache = TTLCache(maxsize=1000, ttl=30)
        # medium_cache for candles, indicators, ML (300s = 5m)
        self.medium_cache = TTLCache(maxsize=1000, ttl=300)
        # report_cache for AI research reports (600s = 10m)
        self.report_cache = TTLCache(maxsize=500, ttl=600)
        # general cache
        self.general_cache = TTLCache(maxsize=2000, ttl=300)

        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        if not REDIS_ENABLED:
            logger.info("Redis disabled by config; using in-memory cache")
            return

        try:
            import redis
            client = redis.from_url(REDIS_URL, socket_timeout=1, socket_connect_timeout=1)
            # Test ping
            client.ping()
            self.redis_client = client
            logger.info(f"Connected to Redis at {REDIS_URL}")
        except Exception as e:
            logger.info(f"Redis not reachable ({e}); using high-speed in-memory TTLCache fallback")
            self.redis_client = None

    def get(self, key: str, cache_type: str = "general") -> Optional[Any]:
        # 1. Check L1 Memory
        local_cache = self._get_local_cache(cache_type)
        if key in local_cache:
            return local_cache[key]

        # 2. Check L2 Redis if available
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val is not None:
                    parsed = json.loads(val)
                    # Backfill L1
                    local_cache[key] = parsed
                    return parsed
            except Exception as e:
                logger.debug(f"Redis get failed: {e}")

        return None

    def set(self, key: str, value: Any, ttl: int = 300, cache_type: str = "general") -> None:
        # 1. Set in L1 Memory
        local_cache = self._get_local_cache(cache_type)
        local_cache[key] = value

        # 2. Set in L2 Redis if available
        if self.redis_client:
            try:
                serialized = json.dumps(value, default=str)
                self.redis_client.setex(key, ttl, serialized)
            except Exception as e:
                logger.debug(f"Redis set failed: {e}")

    def delete(self, key: str, cache_type: str = "general") -> None:
        local_cache = self._get_local_cache(cache_type)
        if key in local_cache:
            del local_cache[key]

        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception as e:
                logger.debug(f"Redis delete failed: {e}")

    def _get_local_cache(self, cache_type: str) -> TTLCache:
        if cache_type == "quote":
            return self.quote_cache
        elif cache_type == "report":
            return self.report_cache
        elif cache_type == "medium":
            return self.medium_cache
        return self.general_cache

cache = CacheManager()
