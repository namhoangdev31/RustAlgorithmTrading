import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { ActivityTab } from "@/components/projects/tabs/ActivityTab";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectActivityPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  return (
    <ActivityTab
      data={{ projects: [project], workspace: data.workspace }}
      locale={locale}
    />
  );
}
