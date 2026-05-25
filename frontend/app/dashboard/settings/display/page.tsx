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

export default function DisplaySettingsPage() {
  return (
    <>
      <PageHeader
        description="Density and layout are server preferences, not client state."
        title="Display"
      />
      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        <SettingsNav />
        <Card>
          <CardHeader>
            <CardTitle>Display density</CardTitle>
            <CardDescription>Saved without localStorage or client hydration.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateDisplayPreferenceAction} className="flex flex-col gap-4">
              <input type="hidden" name="returnTo" value="/dashboard/settings/display" />
              <input type="hidden" name="theme" value="system" />
              <label className="grid gap-2 text-sm">
                Density
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  name="density"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                  <option value="spacious">Spacious</option>
                </select>
              </label>
              <Button className="w-fit" type="submit">Save display</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

