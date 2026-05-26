import { cookies } from "next/headers";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DisplayForm } from "@/components/dashboard/display-form";

export default async function DisplaySettingsPage() {
  const cookieStore = await cookies();
  const displayCookie = cookieStore.get("dashboard_display");
  let initialDensity = "comfortable";
  let initialTheme = "light";
  if (displayCookie) {
    try {
      const parsed = JSON.parse(displayCookie.value);
      if (parsed.density) {
        initialDensity = parsed.density;
      }
      if (parsed.theme) {
        initialTheme = parsed.theme;
      }
    } catch (_) {}
  }

  return (
    <>
      <PageHeader
        description="Density and layout are server preferences, not client state."
        title="Display"
      />
      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        {/* <SettingsNav /> */}
        <Card>
          <CardHeader>
            <CardTitle>Display density</CardTitle>
            <CardDescription>Saved without localStorage or client hydration.</CardDescription>
          </CardHeader>
          <CardContent>
            <DisplayForm initialDensity={initialDensity} initialTheme={initialTheme} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

