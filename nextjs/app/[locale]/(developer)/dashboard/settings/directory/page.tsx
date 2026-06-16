import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Separator } from "@/components/ui/separator";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { ScimSettingsClient } from "@/components/dashboard/scim-settings-client";
import { getScimConfigAction } from "@/app/actions/scim";

export default async function DirectorySettingsPage() {
  const currentUser = await requireCurrentUser();
  
  // Find first organization owned by this user
  const org = await prisma.organization.findFirst({
    where: { userId: currentUser.id },
  });

  if (!org) {
    return (
      <div className="flex flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-12">
        <aside className="lg:w-1/5">
          <SettingsNav />
        </aside>
        <div className="flex w-full overflow-y-hidden p-1 items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Please create an organization on the dashboard first.
          </p>
        </div>
      </div>
    );
  }

  // Load existing SCIM credentials and mappings
  let baseUrl: string | null = null;
  let token: string | null = null;
  let mappings: any[] = [];

  try {
    const res = await getScimConfigAction(org.id);
    if (res.success) {
      baseUrl = res.scimBaseUrl;
      token = res.scimToken;
      mappings = res.mappings;
    }
  } catch (_) {
    // If not generated, mappings start empty
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-12">
      <aside className="lg:w-1/5">
        <SettingsNav />
      </aside>
      <div className="flex w-full overflow-y-hidden p-1">
        <div className="flex flex-1 flex-col">
          <div className="flex-none">
            <h3 className="text-lg font-medium">Directory Sync</h3>
            <p className="text-sm text-muted-foreground">
              Automated user and group provisioning (SCIM) credentials for Microsoft Azure AD & Okta.
            </p>
          </div>
          <Separator className="my-4 flex-none" />
          <div className="faded-bottom h-full w-full overflow-y-auto scroll-smooth pb-12 pe-4">
            <ScimSettingsClient
              organizationId={org.id}
              initialBaseUrl={baseUrl}
              initialToken={token}
              initialMappings={mappings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
