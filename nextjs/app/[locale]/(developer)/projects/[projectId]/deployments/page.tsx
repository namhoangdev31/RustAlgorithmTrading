import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { DeploymentsTab } from "@/components/projects/tabs/DeploymentsTab";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectDeploymentsPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  const vercelConnected = await hasVercelApiKey(user.id);
  let vercelDeployments: any[] = [];
  if (vercelConnected && project.vercelProjectId) {
    try {
      const vercel = await getVercelClient(user.id);
      const deploymentsRes = await vercel.deployments.getDeployments({ projectId: project.vercelProjectId, limit: 10 });
      vercelDeployments = deploymentsRes.deployments || [];
    } catch (err) {
      console.error("Error fetching Vercel deployments:", err);
    }
  }

  return (
    <DeploymentsTab
      vercelConnected={vercelConnected}
      vercelDeployments={vercelDeployments}
      locale={locale}
      project={project}
    />
  );
}
