import { cookies } from "next/headers";

import { PortalShell } from "@/components/portal/PortalShell";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getWorkspaceContext } from "@/lib/server/workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const [workspace, cookieStore] = await Promise.all([
    getWorkspaceContext(user.id),
    cookies(),
  ]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <PortalShell
      activeOrganizationId={workspace.activeOrganization?.id}
      defaultOpen={defaultOpen}
      organizations={workspace.organizations}
      user={{
        email: user.email ?? null,
        fullName: user.fullName ?? null,
        provider: user.provider,
        photoUrl: user.photo?.path ?? null,
        userType: user.userType,
      }}
    >
      {children}
    </PortalShell>
  );
}

