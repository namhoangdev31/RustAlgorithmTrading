import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { DomainsTab } from "@/components/projects/tabs/DomainsTab";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectDomainsPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  const vercelConnected = await hasVercelApiKey(user.id);
  let vercelAliases: any[] = [];
  let vercelProjectDomains: any[] = [];
  if (vercelConnected && project.vercelProjectId) {
    try {
      const vercel = await getVercelClient(user.id);
      const [aliasesRes, domainsRes] = await Promise.allSettled([
        vercel.aliases.listAliases({ projectId: project.vercelProjectId, limit: 50 }),
        vercel.projects.getProjectDomains({ idOrName: project.vercelProjectId }),
      ]);
      if (aliasesRes.status === "fulfilled") {
        vercelAliases = (aliasesRes.value as any).aliases || [];
      }
      if (domainsRes.status === "fulfilled") {
        vercelProjectDomains = (domainsRes.value as any).domains || [];
      }
    } catch (err) {
      console.error("Error loading Vercel domains details:", err);
    }
  }

  return (
    <DomainsTab
      vercelConnected={vercelConnected}
      vercelAliases={vercelAliases}
      vercelProjectDomains={vercelProjectDomains}
      vercelProjectId={project.vercelProjectId || undefined}
      locale={locale}
      projectId={project.id}
    />
  );
}
