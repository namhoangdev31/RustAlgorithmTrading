"use client";

import React from "react";
import { Layers, RotateCcw, Server } from "lucide-react";
import { useTranslations } from "next-intl";

interface DeploymentsTabSwitcherProps {
  activeSubTab: "bundles" | "native" | "vercel";
  setActiveSubTab: (tab: "bundles" | "native" | "vercel") => void;
}

export function DeploymentsTabSwitcher({
  activeSubTab,
  setActiveSubTab,
}: DeploymentsTabSwitcherProps) {
  const t = useTranslations("Deployments");

  const tabs = [
    {
      id: "bundles" as const,
      label: t("registry_title"),
      icon: Layers,
    },
    {
      id: "native" as const,
      label: "Native",
      icon: RotateCcw,
    },
    {
      id: "vercel" as const,
      label: t("vercel_tab"),
      icon: Server,
    },
  ];

  return (
    <div className="flex border-b border-hairline relative">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-ink-mute hover:text-ink hover:border-hairline"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
