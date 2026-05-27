import { getTranslations } from "next-intl/server";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Separator } from "@/components/ui/separator";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function SettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);
  const user = data.user;
  const t = await getTranslations("Settings");

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
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
              <h3 className="text-lg font-medium">{t("profile.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("profile.description")}
              </p>
            </div>
            <Separator className="my-4 flex-none" />
            <div className="faded-bottom h-full w-full overflow-y-auto scroll-smooth pb-12 pe-4">
              <ProfileForm user={user as any} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

