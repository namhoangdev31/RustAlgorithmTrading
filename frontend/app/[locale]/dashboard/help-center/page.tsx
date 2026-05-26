import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const topics = [
  {
    title: "Organizations",
    body: "Every account owns one personal and one corporate organization. Switch from the sidebar.",
  },
  {
    title: "Projects and bundles",
    body: "Create a project from the dashboard. The server action creates its bundle in the same transaction.",
  },
  {
    title: "Tasks",
    body: "Tasks are review queue records scoped to bundles owned by the active organization.",
  },
  {
    title: "Apps",
    body: "Connected apps are bundle external integrations. Use active/inactive state to pause integrations.",
  },
];

export default function HelpCenterPage() {
  return (
    <>
      <PageHeader
        description="Operational notes for the SSR admin dashboard."
        title="Help Center"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <Card key={topic.title}>
            <CardHeader>
              <CardTitle>{topic.title}</CardTitle>
              <CardDescription>{topic.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

