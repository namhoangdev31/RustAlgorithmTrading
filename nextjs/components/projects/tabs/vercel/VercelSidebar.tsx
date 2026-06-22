"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Settings,
  Globe,
  ShieldCheck,
  Key,
  CreditCard,
  Sliders,
  Layers,
  Server,
  Search,
  Radio,
  Terminal,
  Puzzle,
  Zap,
  Webhook,
  Users,
  User,
  HelpCircle,
  Activity,
} from "lucide-react";
import { Button } from "@base-ui/react";

export type VercelTabSection =
  | "observability"
  | "redirects"
  | "certs"
  | "access-groups"
  | "tokens"
  | "credits"
  | "matrix"
  | "edge-config"
  | "aliases"
  | "artifacts"
  | "dns"
  | "registrar"
  | "drains"
  | "logs"
  | "integrations"
  | "edge-cache"
  | "webhooks"
  | "waf"
  | "project-members"
  | "user-profile";

interface SidebarItem {
  id: VercelTabSection;
  translationKey?: string;
  fallbackLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface VercelSidebarProps {
  activeSection: VercelTabSection;
  onSectionChange: (section: VercelTabSection) => void;
}

export function VercelSidebar({ activeSection, onSectionChange }: VercelSidebarProps) {
  const t = useTranslations("VercelTab");

  const menuItems: SidebarItem[] = [
    { id: "observability", translationKey: "observability.title", fallbackLabel: "Observability", icon: Activity },
    { id: "redirects", translationKey: "redirects.title", fallbackLabel: "Redirects", icon: Globe },
    { id: "certs", translationKey: "certs.title", fallbackLabel: "SSL Certificates", icon: ShieldCheck },
    { id: "access-groups", translationKey: "access_groups.title", fallbackLabel: "Access Groups", icon: Settings },
    { id: "tokens", translationKey: "tokens.title", fallbackLabel: "Auth Tokens", icon: Key },
    { id: "credits", translationKey: "credits.title", fallbackLabel: "Billing Credits", icon: CreditCard },
    { id: "edge-config", fallbackLabel: "Edge Config Sync", icon: Sliders },
    { id: "aliases", fallbackLabel: "Account Aliases", icon: Globe },
    { id: "artifacts", fallbackLabel: "Remote Caching", icon: Layers },
    { id: "dns", fallbackLabel: "DNS Records", icon: Server },
    { id: "registrar", fallbackLabel: "Domain Registrar", icon: Search },
    { id: "drains", fallbackLabel: "Log Drains", icon: Radio },
    { id: "logs", fallbackLabel: "Runtime Logs", icon: Terminal },
    { id: "integrations", fallbackLabel: "Integrations", icon: Puzzle },
    { id: "edge-cache", fallbackLabel: "Edge Cache", icon: Zap },
    { id: "webhooks", fallbackLabel: "Webhooks Manager", icon: Webhook },
    { id: "waf", fallbackLabel: "Firewall WAF", icon: ShieldCheck },
    { id: "project-members", fallbackLabel: "Project Members", icon: Users },
    { id: "user-profile", fallbackLabel: "Connected Account", icon: User },
    { id: "matrix", translationKey: "matrix.title", fallbackLabel: "SDK Methods Reference", icon: HelpCircle },
  ];

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 select-none border-b border-hairline lg:border-b-0 lg:border-r lg:border-hairline pr-0 lg:pr-4 no-scrollbar">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        const label = item.translationKey ? t(item.translationKey) : item.fallbackLabel;
        const isActive = activeSection === item.id;

        return (
          <Button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${isActive
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
              }`}
          >
            <IconComponent className="size-4 shrink-0" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
