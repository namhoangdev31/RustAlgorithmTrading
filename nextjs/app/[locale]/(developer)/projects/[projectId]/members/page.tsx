import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { MembersTab } from "@/components/projects/tabs/MembersTab";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectMembersPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  return (
    <MembersTab
      project={project as any}
      locale={locale}
    />
  );
}
