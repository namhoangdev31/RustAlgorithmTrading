import { createHash } from "crypto";

export function anonymizeIpAddress(ip: string | null, projectId: string): { masked: string | null; hash: string | null } {
  if (!ip) return { masked: null, hash: null };
  
  const trimmed = ip.trim();
  
  // 1. One-way hash for threat correlation (uses projectId as a salt)
  const hash = createHash("sha256")
    .update(trimmed + projectId)
    .digest("hex");

  // 2. IP masking
  let masked = trimmed;
  if (trimmed.includes(".")) {
    const parts = trimmed.split(".");
    if (parts.length === 4) {
      parts[3] = "0";
      masked = parts.join(".");
    }
  } else if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length >= 3) {
      // Keep first 3 segments and mask the rest with ::
      masked = parts.slice(0, 3).join(":") + "::";
    }
  }

  return { masked, hash };
}
