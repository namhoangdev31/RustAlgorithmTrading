import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

export default async function MarketplaceListingsPage() {
  const user = await requireCurrentUser();
  const listings = await prisma.bundles.findMany({
    where: {
      deletedAt: null,
      OR: [
        { developerId: user.id },
        { collaborators: { some: { userId: user.id } } },
        { project: { members: { some: { userId: user.id, inviteStatus: "accepted" } } } },
      ],
    },
    select: { id: true, name: true, version: true, status: true, updatedAt: true, externalIntegrations: { select: { id: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Listings"
        description="Manage draft, review, and published bundles backed by persisted catalog records."
        actions={<Button asChild><Link href="/marketplace">Register integration</Link></Button>}
      />
      <Card>
        <CardHeader><CardTitle className="text-base">Listings</CardTitle><CardDescription>Publication status is shown only from catalog evidence.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {listings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No marketplace listings.</div>
          ) : listings.map((listing) => (
            <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div><p className="font-medium">{listing.name}</p><p className="text-xs text-muted-foreground">v{listing.version} · {listing.externalIntegrations.length} integrations · Updated {listing.updatedAt.toLocaleDateString()}</p></div>
              <StatusBadge status={listing.status === "published" ? "active" : listing.status === "suspended" || listing.status === "removed" ? "error" : "pending"} label={listing.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
