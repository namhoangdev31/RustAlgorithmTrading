import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";

import { getNativeRedis } from "@/lib/server/native-platform/redis";

export async function enforceLepoShipRateLimit(input: {
  request: NextRequest;
  scope: string;
  identityId: string;
  deviceId?: string | null;
  limit: number;
  windowSeconds: number;
}) {
  const redis = getNativeRedis();
  if (!redis) throw new Error("RATE_LIMITER_UNAVAILABLE");
  const ip = input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? input.request.headers.get("x-real-ip") ?? "unknown";
  const keys = [
    `lepoship:rl:${input.scope}:identity:${input.identityId}`,
    `lepoship:rl:${input.scope}:ip:${ip}`,
    ...(input.deviceId ? [`lepoship:rl:${input.scope}:device:${createHash("sha256").update(input.deviceId).digest("hex")}`] : []),
  ];
  for (const key of keys) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, input.windowSeconds);
    if (count > input.limit) return false;
  }
  return true;
}
