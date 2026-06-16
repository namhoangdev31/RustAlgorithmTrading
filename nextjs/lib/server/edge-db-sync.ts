import { getNativeRedis } from "@/lib/server/native-platform/redis";

export interface ReplicationLag {
  region: string;
  lagMs: number;
  status: "synced" | "lagging" | "disconnected";
  processedTransactions: number;
  lastSyncAt?: string;
}

export interface CdcTransaction {
  id: string;
  table: string;
  op: "INSERT" | "UPDATE" | "DELETE";
  timestamp: number;
  data: any;
}

const REGIONS = ["ap-southeast-1", "us-east-1", "eu-west-1"];

export async function simulateCdcEvent(
  projectId: string,
  table: string,
  op: "INSERT" | "UPDATE" | "DELETE",
  data: any
) {
  const redis = getNativeRedis();
  if (!redis) return;

  const txId = Math.random().toString(36).substring(2, 9);
  const tx: CdcTransaction = {
    id: txId,
    table,
    op,
    timestamp: Date.now(),
    data
  };

  const txLogKey = `cdc:${projectId}:tx_log`;
  await redis.lpush(txLogKey, JSON.stringify(tx));
  await redis.ltrim(txLogKey, 0, 99); // keep last 100 transactions

  for (const region of REGIONS) {
    const statusKey = `cdc:${projectId}:status:${region}`;
    const currentStatus = await redis.get(statusKey);
    let processed = 0;
    if (currentStatus) {
      try {
        const parsed = JSON.parse(currentStatus);
        processed = parsed.processedTransactions || 0;
      } catch {
        // Safe fallback
      }
    }

    const lag = Math.floor(Math.random() * 80) + 15;
    const lagStatus = lag > 150 ? "lagging" : "synced";

    const updated = {
      region,
      lagMs: lag,
      status: lagStatus,
      processedTransactions: processed + 1,
      lastSyncAt: new Date().toISOString()
    };
    await redis.set(statusKey, JSON.stringify(updated));
  }
}

export async function getReplicationStatus(projectId: string): Promise<ReplicationLag[]> {
  const redis = getNativeRedis();
  if (!redis) {
    return REGIONS.map(region => ({
      region,
      lagMs: 25,
      status: "synced" as const,
      processedTransactions: 142,
      lastSyncAt: new Date().toISOString()
    }));
  }

  const results: ReplicationLag[] = [];
  for (const region of REGIONS) {
    const statusKey = `cdc:${projectId}:status:${region}`;
    const statusStr = await redis.get(statusKey);
    if (statusStr) {
      try {
        results.push(JSON.parse(statusStr));
      } catch {
        results.push({
          region,
          lagMs: 0,
          status: "synced",
          processedTransactions: 0,
          lastSyncAt: new Date().toISOString()
        });
      }
    } else {
      results.push({
        region,
        lagMs: 0,
        status: "synced",
        processedTransactions: 0,
        lastSyncAt: new Date().toISOString()
      });
    }
  }
  return results;
}

export async function getRecentTransactions(projectId: string): Promise<CdcTransaction[]> {
  const redis = getNativeRedis();
  if (!redis) return [];

  const txLogKey = `cdc:${projectId}:tx_log`;
  try {
    const list = await redis.lrange(txLogKey, 0, 9);
    return list.map((item: string) => JSON.parse(item));
  } catch {
    return [];
  }
}

export interface VectorClockRecord {
  data: any;
  vectorClock: Record<string, number>;
  timestamp: number;
}

export function reconcileVectorClock(
  central: VectorClockRecord,
  incoming: VectorClockRecord
): { data: any; vectorClock: Record<string, number>; action: "accept" | "reject" | "conflict_resolved" } {
  const centralClock = central.vectorClock || {};
  const incomingClock = incoming.vectorClock || {};
  
  const allNodes = new Set([...Object.keys(centralClock), ...Object.keys(incomingClock)]);
  
  let incomingGreater = false;
  let centralGreater = false;

  for (const node of allNodes) {
    const cVal = centralClock[node] || 0;
    const iVal = incomingClock[node] || 0;
    
    if (iVal > cVal) incomingGreater = true;
    if (cVal > iVal) centralGreater = true;
  }

  // 1. Incoming dominates
  if (incomingGreater && !centralGreater) {
    return { data: incoming.data, vectorClock: incomingClock, action: "accept" };
  }
  // 2. Central dominates
  if (centralGreater && !incomingGreater) {
    return { data: central.data, vectorClock: centralClock, action: "reject" };
  }
  // 3. Concurrent conflict -> Resolve with Last Write Wins (LWW)
  const mergedClock: Record<string, number> = {};
  for (const node of allNodes) {
    mergedClock[node] = Math.max(centralClock[node] || 0, incomingClock[node] || 0);
  }

  if (incoming.timestamp >= central.timestamp) {
    return { data: incoming.data, vectorClock: mergedClock, action: "conflict_resolved" };
  } else {
    return { data: central.data, vectorClock: mergedClock, action: "conflict_resolved" };
  }
}

export async function pushWriteThroughQueue(
  projectId: string,
  table: string,
  op: "INSERT" | "UPDATE" | "DELETE",
  record: any,
  vectorClock: Record<string, number>
): Promise<void> {
  const redis = getNativeRedis();
  if (!redis) return;

  const payload = {
    id: Math.random().toString(36).substring(2, 9),
    table,
    op,
    timestamp: Date.now(),
    data: record,
    vectorClock
  };

  const queueKey = `cdc:${projectId}:write_through_queue`;
  await redis.rpush(queueKey, JSON.stringify(payload));
}
