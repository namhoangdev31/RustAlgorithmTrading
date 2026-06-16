"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { purgeNativeCache } from "@/lib/server/native-platform/cache";
import { createAiDiagnostic } from "@/lib/server/native-platform/diagnostics";
import { activateNativeDeployment, syncProjectRouting } from "@/lib/server/native-platform/deployments";
import { renewDomainSsl } from "@/lib/server/native-platform/ssl";
import {
  installNativePlugin,
  toggleNativePlugin,
  uninstallNativePlugin,
  upsertNativePlugin,
} from "@/lib/server/native-platform/plugins";

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function rollbackNativeDeploymentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const deploymentId = readFormValue(formData, "deploymentId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=deployments`;

  if (!projectId || !deploymentId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "admin");
  await activateNativeDeployment(projectId, deploymentId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createNativeDomainAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domain = readFormValue(formData, "domain");
  const dnsProvider = readFormValue(formData, "dnsProvider") || null;
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=domains`;

  if (!projectId || !domain) {
    redirect(returnTo);
  }

  // Parse credentials
  let dnsCredentials: Record<string, any> | null = null;
  if (dnsProvider) {
    dnsCredentials = {};
    if (dnsProvider === "CLOUDFLARE") {
      dnsCredentials.cloudflareToken = readFormValue(formData, "cloudflareToken");
    } else if (dnsProvider === "ROUTE53") {
      dnsCredentials.awsAccessKeyId = readFormValue(formData, "awsAccessKeyId");
      dnsCredentials.awsSecretAccessKey = readFormValue(formData, "awsSecretAccessKey");
    } else if (dnsProvider === "GODADDY") {
      dnsCredentials.godaddyApiKey = readFormValue(formData, "godaddyApiKey");
      dnsCredentials.godaddyApiSecret = readFormValue(formData, "godaddyApiSecret");
    }
  }

  await requireProjectRole(user.id, projectId, "editor");
  await prisma.nativeDomainConfig.upsert({
    where: { domain },
    create: {
      projectId,
      domain,
      txtRecordToken: `lepos-domain-${crypto.randomUUID()}`,
      dnsProvider,
      dnsCredentials: dnsCredentials ? (dnsCredentials as any) : undefined,
    },
    update: {
      dnsProvider,
      dnsCredentials: dnsCredentials ? (dnsCredentials as any) : undefined,
      lastDnsCheckAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await syncProjectRouting(projectId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function purgeNativeCacheAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const path = readFormValue(formData, "path") || "/";
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await purgeNativeCache(projectId, path);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function runNativeDiagnosticAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const crashReportId = readFormValue(formData, "crashReportId") || undefined;
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await createAiDiagnostic({ projectId, crashReportId });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function renewNativeDomainSslAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domainId = readFormValue(formData, "domainId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=domains`;

  if (!projectId || !domainId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await renewDomainSsl(domainId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function submitNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  const slug = readFormValue(formData, "slug");
  const name = readFormValue(formData, "name");
  const version = readFormValue(formData, "version") || "0.1.0";
  const bundleUrl = readFormValue(formData, "bundleUrl");
  const description = readFormValue(formData, "description");
  const permissionsRaw = readFormValue(formData, "permissions");
  const permissions = permissionsRaw ? permissionsRaw.split(",").map((p) => p.trim()).filter(Boolean) : [];

  if (!slug || !name || !bundleUrl) {
    redirect(returnTo);
  }

  if (projectId) {
    await requireProjectRole(user.id, projectId, "editor");
  }

  await upsertNativePlugin({
    slug,
    name,
    version,
    bundleUrl,
    description,
    permissions,
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function installNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const configRaw = readFormValue(formData, "config");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !pluginId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  let config: any = null;
  if (configRaw) {
    try {
      config = JSON.parse(configRaw);
    } catch {
      config = { value: configRaw };
    }
  }

  await installNativePlugin(projectId, pluginId, config);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function uninstallNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !pluginId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  await uninstallNativePlugin(projectId, pluginId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const enabled = readFormValue(formData, "enabled") === "true";
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !pluginId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  await toggleNativePlugin(projectId, pluginId, enabled);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function checkCloudTargetsHealthAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  const { checkCloudTargetsHealth } = await import("@/lib/server/native-platform/failover");
  await checkCloudTargetsHealth(projectId);

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleCloudTargetHealthAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const targetId = readFormValue(formData, "targetId");
  const enabledVal = readFormValue(formData, "enabled");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !targetId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  const { toggleCloudTargetHealth } = await import("@/lib/server/native-platform/failover");

  let status: "healthy" | "unhealthy" | "overloaded" = "healthy";
  if (enabledVal === "healthy" || enabledVal === "unhealthy" || enabledVal === "overloaded") {
    status = enabledVal;
  } else {
    status = enabledVal === "true" ? "healthy" : "unhealthy";
  }

  await toggleCloudTargetHealth(projectId, targetId, status);

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function reviewNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const status = readFormValue(formData, "status"); // 'approved', 'rejected', 'pending'
  const notes = readFormValue(formData, "notes");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!pluginId || !status) {
    redirect(returnTo);
  }

  if (projectId) {
    await requireProjectRole(user.id, projectId, "editor");
  }

  const plugin = await prisma.nativePlugin.findUnique({
    where: { id: pluginId }
  });

  if (plugin) {
    const existingMetadata = typeof plugin.metadata === "object" && plugin.metadata !== null ? (plugin.metadata as Record<string, any>) : {};
    const updatedMetadata = {
      ...existingMetadata,
      status,
      reviewedBy: user.email || user.id,
      reviewedAt: new Date().toISOString(),
      notes: notes || undefined
    };

    await prisma.nativePlugin.update({
      where: { id: pluginId },
      data: {
        metadata: updatedMetadata
      }
    });
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}
