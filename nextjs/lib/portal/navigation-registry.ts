import {
  LayoutDashboard,
  Folder,
  Activity,
  Globe,
  LineChart,
  Blocks,
  Rocket,
  Store,
  Settings,
  HelpCircle,
  ShieldAlert,
  User,
  Users,
  Shield,
  Key,
  DollarSign,
  List,
  Bell,
  Palette,
  Database,
  Eye,
  Terminal,
  Cpu,
  RefreshCw,
  FolderLock,
  ListTodo
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  section?: string;
  requiredRole?: "admin" | "owner" | "editor" | "viewer";
};

// Workspace navigation structure
export function getWorkspaceNav(_locale?: string): NavItem[] {
  return [
    { path: "/overview", label: "Overview", icon: LayoutDashboard },
    { path: "/projects", label: "Projects", icon: Folder },
    { path: "/deployments", label: "Deployments", icon: Activity },
    { path: "/domains", label: "Domains", icon: Globe },
    { path: "/observability", label: "Observability", icon: LineChart },
    { path: "/integrations", label: "Integrations", icon: Blocks },
    { path: "/lepoship", label: "LepoShip", icon: Rocket },
    { path: "/marketplace", label: "Marketplace", icon: Store },
    { path: "/activity", label: "Activity Log", icon: Eye },
    { path: "/settings/profile", label: "Settings", icon: Settings },
    { path: "/help", label: "Help", icon: HelpCircle },
    {
      path: "/admin/risk-limits",
      label: "Risk Limits (Admin)",
      icon: ShieldAlert,
      requiredRole: "admin",
    },
    {
      path: "/admin/reviews",
      label: "Review Queue (Admin)",
      icon: ListTodo,
      requiredRole: "admin",
    },
  ];
}

// Project navigation structure
export function getProjectNav(_locale: string, projectId: string): NavItem[] {
  const base = `/projects/${projectId}`;
  return [
    { path: `${base}/overview`, label: "Overview", icon: LayoutDashboard },
    { path: `${base}/deployments`, label: "Deployments", icon: Activity },
    { path: `${base}/delivery`, label: "Delivery", icon: Rocket },
    { path: `${base}/domains`, label: "Domains", icon: Globe },
    { path: `${base}/observability`, label: "Observability", icon: LineChart },
    { path: `${base}/routing`, label: "Routing", icon: RefreshCw },
    { path: `${base}/security`, label: "Security", icon: FolderLock },
    { path: `${base}/integrations`, label: "Integrations", icon: Blocks },
    { path: `${base}/forms`, label: "Forms", icon: ListTodo },
    { path: `${base}/members`, label: "Members", icon: Users },
    { path: `${base}/activity`, label: "Activity", icon: Eye },
    { path: `${base}/settings`, label: "Settings", icon: Settings },
  ];
}

// LepoShip child navigation structure
export function getLepoShipNav(_locale: string, projectId: string): NavItem[] {
  const base = `/lepoship/${projectId}`;
  return [
    { path: `${base}/overview`, label: "Overview", icon: LayoutDashboard },
    { path: `${base}/builds`, label: "Builds", icon: Terminal },
    { path: `${base}/ota`, label: "OTA Rollouts", icon: Cpu },
    { path: `${base}/ab-testing`, label: "A/B Tests", icon: Activity },
    { path: `${base}/listing`, label: "Store Listing", icon: Store },
    { path: `${base}/settings`, label: "Build Settings", icon: Settings },
  ];
}

// Marketplace navigation structure
export function getMarketplaceNav(_locale?: string): NavItem[] {
  const base = "/marketplace";
  return [
    { path: `${base}`, label: "Overview", icon: LayoutDashboard },
    { path: `${base}/listings`, label: "Listings", icon: List },
    { path: `${base}/analytics`, label: "Analytics", icon: LineChart },
    { path: `${base}/billing`, label: "Billing", icon: DollarSign },
  ];
}

// Settings navigation structure
export function getSettingsNav(_locale?: string): NavItem[] {
  const base = "/settings";
  return [
    { path: `${base}/profile`, label: "Profile", icon: User, section: "Personal" },
    { path: `${base}/workspace`, label: "Workspace Info", icon: Settings, section: "Workspace" },
    { path: `${base}/members`, label: "Members", icon: Users, section: "Workspace" },
    { path: `${base}/security`, label: "Security & MFA", icon: Shield, section: "Workspace" },
    { path: `${base}/notifications`, label: "Notifications", icon: Bell, section: "Workspace" },
    { path: `${base}/appearance`, label: "Appearance", icon: Palette, section: "Workspace" },
    { path: `${base}/directory`, label: "Directory Sync (SCIM)", icon: Database, section: "Workspace" },
    { path: `${base}/audit`, label: "Audit Logs", icon: Eye, section: "Workspace" },
    { path: `${base}/tokens`, label: "Personal Access Tokens", icon: Key, section: "Security" },
  ];
}
