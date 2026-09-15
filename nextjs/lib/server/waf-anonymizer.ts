import { createHash } from "crypto";

export function anonymizeIpAddress(ip: string | null, projectId: string): { masked: string | null; hash: string | null } {
  if (!ip) return { masked: null, hash: null };
  
  const trimmed = ip.trim();

  const hash = createHash("sha256")
    .update(trimmed + projectId)
    .digest("hex");

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
      
      masked = parts.slice(0, 3).join(":") + "::";
    }
  }

  return { masked, hash };
}
