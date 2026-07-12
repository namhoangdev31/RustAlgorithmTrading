import { requireCurrentUser } from "@/lib/server/current-user";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WebhookManager } from "./WebhookManager";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipWebhooksSettingsPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project || !data.project.bundle) {
    redirect(`/${locale}/lepoship`);
  }

  const bundle = data.project.bundle;

  // Retrieve project webhooks
  const webhooks = await prisma.bundleWebhooks.findMany({
    where: { bundleId: bundle.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card className="bg-card border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          Outbound Event Webhooks
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Receive real-time HTTPS callbacks signed with HMAC-SHA256 when builds start/succeed/fail, releases are published, or orders are completed.
        </CardDescription>
      </CardHeader>
      <Separator className="my-4 border-hairline" />
      <CardContent className="px-0 pb-0">
        <WebhookManager projectId={projectId} initialWebhooks={webhooks} />
      </CardContent>
    </Card>
  );
}
