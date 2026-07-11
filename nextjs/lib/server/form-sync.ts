export type ExternalSyncResult = {
  success: false;
  provider: "google-sheets" | "salesforce";
  code: "provider_unavailable";
  message: string;
};

/**
 * A provider adapter must be connected before submissions can leave the portal.
 * This boundary deliberately never reports success for an unconfigured adapter.
 */
export async function syncSubmissionToExternal(
  _data: Record<string, unknown>,
  target: "google-sheets" | "salesforce"
): Promise<ExternalSyncResult> {
  console.warn(`[Form Sync] ${target} is enabled on the form but no provider adapter is configured.`);
  return {
    success: false,
    provider: target,
    code: "provider_unavailable",
    message: `Connect a ${target} provider before enabling submission sync.`,
  };
}
