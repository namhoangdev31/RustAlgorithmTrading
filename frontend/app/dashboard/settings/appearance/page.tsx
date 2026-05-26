import { cookies } from "next/headers";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Separator } from "@/components/ui/separator";
import { AppearanceForm } from "@/components/dashboard/appearance-form";

export default async function AppearanceSettingsPage() {
  const cookieStore = await cookies();
  const displayCookie = cookieStore.get("dashboard_display");
  let initialTheme = "light";
  if (displayCookie) {
    try {
      const parsed = JSON.parse(displayCookie.value);
      if (parsed.theme === "dark" || parsed.theme === "light") {
        initialTheme = parsed.theme;
      }
    } catch (_) {}
  }

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-4 lg:my-6" />

      <div className="flex flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-12">
        {/* <aside className="top-0 lg:sticky lg:w-1/5">
          <SettingsNav />
        </aside> */}
        <div className="flex w-full overflow-y-hidden p-1">
          <div className="flex flex-1 flex-col">
            <div className="flex-none">
              <h3 className="text-lg font-medium">Appearance</h3>
              <p className="text-sm text-muted-foreground">
                Customize the appearance of the app. Automatically switch between day
                and night themes.
              </p>
            </div>
            <Separator className="my-4 flex-none" />
            <div className="faded-bottom h-full w-full overflow-y-auto scroll-smooth pb-12 pe-4">
              <AppearanceForm initialTheme={initialTheme} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
