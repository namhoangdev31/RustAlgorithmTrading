import crypto from "node:crypto";
import { getNativeRedis, redisSetJson, redisGetJson, redisDelete, redisPublish, nativeRedisKeys } from "./redis";

export interface DebugSession {
  sessionId: string;
  projectId: string;
  deviceId: string;
  deviceName?: string;
  platform?: string;
  createdAt: number;
}

export async function createDebugSession(input: {
  projectId: string;
  deviceId: string;
  deviceName?: string;
  platform?: string;
}) {
  const sessionId = crypto.randomUUID();
  const createdAt = Date.now();
  const session: DebugSession = {
    sessionId,
    projectId: input.projectId,
    deviceId: input.deviceId,
    deviceName: input.deviceName,
    platform: input.platform,
    createdAt,
  };

  const key = nativeRedisKeys.debug(sessionId);
  await redisSetJson(key, session, 3600); // 1 hour TTL
  return session;
}

export async function getDebugSession(sessionId: string): Promise<DebugSession | null> {
  const key = nativeRedisKeys.debug(sessionId);
  return redisGetJson<DebugSession>(key);
}

export async function listActiveSessions(projectId: string): Promise<DebugSession[]> {
  const redis = getNativeRedis();
  if (!redis) return [];

  // Scan keys matching "lepos:debug:*"
  const keys = await redis.keys("lepos:debug:*");
  const sessions: DebugSession[] = [];

  for (const key of keys) {
    // Exclude logs keys (like lepos:debug:*:logs)
    if (key.endsWith(":logs")) continue;
    const session = await redisGetJson<DebugSession>(key);
    if (session && session.projectId === projectId) {
      sessions.push(session);
    }
  }

  return sessions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function relayLogMessage(input: {
  sessionId: string;
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  timestamp?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  const redis = getNativeRedis();
  if (!redis) return false;

  const logKey = `lepos:debug:${input.sessionId}:logs`;
  const logEntry = {
    id: crypto.randomUUID(),
    level: input.level,
    message: input.message,
    timestamp: input.timestamp || Date.now(),
    source: input.source || "webview",
    metadata: input.metadata || {},
  };

  // Push to list, keep last 1000 logs
  await redis.lpush(logKey, JSON.stringify(logEntry));
  await redis.ltrim(logKey, 0, 999);
  
  // Set TTL on logs list to match session TTL
  await redis.expire(logKey, 3600);

  // Publish to real-time pubsub channel
  await redisPublish(`debug:${input.sessionId}`, {
    type: "log",
    data: logEntry,
  });

  return true;
}

export async function getSessionLogs(sessionId: string, limit = 100): Promise<any[]> {
  const redis = getNativeRedis();
  if (!redis) return [];

  const logKey = `lepos:debug:${sessionId}:logs`;
  const logs = await redis.lrange(logKey, 0, limit - 1);
  return logs.map((log) => JSON.parse(log)).reverse();
}

export async function sendHotReloadSignal(sessionId: string, payload?: { changedFiles?: string[] }) {
  return redisPublish(`debug:${sessionId}`, {
    type: "hot-reload",
    payload: payload || {},
  });
}

export async function terminateDebugSession(sessionId: string) {
  const key = nativeRedisKeys.debug(sessionId);
  const logKey = `lepos:debug:${sessionId}:logs`;
  await redisDelete(key, logKey);
  
  await redisPublish(`debug:${sessionId}`, {
    type: "terminated",
  });
  return true;
}

export async function getDebugStats(projectId: string) {
  const sessions = await listActiveSessions(projectId);
  const redis = getNativeRedis();
  
  const stats = [];
  for (const session of sessions) {
    let logCount = 0;
    if (redis) {
      logCount = await redis.llen(`lepos:debug:${session.sessionId}:logs`);
    }
    stats.push({
      sessionId: session.sessionId,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      logCount,
    });
  }

  return {
    activeSessionCount: sessions.length,
    sessions: stats,
  };
}
