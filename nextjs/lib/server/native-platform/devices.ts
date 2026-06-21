import { prisma } from "@/lib/server/prisma";

const ONLINE_WINDOW_MS = 60 * 1000;
const STALE_WINDOW_MS = 5 * 60 * 1000;

export type DeviceHeartbeatInput = {
  projectId: string;
  deviceId: string;
  platform: string;
  deviceModel?: string | null;
  osVersion?: string | null;
  ramMb?: number | null;
  pingMs?: number | null;
  metadata?: unknown;
};

export function deriveConnectedDeviceStatus(lastSeenAt: Date | string) {
  const lastSeen = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  const elapsed = Date.now() - lastSeen.getTime();

  if (elapsed <= ONLINE_WINDOW_MS) {
    return "online";
  }

  if (elapsed <= STALE_WINDOW_MS) {
    return "stale";
  }

  return "offline";
}

export async function upsertConnectedDeviceHeartbeat(input: DeviceHeartbeatInput) {
  const lastSeenAt = new Date();

  return prisma.nativeConnectedDevice.upsert({
    where: {
      projectId_deviceId: {
        projectId: input.projectId,
        deviceId: input.deviceId,
      },
    },
    create: {
      projectId: input.projectId,
      deviceId: input.deviceId,
      platform: input.platform,
      deviceModel: input.deviceModel || null,
      osVersion: input.osVersion || null,
      ramMb: input.ramMb ?? null,
      pingMs: input.pingMs ?? null,
      metadata: (input.metadata || null) as any,
      status: "online",
      lastSeenAt,
    },
    update: {
      platform: input.platform,
      deviceModel: input.deviceModel || null,
      osVersion: input.osVersion || null,
      ramMb: input.ramMb ?? null,
      pingMs: input.pingMs ?? null,
      metadata: (input.metadata || null) as any,
      status: "online",
      lastSeenAt,
    },
  });
}

export async function listConnectedDevices(projectId: string) {
  const devices = await prisma.nativeConnectedDevice.findMany({
    where: { projectId },
    orderBy: { lastSeenAt: "desc" },
  });

  return devices.map((device) => ({
    ...device,
    status: deriveConnectedDeviceStatus(device.lastSeenAt),
  }));
}
