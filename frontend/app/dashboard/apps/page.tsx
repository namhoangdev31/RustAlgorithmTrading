import Link from "next/link";
import {
  Bot,
  Code2,
  Container,
  CreditCard,
  GitBranch,
  GitFork,
  Mail,
  MessageCircle,
  MessagesSquare,
  NotebookText,
  Palette,
  PanelsTopLeft,
  Send,
  SlidersHorizontal,
  Video,
  type LucideIcon,
} from "lucide-react";

import {
  deleteIntegrationAction,
  toggleIntegrationAction,
  upsertIntegrationAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getAppsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type AppsPageProps = {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    type?: string;
    sort?: string;
    active?: string;
    dialog?: string;
    id?: string;
  }>;
};

type CatalogApp = {
  key: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
};

const catalogApps: CatalogApp[] = [
  {
    key: "telegram",
    name: "Telegram",
    desc: "Connect with Telegram for real-time communication.",
    icon: Send,
    tone: "text-sky-500",
  },
  {
    key: "notion",
    name: "Notion",
    desc: "Effortlessly sync Notion pages for seamless collaboration.",
    icon: NotebookText,
    tone: "text-foreground",
  },
  {
    key: "figma",
    name: "Figma",
    desc: "View and collaborate on Figma designs in one place.",
    icon: Palette,
    tone: "text-pink-500",
  },
  {
    key: "trello",
    name: "Trello",
    desc: "Sync Trello cards for streamlined project management.",
    icon: GitBranch,
    tone: "text-blue-500",
  },
  {
    key: "slack",
    name: "Slack",
    desc: "Integrate Slack for efficient team communication",
    icon: MessageCircle,
    tone: "text-emerald-500",
  },
  {
    key: "zoom",
    name: "Zoom",
    desc: "Host Zoom meetings directly from the dashboard.",
    icon: Video,
    tone: "text-blue-500",
  },
  {
    key: "stripe",
    name: "Stripe",
    desc: "Easily manage Stripe transactions and payments.",
    icon: CreditCard,
    tone: "text-violet-500",
  },
  {
    key: "gmail",
    name: "Gmail",
    desc: "Access and manage Gmail messages effortlessly.",
    icon: Mail,
    tone: "text-red-500",
  },
  {
    key: "medium",
    name: "Medium",
    desc: "Explore and share Medium stories on your dashboard.",
    icon: PanelsTopLeft,
    tone: "text-foreground",
  },
  {
    key: "skype",
    name: "Skype",
    desc: "Connect with Skype contacts seamlessly.",
    icon: MessagesSquare,
    tone: "text-cyan-500",
  },
  {
    key: "docker",
    name: "Docker",
    desc: "Effortlessly manage Docker containers on your dashboard.",
    icon: Container,
    tone: "text-sky-600",
  },
  {
    key: "github",
    name: "GitHub",
    desc: "Streamline code management with GitHub integration.",
    icon: Code2,
    tone: "text-foreground",
  },
  {
    key: "gitlab",
    name: "GitLab",
    desc: "Efficiently manage code projects with GitLab integration.",
    icon: GitFork,
    tone: "text-orange-500",
  },
  {
    key: "discord",
    name: "Discord",
    desc: "Connect with Discord for seamless team communication.",
    icon: Bot,
    tone: "text-indigo-500",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    desc: "Easily integrate WhatsApp for direct messaging.",
    icon: MessageCircle,
    tone: "text-green-500",
  },
];

export default async function AppsPage({ searchParams }: AppsPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getAppsData(user.id, params);
  const selectedIntegration = data.integrations.find(
    (integration) => integration.id === params.id
  );
  const searchTerm = (params.filter ?? params.q ?? "").toLowerCase();
  const appType = params.type ?? (params.active === "true" ? "connected" : "all");
  const sort = params.sort === "desc" ? "desc" : "asc";
  const firstBundle = data.bundles[0];

  const apps = catalogApps
    .map((app) => {
      const integration = data.integrations.find((item) => {
        const integrationType = item.integrationType.toLowerCase();
        const displayName = item.displayName.toLowerCase();
        return integrationType === app.key || displayName === app.name.toLowerCase();
      });

      return {
        ...app,
        integration,
        connected: Boolean(integration?.isActive),
      };
    })
    .filter((app) =>
      appType === "connected"
        ? app.connected
        : appType === "notConnected"
          ? !app.connected
          : true
    )
    .filter((app) => app.name.toLowerCase().includes(searchTerm))
    .sort((a, b) =>
      sort === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Integrations</h1>
        <p className="text-muted-foreground">
          Here&apos;s a list of your apps for the integration!
        </p>
      </div>

      <div className="my-4 flex items-end justify-between gap-4 sm:my-0 sm:items-center">
        <form action="/dashboard/apps" className="flex flex-col gap-4 sm:my-4 sm:flex-row" method="get">
          <Input
            className="h-9 w-40 lg:w-[15.625rem]"
            defaultValue={params.filter ?? params.q ?? ""}
            name="filter"
            placeholder="Filter apps..."
          />
          <Select defaultValue={appType} name="type">
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="All Apps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="notConnected">Not Connected</SelectItem>
            </SelectContent>
          </Select>
          <input name="sort" type="hidden" value={sort} />
          <Button className="h-9" type="submit" variant="outline">
            Filter
          </Button>
        </form>

        <form action="/dashboard/apps" method="get">
          <input name="filter" type="hidden" value={params.filter ?? params.q ?? ""} />
          <input name="type" type="hidden" value={appType} />
          <input name="sort" type="hidden" value={sort === "asc" ? "desc" : "asc"} />
          <Button className="h-9 w-16" type="submit" variant="outline">
            <SlidersHorizontal data-icon="inline-start" />
            <span className="sr-only">
              {sort === "asc" ? "Descending" : "Ascending"}
            </span>
          </Button>
        </form>
      </div>

      <Separator className="shadow-sm" />

      <ul className="faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const Icon = app.icon;

          return (
            <li className="rounded-lg border p-4 transition hover:shadow-md" key={app.name}>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted p-2">
                  <Icon className={cn("size-5", app.tone)} />
                </div>
                {app.integration ? (
                  <form action={toggleIntegrationAction}>
                    <input name="integrationId" type="hidden" value={app.integration.id} />
                    <input name="returnTo" type="hidden" value="/dashboard/apps" />
                    <Button
                      className={cn(
                        app.connected &&
                          "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900"
                      )}
                      size="sm"
                      type="submit"
                      variant="outline"
                    >
                      {app.connected ? "Connected" : "Connect"}
                    </Button>
                  </form>
                ) : (
                  <form action={upsertIntegrationAction}>
                    <input name="returnTo" type="hidden" value="/dashboard/apps" />
                    <input name="bundleId" type="hidden" value={firstBundle?.id ?? ""} />
                    <input name="integrationType" type="hidden" value={app.key} />
                    <input name="displayName" type="hidden" value={app.name} />
                    <input name="isActive" type="hidden" value="true" />
                    <Button disabled={!firstBundle} size="sm" type="submit" variant="outline">
                      Connect
                    </Button>
                  </form>
                )}
              </div>
              <div>
                <h2 className="mb-1 font-semibold">{app.name}</h2>
                <p className="line-clamp-2 text-gray-500">{app.desc}</p>
              </div>
              {app.integration ? (
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/apps?dialog=edit&id=${app.integration.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <form action={deleteIntegrationAction}>
                    <input name="integrationId" type="hidden" value={app.integration.id} />
                    <input name="returnTo" type="hidden" value="/dashboard/apps" />
                    <Button size="sm" type="submit" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

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
          <Label className="grid gap-2 text-sm">
            Bundle
            <Select
              defaultValue={integration?.bundle.id}
              name="bundleId"
              required
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select bundle..." />
              </SelectTrigger>
              <SelectContent>
                {bundles.map((bundle) => (
                  <SelectItem key={bundle.id} value={bundle.id}>
                    {bundle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            Integration type
            <Input
              defaultValue={integration?.integrationType ?? ""}
              name="integrationType"
              placeholder="github"
              required
            />
          </Label>
          <Label className="grid gap-2 text-sm">
            Display name
            <Input defaultValue={integration?.displayName ?? ""} name="displayName" />
          </Label>
          <Label className="grid gap-2 text-sm">
            Active
            <Select
              defaultValue={integration?.isActive === false ? "false" : "true"}
              name="isActive"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            Endpoint
            <Input name="endpoint" placeholder="https://example.com/webhook" />
          </Label>
          <Label className="grid gap-2 text-sm">
            Notes
            <Input name="notes" />
          </Label>
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
