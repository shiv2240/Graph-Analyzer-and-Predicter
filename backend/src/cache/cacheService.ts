import NodeCache from "node-cache";
import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../utils/logger";

class CacheService {
  private localCache: NodeCache;
  private redis: Redis | null = null;
  private redisConnected = false;
  private redisLogged = false;

  constructor() {
    // L1 in-memory cache
    this.localCache = new NodeCache({
      stdTTL: config.CACHE_TTL_SECONDS,
      checkperiod: 60,
      useClones: false,
    });

    this.initRedis();
  }

  private initRedis() {
    if (!config.REDIS_ENABLED) {
      logger.info("Redis disabled via config; using in-memory cache");
      return;
    }

    const redisUrl = config.REDIS_URL || process.env.REDIS_URL;

    try {
      this.redis = new Redis(redisUrl || "redis://127.0.0.1:6379", {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 1500,
        retryStrategy: () => null, // Do not spam retries if redis is not running
      });

      this.redis.on("connect", () => {
        this.redisConnected = true;
        logger.info("Connected to Redis distributed cache (L2)");
      });

      this.redis.on("error", (err) => {
        this.redisConnected = false;
        if (!this.redisLogged) {
          logger.info(
            { reason: err.message },
            "Redis server not reachable; seamlessly operating in high-performance in-memory cache mode (L1)"
          );
          this.redisLogged = true;
        }
      });

      // Attempt initial connection without blocking app startup
      this.redis.connect().catch(() => {
        this.redisConnected = false;
      });
    } catch (err: any) {
      logger.debug({ err: err.message }, "Redis initialization skipped");
      this.redis = null;
    }
  }

  /**
   * Synchronous get (checks L1 in-memory cache)
   */
  get<T>(key: string): T | undefined {
    const value = this.localCache.get<T>(key);
    if (value !== undefined) {
      logger.debug({ key }, "L1 cache hit");
    }
    return value;
  }

  /**
   * Synchronous set (sets L1 in-memory cache and asynchronously sets L2 Redis if available)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? config.CACHE_TTL_SECONDS;
    this.localCache.set(key, value, ttl);
    logger.debug({ key, ttl }, "L1 cache set");

    if (this.redisConnected && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        this.redis.setex(key, ttl, serialized).catch((e) => {
          logger.debug({ err: e.message }, "Redis setex async error");
        });
      } catch {
        // Serialization error ignored for complex objects
      }
    }
  }

  /**
   * Asynchronous get: checks L1 memory, falls back to L2 Redis, and backfills L1 if found.
   */
  async getAsync<T>(key: string): Promise<T | undefined> {
    // 1. Check L1 local cache
    const localVal = this.localCache.get<T>(key);
    if (localVal !== undefined) {
      return localVal;
    }

    // 2. Check L2 Redis cache
    if (this.redisConnected && this.redis) {
      try {
        const redisVal = await this.redis.get(key);
        if (redisVal !== null) {
          const parsed = JSON.parse(redisVal) as T;
          // Backfill L1
          this.localCache.set(key, parsed, config.CACHE_TTL_SECONDS);
          return parsed;
        }
      } catch (err: any) {
        logger.debug({ key, err: err.message }, "Redis getAsync failed");
      }
    }

    return undefined;
  }

  /**
   * Asynchronous set: sets both L1 local cache and L2 Redis cache.
   */
  async setAsync<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? config.CACHE_TTL_SECONDS;
    this.localCache.set(key, value, ttl);

    if (this.redisConnected && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        await this.redis.setex(key, ttl, serialized);
      } catch (err: any) {
        logger.debug({ key, err: err.message }, "Redis setAsync failed");
      }
    }
  }

  del(key: string): void {
    this.localCache.del(key);
    if (this.redisConnected && this.redis) {
      this.redis.del(key).catch(() => {});
    }
  }

  flush(): void {
    this.localCache.flushAll();
    if (this.redisConnected && this.redis) {
      this.redis.flushdb().catch(() => {});
    }
    logger.info("Cache flushed (L1 + L2)");
  }

  stats() {
    return {
      localStats: this.localCache.getStats(),
      redisConnected: this.redisConnected,
    };
  }
}

export const cache = new CacheService();
