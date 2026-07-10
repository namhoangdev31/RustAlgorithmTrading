import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HelpCenterPage() {
  const t = await getTranslations("HelpCenter");

  const topics = [
    {
      key: "organizations",
      title: t("topics.organizations.title"),
      body: t("topics.organizations.body"),
    },
    {
      key: "projects_and_bundles",
      title: t("topics.projects_and_bundles.title"),
      body: t("topics.projects_and_bundles.body"),
    },
    {
      key: "projects",
      title: t("topics.projects.title"),
      body: t("topics.projects.body"),
    },
    {
      key: "apps",
      title: t("topics.apps.title"),
      body: t("topics.apps.body"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={t("description")}
        title={t("title")}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <Card key={topic.key} className="bg-card border border-hairline">
            <CardHeader>
              <CardTitle className="text-base font-bold">{topic.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">{topic.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="h-8 text-xs">
                <Link href="/overview">{t("open_dashboard") || "Go to Overview"}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
