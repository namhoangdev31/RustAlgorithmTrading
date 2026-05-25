import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const settingsLinks = [
  ["Profile", "/dashboard/settings"],
  ["Account", "/dashboard/settings/account"],
  ["Appearance", "/dashboard/settings/appearance"],
  ["Notifications", "/dashboard/settings/notifications"],
  ["Display", "/dashboard/settings/display"],
] as const;

export function SettingsNav() {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        {settingsLinks.map(([label, href]) => (
          <Button asChild className="justify-start" key={href} variant="ghost">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

