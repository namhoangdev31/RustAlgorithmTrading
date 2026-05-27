import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
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
      key: "tasks",
      title: t("topics.tasks.title"),
      body: t("topics.tasks.body"),
    },
    {
      key: "apps",
      title: t("topics.apps.title"),
      body: t("topics.apps.body"),
    },
  ];

  return (
    <>
      <PageHeader
        description={t("description")}
        title={t("title")}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <Card key={topic.key}>
            <CardHeader>
              <CardTitle>{topic.title}</CardTitle>
              <CardDescription>{topic.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/dashboard">{t("open_dashboard")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}


