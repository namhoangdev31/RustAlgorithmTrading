import { Link } from "@/i18n/navigation";
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
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("Apps");

  const apps = catalogApps
    .map((app) => {
      const integration = data.integrations.find((item) => {
        const integrationType = item.integrationType.toLowerCase();
        const displayName = item.displayName.toLowerCase();
        return integrationType === app.key || displayName === app.name.toLowerCase();
      });

      return {
        ...app,
        name: t(`items.${app.key}.name`),
        desc: t(`items.${app.key}.desc`),
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
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="my-4 flex items-end justify-between gap-4 sm:my-0 sm:items-center">
        <form action="/dashboard/apps" className="flex flex-col gap-4 sm:my-4 sm:flex-row" method="get">
          <Input
            className="h-9 w-40 lg:w-[15.625rem]"
            defaultValue={params.filter ?? params.q ?? ""}
            name="filter"
            placeholder={t("filter_placeholder")}
          />
          <Select defaultValue={appType} name="type">
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder={t("all_apps")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_apps")}</SelectItem>
              <SelectItem value="connected">{t("connected")}</SelectItem>
              <SelectItem value="notConnected">{t("not_connected")}</SelectItem>
            </SelectContent>
          </Select>
          <Input name="sort" type="hidden" value={sort} />
          <Button className="h-9" type="submit" variant="outline">
            {t("filter_btn")}
          </Button>
        </form>

        <form action="/dashboard/apps" method="get">
          <Input name="filter" type="hidden" value={params.filter ?? params.q ?? ""} />
          <Input name="type" type="hidden" value={appType} />
          <Input name="sort" type="hidden" value={sort === "asc" ? "desc" : "asc"} />
          <Button className="h-9 w-16" type="submit" variant="outline">
            <SlidersHorizontal data-icon="inline-start" />
            <span className="sr-only">
              {sort === "asc" ? t("descending") : t("ascending")}
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
                    <Input name="integrationId" type="hidden" value={app.integration.id} />
                    <Input name="returnTo" type="hidden" value="/dashboard/apps" />
                    <Button
                      className={cn(
                        app.connected &&
                        "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900"
                      )}
                      size="sm"
                      type="submit"
                      variant="outline"
                    >
                      {app.connected ? t("connected") : t("connect_btn")}
                    </Button>
                  </form>
                ) : (
                  <form action={upsertIntegrationAction}>
                    <Input name="returnTo" type="hidden" value="/dashboard/apps" />
                    <Input name="bundleId" type="hidden" value={firstBundle?.id ?? ""} />
                    <Input name="integrationType" type="hidden" value={app.key} />
                    <Input name="displayName" type="hidden" value={app.name} />
                    <Input name="isActive" type="hidden" value="true" />
                    <Button disabled={!firstBundle} size="sm" type="submit" variant="outline">
                      {t("connect_btn")}
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
                      {t("edit_btn")}
                    </Link>
                  </Button>
                  <form action={deleteIntegrationAction}>
                    <Input name="integrationId" type="hidden" value={app.integration.id} />
                    <Input name="returnTo" type="hidden" value="/dashboard/apps" />
                    <Button size="sm" type="submit" variant="ghost">
                      {t("remove_btn")}
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
          title={t("connect_app_title")}
          t={t}
        />
      ) : null}

      {params.dialog === "edit" && selectedIntegration ? (
        <IntegrationForm
          action={upsertIntegrationAction}
          bundles={data.bundles}
          integration={selectedIntegration}
          returnTo="/dashboard/apps"
          title={t("edit_integration_title")}
          t={t}
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
  t,
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
  t: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{t("form_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <Input type="hidden" name="returnTo" value={returnTo} />
          <Label className="grid gap-2 text-sm">
            {t("bundle_label")}
            <Select
              defaultValue={integration?.bundle.id}
              name="bundleId"
              required
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("select_bundle_placeholder")} />
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
            {t("integration_type_label")}
            <Input
              defaultValue={integration?.integrationType ?? ""}
              name="integrationType"
              placeholder="github"
              required
            />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("display_name_label")}
            <Input defaultValue={integration?.displayName ?? ""} name="displayName" />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("active_label")}
            <Select
              defaultValue={integration?.isActive === false ? "false" : "true"}
              name="isActive"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("select_status_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("active_status")}</SelectItem>
                <SelectItem value="false">{t("inactive_status")}</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("endpoint_label")}
            <Input name="endpoint" placeholder="https://example.com/webhook" />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("notes_label")}
            <Input name="notes" />
          </Label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{t("save_integration_btn")}</Button>
            <Button asChild variant="outline">
              <Link href={returnTo}>{t("cancel_btn")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
