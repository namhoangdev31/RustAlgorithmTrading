"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getVercelClient } from "@/lib/server/vercel";

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


