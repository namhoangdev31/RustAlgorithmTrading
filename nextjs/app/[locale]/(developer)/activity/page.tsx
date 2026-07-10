import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { ActivityTab } from "@/components/projects/tabs/ActivityTab";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WorkspaceActivityPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});

  return (
    <ActivityTab
      data={data}
      locale={locale}
    />
  );
}
