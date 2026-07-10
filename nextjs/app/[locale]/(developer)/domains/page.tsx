import * as React from "react";
import { requireCurrentUser } from "@/lib/server/current-user";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { DomainsTab } from "@/components/projects/tabs/DomainsTab";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WorkspaceDomainsPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await requireCurrentUser();
  
  const vercelConnected = await hasVercelApiKey(user.id);
  let vercelAliases: any[] = [];
  let vercelConnectionError = false;

  if (vercelConnected) {
    try {
      const vercel = await getVercelClient(user.id);
      const aliasesRes = await vercel.aliases.listAliases({ limit: 50 });
      vercelAliases = aliasesRes.aliases || [];
    } catch (err) {
      console.error("Error fetching Vercel aliases in workspace page:", err);
      vercelConnectionError = true;
    }
  }

  return (
    <DomainsTab
      vercelConnected={vercelConnected}
      vercelAliases={vercelAliases}
      vercelConnectionError={vercelConnectionError}
      locale={locale}
    />
  );
}
