import Link from "next/link";
import { PlugZap } from "lucide-react";

import {
  deleteIntegrationAction,
  toggleIntegrationAction,
  upsertIntegrationAction,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAppsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

type AppsPageProps = {
  searchParams: Promise<{
    q?: string;
    active?: string;
    dialog?: string;
    id?: string;
  }>;
};

export default async function AppsPage({ searchParams }: AppsPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getAppsData(user.id, params);
  const selectedIntegration = data.integrations.find(
    (integration) => integration.id === params.id
  );

  return (
    <>
      <PageHeader
        actionHref="/dashboard/apps?dialog=connect"
        actionLabel="Connect app"
        description="App integrations are stored against each bundle without adding schema."
        title="Apps"
      />

      <Card>
        <CardHeader>
          <CardTitle>Connected apps</CardTitle>
          <CardDescription>Manage BundleExternalIntegrations records.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/dashboard/apps" className="mb-4 flex flex-wrap gap-2" method="get">
            <Input className="max-w-xs" name="q" placeholder="Search integrations" />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              name="active"
            >
              <option value="">All states</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button type="submit" variant="outline">Filter</Button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.integrations.length ? (
              data.integrations.map((integration) => (
                <Card key={integration.id} size="sm">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-md border">
                          <PlugZap data-icon="inline-start" />
                        </div>
                        <div>
                          <CardTitle>{integration.displayName}</CardTitle>
                          <CardDescription>{integration.bundle.name}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={integration.isActive ? "default" : "outline"}>
                        {integration.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      {integration.integrationType}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <form action={toggleIntegrationAction}>
                        <input
                          type="hidden"
                          name="integrationId"
                          value={integration.id}
                        />
                        <input type="hidden" name="returnTo" value="/dashboard/apps" />
                        <Button size="sm" type="submit" variant="outline">
                          {integration.isActive ? "Pause" : "Activate"}
                        </Button>
                      </form>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/apps?dialog=edit&id=${integration.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <form action={deleteIntegrationAction}>
                        <input
                          type="hidden"
                          name="integrationId"
                          value={integration.id}
                        />
                        <input type="hidden" name="returnTo" value="/dashboard/apps" />
                        <Button size="sm" type="submit" variant="ghost">Remove</Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-8 text-sm text-muted-foreground">
                  No integrations found.
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {params.dialog === "connect" ? (
        <IntegrationForm
          action={upsertIntegrationAction}
          bundles={data.bundles}
          returnTo="/dashboard/apps"
          title="Connect app"
        />
      ) : null}

      {params.dialog === "edit" && selectedIntegration ? (
        <IntegrationForm
          action={upsertIntegrationAction}
          bundles={data.bundles}
          integration={selectedIntegration}
          returnTo="/dashboard/apps"
          title="Edit integration"
        />
      ) : null}
    </>
  );
}

function IntegrationForm({
  action,
  bundles,
  integration,
  returnTo,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  bundles: { id: string; name: string }[];
  integration?: {
    bundle: { id: string };
    displayName: string;
    integrationType: string;
    isActive: boolean;
    config: string;
  };
  returnTo: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Stored as BundleExternalIntegrations config JSON.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="grid gap-2 text-sm">
            Bundle
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={integration?.bundle.id}
              name="bundleId"
              required
            >
              {bundles.map((bundle) => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Integration type
            <Input
              defaultValue={integration?.integrationType ?? ""}
              name="integrationType"
              placeholder="github"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            Display name
            <Input defaultValue={integration?.displayName ?? ""} name="displayName" />
          </label>
          <label className="grid gap-2 text-sm">
            Active
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={integration?.isActive === false ? "false" : "true"}
              name="isActive"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Endpoint
            <Input name="endpoint" placeholder="https://example.com/webhook" />
          </label>
          <label className="grid gap-2 text-sm">
            Notes
            <Input name="notes" />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">Save integration</Button>
            <Button asChild variant="outline">
              <Link href={returnTo}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

