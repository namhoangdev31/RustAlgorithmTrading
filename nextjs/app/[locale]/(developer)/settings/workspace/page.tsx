import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/portal/PageHeader";
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
import { WorkspaceGovernanceCard } from "@/components/dashboard/workspace-governance-card";

export default async function AccountSettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);
  const t = await getTranslations("Settings");

  return (
    <div className="space-y-6">
      <PageHeader
        description={t("account.description")}
        title={t("account.title")}
      />
      <div className="flex flex-col gap-6">
        <Card className="bg-card border border-hairline">
          <CardHeader>
            <CardTitle className="text-base font-bold">{t("account.profile_title")}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">{t("account.profile_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm user={data.user as any} />
          </CardContent>
        </Card>
        
        {data.workspace.organizations.map((organization) => {
          const orgTypeLocalized = organization.type === "personal" 
            ? t("account.org_personal") 
            : t("account.org_corporate");
          const canDelete = data.workspace.organizations.length > 1 && organization.type === "corporate";
          return (
            <Card key={organization.id} className="bg-card border border-hairline">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  {t("account.org_title", { type: orgTypeLocalized })}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  {t("account.org_desc", { count: organization.projects.length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationForm organization={organization} canDelete={canDelete} />
              </CardContent>
            </Card>
          );
        })}
        
        {data.workspace.activeOrganization ? (
          <WorkspaceGovernanceCard
            organizationId={data.workspace.activeOrganization.id}
            members={data.workspaceMembers}
            usage={data.workspaceUsage}
          />
        ) : null}
      </div>
    </div>
  );
}
