"use client";

import React, { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "../ui/button";

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: "en" | "vi") => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-secondary w-fit">
      <Button
        variant={locale === "vi" ? "secondary" : "ghost"}
        size="sm"
        disabled={isPending}
        onClick={() => handleLanguageChange("vi")}
        className="h-7 px-3 text-xs rounded-md transition-all hover:bg-muted font-medium"
      >
        Tiếng Việt
      </Button>
      <Button
        variant={locale === "en" ? "secondary" : "ghost"}
        size="sm"
        disabled={isPending}
        onClick={() => handleLanguageChange("en")}
        className="h-7 px-3 text-xs rounded-md transition-all hover:bg-muted font-medium"
      >
        English
      </Button>
    </div>
  );
};
