import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { OrganizationForm } from "@/components/dashboard/organization-form";
import { AccountForm } from "@/components/dashboard/account-form";

export default async function AccountSettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);
  const t = await getTranslations("Settings");

  return (
    <>
      <PageHeader
        description={t("account.description")}
        title={t("account.title")}
      />
      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        <SettingsNav />
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("account.profile_title")}</CardTitle>
              <CardDescription>{t("account.profile_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountForm user={data.user as any} />
            </CardContent>
          </Card>
          {data.workspace.organizations.map((organization) => {
            const orgTypeLocalized = organization.type === "personal" 
              ? t("account.org_personal") 
              : t("account.org_corporate");
            return (
              <Card key={organization.id}>
                <CardHeader>
                  <CardTitle>
                    {t("account.org_title", { type: orgTypeLocalized })}
                  </CardTitle>
                  <CardDescription>
                    {t("account.org_desc", { count: organization.projects.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OrganizationForm organization={organization} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

