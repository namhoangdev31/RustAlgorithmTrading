import { updateOrganizationAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

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
                <form action={updateOrganizationAction} className="flex flex-col gap-4">
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <input type="hidden" name="type" value={organization.type} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value="/dashboard/settings/account"
                  />
                  <label className="grid gap-2 text-sm">
                    Name
                    <Input name="name" defaultValue={organization.name} />
                  </label>
                  <Button className="w-fit" type="submit">Save organization</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

