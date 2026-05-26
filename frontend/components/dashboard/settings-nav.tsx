"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Monitor, Palette, UserCog, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const settingsLinks = [
  ["Profile", "/dashboard/settings", UserCog],
  ["Account", "/dashboard/settings/account", Wrench],
  ["Appearance", "/dashboard/settings/appearance", Palette],
  ["Notifications", "/dashboard/settings/notifications", Bell],
  ["Display", "/dashboard/settings/display", Monitor],
] as const;

export function SettingsNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="p-1 md:hidden">
        <Select
          value={pathname}
          onValueChange={(value) => router.push(value)}
        >
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Select tab..." />
          </SelectTrigger>
          <SelectContent>
            {settingsLinks.map(([label, href]) => (
              <SelectItem key={href} value={href}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="hidden w-full min-w-40 bg-background px-1 py-2 md:block">
        <nav className="flex gap-2 py-1 lg:flex-col lg:gap-1">
        {settingsLinks.map(([label, href, Icon]) => (
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
