import { updateProfileAction } from "@/app/actions/admin";
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

export default async function SettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);
  const user = data.user;

  return (
    <>
      <PageHeader
        description="Profile settings are written directly to the User model."
        title="Settings"
      />

      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        <SettingsNav />
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update public account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="returnTo" value="/dashboard/settings" />
              <label className="grid gap-2 text-sm">
                First name
                <Input defaultValue={user?.firstName ?? ""} name="firstName" />
              </label>
              <label className="grid gap-2 text-sm">
                Last name
                <Input defaultValue={user?.lastName ?? ""} name="lastName" />
              </label>
              <label className="grid gap-2 text-sm">
                Full name
                <Input defaultValue={user?.fullName ?? ""} name="fullName" />
              </label>
              <label className="grid gap-2 text-sm">
                Phone
                <Input defaultValue={user?.phone ?? ""} name="phone" />
              </label>
              <label className="grid gap-2 text-sm">
                Gender
                <Input defaultValue={user?.gender ?? ""} name="gender" />
              </label>
              <label className="grid gap-2 text-sm">
                Email
                <Input defaultValue={user?.email ?? ""} disabled />
              </label>
              <div className="md:col-span-2">
                <Button type="submit">Update profile</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
