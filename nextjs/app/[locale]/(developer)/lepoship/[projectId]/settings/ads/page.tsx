import { requireCurrentUser } from "@/lib/server/current-user";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AdsForm } from "./AdsForm";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipAdsSettingsPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project || !data.project.bundle) {
    redirect(`/${locale}/lepoship`);
  }

  const bundle = data.project.bundle;

  // Retrieve current ad configurations
  const adConfig = await prisma.bundleAdConfigurations.findUnique({
    where: { bundleId: bundle.id },
  });

  return (
    <Card className="bg-card border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          Advertising Configurations
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Configure monetization settings, placement units, and sandbox testing overrides for LepoShip SDK runtime ads.
        </CardDescription>
      </CardHeader>
      <Separator className="my-4 border-hairline" />
      <CardContent className="px-0 pb-0">
        <AdsForm projectId={projectId} initialConfig={adConfig} />
      </CardContent>
    </Card>
  );
}
