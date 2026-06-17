"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getVercelClient, getAuthorizedVercelClient, syncCentralEdgeConfig, MultiProviderConfig } from "@/lib/server/vercel";
import { prisma } from "@/lib/server/prisma";
import { encryptSecret } from "@/lib/server/secret-crypto";
import crypto from "crypto";

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createAccessGroupAction(formData: FormData) {
  const user = await requireCurrentUser();
  const name = readFormValue(formData, "name");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=access-groups";

  if (!name) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.accessGroups.createAccessGroup({
      requestBody: {
        name,
      },
    });
  } catch (error) {
    console.error("Failed to create access group:", error);
    // Redirect with error query param if needed
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=create_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteAccessGroupAction(formData: FormData) {
  const user = await requireCurrentUser();
  const idOrName = readFormValue(formData, "idOrName");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=access-groups";

  if (!idOrName) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.accessGroups.deleteAccessGroup({
      idOrName,
    });
  } catch (error) {
    console.error("Failed to delete access group:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=delete_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function assignAliasAction(formData: FormData) {
  const user = await requireCurrentUser();
  const deploymentId = readFormValue(formData, "deploymentId");
  const alias = readFormValue(formData, "alias");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=domains";

  if (!deploymentId || !alias) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.aliases.assignAlias({
      id: deploymentId,
      requestBody: {
        alias,
      },
    });
  } catch (error) {
    console.error("Failed to assign alias:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=assign_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteAliasAction(formData: FormData) {
  const user = await requireCurrentUser();
  const aliasId = readFormValue(formData, "aliasId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=domains";

  if (!aliasId) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.aliases.deleteAlias({
      aliasId,
    });
  } catch (error) {
    console.error("Failed to delete alias:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=delete_alias_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createAuthTokenAction(formData: FormData) {
  const user = await requireCurrentUser();
  const name = readFormValue(formData, "name");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=tokens";

  if (!name) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.authentication.createAuthToken({
      requestBody: {
        name,
      },
    });
  } catch (error) {
    console.error("Failed to create auth token:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=create_token_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteAuthTokenAction(formData: FormData) {
  const user = await requireCurrentUser();
  const tokenId = readFormValue(formData, "tokenId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=tokens";

  if (!tokenId) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.authentication.deleteAuthToken({
      tokenId,
    });
  } catch (error) {
    console.error("Failed to delete auth token:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=delete_token_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function buyCreditsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const creditType = readFormValue(formData, "creditType") || "v0";
  const amountStr = readFormValue(formData, "amount");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=billing";

  if (!amountStr) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.billing.buyCredits({
      requestBody: {
        item: {
          type: "credits",
          creditType: creditType as "v0" | "gateway" | "agent",
          amount: parseInt(amountStr, 10),
        },
      },
    });
  } catch (error) {
    console.error("Failed to buy credits:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=purchase_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleObservabilityAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const disabledStr = readFormValue(formData, "disabled");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=observability";

  if (!projectId || !disabledStr) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.apiObservability.updateObservabilityConfigurationProject({
      projectIdOrName: projectId,
      requestBody: {
        disabled: disabledStr === "true",
      },
    });
  } catch (error) {
    console.error("Failed to toggle observability:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=toggle_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function cancelDeploymentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const id = readFormValue(formData, "deploymentId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=deployments";

  if (!id) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.deployments.cancelDeployment({
      id,
    });
  } catch (error) {
    console.error("Failed to cancel deployment:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=cancel_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function issueCertificateAction(formData: FormData) {
  const user = await requireCurrentUser();
  const cnsStr = readFormValue(formData, "cns");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=certs";

  if (!cnsStr) {
    redirect(returnTo);
  }

  const cns = cnsStr.split(",").map(s => s.trim()).filter(Boolean);

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.certs.issueCert({
      requestBody: {
        cns,
      },
    });
  } catch (error) {
    console.error("Failed to issue cert:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=issue_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function uploadCertificateAction(formData: FormData) {
  const user = await requireCurrentUser();
  const cert = readFormValue(formData, "cert");
  const key = readFormValue(formData, "key");
  const ca = readFormValue(formData, "ca");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=certs";

  if (!cert || !key || !ca) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.certs.uploadCert({
      requestBody: {
        cert,
        key,
        ca,
      },
    });
  } catch (error) {
    console.error("Failed to upload cert:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=upload_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteCertificateAction(formData: FormData) {
  const user = await requireCurrentUser();
  const id = readFormValue(formData, "certId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=certs";

  if (!id) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.certs.removeCert({
      id,
    });
  } catch (error) {
    console.error("Failed to remove cert:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=delete_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function stageRedirectsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const teamId = readFormValue(formData, "teamId") || "";
  const source = readFormValue(formData, "source");
  const destination = readFormValue(formData, "destination");
  const returnTo = readFormValue(formData, "returnTo") || "/projects?tab=bulk-redirects";

  if (!projectId || !source || !destination) {
    redirect(returnTo);
  }

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.bulkRedirects.stageRedirects({
      requestBody: {
        projectId,
        teamId,
        redirects: [
          {
            source,
            destination,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to stage redirects:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=stage_failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function getDeploymentEventsAction(deploymentId: string) {
  const user = await requireCurrentUser();
  if (!deploymentId) {
    return { success: false, error: "Deployment ID is required" };
  }

  try {
    const vercel = await getVercelClient(user.id);
    const events = await vercel.deployments.getDeploymentEvents({
      idOrUrl: deploymentId,
      direction: "forward",
    });
    return { success: true, events };
  } catch (error: any) {
    console.error("Failed to fetch deployment events:", error);
    return { success: false, error: error?.message || "Failed to fetch deployment events" };
  }
}

export async function createProjectEnvAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const key = readFormValue(formData, "key");
  const value = readFormValue(formData, "value");
  const type = readFormValue(formData, "type") || "encrypted";
  const comment = readFormValue(formData, "comment") || "";
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !key || !value) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing_fields`);
  }

  const targets: string[] = [];
  if (formData.get("target_production") === "on" || formData.get("target_production") === "true") targets.push("production");
  if (formData.get("target_preview") === "on" || formData.get("target_preview") === "true") targets.push("preview");
  if (formData.get("target_development") === "on" || formData.get("target_development") === "true") targets.push("development");

  if (targets.length === 0) {
    targets.push("production", "preview", "development");
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    await vercel.projects.createProjectEnv({
      idOrName: projectId,
      requestBody: [
        {
          key,
          value,
          target: targets as any,
          type: type as any,
          comment,
        },
      ],
    });
  } catch (error: any) {
    console.error("Failed to create project env var:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=create_env_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function removeProjectEnvAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const envId = readFormValue(formData, "envId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !envId) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    await vercel.projects.removeProjectEnv({
      idOrName: projectId,
      id: envId,
    });
  } catch (error: any) {
    console.error("Failed to remove project env var:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=remove_env_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function editProjectEnvAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const envId = readFormValue(formData, "envId");
  const key = readFormValue(formData, "key");
  const value = readFormValue(formData, "value");
  const type = readFormValue(formData, "type") || "encrypted";
  const comment = readFormValue(formData, "comment") || "";
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !envId || !key) {
    redirect(returnTo);
  }

  const targets: string[] = [];
  if (formData.get("target_production") === "on" || formData.get("target_production") === "true") targets.push("production");
  if (formData.get("target_preview") === "on" || formData.get("target_preview") === "true") targets.push("preview");
  if (formData.get("target_development") === "on" || formData.get("target_development") === "true") targets.push("development");

  if (targets.length === 0) {
    targets.push("production", "preview", "development");
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    await vercel.projects.editProjectEnv({
      idOrName: projectId,
      id: envId,
      requestBody: {
        key,
        value,
        target: targets as any,
        type: type as any,
        comment,
      },
    });
  } catch (error: any) {
    console.error("Failed to edit project env var:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=edit_env_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function addProjectDomainAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domain = readFormValue(formData, "domain");
  const gitBranch = readFormValue(formData, "gitBranch") || undefined;
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !domain) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    await vercel.projects.addProjectDomain({
      idOrName: projectId,
      requestBody: {
        name: domain,
        gitBranch: gitBranch || undefined,
      },
    });
  } catch (error: any) {
    console.error("Failed to add project domain:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=add_domain_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function removeProjectDomainAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domain = readFormValue(formData, "domain");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !domain) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    await vercel.projects.removeProjectDomain({
      idOrName: projectId,
      domain,
    });
  } catch (error: any) {
    console.error("Failed to remove project domain:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=remove_domain_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function verifyProjectDomainAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domain = readFormValue(formData, "domain");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !domain) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    await vercel.projects.verifyProjectDomain({
      idOrName: projectId,
      domain,
    });
  } catch (error: any) {
    console.error("Failed to verify project domain:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=verify_domain_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function rollbackDeploymentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const deploymentId = readFormValue(formData, "deploymentId");
  const description = readFormValue(formData, "description") || undefined;
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !deploymentId) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "admin");
    await vercel.projects.requestRollback({
      projectId,
      deploymentId,
      description,
    });
  } catch (error: any) {
    console.error("Failed to rollback deployment:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=rollback_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function getEdgeConfigsAction(projectId: string) {
  const user = await requireCurrentUser();
  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "viewer");
    const res = await vercel.edgeConfig.getEdgeConfigs({});
    return { success: true, edgeConfigs: Array.isArray(res) ? res : [] };
  } catch (error: any) {
    console.error("Failed to fetch Edge Configs:", error);
    return { success: false, error: error?.message || "Failed to fetch Edge Configs" };
  }
}

export async function getEdgeConfigItemsAction(projectId: string, edgeConfigId: string) {
  const user = await requireCurrentUser();
  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "viewer");
    const items = await vercel.edgeConfig.getEdgeConfigItems({ edgeConfigId });
    return { success: true, items: items || {} };
  } catch (error: any) {
    console.error("Failed to fetch Edge Config items:", error);
    return { success: false, error: error?.message || "Failed to fetch Edge Config items" };
  }
}

export async function linkProjectEdgeConfigAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const edgeConfigId = readFormValue(formData, "edgeConfigId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !edgeConfigId) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");
    
    // 1. Create a token for this store
    const tokenRes = await vercel.edgeConfig.createEdgeConfigToken({
      edgeConfigId,
      requestBody: { label: `lepos-project-${projectId}` }
    });

    const token = tokenRes.token;
    if (!token) {
      throw new Error("Failed to create Edge Config token");
    }

    const connectionString = `https://edge-config.vercel.com/${edgeConfigId}?token=${token}`;

    // 2. Set the env var on Vercel project
    await vercel.projects.createProjectEnv({
      idOrName: projectId,
      requestBody: [
        {
          key: "EDGE_CONFIG",
          value: connectionString,
          target: ["production", "preview", "development"],
          type: "encrypted",
          comment: "Linked Edge Config Connection"
        }
      ]
    });
  } catch (error: any) {
    console.error("Failed to link Edge Config:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=link_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createAndLinkEdgeConfigAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const slug = readFormValue(formData, "slug");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !slug) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");

    // 1. Create store
    const store = await vercel.edgeConfig.createEdgeConfig({
      requestBody: { slug }
    });

    const edgeConfigId = store.id;
    if (!edgeConfigId) {
      throw new Error("Failed to create Edge Config store");
    }

    // 2. Create token for store
    const tokenRes = await vercel.edgeConfig.createEdgeConfigToken({
      edgeConfigId,
      requestBody: { label: `lepos-project-${projectId}` }
    });

    const token = tokenRes.token;
    if (!token) {
      throw new Error("Failed to create Edge Config token");
    }

    const connectionString = `https://edge-config.vercel.com/${edgeConfigId}?token=${token}`;

    // 3. Create project env var
    await vercel.projects.createProjectEnv({
      idOrName: projectId,
      requestBody: [
        {
          key: "EDGE_CONFIG",
          value: connectionString,
          target: ["production", "preview", "development"],
          type: "encrypted",
          comment: "Linked Edge Config Connection"
        }
      ]
    });
  } catch (error: any) {
    console.error("Failed to create and link Edge Config:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=create_link_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function patchEdgeConfigItemAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const edgeConfigId = readFormValue(formData, "edgeConfigId");
  const key = readFormValue(formData, "key");
  const value = readFormValue(formData, "value"); // String representation of JSON or plain string
  const operation = readFormValue(formData, "operation"); // "create" | "update" | "delete"
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !edgeConfigId || !key || !operation) {
    redirect(returnTo);
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(user.id, projectId, "editor");

    let parsedValue: any = undefined;
    if (operation !== "delete" && value !== undefined) {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value; // Fallback to plain string
      }
    }

    const items = [
      {
        operation: operation as any,
        key,
        value: parsedValue
      }
    ];

    await vercel.edgeConfig.patchEdgeConfigItems({
      edgeConfigId,
      requestBody: { items }
    });

    // Replicate changes to all linked multi-providers (Vercel & Cloudflare KV) in parallel
    const projectProvidersRes = await getProjectProvidersAction(projectId);
    if (projectProvidersRes.success && projectProvidersRes.providers && projectProvidersRes.providers.length > 0) {
      await syncCentralEdgeConfig(user.id, projectProvidersRes.providers, items);
    }
  } catch (error: any) {
    console.error("Failed to patch Edge Config item:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=patch_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

const ADVANCED_VERCEL_METHODS = {
  // accessGroups
  "accessGroups.createAccessGroup": { path: ["accessGroups", "createAccessGroup"], role: "admin" },
  "accessGroups.deleteAccessGroup": { path: ["accessGroups", "deleteAccessGroup"], role: "admin" },
  "accessGroups.listAccessGroups": { path: ["accessGroups", "listAccessGroups"], role: "viewer" },

  // aliases
  "aliases.assignAlias": { path: ["aliases", "assignAlias"], role: "editor" },
  "aliases.listAliases": { path: ["aliases", "listAliases"], role: "viewer" },
  "aliases.deleteAlias": { path: ["aliases", "deleteAlias"], role: "editor" },

  // apiObservability
  "apiObservability.updateObservabilityConfigurationProject": { path: ["apiObservability", "updateObservabilityConfigurationProject"], role: "admin" },

  // artifacts
  "artifacts.artifactExists": { path: ["artifacts", "artifactExists"], role: "viewer" },
  "artifacts.artifactQuery": { path: ["artifacts", "artifactQuery"], role: "viewer" },
  "artifacts.downloadArtifact": { path: ["artifacts", "downloadArtifact"], role: "viewer" },
  "artifacts.recordEvents": { path: ["artifacts", "recordEvents"], role: "editor" },
  "artifacts.status": { path: ["artifacts", "status"], role: "viewer" },
  "artifacts.uploadArtifact": { path: ["artifacts", "uploadArtifact"], role: "editor" },

  // authentication (auth tokens)
  "authentication.createAuthToken": { path: ["authentication", "createAuthToken"], role: "admin" },
  "authentication.deleteAuthToken": { path: ["authentication", "deleteAuthToken"], role: "admin" },
  "authentication.listAuthTokens": { path: ["authentication", "listAuthTokens"], role: "viewer" },

  // billing
  "billing.buyCredits": { path: ["billing", "buyCredits"], role: "admin" },

  // bulkRedirects
  "bulkRedirects.stageRedirects": { path: ["bulkRedirects", "stageRedirects"], role: "editor" },

  // certs
  "certs.issueCert": { path: ["certs", "issueCert"], role: "editor" },
  "certs.uploadCert": { path: ["certs", "uploadCert"], role: "editor" },
  "certs.removeCert": { path: ["certs", "removeCert"], role: "editor" },
  "certs.getCertById": { path: ["certs", "getCertById"], role: "viewer" },

  // checks
  "checks.createCheck": { path: ["checks", "createCheck"], role: "editor" },
  "checks.getAllChecks": { path: ["checks", "getAllChecks"], role: "viewer" },
  "checks.getCheck": { path: ["checks", "getCheck"], role: "viewer" },
  "checks.rerequestCheck": { path: ["checks", "rerequestCheck"], role: "editor" },
  "checks.updateCheck": { path: ["checks", "updateCheck"], role: "editor" },

  // checksV2
  "checksV2.createDeploymentCheckRun": { path: ["checksV2", "createDeploymentCheckRun"], role: "editor" },
  "checksV2.createProjectCheck": { path: ["checksV2", "createProjectCheck"], role: "admin" },
  "checksV2.deleteProjectCheck": { path: ["checksV2", "deleteProjectCheck"], role: "admin" },
  "checksV2.getDeploymentCheckRun": { path: ["checksV2", "getDeploymentCheckRun"], role: "viewer" },
  "checksV2.getProjectCheck": { path: ["checksV2", "getProjectCheck"], role: "viewer" },
  "checksV2.listCheckRuns": { path: ["checksV2", "listCheckRuns"], role: "viewer" },
  "checksV2.listDeploymentCheckRuns": { path: ["checksV2", "listDeploymentCheckRuns"], role: "viewer" },
  "checksV2.listProjectChecks": { path: ["checksV2", "listProjectChecks"], role: "viewer" },
  "checksV2.updateDeploymentCheckRun": { path: ["checksV2", "updateDeploymentCheckRun"], role: "editor" },
  "checksV2.updateProjectCheck": { path: ["checksV2", "updateProjectCheck"], role: "admin" },

  // deployments
  "deployments.getDeployments": { path: ["deployments", "getDeployments"], role: "viewer" },
  "deployments.cancelDeployment": { path: ["deployments", "cancelDeployment"], role: "editor" },
  "deployments.getDeployment": { path: ["deployments", "getDeployment"], role: "viewer" },

  // dns
  "dns.createRecord": { path: ["dns", "createRecord"], role: "editor" },
  "dns.getRecords": { path: ["dns", "getRecords"], role: "viewer" },
  "dns.removeRecord": { path: ["dns", "removeRecord"], role: "editor" },
  "dns.updateRecord": { path: ["dns", "updateRecord"], role: "editor" },

  // domains
  "domains.createOrReplaceDomain": { path: ["domains", "createOrReplaceDomain"], role: "editor" },
  "domains.getDomain": { path: ["domains", "getDomain"], role: "viewer" },
  "domains.checkDomainStatus": { path: ["domains", "checkDomainStatus"], role: "viewer" },

  // domainsRegistrar
  "domainsRegistrar.buyDomains": { path: ["domainsRegistrar", "buyDomains"], role: "admin" },
  "domainsRegistrar.buySingleDomain": { path: ["domainsRegistrar", "buySingleDomain"], role: "admin" },
  "domainsRegistrar.getBulkAvailability": { path: ["domainsRegistrar", "getBulkAvailability"], role: "viewer" },
  "domainsRegistrar.getDomainAuthCode": { path: ["domainsRegistrar", "getDomainAuthCode"], role: "admin" },
  "domainsRegistrar.getDomainAvailability": { path: ["domainsRegistrar", "getDomainAvailability"], role: "viewer" },
  "domainsRegistrar.getDomainPrice": { path: ["domainsRegistrar", "getDomainPrice"], role: "viewer" },
  "domainsRegistrar.getTldPrice": { path: ["domainsRegistrar", "getTldPrice"], role: "viewer" },
  "domainsRegistrar.renewDomain": { path: ["domainsRegistrar", "renewDomain"], role: "admin" },
  "domainsRegistrar.transferInDomain": { path: ["domainsRegistrar", "transferInDomain"], role: "admin" },

  // drains
  "drains.createDrain": { path: ["drains", "createDrain"], role: "admin" },
  "drains.deleteDrain": { path: ["drains", "deleteDrain"], role: "admin" },
  "drains.getDrain": { path: ["drains", "getDrain"], role: "viewer" },
  "drains.getDrains": { path: ["drains", "getDrains"], role: "viewer" },
  "drains.testDrain": { path: ["drains", "testDrain"], role: "editor" },
  "drains.updateDrain": { path: ["drains", "updateDrain"], role: "admin" },

  // edgeCache
  "edgeCache.dangerouslyDeleteBySrcImages": { path: ["edgeCache", "dangerouslyDeleteBySrcImages"], role: "admin" },
  "edgeCache.dangerouslyDeleteByTags": { path: ["edgeCache", "dangerouslyDeleteByTags"], role: "admin" },
  "edgeCache.invalidateBySrcImages": { path: ["edgeCache", "invalidateBySrcImages"], role: "editor" },
  "edgeCache.invalidateByTags": { path: ["edgeCache", "invalidateByTags"], role: "editor" },

  // edgeConfig
  "edgeConfig.createEdgeConfig": { path: ["edgeConfig", "createEdgeConfig"], role: "editor" },
  "edgeConfig.getEdgeConfigs": { path: ["edgeConfig", "getEdgeConfigs"], role: "viewer" },
  "edgeConfig.getEdgeConfig": { path: ["edgeConfig", "getEdgeConfig"], role: "viewer" },
  "edgeConfig.updateEdgeConfig": { path: ["edgeConfig", "updateEdgeConfig"], role: "editor" },

  // environment
  "environment.createCustomEnvironment": { path: ["environment", "createCustomEnvironment"], role: "admin" },
  "environment.createSharedEnvVariable": { path: ["environment", "createSharedEnvVariable"], role: "editor" },
  "environment.deleteSharedEnvVariable": { path: ["environment", "deleteSharedEnvVariable"], role: "editor" },
  "environment.getCustomEnvironment": { path: ["environment", "getCustomEnvironment"], role: "viewer" },
  "environment.getSharedEnvVar": { path: ["environment", "getSharedEnvVar"], role: "viewer" },
  "environment.listSharedEnvVariable": { path: ["environment", "listSharedEnvVariable"], role: "viewer" },
  "environment.removeCustomEnvironment": { path: ["environment", "removeCustomEnvironment"], role: "admin" },
  "environment.updateCustomEnvironment": { path: ["environment", "updateCustomEnvironment"], role: "admin" },
  "environment.updateSharedEnvVariable": { path: ["environment", "updateSharedEnvVariable"], role: "editor" },

  // env
  "env.filterProjectEnvs": { path: ["env", "filterProjectEnvs"], role: "viewer" },
  "env.createProjectEnv": { path: ["env", "createProjectEnv"], role: "editor" },
  "env.patchProjectEnv": { path: ["env", "patchProjectEnv"], role: "editor" },
  "env.removeProjectEnv": { path: ["env", "removeProjectEnv"], role: "editor" },

  // featureFlags
  "featureFlags.createFlag": { path: ["featureFlags", "createFlag"], role: "editor" },
  "featureFlags.createFlagSegment": { path: ["featureFlags", "createFlagSegment"], role: "editor" },
  "featureFlags.createSDKKey": { path: ["featureFlags", "createSDKKey"], role: "admin" },
  "featureFlags.deleteFlag": { path: ["featureFlags", "deleteFlag"], role: "editor" },
  "featureFlags.deleteFlagSegment": { path: ["featureFlags", "deleteFlagSegment"], role: "editor" },
  "featureFlags.deleteSDKKey": { path: ["featureFlags", "deleteSDKKey"], role: "admin" },
  "featureFlags.getFlag": { path: ["featureFlags", "getFlag"], role: "viewer" },
  "featureFlags.listFlags": { path: ["featureFlags", "listFlags"], role: "viewer" },
  "featureFlags.updateFlag": { path: ["featureFlags", "updateFlag"], role: "editor" },

  // integrations
  "integrations.getConfigurations": { path: ["integrations", "getConfigurations"], role: "viewer" },
  "integrations.createLogDrain": { path: ["integrations", "createLogDrain"], role: "admin" },
  "integrations.deleteLogDrain": { path: ["integrations", "deleteLogDrain"], role: "admin" },

  // logDrains
  "logDrains.createConfigurableLogDrain": { path: ["logDrains", "createConfigurableLogDrain"], role: "admin" },
  "logDrains.createLogDrain": { path: ["logDrains", "createLogDrain"], role: "admin" },
  "logDrains.deleteConfigurableLogDrain": { path: ["logDrains", "deleteConfigurableLogDrain"], role: "admin" },
  "logDrains.deleteIntegrationLogDrain": { path: ["logDrains", "deleteIntegrationLogDrain"], role: "admin" },
  "logDrains.getAllLogDrains": { path: ["logDrains", "getAllLogDrains"], role: "viewer" },
  "logDrains.getConfigurableLogDrain": { path: ["logDrains", "getConfigurableLogDrain"], role: "viewer" },
  "logDrains.getIntegrationLogDrains": { path: ["logDrains", "getIntegrationLogDrains"], role: "viewer" },

  // logs
  "logs.getRuntimeLogs": { path: ["logs", "getRuntimeLogs"], role: "viewer" },

  // marketplace
  "marketplace.createEvent": { path: ["marketplace", "createEvent"], role: "editor" },
  "marketplace.getAccountInfo": { path: ["marketplace", "getAccountInfo"], role: "viewer" },
  "marketplace.getIntegrationResource": { path: ["marketplace", "getIntegrationResource"], role: "viewer" },
  "marketplace.getInvoice": { path: ["marketplace", "getInvoice"], role: "viewer" },
  "marketplace.submitBillingData": { path: ["marketplace", "submitBillingData"], role: "editor" },
  "marketplace.submitInvoice": { path: ["marketplace", "submitInvoice"], role: "editor" },
  "marketplace.updateResource": { path: ["marketplace", "updateResource"], role: "editor" },

  // microfrontends
  "microfrontends.createMicrofrontendsGroupWithApplications": { path: ["microfrontends", "createMicrofrontendsGroupWithApplications"], role: "admin" },
  "microfrontends.getMicrofrontendsConfig": { path: ["microfrontends", "getMicrofrontendsConfig"], role: "viewer" },
  "microfrontends.getMicrofrontendsGroups": { path: ["microfrontends", "getMicrofrontendsGroups"], role: "viewer" },

  // networking
  "networking.createNetwork": { path: ["networking", "createNetwork"], role: "admin" },
  "networking.deleteNetwork": { path: ["networking", "deleteNetwork"], role: "admin" },
  "networking.listNetworks": { path: ["networking", "listNetworks"], role: "viewer" },
  "networking.readNetwork": { path: ["networking", "readNetwork"], role: "viewer" },
  "networking.updateNetwork": { path: ["networking", "updateNetwork"], role: "admin" },
  "networking.updateStaticIps": { path: ["networking", "updateStaticIps"], role: "admin" },

  // projectMembers
  "projectMembers.addProjectMember": { path: ["projectMembers", "addProjectMember"], role: "admin" },
  "projectMembers.getProjectMembers": { path: ["projectMembers", "getProjectMembers"], role: "viewer" },
  "projectMembers.removeProjectMember": { path: ["projectMembers", "removeProjectMember"], role: "admin" },

  // projectRoutes
  "projectRoutes.addRoute": { path: ["projectRoutes", "addRoute"], role: "editor" },
  "projectRoutes.deleteRoutes": { path: ["projectRoutes", "deleteRoutes"], role: "editor" },
  "projectRoutes.editRoute": { path: ["projectRoutes", "editRoute"], role: "editor" },
  "projectRoutes.generateRoute": { path: ["projectRoutes", "generateRoute"], role: "editor" },
  "projectRoutes.getRoutes": { path: ["projectRoutes", "getRoutes"], role: "viewer" },
  "projectRoutes.stageRoutes": { path: ["projectRoutes", "stageRoutes"], role: "editor" },

  // projects
  "projects.createProject": { path: ["projects", "createProject"], role: "admin" },
  "projects.getProject": { path: ["projects", "getProject"], role: "viewer" },
  "projects.updateProject": { path: ["projects", "updateProject"], role: "admin" },
  "projects.deleteProject": { path: ["projects", "deleteProject"], role: "admin" },

  // rollingRelease
  "rollingRelease.approveRollingReleaseStage": { path: ["rollingRelease", "approveRollingReleaseStage"], role: "admin" },
  "rollingRelease.completeRollingRelease": { path: ["rollingRelease", "completeRollingRelease"], role: "admin" },
  "rollingRelease.deleteRollingReleaseConfig": { path: ["rollingRelease", "deleteRollingReleaseConfig"], role: "admin" },
  "rollingRelease.getRollingRelease": { path: ["rollingRelease", "getRollingRelease"], role: "viewer" },
  "rollingRelease.getRollingReleaseConfig": { path: ["rollingRelease", "getRollingReleaseConfig"], role: "viewer" },
  "rollingRelease.updateRollingReleaseConfig": { path: ["rollingRelease", "updateRollingReleaseConfig"], role: "admin" },

  // sandboxes
  "sandboxes.createSessionDirectory": { path: ["sandboxes", "createSessionDirectory"], role: "editor" },
  "sandboxes.createSessionSnapshot": { path: ["sandboxes", "createSessionSnapshot"], role: "editor" },
  "sandboxes.deleteSandbox": { path: ["sandboxes", "deleteSandbox"], role: "editor" },
  "sandboxes.deleteSessionSnapshot": { path: ["sandboxes", "deleteSessionSnapshot"], role: "editor" },
  "sandboxes.extendSessionTimeout": { path: ["sandboxes", "extendSessionTimeout"], role: "editor" },
  "sandboxes.getNamedSandbox": { path: ["sandboxes", "getNamedSandbox"], role: "viewer" },
  "sandboxes.getSession": { path: ["sandboxes", "getSession"], role: "viewer" },
  "sandboxes.listSandboxes": { path: ["sandboxes", "listSandboxes"], role: "viewer" },
  "sandboxes.listSessions": { path: ["sandboxes", "listSessions"], role: "viewer" },
  "sandboxes.stopSession": { path: ["sandboxes", "stopSession"], role: "editor" },

  // secrets
  "secrets.createSecret": { path: ["secrets", "createSecret"], role: "editor" },
  "secrets.deleteSecret": { path: ["secrets", "deleteSecret"], role: "editor" },
  "secrets.listSecrets": { path: ["secrets", "listSecrets"], role: "viewer" },

  // security
  "security.addBypassIp": { path: ["security", "addBypassIp"], role: "admin" },
  "security.getActiveAttackStatus": { path: ["security", "getActiveAttackStatus"], role: "viewer" },
  "security.getBypassIp": { path: ["security", "getBypassIp"], role: "viewer" },
  "security.getFirewallConfig": { path: ["security", "getFirewallConfig"], role: "viewer" },
  "security.getSecurityFirewallEvents": { path: ["security", "getSecurityFirewallEvents"], role: "viewer" },
  "security.putFirewallConfig": { path: ["security", "putFirewallConfig"], role: "admin" },
  "security.removeBypassIp": { path: ["security", "removeBypassIp"], role: "admin" },
  "security.updateAttackChallengeMode": { path: ["security", "updateAttackChallengeMode"], role: "admin" },
  "security.updateFirewallConfig": { path: ["security", "updateFirewallConfig"], role: "admin" },

  // teams
  "teams.createTeam": { path: ["teams", "createTeam"], role: "admin" },
  "teams.getTeam": { path: ["teams", "getTeam"], role: "viewer" },
  "teams.getTeamMembers": { path: ["teams", "getTeamMembers"], role: "viewer" },

  // user
  "user.getAuthUser": { path: ["user", "getAuthUser"], role: "viewer" },
  "user.listEventTypes": { path: ["user", "listEventTypes"], role: "viewer" },
  "user.listUserEvents": { path: ["user", "listUserEvents"], role: "viewer" },
  "user.requestDelete": { path: ["user", "requestDelete"], role: "admin" },

  // webhooks
  "webhooks.createWebhook": { path: ["webhooks", "createWebhook"], role: "editor" },
  "webhooks.getWebhooks": { path: ["webhooks", "getWebhooks"], role: "viewer" },
  "webhooks.deleteWebhook": { path: ["webhooks", "deleteWebhook"], role: "editor" },
} as const;

type AdvancedVercelMethod = keyof typeof ADVANCED_VERCEL_METHODS;

function readJsonPayload(value: string) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    throw new Error("Payload must be valid JSON.");
  }
}

async function callVercelSdkMethod(
  vercel: unknown,
  path: readonly string[],
  payload: Record<string, unknown>
) {
  let target: any = vercel;

  for (const segment of path.slice(0, -1)) {
    target = target?.[segment];
  }

  const methodName = path[path.length - 1];
  const method = target?.[methodName];

  if (typeof method !== "function") {
    throw new Error(`Vercel SDK method ${path.join(".")} is unavailable.`);
  }

  return method.call(target, payload);
}

export async function runAdvancedVercelSdkAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const methodKey = readFormValue(formData, "method") as AdvancedVercelMethod;
  const returnTo = readFormValue(formData, "returnTo") || "/projects";
  const methodConfig = ADVANCED_VERCEL_METHODS[methodKey];

  if (!projectId || !methodConfig) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=unsupported_vercel_method`);
  }

  try {
    const payload = readJsonPayload(readFormValue(formData, "payload"));
    const { vercel } = await getAuthorizedVercelClient(
      user.id,
      projectId,
      methodConfig.role
    );

    await callVercelSdkMethod(vercel, methodConfig.path, payload);
  } catch (error: any) {
    console.error("Failed to run advanced Vercel SDK action:", error);
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=advanced_vercel_failed&message=${encodeURIComponent(error?.message || "")}`
    );
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function getAdvancedVercelSdkResource(
  projectId: string,
  methodKey: AdvancedVercelMethod,
  payload: Record<string, unknown> = {}
) {
  const user = await requireCurrentUser();
  const methodConfig = ADVANCED_VERCEL_METHODS[methodKey];

  if (!projectId || !methodConfig) {
    return { success: false, error: "Unsupported Vercel SDK method." };
  }

  try {
    const { vercel } = await getAuthorizedVercelClient(
      user.id,
      projectId,
      methodConfig.role
    );
    const result = await callVercelSdkMethod(vercel, methodConfig.path, payload);
    return { success: true, result };
  } catch (error: any) {
    console.error("Failed to fetch advanced Vercel SDK resource:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch advanced Vercel SDK resource.",
    };
  }
}

export async function saveProviderApiKeyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const provider = readFormValue(formData, "provider"); // "vercel" | "cloudflare"
  const accountId = readFormValue(formData, "accountId");
  const apiKey = readFormValue(formData, "apiKey");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!provider || !accountId || !apiKey) {
    redirect(returnTo);
  }

  const providerKey = `${provider}_${accountId}`;
  const encrypted = encryptSecret(apiKey);

  await prisma.$executeRawUnsafe(`
    INSERT INTO user_secrets (id, user_id, provider, encrypted_value, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (user_id, provider)
    DO UPDATE SET encrypted_value = EXCLUDED.encrypted_value, updated_at = NOW()
  `,
    crypto.randomUUID(),
    user.id,
    providerKey,
    encrypted
  );

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function linkProjectProviderAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const provider = readFormValue(formData, "provider");
  const accountId = readFormValue(formData, "accountId");
  const targetProjectId = readFormValue(formData, "targetProjectId");
  const edgeConfigId = readFormValue(formData, "edgeConfigId");
  const displayName = readFormValue(formData, "displayName") || `${provider} (${accountId})`;
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !provider || !accountId || !targetProjectId) {
    redirect(returnTo);
  }

  // Find project bundle
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true }
  });

  if (!project || !project.bundle) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=project_bundle_missing`);
  }

  const bundleId = project.bundle.id;

  // Retrieve current config from BundleExternalIntegrations (if exists)
  const existingIntegration = await prisma.bundleExternalIntegrations.findFirst({
    where: { bundleId, integrationType: "multi_provider" }
  });

  let providersList: MultiProviderConfig[] = [];
  if (existingIntegration) {
    try {
      providersList = JSON.parse(existingIntegration.config);
    } catch {}
  }

  // Add new config
  const newProvider: MultiProviderConfig & { displayName: string } = {
    provider: provider as any,
    accountId,
    projectId: targetProjectId,
    edgeConfigId: edgeConfigId || undefined,
    displayName
  };

  // Filter out existing duplicates based on provider, accountId, and targetProjectId
  providersList = providersList.filter(
    (p) => !(p.provider === provider && p.accountId === accountId && p.projectId === targetProjectId)
  );
  providersList.push(newProvider);

  // Save back to DB
  await prisma.bundleExternalIntegrations.upsert({
    where: {
      bundleId_integrationType: {
        bundleId,
        integrationType: "multi_provider"
      }
    },
    update: {
      config: JSON.stringify(providersList),
      displayName: "Multi Provider Links",
      updatedAt: new Date()
    },
    create: {
      id: crypto.randomUUID(),
      bundleId,
      integrationType: "multi_provider",
      displayName: "Multi Provider Links",
      config: JSON.stringify(providersList),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function unlinkProjectProviderAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const provider = readFormValue(formData, "provider");
  const accountId = readFormValue(formData, "accountId");
  const targetProjectId = readFormValue(formData, "targetProjectId");
  const returnTo = readFormValue(formData, "returnTo") || "/projects";

  if (!projectId || !provider || !accountId || !targetProjectId) {
    redirect(returnTo);
  }

  // Find project bundle
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true }
  });

  if (!project || !project.bundle) {
    redirect(returnTo);
  }

  const bundleId = project.bundle.id;

  const existingIntegration = await prisma.bundleExternalIntegrations.findFirst({
    where: { bundleId, integrationType: "multi_provider" }
  });

  if (existingIntegration) {
    let providersList: MultiProviderConfig[] = [];
    try {
      providersList = JSON.parse(existingIntegration.config);
    } catch {}

    providersList = providersList.filter(
      (p) => !(p.provider === provider && p.accountId === accountId && p.projectId === targetProjectId)
    );

    await prisma.bundleExternalIntegrations.update({
      where: { id: existingIntegration.id },
      data: {
        config: JSON.stringify(providersList),
        updatedAt: new Date()
      }
    });
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function getProjectProvidersAction(projectId: string) {
  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: { bundle: true }
    });

    if (!project || !project.bundle) {
      return { success: true, providers: [] };
    }

    const integration = await prisma.bundleExternalIntegrations.findFirst({
      where: { bundleId: project.bundle.id, integrationType: "multi_provider" }
    });

    if (!integration) {
      return { success: true, providers: [] };
    }

    const providers = JSON.parse(integration.config);
    return { success: true, providers: Array.isArray(providers) ? providers : [] };
  } catch (error: any) {
    console.error("Failed to fetch project providers:", error);
    return { success: false, error: error?.message || "Failed to fetch project providers" };
  }
}

export async function getVercelProjectsAction() {
  const user = await requireCurrentUser();
  const { getWorkspaceContext } = await import("@/lib/server/workspace");
  try {
    const workspace = await getWorkspaceContext(user.id);
    const orgId = workspace.activeOrganization?.id;
    if (!orgId) return { success: true, projects: [] };

    const projects = await prisma.project.findMany({
      where: {
        organizationId: orgId,
        vercelProjectId: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        vercelProjectId: true,
      },
    });
    return { success: true, projects };
  } catch (error: any) {
    console.error("Failed to fetch Vercel projects:", error);
    return { success: false, error: error?.message || "Failed to fetch projects" };
  }
}






