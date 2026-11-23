import 'server-only';
import Redis, { RedisOptions } from 'ioredis';

const g = globalThis as unknown as { _redis?: Redis | null };

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

function createRedisClient(): Redis | null {
  try {
    const opts: RedisOptions = {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: true,
      retryStrategy(times) {
        // Reconnect with backoff up to 3s so intermittent restarts automatically recover
        return Math.min(times * 200, 3000);
      },
    };

    const client = new Redis(REDIS_URL, opts);

    client.on('error', (err) => {
      // Log connection warnings without crashing the app
      if ((err as any)?.code === 'ECONNREFUSED') {
        // Suppress repeated connection refused spam
      } else {
        console.warn('[redis] connection error:', (err as Error).message);
      }
    });

    return client;
  } catch (err) {
    console.warn('[redis] initialization error:', err);
    return null;
  }
}

export function getRedis(): Redis | null {
  if (process.env.REDIS_DISABLED === '1') {
    return null;
  }
  if (g._redis && g._redis.status === 'end') {
    g._redis = null;
  }
  if (!g._redis) {
    g._redis = createRedisClient();
  }
  return g._redis;
}

/**
 * Returns Redis instance only if ready, avoiding offline queue delays when Redis is down
 */
export function getActiveRedis(): Redis | null {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') {
    return null;
  }
  return redis;
}

/**
 * Retrieve cached JSON value by key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getActiveRedis();
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Cache JSON value with TTL in seconds (default 300s = 5m)
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const redis = getActiveRedis();
  if (!redis) return;
  try {
    const str = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.set(key, str, 'EX', ttlSeconds);
    } else {
      await redis.set(key, str);
    }
  } catch {
    // Fail silently — database is primary source of truth
  }
}

/**
 * Delete one or more exact cache keys
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  const redis = getActiveRedis();
  if (!redis || !keys.length) return;
  try {
    await redis.del(...keys);
  } catch {
    // Ignore error
  }
}

/**
 * Invalidate cache keys matching pattern (e.g. "vehicles:*", "settings:*")
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const redis = getActiveRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Ignore error
  }
}

/**
 * Quick ping check to verify Redis health
 */
export async function isRedisHealthy(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  if (redis.status !== 'ready') {
    if (redis.status === 'connecting' || redis.status === 'connect') {
      try {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => { cleanup(); resolve(); };
          const onError = (e: Error) => { cleanup(); reject(e); };
          const timer = setTimeout(() => { cleanup(); resolve(); }, 500);
          const cleanup = () => {
            clearTimeout(timer);
            redis.off('ready', onReady);
            redis.off('error', onError);
          };
          redis.once('ready', onReady);
          redis.once('error', onError);
        });
      } catch {
        return false;
      }
    }
  }
  if (redis.status !== 'ready') return false;
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Gracefully disconnect Redis client (used in testing and shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (g._redis) {
    try {
      if (g._redis.status === 'ready' || g._redis.status === 'connecting') {
        await g._redis.quit();
      } else {
        g._redis.disconnect();
      }
    } catch {
      g._redis.disconnect();
    }
    g._redis = undefined;
  }
}
