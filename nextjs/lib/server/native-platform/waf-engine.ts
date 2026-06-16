import crypto from "node:crypto";
import { prisma } from "@/lib/server/prisma";
import { getNativeRedis } from "./redis";

export function analyzeJa3Fingerprint(ja3String: string): { isBot: boolean; name: string; score: number } {
  const knownBotJa3s: Record<string, string> = {
    "e7d705a246d61002df359b369c0d164d": "curl",
    "b32309a246d61002df359b369c0d164d": "python-requests",
    "c89283f218a0029db8efba193ad910c0": "go-http-client",
  };

  const name = knownBotJa3s[ja3String];
  if (name) {
    return { isBot: true, name, score: 90 };
  }

  if (ja3String.startsWith("771,") && (ja3String.includes(",,,") || ja3String.length < 50)) {
    return { isBot: true, name: "malformed-client", score: 75 };
  }

  return { isBot: false, name: "legitimate", score: 0 };
}

export function generateJsChallenge() {
  const challengeId = crypto.randomUUID();
  const difficulty = 4; // proof-of-work difficulty
  const salt = crypto.randomBytes(16).toString("hex");

  const redis = getNativeRedis();
  if (redis) {
    redis.set(`lepos:waf:challenge:${challengeId}`, salt, "EX", 300); // 5 min TTL
  }

  return {
    challengeId,
    salt,
    difficulty,
    script: `
      (function() {
        const salt = "${salt}";
        const difficulty = ${difficulty};
        const challengeId = "${challengeId}";
        
        function solve() {
          let nonce = 0;
          const targetPrefix = "0".repeat(difficulty);
          while (true) {
            const hash = sha256(salt + nonce);
            if (hash.startsWith(targetPrefix)) {
              return nonce;
            }
            nonce++;
          }
        }
        
        async function sha256(message) {
          const msgBuffer = new TextEncoder().encode(message);
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        window.solveWafChallenge = async function() {
          const nonce = solve();
          const response = await fetch('/api/waf/challenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challengeId, answer: nonce })
          });
          return response.ok;
        };
      })();
    `
  };
}

export async function verifyJsChallenge(challengeId: string, answer: number): Promise<boolean> {
  const redis = getNativeRedis();
  if (!redis) return true;

  const salt = await redis.get(`lepos:waf:challenge:${challengeId}`);
  if (!salt) return false;

  const hash = crypto.createHash("sha256").update(salt + answer).digest("hex");
  const targetPrefix = "0".repeat(4);
  
  if (hash.startsWith(targetPrefix)) {
    await redis.del(`lepos:waf:challenge:${challengeId}`);
    return true;
  }

  return false;
}

export async function autoBlockSuspiciousIp(projectId: string, ipAddress: string, fingerprint: string) {
  const redis = getNativeRedis();
  if (!redis) return false;

  const blockKey = `lepos:waf:blocked:${ipAddress}`;
  await redis.set(blockKey, JSON.stringify({ projectId, fingerprint, blockedAt: Date.now() }), "EX", 3600); // block 1 hour

  await prisma.nativeWafEvent.create({
    data: {
      projectId,
      fingerprint,
      ipAddress,
      action: "block",
      reason: "Rate limit violation or TLS fingerprint anomaly",
    },
  });

  return true;
}

export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  const redis = getNativeRedis();
  if (!redis) return false;

  const blocked = await redis.get(`lepos:waf:blocked:${ipAddress}`);
  return !!blocked;
}

export async function getWafAnalytics(projectId: string, timeRange: { from: Date; to: Date }) {
  const events = await prisma.nativeWafEvent.findMany({
    where: {
      projectId,
      createdAt: {
        gte: timeRange.from,
        lte: timeRange.to,
      },
    },
  });

  const totalEvents = events.length;
  const byAction: Record<string, number> = {};
  const ipCounts: Record<string, number> = {};

  for (const e of events) {
    byAction[e.action] = (byAction[e.action] || 0) + 1;
    if (e.ipAddress) {
      ipCounts[e.ipAddress] = (ipCounts[e.ipAddress] || 0) + 1;
    }
  }

  const topBlockedIps = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents,
    byAction,
    topBlockedIps,
  };
}

export async function createWafRule(input: {
  projectId: string;
  name: string;
  action: string;
  type: string;
  pattern: string;
  description?: string;
}) {
  return prisma.nativeWafRule.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      action: input.action,
      type: input.type,
      pattern: input.pattern,
      description: input.description || null,
    },
  });
}

export async function listWafRules(projectId: string) {
  return prisma.nativeWafRule.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateWafRule(id: string, projectId: string, input: any) {
  return prisma.nativeWafRule.update({
    where: { id, projectId },
    data: input,
  });
}

export async function deleteWafRule(id: string, projectId: string) {
  return prisma.nativeWafRule.delete({
    where: { id, projectId },
  });
}
