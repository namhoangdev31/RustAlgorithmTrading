import { headers } from "next/headers";

import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { ScimDirectorySettings } from "@/components/portal/ScimDirectorySettings";
import { PageHeader } from "@/components/portal/PageHeader";
import { EmptyState } from "@/components/portal/EmptyState";

export default async function DirectorySettingsPage() {
  const currentUser = await requireCurrentUser();
  
  const org = await prisma.organization.findFirst({
    where: {
      OR: [
        { userId: currentUser.id },
        { members: { some: { userId: currentUser.id, inviteStatus: "accepted" } } },
      ],
    },
  });

  if (!org) {
    return (
      <EmptyState
        title="No workspace available"
        description="Create or join a workspace before configuring directory synchronization."
      />
    );
  }

  const [connection, mappings, requestHeaders] = await Promise.all([
    prisma.workspaceProviderConnection.findUnique({
      where: { organizationId_provider: { organizationId: org.id, provider: "scim" } },
      select: { status: true },
    }),
    prisma.nativeScimMapping.findMany({
      where: { organizationId: org.id },
      orderBy: { updatedAt: "desc" },
    }),
    headers(),
  ]);
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = host ? `${protocol}://${host}` : "";
  // The bearer credential identifies the workspace; query parameters would break
  // providers that append /Users and /Groups to this base URL.
  const baseUrl = `${origin}/api/scim/v2`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directory Sync"
        description="Provision workspace users and groups through a real SCIM 2.0 connection."
      />
      <ScimDirectorySettings
        organizationId={org.id}
        initialBaseUrl={baseUrl}
        initialConfigured={connection?.status === "active"}
        mappings={mappings.map((mapping) => ({
          id: mapping.id,
          provider: mapping.provider,
          resourceType: mapping.resourceType,
          externalId: mapping.externalId,
          localRole: mapping.localRole,
          metadata: mapping.metadata,
          updatedAt: mapping.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
