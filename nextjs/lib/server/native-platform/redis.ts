import IORedis from "ioredis";

let redisClient: IORedis | null | undefined;

export function getNativeRedis() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new IORedis(url, {
    connectTimeout: 1500,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redisClient.on("error", (error) => {
    console.warn("[native-platform] Redis unavailable:", error.message);
  });

  return redisClient;
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds?: number) {
  const redis = getNativeRedis();
  if (!redis) return false;

  const payload = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, payload, "EX", ttlSeconds);
  } else {
    await redis.set(key, payload);
  }
  return true;
}

export async function redisGetJson<T>(key: string) {
  const redis = getNativeRedis();
  if (!redis) return null;

  const payload = await redis.get(key);
  if (!payload) return null;
  return JSON.parse(payload) as T;
}

export async function redisDelete(...keys: string[]) {
  const redis = getNativeRedis();
  if (!redis || keys.length === 0) return 0;
  return redis.del(...keys);
}

export async function redisPublish(channel: string, payload: unknown) {
  const redis = getNativeRedis();
  if (!redis) return false;
  await redis.publish(channel, JSON.stringify(payload));
  return true;
}

export const nativeRedisKeys = {
  domain: (host: string) => `lepos:domain:${host}`,
  activeDeployment: (projectId: string) => `lepos:project:${projectId}:activeDeployment`,
  cache: (projectId: string, path: string) => `lepos:cache:${projectId}:${path}`,
  waf: (fingerprint: string) => `lepos:waf:${fingerprint}`,
  debug: (sessionId: string) => `lepos:debug:${sessionId}`,
};
