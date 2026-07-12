import { requireCurrentUser } from "@/lib/server/current-user";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TokensList } from "./TokensList";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipSdkTokensPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project || !data.project.bundle) {
    redirect(`/${locale}/lepoship`);
  }

  const bundle = data.project.bundle;

  // Retrieve active (non-revoked) SDK Ingestion tokens
  const activeTokens = await prisma.bundleSdkTokens.findMany({
    where: {
      bundleId: bundle.id,
      isRevoked: false,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card className="bg-card border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          SDK Credentials & Keys
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Manage ingestion tokens for telemetry streaming and user report collections within LepoShip SDK client packages.
        </CardDescription>
      </CardHeader>
      <Separator className="my-4 border-hairline" />
      <CardContent className="px-0 pb-0">
        <TokensList projectId={projectId} initialTokens={activeTokens} />
      </CardContent>
    </Card>
  );
}
