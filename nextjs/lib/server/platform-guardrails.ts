export const LIVE_EXTERNAL_INTEGRATIONS = ["vercel", "github"] as const;

export type LiveExternalIntegration = (typeof LIVE_EXTERNAL_INTEGRATIONS)[number];
export type IntegrationMode = "live" | "internal";

const LIVE_EXTERNAL_SET = new Set<string>(LIVE_EXTERNAL_INTEGRATIONS);

export function normalizeIntegrationType(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export function getIntegrationMode(value: string): IntegrationMode {
  const type = normalizeIntegrationType(value);
  return LIVE_EXTERNAL_SET.has(type) ? "live" : "internal";
}

export function isLiveExternalIntegration(
  value: string
): value is LiveExternalIntegration {
  return LIVE_EXTERNAL_SET.has(normalizeIntegrationType(value));
}

export function buildIntegrationConfig(
  type: string,
  input: Record<string, string>
) {
  const integrationType = normalizeIntegrationType(type);
  const mode = getIntegrationMode(integrationType);

  return {
    integrationType,
    mode,
    config: {
      mode,
      managedBy: "server-actions",
      notes: input.notes || "",
      // Non-live marketplace entries stay as registry/config only. They must not
      // carry an endpoint that future code might call accidentally.
      endpoint: mode === "live" ? input.endpoint || "" : "",
    },
  };
}

export const PUBLIC_API_SURFACE_DISABLED =
  "Public REST API and client SDK surfaces are intentionally disabled for this SSR-first release.";
