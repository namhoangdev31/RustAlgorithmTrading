import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { OrganizationForm } from "@/components/dashboard/organization-form";

export default async function AccountSettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);

  return (
    <>
      <PageHeader
        description="Organization settings preserve one personal and one corporate workspace."
        title="Account"
      />
      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        <SettingsNav />
        <div className="flex flex-col gap-4">
          {data.workspace.organizations.map((organization) => (
            <Card key={organization.id}>
              <CardHeader>
                <CardTitle>{organization.type} organization</CardTitle>
                <CardDescription>
                  {organization.projects.length} projects in this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationForm organization={organization} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

