import { getTranslations } from "next-intl/server";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Separator } from "@/components/ui/separator";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { VercelApiKeyForm } from "@/components/dashboard/vercel-api-key-form";
import { prisma } from "@/lib/server/prisma";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ vercel?: string }>;
}) {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);
  const user = data.user;
  const t = await getTranslations("Settings");
  const vercelSecretRows = await prisma.$queryRawUnsafe<Array<{ provider: string }>>(
    "SELECT provider FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
    currentUser.id,
    "vercel"
  ).catch(() => []);
  const hasSavedVercelKey = vercelSecretRows.length > 0;
  const search = searchParams ? await searchParams : undefined;
  const vercelStatus = search?.vercel;

  return (
    <>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-12">
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
              <div className="mt-6">
                <VercelApiKeyForm hasSavedKey={hasSavedVercelKey} status={typeof vercelStatus === "string" ? vercelStatus : undefined} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
