"use client";

import { useRouter } from "@/i18n/navigation";
import { Activity, ChevronRight, FolderGit, Globe2, HelpCircle, Laptop, LayoutDashboard, Moon, PlugZap, Rocket, SearchIcon, Settings, Sparkles, Sun } from "lucide-react";
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
  const tn = useTranslations("Portal.navigation");

  function runCommand(command: () => void) {
    setOpen(false);
    command();
  }

  const commandLinks: { heading: string; items: CommandLink[] }[] = [
    {
      heading: tn("workspace"),
      items: [
        { title: tn("overview"), href: "/overview", icon: LayoutDashboard },
        { title: tn("projects"), href: "/projects", icon: FolderGit },
        { title: tn("deployments"), href: "/deployments", icon: Rocket },
        { title: tn("domains"), href: "/domains", icon: Globe2 },
        { title: tn("observability"), href: "/observability", icon: Activity },
        { title: tn("integrations"), href: "/integrations", icon: PlugZap },
        { title: tn("marketplace"), href: "/marketplace", icon: Sparkles },
      ],
    },
    {
      heading: tn("manage"),
      items: [
        { title: tn("settings"), href: "/settings/profile", icon: Settings },
        { title: tn("help"), href: "/help", icon: HelpCircle },
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
              onSelect={() => runCommand(() => router.push("/integrations?active=true"))}
            >
              {t("active_integrations")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Link className="sr-only" href="/overview">{tn("overview")}</Link>
    </>
  );
}
