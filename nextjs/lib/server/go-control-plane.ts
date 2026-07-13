import crypto from "crypto";

type SignedFetchOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  userId: string;
  bundleId?: string;
  checksumSha256?: string;
  idempotencyKey?: string;
};

function controlPlaneBaseUrl() {
  const base = process.env.GO_CONTROL_PLANE_URL;
  if (!base) {
    throw new Error("GO_CONTROL_PLANE_URL is not configured.");
  }
  return base.replace(/\/+$/, "");
}

function serviceSecret() {
  const secret = process.env.LEPOS_SERVICE_SECRET;
  if (!secret) {
    throw new Error("LEPOS_SERVICE_SECRET is not configured.");
  }
  return secret;
}

export function publicGoControlPlaneUrl() {
  return (process.env.NEXT_PUBLIC_GO_CONTROL_PLANE_URL || process.env.GO_CONTROL_PLANE_PUBLIC_URL || controlPlaneBaseUrl()).replace(/\/+$/, "");
}

export async function signedGoControlPlaneFetch(path: string, options: SignedFetchOptions) {
  const method = options.method || "POST";
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  const serviceId = process.env.LEPOS_SERVICE_ID || "nextjs-frontend";
  const canonical = [
    method,
    path,
    timestamp,
    nonce,
    options.userId,
    serviceId,
    options.bundleId || "",
    options.checksumSha256 || "",
    options.idempotencyKey || "",
  ].join("\n");
  const signature = crypto.createHmac("sha256", serviceSecret()).update(canonical).digest("hex");
  const headers = new Headers(options.headers);

  headers.set("X-LepoS-User-ID", options.userId);
  headers.set("X-LepoS-Service-ID", serviceId);
  headers.set("X-LepoS-Timestamp", timestamp);
  headers.set("X-LepoS-Nonce", nonce);
  headers.set("X-LepoS-Signature", signature);
  if (options.bundleId) headers.set("X-LepoS-Bundle-ID", options.bundleId);
  if (options.checksumSha256) headers.set("X-Artifact-SHA256", options.checksumSha256);
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);

  return fetch(`${controlPlaneBaseUrl()}${path}`, {
    method,
    headers,
    body: options.body,
    cache: "no-store",
  });
}
