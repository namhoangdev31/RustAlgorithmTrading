const CONTROL_PLANE_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "CRON_SECRET",
  "TELEMETRY_DEVICE_PEPPER",
  "LEPOS_ARTIFACT_ENDPOINT",
  "LEPOS_ARTIFACT_BUCKET",
  "LEPOS_ARTIFACT_ACCESS_KEY_ID",
  "LEPOS_ARTIFACT_SECRET_ACCESS_KEY",
  "LEPOS_ARTIFACT_PUBLIC_BASE_URL",
  "AUTH_SECRET",
  "ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GITHUB_WEBHOOK_SECRET",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
] as const;

const WORKER_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "LEPOS_ARTIFACT_ENDPOINT",
  "LEPOS_ARTIFACT_BUCKET",
  "LEPOS_ARTIFACT_ACCESS_KEY_ID",
  "LEPOS_ARTIFACT_SECRET_ACCESS_KEY",
  "LEPOS_ARTIFACT_PUBLIC_BASE_URL",
  "TELEMETRY_DEVICE_PEPPER",
] as const;

export function validateLepoShipEnvironment(role: "control-plane" | "worker" = "control-plane") {
  const keys = role === "worker" ? WORKER_KEYS : CONTROL_PLANE_KEYS;
  const missing = keys.filter((key) => !process.env[key]?.trim());
  return { valid: missing.length === 0, missing };
}

export function assertLepoShipEnvironment(role: "control-plane" | "worker" = "control-plane") {
  const result = validateLepoShipEnvironment(role);
  if (!result.valid) throw new Error(`LEPOSHIP_ENV_INVALID:${result.missing.join(",")}`);
}
