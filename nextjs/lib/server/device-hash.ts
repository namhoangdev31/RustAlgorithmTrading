import { createHmac } from "crypto";

/**
 * Hash a device identifier using TELEMETRY_DEVICE_PEPPER.
 * Never stores raw device IDs. Returns a hex-encoded SHA-256 hash.
 */
export function hashDeviceId(rawDeviceId: string): string {
  const pepper = process.env.TELEMETRY_DEVICE_PEPPER;
  if (!pepper) throw new Error("TELEMETRY_DEVICE_PEPPER_REQUIRED");
  return createHmac("sha256", pepper).update(rawDeviceId).digest("hex");
}
