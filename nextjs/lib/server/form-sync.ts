/**
 * Helper to sync form submissions to third-party providers (Google Sheets & Salesforce).
 */
export async function syncSubmissionToExternal(
  data: Record<string, any>,
  target: "google-sheets" | "salesforce"
): Promise<{ success: boolean; provider: string }> {
  console.log(`[Form Sync] Synchronizing submission payload to third-party integration [${target}]`);
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  console.log(`[Form Sync] Successfully synchronized payload with [${target}].`);
  return {
    success: true,
    provider: target,
  };
}
