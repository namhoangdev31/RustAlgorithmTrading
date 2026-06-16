"use client";

import { Bell, Key, Monitor, Palette, UserCog, Wrench, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Settings.nav");

  const settingsLinks = [
    { label: t("profile"), href: "/dashboard/settings", Icon: UserCog },
    { label: t("account"), href: "/dashboard/settings/account", Icon: Wrench },
    { label: t("appearance"), href: "/dashboard/settings/appearance", Icon: Palette },
    { label: t("notifications"), href: "/dashboard/settings/notifications", Icon: Bell },
    { label: t("display"), href: "/dashboard/settings/display", Icon: Monitor },
    { label: t("vercel"), href: "/dashboard/settings?vercel=configure", Icon: Key },
    { label: "Directory Sync (SCIM)", href: "/dashboard/settings/directory", Icon: Shield },
  ] as const;

  return (
    <>
      <div className="p-1 md:hidden">
        <Select
          value={pathname}
          onValueChange={(value) => router.push(value)}
        >
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder={t("select_tab")} />
          </SelectTrigger>
          <SelectContent>
            {settingsLinks.map(({ label, href }) => (
              <SelectItem key={href} value={href}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="hidden w-full min-w-40 bg-background px-1 py-2 md:block">
        <nav className="flex gap-2 py-1 lg:flex-col lg:gap-1">
        {settingsLinks.map(({ label, href, Icon }) => (
          <Button asChild className="justify-start" key={href} variant="ghost">
            <Link href={href}>
              <Icon data-icon="inline-start" />
              {label}
            </Link>
          </Button>
        ))}
        </nav>
      </ScrollArea>
    </>
  );
}

