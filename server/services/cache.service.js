import Redis from "ioredis";
import { getEnv } from "../config/env.js";

let redis = null;

export function getRedis() {
  const env = getEnv();
  if (!env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true });
    redis.on("error", (e) => console.warn("[redis]", e.message));
  }
  return redis;
}

export async function cacheGet(key) {
  const r = getRedis();
  if (!r) return null;
  try {
    const v = await r.get(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  const r = getRedis();
  if (!r) return;
  try {
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (_) {
    /* ignore */
  }
}

export async function cacheDel(pattern) {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys(pattern);
    if (keys.length) await r.del(...keys);
  } catch (_) {
    /* ignore */
  }
}
