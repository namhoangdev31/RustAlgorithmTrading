import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
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
    } catch (_) { }
  }

  const t = await getTranslations("Settings");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("appearance.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("appearance.description")}
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-6">
        <AppearanceForm initialTheme={initialTheme} />
      </div>
    </div>
  );
}
