import { updateDisplayPreferenceAction } from "@/app/actions/admin";
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

export default function AppearanceSettingsPage() {
  return (
    <>
      <PageHeader
        description="Server-stored appearance preference for the dashboard shell."
        title="Appearance"
      />
      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        <SettingsNav />
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Saved to an HTTP-only dashboard preference cookie.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateDisplayPreferenceAction} className="flex flex-col gap-4">
              <input
                type="hidden"
                name="returnTo"
                value="/dashboard/settings/appearance"
              />
              <label className="grid gap-2 text-sm">
                Preferred theme
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  name="theme"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <input type="hidden" name="density" value="comfortable" />
              <Button className="w-fit" type="submit">Save appearance</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

