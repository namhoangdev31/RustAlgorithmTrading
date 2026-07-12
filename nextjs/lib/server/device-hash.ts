import { createHash } from "crypto";

/**
 * Hash a device identifier using TELEMETRY_DEVICE_PEPPER.
 * Never stores raw device IDs. Returns a hex-encoded SHA-256 hash.
 */
export function hashDeviceId(rawDeviceId: string): string {
  const pepper = process.env.TELEMETRY_DEVICE_PEPPER || "";
  return createHash("sha256").update(`${pepper}:${rawDeviceId}`).digest("hex");
}
