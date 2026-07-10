import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { DeploymentsTab } from "@/components/projects/tabs/DeploymentsTab";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WorkspaceDeploymentsPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  
  const vercelConnected = await hasVercelApiKey(user.id);
  let vercelDeployments: any[] = [];
  let vercelConnectionError = false;

  if (vercelConnected) {
    try {
      const vercel = await getVercelClient(user.id);
      const deploymentsRes = await vercel.deployments.getDeployments({ limit: 50 });
      vercelDeployments = deploymentsRes.deployments || [];
    } catch (err) {
      console.error("Error fetching Vercel deployments in workspace page:", err);
      vercelConnectionError = true;
    }
  }

  return (
    <DeploymentsTab
      vercelConnected={vercelConnected}
      vercelDeployments={vercelDeployments}
      vercelConnectionError={vercelConnectionError}
      locale={locale}
      projects={data.projects}
    />
  );
}
