"use client";

import { useRouter } from "@/i18n/navigation";
import {
  AppWindow,
  ChevronRight,
  FileWarning,
  HelpCircle,
  Laptop,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Moon,
  SearchIcon,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useSearch } from "@/components/dashboard/search-provider";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type CommandLink = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  parent?: string;
};

export function Search({ className }: { className?: string }) {
  const router = useRouter();
  const { open, setOpen } = useSearch();
  const { setTheme } = useTheme();
  const t = useTranslations("Dashboard.shell.search");
  const tn = useTranslations("Dashboard.shell.nav");

  function runCommand(command: () => void) {
    setOpen(false);
    command();
  }

  const commandLinks: { heading: string; items: CommandLink[] }[] = [
    {
      heading: t("general"),
      items: [
        { title: tn("dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { title: tn("projects"), href: "/projects", icon: ListTodo },
        { title: tn("apps"), href: "/dashboard/apps", icon: AppWindow },
        { title: tn("chats"), href: "/dashboard/chats", icon: MessagesSquare },
        { title: tn("users"), href: "/dashboard/users", icon: Users },
      ],
    },
    {
      heading: t("pages"),
      items: [
        { title: t("auth"), href: "/login", icon: ShieldCheck, parent: t("sign_in") },
        {
          title: t("errors"),
          href: "/dashboard/errors/not-found",
          icon: FileWarning,
          parent: t("not_found"),
        },
      ],
    },
    {
      heading: t("other"),
      items: [
        { title: tn("settings"), href: "/dashboard/settings", icon: Settings },
        { title: tn("account"), href: "/dashboard/settings/account", icon: UserCog },
        { title: tn("help_center"), href: "/dashboard/help-center", icon: HelpCircle },
      ],
    },
  ];

  const themeItems = [
    { title: t("light"), value: "light", icon: Sun },
    { title: t("dark"), value: "dark", icon: Moon },
    { title: t("system"), value: "system", icon: Laptop },
  ];

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        <SearchIcon data-icon="inline-start" />
        <span className="hidden md:inline-flex">{t("button")}</span>
        <kbd className="pointer-events-none ms-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{t("no_results")}</CommandEmpty>
          {commandLinks.map((group) => (
            <CommandGroup heading={group.heading} key={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => runCommand(() => router.push(item.href))}
                  value={`${group.heading} ${item.title} ${item.parent ?? ""}`}
                >
                  <item.icon data-icon="inline-start" />
                  <span>{item.title}</span>
                  {item.parent ? (
                    <>
                      <ChevronRight className="text-muted-foreground" />
                      <span>{item.parent}</span>
                    </>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading={t("theme")}>
            {themeItems.map((item) => (
              <CommandItem
                key={item.value}
                onSelect={() => runCommand(() => setTheme(item.value))}
                value={`${t("theme")} ${item.title}`}
              >
                <item.icon data-icon="inline-start" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t("quick_filters")}>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/projects?status=pending"))
              }
            >
              {t("pending_projects")}
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/apps?active=true"))}
            >
              {t("active_integrations")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Link className="sr-only" href="/dashboard">{tn("dashboard")}</Link>
    </>
  );
}
