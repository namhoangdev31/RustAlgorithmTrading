import { AdminShell } from "@/components/dashboard/admin-shell";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getWorkspaceContext } from "@/lib/server/workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const workspace = await getWorkspaceContext(user.id);

  return (
    <AdminShell
      user={{
        email: user.email ?? null,
        fullName: user.fullName ?? null,
        provider: user.provider,
      }}
      workspace={workspace}
    >
      {children}
    </AdminShell>
  );
}

