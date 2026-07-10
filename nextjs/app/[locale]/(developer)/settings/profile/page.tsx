import { getTranslations } from "next-intl/server";
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("profile.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("profile.description")}
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-6">
        <ProfileForm user={user as any} />
      </div>
    </div>
  );
}
