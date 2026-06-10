"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getVercelClient, getAuthorizedVercelClient } from "@/lib/server/vercel";

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
  } catch (error: any) {
    console.error("Failed to patch Edge Config item:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=patch_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

const ADVANCED_VERCEL_METHODS = {
  deploymentProtection: {
    path: ["projects", "updateProjectProtection"],
    role: "admin",
  },
  firewallConfig: {
    path: ["security", "updateFirewallConfig"],
    role: "admin",
  },
  logDrain: {
    path: ["logDrains", "createLogDrain"],
    role: "admin",
  },
  deploymentCheck: {
    path: ["checks", "createCheck"],
    role: "editor",
  },
  projectMember: {
    path: ["projectMembers", "addProjectMember"],
    role: "admin",
  },
  dnsRecord: {
    path: ["dns", "createRecord"],
    role: "admin",
  },
  featureFlag: {
    path: ["featureFlags", "createFlag"],
    role: "editor",
  },
  gitSettings: {
    path: ["projects", "updateProject"],
    role: "admin",
  },
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





