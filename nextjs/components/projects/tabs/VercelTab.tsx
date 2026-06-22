"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Settings,
  Globe,
  ShieldAlert,
  Key,
  CreditCard,
  Activity,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Sliders,
  Layers,
  ArrowLeft,
  Server,
  Search,
  Terminal,
  Puzzle,
  Zap,
  Radio,
  Webhook,
  Users,
  User
} from "lucide-react";
import { EdgeConfigVarsCard } from "@/components/projects/EdgeConfigVarsCard";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";

import { useEffect } from "react";
import {
  createAccessGroupAction,
  deleteAccessGroupAction,
  createAuthTokenAction,
  deleteAuthTokenAction,
  buyCreditsAction,
  toggleObservabilityAction,
  issueCertificateAction,
  uploadCertificateAction,
  deleteCertificateAction,
  stageRedirectsAction,
  updateAccessGroupAction,
  listAccessGroupMembersAction,
  listAccessGroupProjectsAction,
  createAccessGroupProjectAction,
  deleteAccessGroupProjectAction,
  listAliasesAction,
  assignAliasAction,
  deleteAliasAction,
  getArtifactStatusAction,
  artifactExistsAction,
  getDnsRecordsAction,
  createDnsRecordAction,
  deleteDnsRecordAction,
  getDomainAvailabilityAction,
  getDomainPriceAction,
  buyDomainAction,
  purgeEdgeCacheAction,
  getRuntimeLogsAction,
  getIntegrationsAction,
  createConfigurableLogDrainAction,
  deleteConfigurableLogDrainAction,
  listConfigurableLogDrainsAction,
  listDeploymentsAction,
  getFirewallConfigAction,
  updateFirewallConfigAction,
  addBypassIpAction,
  createWebhookAction,
  deleteWebhookAction,
  getWebhooksAction,
  getAuthUserAction,
  getProjectMembersAction,
  addProjectMemberAction,
  removeProjectMemberAction
} from "@/app/actions/vercel";

interface VercelTabProps {
  project: any;
  vercelConnected: boolean;
  vercelAccessGroups: any[];
  vercelTokens: any[];
  vercelConnectionError?: boolean;
  locale: string;
  returnTo: string;
  vercelProjectEnvVars?: any[];
}

export function VercelTab({
  project,
  vercelConnected,
  vercelAccessGroups,
  vercelTokens,
  vercelConnectionError,
  locale,
  returnTo,
  vercelProjectEnvVars = [],
}: VercelTabProps) {
  const t = useTranslations("VercelTab");
  const [activeSection, setActiveSection] = useState<
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
    | "user-profile"
  >("observability");

  // --- New States for modules 11-20 ---
  // DNS Records
  const [dnsDomain, setDnsDomain] = useState("");
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [loadingDns, setLoadingDns] = useState(false);
  const [dnsError, setDnsError] = useState("");

  // Domain Registrar
  const [searchDomain, setSearchDomain] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [registrarError, setRegistrarError] = useState("");

  // Log Drains
  const [logDrainsList, setLogDrainsList] = useState<any[]>([]);
  const [loadingDrains, setLoadingDrains] = useState(false);
  const [drainsError, setDrainsError] = useState("");

  // Real-time Logs
  const [deploymentsList, setDeploymentsList] = useState<any[]>([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState("");
  const [runtimeLogs, setRuntimeLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  // Integrations
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [integrationsError, setIntegrationsError] = useState("");

  const handleFetchDnsRecords = async () => {
    if (!dnsDomain) return;
    setLoadingDns(true);
    setDnsError("");
    try {
      const res = await getDnsRecordsAction(project.id, dnsDomain);
      if (res.success && res.records) {
        setDnsRecords(res.records || []);
      } else {
        setDnsError(res.error || "Failed to load DNS records");
      }
    } catch (err: any) {
      setDnsError(err?.message || "Failed to load DNS records");
    } finally {
      setLoadingDns(false);
    }
  };

  const handleSearchDomainAvailability = async () => {
    if (!searchDomain) return;
    setCheckingAvailability(true);
    setRegistrarError("");
    setAvailabilityResult(null);
    setPriceResult(null);
    try {
      const availRes = await getDomainAvailabilityAction(project.id, searchDomain);
      if (availRes.success) {
        setAvailabilityResult({ available: availRes.available, searched: true });
        if (availRes.available) {
          const priceRes = await getDomainPriceAction(project.id, searchDomain);
          if (priceRes.success && priceRes.priceData) {
            setPriceResult(priceRes.priceData);
          }
        }
      } else {
        setRegistrarError(availRes.error || "Failed to check domain availability");
      }
    } catch (err: any) {
      setRegistrarError(err?.message || "Failed to search domain");
    } finally {
      setCheckingAvailability(false);
    }
  };

  // New States for Access Groups details
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupProjects, setGroupProjects] = useState<any[]>([]);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [newProjectToMap, setNewProjectToMap] = useState("");

  // New States for Account Aliases
  const [aliasesList, setAliasesList] = useState<any[]>([]);
  const [loadingAliases, setLoadingAliases] = useState(false);
  const [aliasesError, setAliasesError] = useState("");

  // New States for Remote Caching
  const [cachingStatus, setCachingStatus] = useState<any>(null);
  const [loadingCaching, setLoadingCaching] = useState(false);
  const [cachingError, setCachingError] = useState("");
  const [artifactHashToCheck, setArtifactHashToCheck] = useState("");
  const [artifactExistsResult, setArtifactExistsResult] = useState<boolean | null>(null);
  const [checkingArtifact, setCheckingArtifact] = useState(false);

  // New States for Webhooks, WAF, Project Members, User Profile
  const [webhooksList, setWebhooksList] = useState<any[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [webhooksError, setWebhooksError] = useState("");
  const [firewallConfig, setFirewallConfig] = useState<any>(null);
  const [loadingFirewall, setLoadingFirewall] = useState(false);
  const [firewallError, setFirewallError] = useState("");
  const [projectMembersList, setProjectMembersList] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [authProfile, setAuthProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Fetch group details when selectedGroup changes
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchGroupData = async () => {
      setLoadingGroupDetails(true);
      try {
        const [membersRes, projectsRes] = await Promise.all([
          listAccessGroupMembersAction(project.id, selectedGroup.id),
          listAccessGroupProjectsAction(project.id, selectedGroup.id)
        ]);
        if (membersRes.success) setGroupMembers(membersRes.members || []);
        if (projectsRes.success) setGroupProjects(projectsRes.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGroupDetails(false);
      }
    };
    fetchGroupData();
  }, [selectedGroup, project.id]);

  // Fetch account-wide aliases when aliases section is active
  useEffect(() => {
    if (activeSection !== "aliases") return;
    const fetchAliases = async () => {
      setLoadingAliases(true);
      setAliasesError("");
      try {
        const res = await listAliasesAction(project.id);
        if (res.success && res.aliases) {
          setAliasesList((res.aliases as any).aliases || []);
        } else {
          setAliasesError(res.error || "Failed to load aliases");
        }
      } catch (err: any) {
        setAliasesError(err?.message || "Failed to load aliases");
      } finally {
        setLoadingAliases(false);
      }
    };
    fetchAliases();
  }, [activeSection, project.id]);

  // Fetch caching status when caching section is active
  useEffect(() => {
    if (activeSection !== "artifacts") return;
    const fetchCachingStatus = async () => {
      setLoadingCaching(true);
      setCachingError("");
      try {
        const res = await getArtifactStatusAction(project.id);
        if (res.success && res.status) {
          setCachingStatus(res.status);
        } else {
          setCachingError(res.error || "Failed to load caching status");
        }
      } catch (err: any) {
        setCachingError(err?.message || "Failed to load caching status");
      } finally {
        setLoadingCaching(false);
      }
    };
    fetchCachingStatus();
  }, [activeSection, project.id]);

  // Fetch Log Drains when drains section is active
  useEffect(() => {
    if (activeSection !== "drains") return;
    const fetchLogDrains = async () => {
      setLoadingDrains(true);
      setDrainsError("");
      try {
        const res = await listConfigurableLogDrainsAction(project.id);
        if (res.success && res.drains) {
          const list = Array.isArray(res.drains)
            ? res.drains
            : (res.drains as any).drains || [];
          setLogDrainsList(list);
        } else {
          setDrainsError(res.error || "Failed to load log drains");
        }
      } catch (err: any) {
        setDrainsError(err?.message || "Failed to load log drains");
      } finally {
        setLoadingDrains(false);
      }
    };
    fetchLogDrains();
  }, [activeSection, project.id]);

  // Fetch Deployments when logs section is active
  useEffect(() => {
    if (activeSection !== "logs") return;
    const fetchDeployments = async () => {
      setLoadingDeployments(true);
      setLogsError("");
      try {
        const res = await listDeploymentsAction(project.id);
        if (res.success && res.deployments) {
          const list = Array.isArray(res.deployments)
            ? res.deployments
            : (res.deployments as any).deployments || [];
          setDeploymentsList(list);
          if (list.length > 0 && !selectedDeploymentId) {
            setSelectedDeploymentId(list[0].uid || list[0].id || "");
          }
        } else {
          setLogsError(res.error || "Failed to load deployments");
        }
      } catch (err: any) {
        setLogsError(err?.message || "Failed to load deployments");
      } finally {
        setLoadingDeployments(false);
      }
    };
    fetchDeployments();
  }, [activeSection, project.id]);

  // Fetch Logs when selectedDeploymentId changes
  useEffect(() => {
    if (activeSection !== "logs" || !selectedDeploymentId) return;
    const fetchLogs = async () => {
      setLoadingLogs(true);
      setLogsError("");
      try {
        const res = await getRuntimeLogsAction(project.id, selectedDeploymentId);
        if (res.success && res.logs) {
          setRuntimeLogs(res.logs || []);
        } else {
          setLogsError(res.error || "Failed to load runtime logs");
        }
      } catch (err: any) {
        setLogsError(err?.message || "Failed to load runtime logs");
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [activeSection, selectedDeploymentId, project.id]);

  // Fetch Integrations when integrations section is active
  useEffect(() => {
    if (activeSection !== "integrations") return;
    const fetchIntegrations = async () => {
      setLoadingIntegrations(true);
      setIntegrationsError("");
      try {
        const res = await getIntegrationsAction(project.id);
        if (res.success && res.configurations) {
          setIntegrationsList(res.configurations || []);
        } else {
          setIntegrationsError(res.error || "Failed to load integrations");
        }
      } catch (err: any) {
        setIntegrationsError(err?.message || "Failed to load integrations");
      } finally {
        setLoadingIntegrations(false);
      }
    };
    fetchIntegrations();
  }, [activeSection, project.id]);

  // Fetch Webhooks
  useEffect(() => {
    if (activeSection !== "webhooks") return;
    const fetchWebhooks = async () => {
      setLoadingWebhooks(true);
      setWebhooksError("");
      try {
        const res = await getWebhooksAction(project.id);
        if (res.success && res.webhooks) {
          const list = Array.isArray(res.webhooks)
            ? res.webhooks
            : (res.webhooks as any).webhooks || [];
          setWebhooksList(list);
        } else {
          setWebhooksError(res.error || "Failed to load webhooks");
        }
      } catch (err: any) {
        setWebhooksError(err?.message || "Failed to load webhooks");
      } finally {
        setLoadingWebhooks(false);
      }
    };
    fetchWebhooks();
  }, [activeSection, project.id]);

  // Fetch Firewall Configuration
  useEffect(() => {
    if (activeSection !== "waf") return;
    const fetchFirewall = async () => {
      setLoadingFirewall(true);
      setFirewallError("");
      try {
        const res = await getFirewallConfigAction(project.id);
        if (res.success && res.config) {
          setFirewallConfig(res.config);
        } else {
          setFirewallError(res.error || "Failed to load firewall config");
        }
      } catch (err: any) {
        setFirewallError(err?.message || "Failed to load firewall config");
      } finally {
        setLoadingFirewall(false);
      }
    };
    fetchFirewall();
  }, [activeSection, project.id]);

  // Fetch Project Members
  useEffect(() => {
    if (activeSection !== "project-members") return;
    const fetchMembers = async () => {
      setLoadingMembers(true);
      setMembersError("");
      try {
        const res = await getProjectMembersAction(project.id);
        if (res.success && res.members) {
          setProjectMembersList(res.members || []);
        } else {
          setMembersError(res.error || "Failed to load project members");
        }
      } catch (err: any) {
        setMembersError(err?.message || "Failed to load project members");
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [activeSection, project.id]);

  // Fetch Auth User Profile
  useEffect(() => {
    if (activeSection !== "user-profile") return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError("");
      try {
        const res = await getAuthUserAction(project.id);
        if (res.success && res.user) {
          setAuthProfile(res.user);
        } else {
          setProfileError(res.error || "Failed to load user profile");
        }
      } catch (err: any) {
        setProfileError(err?.message || "Failed to load user profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [activeSection, project.id]);


  if (!vercelConnected) {
    return (
      <Card className="bg-canvas border border-hairline p-8 text-center rounded-lg max-w-xl mx-auto my-8">
        <CardHeader className="flex flex-col items-center justify-center space-y-3 pb-2">
          <div className="size-12 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute">
            <ShieldAlert className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-lg font-bold text-ink">{t("title")}</CardTitle>
          <CardDescription className="text-sm text-ink-mute">
            {t("not_connected")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold text-xs h-9 rounded-sm px-6">
            <Link href="/dashboard/settings">
              Configure Vercel API Key
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 w-full">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 select-none border-b border-hairline lg:border-b-0 lg:border-r lg:border-hairline pr-0 lg:pr-4 no-scrollbar">
        <button
          onClick={() => setActiveSection("observability")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "observability"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Activity className="size-4 shrink-0" />
          {t("observability.title")}
        </button>
        <button
          onClick={() => setActiveSection("redirects")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "redirects"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Globe className="size-4 shrink-0" />
          {t("redirects.title")}
        </button>
        <button
          onClick={() => setActiveSection("certs")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "certs"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <ShieldCheck className="size-4 shrink-0" />
          {t("certs.title")}
        </button>
        <button
          onClick={() => setActiveSection("access-groups")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "access-groups"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Settings className="size-4 shrink-0" />
          {t("access_groups.title")}
        </button>
        <button
          onClick={() => setActiveSection("tokens")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "tokens"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Key className="size-4 shrink-0" />
          {t("tokens.title")}
        </button>
        <button
          onClick={() => setActiveSection("credits")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "credits"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <CreditCard className="size-4 shrink-0" />
          {t("credits.title")}
        </button>
        <button
          onClick={() => setActiveSection("edge-config")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "edge-config"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Sliders className="size-4 shrink-0" />
          Edge Config Sync
        </button>
        <button
          onClick={() => setActiveSection("aliases")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "aliases"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Globe className="size-4 shrink-0" />
          Account Aliases
        </button>
        <button
          onClick={() => setActiveSection("artifacts")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "artifacts"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Layers className="size-4 shrink-0" />
          Remote Caching
        </button>
        <button
          onClick={() => setActiveSection("dns")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "dns"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Server className="size-4 shrink-0" />
          DNS Records
        </button>
        <button
          onClick={() => setActiveSection("registrar")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "registrar"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Search className="size-4 shrink-0" />
          Domain Registrar
        </button>
        <button
          onClick={() => setActiveSection("drains")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "drains"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Radio className="size-4 shrink-0" />
          Log Drains
        </button>
        <button
          onClick={() => setActiveSection("logs")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "logs"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Terminal className="size-4 shrink-0" />
          Runtime Logs
        </button>
        <button
          onClick={() => setActiveSection("integrations")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "integrations"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Puzzle className="size-4 shrink-0" />
          Integrations
        </button>
        <button
          onClick={() => setActiveSection("edge-cache")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "edge-cache"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Zap className="size-4 shrink-0" />
          Edge Cache
        </button>
        <button
          onClick={() => setActiveSection("webhooks")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "webhooks"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Webhook className="size-4 shrink-0" />
          Webhooks Manager
        </button>
        <button
          onClick={() => setActiveSection("waf")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "waf"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <ShieldCheck className="size-4 shrink-0" />
          Firewall WAF
        </button>
        <button
          onClick={() => setActiveSection("project-members")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "project-members"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Users className="size-4 shrink-0" />
          Project Members
        </button>
        <button
          onClick={() => setActiveSection("user-profile")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "user-profile"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <User className="size-4 shrink-0" />
          Connected Account
        </button>
        <button
          onClick={() => setActiveSection("matrix")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "matrix"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <HelpCircle className="size-4 shrink-0" />
          {t("matrix.title")}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {vercelConnectionError && (
          <Alert variant="destructive" className="mb-6 bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">Connection Error</AlertTitle>
            <AlertDescription className="text-xs font-semibold mt-1">
              {t("api_error")}
            </AlertDescription>
          </Alert>
        )}

        {/* 1. API Observability */}
        {activeSection === "observability" && (
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink">{t("observability.title")}</CardTitle>
              <CardDescription className="text-xs text-ink-mute">{t("observability.desc")}</CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-canvas-soft/40 p-4 rounded-md border border-hairline">
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Project Integration Status</h4>
                  <p className="text-[11px] text-ink-mute mt-1">Configure whether API observability telemetry data is enabled for this project.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="text-xs font-bold text-ink">{t("observability.status_enabled")}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <form action={toggleObservabilityAction} className="flex flex-col">
                  <input type="hidden" name="projectId" value={project.vercelProjectId || ""} />
                  <input type="hidden" name="disabled" value="false" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="outline" className="w-full border-hairline-strong text-xs font-semibold hover:bg-canvas-soft h-10 rounded-sm">
                    <Activity className="size-3.5 mr-2 text-primary" />
                    {t("observability.toggle_enable")}
                  </Button>
                </form>

                <form action={toggleObservabilityAction} className="flex flex-col">
                  <input type="hidden" name="projectId" value={project.vercelProjectId || ""} />
                  <input type="hidden" name="disabled" value="true" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="outline" className="w-full border-destructive/20 hover:border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/5 h-10 rounded-sm">
                    <ShieldAlert className="size-3.5 mr-2" />
                    {t("observability.toggle_disable")}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Redirect Rules */}
        {activeSection === "redirects" && (
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink">{t("redirects.title")}</CardTitle>
              <CardDescription className="text-xs text-ink-mute">{t("redirects.desc")}</CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0">
              <form action={stageRedirectsAction} className="space-y-4">
                <input type="hidden" name="projectId" value={project.vercelProjectId || ""} />
                <input type="hidden" name="returnTo" value={returnTo} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="source" className="text-xs font-bold text-ink-secondary">{t("redirects.source_label")}</Label>
                    <Input
                      id="source"
                      name="source"
                      placeholder={t("redirects.source_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="destination" className="text-xs font-bold text-ink-secondary">{t("redirects.dest_label")}</Label>
                    <Input
                      id="destination"
                      name="destination"
                      placeholder={t("redirects.dest_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                  <Plus className="size-3.5 mr-1.5" />
                  {t("redirects.stage_btn")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 3. SSL Certificates */}
        {activeSection === "certs" && (
          <div className="space-y-6">
            {/* Issue Certificate */}
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("certs.title")} — Issue SSL</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("certs.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={issueCertificateAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="space-y-1.5">
                    <Label htmlFor="cns" className="text-xs font-bold text-ink-secondary">{t("certs.domain_label")}</Label>
                    <Input
                      id="cns"
                      name="cns"
                      placeholder={t("certs.domain_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    <CheckCircle className="size-3.5 mr-1.5" />
                    {t("certs.issue_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Upload Certificate */}
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("certs.upload_btn")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">Upload a custom TLS/SSL certificate chain for external routing.</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={uploadCertificateAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="cert" className="text-xs font-bold text-ink-secondary">{t("certs.cert_label")}</Label>
                    <Textarea
                      id="cert"
                      name="cert"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="key" className="text-xs font-bold text-ink-secondary">{t("certs.key_label")}</Label>
                    <Textarea
                      id="key"
                      name="key"
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ca" className="text-xs font-bold text-ink-secondary">{t("certs.ca_label")}</Label>
                    <Textarea
                      id="ca"
                      name="ca"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    <PlusCircle className="size-3.5 mr-1.5" />
                    {t("certs.upload_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Revoke Certificate */}
            <Card className="bg-canvas border border-destructive/20 rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-destructive">{t("certs.remove_btn")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">Revoke or delete an existing certificate by ID.</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={deleteCertificateAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="space-y-1.5">
                    <Label htmlFor="certId" className="text-xs font-bold text-ink-secondary">{t("certs.cert_id_label")}</Label>
                    <Input
                      id="certId"
                      name="certId"
                      placeholder={t("certs.cert_id_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="bg-destructive hover:bg-destructive-deep text-white text-xs font-semibold h-9 rounded-sm px-4">
                    <Trash2 className="size-3.5 mr-1.5" />
                    {t("certs.remove_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. Access Groups */}
        {activeSection === "access-groups" && (
          <div className="space-y-6 animate-in fade-in">
            {selectedGroup ? (
              // Detailed group management view
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedGroup(null);
                      setIsEditingGroup(false);
                    }} 
                    className="h-8 text-xs font-semibold"
                  >
                    <ArrowLeft className="size-3.5 mr-1" />
                    Back to list
                  </Button>
                  <h3 className="text-sm font-bold text-ink">Manage Access Group: {selectedGroup.name}</h3>
                </div>

                {/* Edit Group Name */}
                <Card className="bg-canvas border border-hairline rounded-lg p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm font-bold text-ink">Update Access Group Name</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form action={updateAccessGroupAction} className="space-y-4">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="idOrName" value={selectedGroup.id} />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor="editGroupName" className="text-xs font-bold text-ink-secondary">New Name</Label>
                          <Input
                            id="editGroupName"
                            name="name"
                            defaultValue={selectedGroup.name}
                            required
                            className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                          />
                        </div>
                        <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                          Update Name
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Members Section */}
                <Card className="bg-canvas border border-hairline rounded-lg p-0">
                  <CardHeader className="p-5 border-b border-hairline">
                    <CardTitle className="text-sm font-bold text-ink">Group Members</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingGroupDetails ? (
                      <div className="p-6 text-center text-xs text-ink-mute">Loading members...</div>
                    ) : groupMembers.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink-mute">No members in this group.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">UID</TableHead>
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Email / Username</TableHead>
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Role</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupMembers.map((member) => (
                            <TableRow key={member.uid} className="border-b border-hairline">
                              <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{member.uid}</TableCell>
                              <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{member.email || member.username}</TableCell>
                              <TableCell className="px-5 py-3 text-xs text-ink-mute">{member.role}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Projects Mapping Section */}
                <Card className="bg-canvas border border-hairline rounded-lg p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm font-bold text-ink">Group Projects</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    {/* Map Project Form */}
                    <form action={createAccessGroupProjectAction} className="space-y-4">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="accessGroupId" value={selectedGroup.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor="mapProjectId" className="text-xs font-bold text-ink-secondary">Map Vercel Project ID or Name</Label>
                          <Input
                            id="mapProjectId"
                            name="projectIdToMap"
                            placeholder="e.g. prj_xyz123"
                            required
                            className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                          />
                        </div>
                        <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                          <Plus className="size-3.5 mr-1.5" />
                          Link Project
                        </Button>
                      </div>
                    </form>

                    <Separator className="bg-hairline my-4" />

                    {/* Group Projects Table */}
                    <div className="border border-hairline rounded-md overflow-hidden">
                      {loadingGroupDetails ? (
                        <div className="p-6 text-center text-xs text-ink-mute">Loading projects...</div>
                      ) : groupProjects.length === 0 ? (
                        <div className="p-6 text-center text-xs text-ink-mute">No projects linked to this group.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                              <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Project ID</TableHead>
                              <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Name</TableHead>
                              <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupProjects.map((groupProj) => (
                              <TableRow key={groupProj.projectId} className="border-b border-hairline hover:bg-canvas-soft/10">
                                <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{groupProj.projectId}</TableCell>
                                <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{groupProj.name || groupProj.projectId}</TableCell>
                                <TableCell className="px-5 py-3 text-right">
                                  <form action={deleteAccessGroupProjectAction}>
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="accessGroupId" value={selectedGroup.id} />
                                    <input type="hidden" name="projectId" value={project.id} />
                                    <input type="hidden" name="projectToRemoveId" value={groupProj.projectId} />
                                    <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                      Unlink
                                    </Button>
                                  </form>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // List access groups (Default View)
              <>
                <Card className="bg-canvas border border-hairline rounded-lg p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base font-bold text-ink">{t("access_groups.title")}</CardTitle>
                    <CardDescription className="text-xs text-ink-mute">{t("access_groups.desc")}</CardDescription>
                  </CardHeader>
                  <Separator className="bg-hairline my-4" />
                  <CardContent className="px-0">
                    <form action={createAccessGroupAction} className="space-y-4">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor="groupName" className="text-xs font-bold text-ink-secondary">{t("access_groups.name_label")}</Label>
                          <Input
                            id="groupName"
                            name="name"
                            placeholder={t("access_groups.name_placeholder")}
                            required
                            className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                          />
                        </div>
                        <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                          <Plus className="size-3.5 mr-1.5" />
                          {t("access_groups.create_btn")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="bg-canvas border border-hairline rounded-lg p-0">
                  <CardHeader className="p-5 border-b border-hairline">
                    <CardTitle className="text-sm font-bold text-ink">Active Access Groups</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {vercelAccessGroups.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink-mute">
                        {t("access_groups.empty")}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_id")}</TableHead>
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_name")}</TableHead>
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_created")}</TableHead>
                            <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vercelAccessGroups.map((group) => (
                            <TableRow key={group.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                              <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">
                                <button 
                                  onClick={() => setSelectedGroup(group)}
                                  className="hover:underline text-primary text-left"
                                >
                                  {group.id}
                                </button>
                              </TableCell>
                              <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{group.name}</TableCell>
                              <TableCell className="px-5 py-3 text-xs text-ink-mute">
                                {group.createdAt ? formatRelativeTime(new Date(group.createdAt), locale) : "N/A"}
                              </TableCell>
                              <TableCell className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedGroup(group)}
                                    className="h-7 text-xs px-2.5 rounded-sm"
                                  >
                                    Manage
                                  </Button>
                                  <form action={deleteAccessGroupAction}>
                                    <input type="hidden" name="idOrName" value={group.id} />
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </form>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* 5. Auth Tokens */}
        {activeSection === "tokens" && (
          <div className="space-y-6">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("tokens.title")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("tokens.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={createAuthTokenAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="tokenName" className="text-xs font-bold text-ink-secondary">{t("tokens.name_label")}</Label>
                      <Input
                        id="tokenName"
                        name="name"
                        placeholder={t("tokens.name_placeholder")}
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                    <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                      <Plus className="size-3.5 mr-1.5" />
                      {t("tokens.create_btn")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-canvas border border-hairline rounded-lg p-0">
              <CardHeader className="p-5 border-b border-hairline">
                <CardTitle className="text-sm font-bold text-ink">Active Tokens</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vercelTokens.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">
                    {t("tokens.empty")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_id")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_name")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_created")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vercelTokens.map((token) => (
                        <TableRow key={token.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                          <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{token.id}</TableCell>
                          <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{token.name}</TableCell>
                          <TableCell className="px-5 py-3 text-xs text-ink-mute">
                            {token.createdAt ? formatRelativeTime(new Date(token.createdAt), locale) : "N/A"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            <form action={deleteAuthTokenAction}>
                              <input type="hidden" name="tokenId" value={token.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 6. Billing & Credits */}
        {activeSection === "credits" && (
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink">{t("credits.title")}</CardTitle>
              <CardDescription className="text-xs text-ink-mute">{t("credits.desc")}</CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0 space-y-4">
              <form action={buyCreditsAction} className="space-y-4">
                <input type="hidden" name="returnTo" value={returnTo} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="creditType" className="text-xs font-bold text-ink-secondary">{t("credits.type_label")}</Label>
                    <Select name="creditType" defaultValue="v0">
                      <SelectTrigger className="bg-canvas-soft border-hairline text-xs font-medium h-9 rounded-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-canvas border border-hairline rounded-md">
                        <SelectItem value="v0" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">v0 Credits</SelectItem>
                        <SelectItem value="gateway" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">AI Gateway Credits</SelectItem>
                        <SelectItem value="agent" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">AI Agent Credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs font-bold text-ink-secondary">{t("credits.amount_label")}</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder={t("credits.amount_placeholder")}
                      required
                      min="1"
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                  <CreditCard className="size-3.5 mr-1.5" />
                  {t("credits.buy_btn")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edge Config Centralized Sync Dashboard */}
        {activeSection === "edge-config" && (
          <EdgeConfigVarsCard
            vercelProjectEnvVars={vercelProjectEnvVars}
            vercelProjectId={project.vercelProjectId || ""}
            projectId={project.id}
            locale={locale}
            returnTo={returnTo}
          />
        )}

        {/* Aliases Section */}
        {activeSection === "aliases" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Account Aliases</CardTitle>
                <CardDescription className="text-xs text-ink-mute">Assign and manage custom domain aliases for your deployments across Vercel.</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={assignAliasAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="assignAliasName" className="text-xs font-bold text-ink-secondary">Alias URL / Domain</Label>
                      <Input
                        id="assignAliasName"
                        name="alias"
                        placeholder="e.g. my-app.vercel.app"
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assignAliasDpl" className="text-xs font-bold text-ink-secondary">Deployment ID</Label>
                      <Input
                        id="assignAliasDpl"
                        name="deploymentId"
                        placeholder="e.g. dpl_xyz123"
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Assign Alias
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-canvas border border-hairline rounded-lg p-0">
              <CardHeader className="p-5 border-b border-hairline">
                <CardTitle className="text-sm font-bold text-ink">Domain Aliases List</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingAliases ? (
                  <div className="p-6 text-center text-xs text-ink-mute">Loading aliases...</div>
                ) : aliasesError ? (
                  <div className="p-6 text-center text-xs text-destructive">{aliasesError}</div>
                ) : aliasesList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">No domain aliases configured.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Alias</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Deployment ID</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Created</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aliasesList.map((item) => (
                        <TableRow key={item.uid} className="border-b border-hairline hover:bg-canvas-soft/10">
                          <TableCell className="px-5 py-3 text-xs font-semibold text-ink">
                            <a href={`https://${item.alias}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              {item.alias}
                            </a>
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{item.deploymentId}</TableCell>
                          <TableCell className="px-5 py-3 text-xs text-ink-mute">
                            {item.createdAt ? formatRelativeTime(new Date(item.createdAt), locale) : "N/A"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            <form action={deleteAliasAction}>
                              <input type="hidden" name="aliasId" value={item.uid} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Remote Caching Section */}
        {activeSection === "artifacts" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Remote Caching & Build Artifacts</CardTitle>
                <CardDescription className="text-xs text-ink-mute">Manage and audit build caching artifacts to accelerate build pipelines.</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-6">
                {loadingCaching ? (
                  <div className="text-xs text-ink-mute">Loading remote caching status...</div>
                ) : cachingError ? (
                  <div className="text-xs text-destructive">{cachingError}</div>
                ) : cachingStatus ? (
                  <div className="bg-canvas-soft/40 p-4 rounded-md border border-hairline flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Caching State</h4>
                      <p className="text-[11px] text-ink-mute mt-1">Remote cache storage status for your team/organization.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${cachingStatus.status === "disabled" ? "bg-destructive" : "bg-primary"}`} />
                      <span className="text-xs font-bold text-ink uppercase">{cachingStatus.status || "Active"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-ink-mute">Remote caching status details are not available.</div>
                )}

                {/* Artifact existence check form */}
                <div className="space-y-4 border border-hairline p-4 rounded-md bg-canvas-soft/20">
                  <h4 className="text-xs font-bold text-ink">Query Build Artifact Existence</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter artifact sha256 hash"
                      value={artifactHashToCheck}
                      onChange={(e) => {
                        setArtifactHashToCheck(e.target.value);
                        setArtifactExistsResult(null);
                      }}
                      className="bg-canvas border-hairline focus:border-primary focus:ring-0 text-xs font-mono h-9 rounded-sm flex-1"
                    />
                    <Button
                      onClick={async () => {
                        if (!artifactHashToCheck) return;
                        setCheckingArtifact(true);
                        try {
                          const res = await artifactExistsAction(project.id, artifactHashToCheck);
                          setArtifactExistsResult(res.success);
                        } catch (err) {
                          console.error(err);
                          setArtifactExistsResult(false);
                        } finally {
                          setCheckingArtifact(false);
                        }
                      }}
                      disabled={checkingArtifact || !artifactHashToCheck}
                      className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4"
                    >
                      {checkingArtifact ? "Checking..." : "Verify Hash"}
                    </Button>
                  </div>

                  {artifactExistsResult !== null && (
                    <Alert className={`mt-2 ${artifactExistsResult ? "bg-primary/5 border-primary/20 text-primary" : "bg-destructive/5 border-destructive/20 text-destructive"}`}>
                      <AlertCircle className="size-4 shrink-0" />
                      <AlertDescription className="text-xs font-medium">
                        {artifactExistsResult 
                          ? "Artifact exists and is available in the remote cache." 
                          : "Artifact does not exist in the remote cache."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DNS Records */}
        {activeSection === "dns" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">DNS Records</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Query and manage DNS records for domains registered or hosted with Vercel.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="dnsDomainInput" className="text-xs font-bold text-ink-secondary">Domain Name</Label>
                    <Input
                      id="dnsDomainInput"
                      placeholder="e.g. example.com"
                      value={dnsDomain}
                      onChange={(e) => setDnsDomain(e.target.value)}
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleFetchDnsRecords} 
                    disabled={loadingDns || !dnsDomain}
                    className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4"
                  >
                    {loadingDns ? "Fetching..." : "Fetch Records"}
                  </Button>
                </div>

                {dnsError && (
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
                    <AlertCircle className="size-4 shrink-0" />
                    <AlertDescription className="text-xs font-semibold">{dnsError}</AlertDescription>
                  </Alert>
                )}

                {dnsRecords.length > 0 ? (
                  <div className="rounded-md border border-hairline overflow-hidden mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Type</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Name</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Value</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">TTL</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dnsRecords.map((record) => (
                          <TableRow key={record.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                            <TableCell className="px-5 py-3 text-xs font-bold text-ink">{record.type}</TableCell>
                            <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{record.name || "@"}</TableCell>
                            <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary truncate max-w-[200px]" title={record.value}>{record.value}</TableCell>
                            <TableCell className="px-5 py-3 text-xs text-ink-mute">{record.ttl}</TableCell>
                            <TableCell className="px-5 py-3 text-right">
                              <form action={deleteDnsRecordAction}>
                                <input type="hidden" name="projectId" value={project.id} />
                                <input type="hidden" name="domain" value={dnsDomain} />
                                <input type="hidden" name="recordId" value={record.id} />
                                <input type="hidden" name="returnTo" value={returnTo} />
                                <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </form>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  !loadingDns && dnsDomain && (
                    <div className="p-6 text-center text-xs text-ink-mute border border-dashed border-hairline rounded-md">
                      No DNS records found for this domain.
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {dnsDomain && (
              <Card className="bg-canvas border border-hairline rounded-lg p-5">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-bold text-ink">Add New DNS Record for {dnsDomain}</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <form action={createDnsRecordAction} className="space-y-4">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="domain" value={dnsDomain} />
                    <input type="hidden" name="returnTo" value={returnTo} />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="dnsType" className="text-xs font-bold text-ink-secondary">Record Type</Label>
                        <Select name="type" defaultValue="A">
                          <SelectTrigger id="dnsType" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-canvas border-hairline text-xs">
                            {["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "LOC", "CAA", "NS"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dnsName" className="text-xs font-bold text-ink-secondary">Name / Host</Label>
                        <Input
                          id="dnsName"
                          name="name"
                          placeholder="e.g. www, sub, @"
                          className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label htmlFor="dnsValue" className="text-xs font-bold text-ink-secondary">Value / Points To</Label>
                        <Input
                          id="dnsValue"
                          name="value"
                          placeholder="e.g. 76.76.21.21"
                          required
                          className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="dnsTtl" className="text-xs font-bold text-ink-secondary">TTL (Seconds, optional)</Label>
                        <Input
                          id="dnsTtl"
                          name="ttl"
                          type="number"
                          placeholder="e.g. 60, 3600"
                          className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dnsComment" className="text-xs font-bold text-ink-secondary">Comment (Optional)</Label>
                        <Input
                          id="dnsComment"
                          name="comment"
                          placeholder="Identify this record"
                          className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                      Create DNS Record
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Domain Registrar */}
        {activeSection === "registrar" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Domain Registrar</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Search, verify availability, and buy custom domains directly from Vercel's Domain Registrar service.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="searchDomainInput" className="text-xs font-bold text-ink-secondary">Search Domain Name</Label>
                    <Input
                      id="searchDomainInput"
                      placeholder="e.g. my-cool-startup.com"
                      value={searchDomain}
                      onChange={(e) => setSearchDomain(e.target.value)}
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleSearchDomainAvailability} 
                    disabled={checkingAvailability || !searchDomain}
                    className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4"
                  >
                    {checkingAvailability ? "Checking..." : "Check Availability"}
                  </Button>
                </div>

                {registrarError && (
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
                    <AlertCircle className="size-4 shrink-0" />
                    <AlertDescription className="text-xs font-semibold">{registrarError}</AlertDescription>
                  </Alert>
                )}

                {availabilityResult && (
                  <div className="mt-6 border border-hairline rounded-lg p-5 bg-canvas-soft/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-ink">{searchDomain}</div>
                        <div className="text-xs mt-1">
                          {availabilityResult.available ? (
                            <span className="text-primary font-semibold flex items-center gap-1">
                              <CheckCircle className="size-4" /> Available for registration
                            </span>
                          ) : (
                            <span className="text-destructive font-semibold flex items-center gap-1">
                              <AlertCircle className="size-4" /> Already registered
                            </span>
                          )}
                        </div>
                      </div>

                      {availabilityResult.available && priceResult && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-ink">${priceResult.purchasePrice}</div>
                          <div className="text-[10px] text-ink-mute">
                            Renewal price: ${priceResult.renewalPrice || priceResult.purchasePrice}/yr
                          </div>
                        </div>
                      )}
                    </div>

                    {availabilityResult.available && priceResult && (
                      <form action={buyDomainAction} className="mt-4 pt-4 border-t border-hairline flex justify-end">
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="name" value={searchDomain} />
                        <input type="hidden" name="expectedPrice" value={priceResult.purchasePrice} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-bold h-9 rounded-sm px-4">
                          Buy Domain
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Log Drains */}
        {activeSection === "drains" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">System Log Drains</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Configure real-time log forwarding to third-party endpoints such as Datadog, Logflare, or custom Syslog/HTTPS collectors.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                {loadingDrains ? (
                  <div className="p-6 text-center text-xs text-ink-mute">Loading log drains...</div>
                ) : drainsError ? (
                  <div className="p-6 text-center text-xs text-destructive">{drainsError}</div>
                ) : logDrainsList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">No log drains configured.</div>
                ) : (
                  <div className="rounded-md border border-hairline overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Name</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Destination URL</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Format</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Sources</TableHead>
                          <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logDrainsList.map((drain) => (
                          <TableRow key={drain.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                            <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{drain.name}</TableCell>
                            <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary truncate max-w-[200px]" title={drain.url}>{drain.url}</TableCell>
                            <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{drain.deliveryFormat}</TableCell>
                            <TableCell className="px-5 py-3 text-xs text-ink-mute">{(drain.sources || []).join(", ")}</TableCell>
                            <TableCell className="px-5 py-3 text-right">
                              <form action={deleteConfigurableLogDrainAction}>
                                <input type="hidden" name="projectId" value={project.id} />
                                <input type="hidden" name="logDrainId" value={drain.id} />
                                <input type="hidden" name="returnTo" value={returnTo} />
                                <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </form>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-bold text-ink">Add Log Drain Endpoint</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <form action={createConfigurableLogDrainAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="drainName" className="text-xs font-bold text-ink-secondary">Name</Label>
                      <Input
                        id="drainName"
                        name="name"
                        placeholder="e.g. Datadog Log Stream"
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="drainFormat" className="text-xs font-bold text-ink-secondary">Delivery Format</Label>
                      <Select name="deliveryFormat" defaultValue="json">
                        <SelectTrigger id="drainFormat" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent className="bg-canvas border-hairline text-xs">
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="ndjson">NDJSON</SelectItem>
                          <SelectItem value="syslog">Syslog</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="drainUrl" className="text-xs font-bold text-ink-secondary">Endpoint URL</Label>
                    <Input
                      id="drainUrl"
                      name="url"
                      placeholder="e.g. https://http-intake.logs.datadoghq.com/... or syslog://..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Create Log Drain
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Runtime Logs */}
        {activeSection === "logs" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Real-time Runtime Logs</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Inspect the live serverless execution logs, API requests, and standard outputs for project deployments.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deploymentSelect" className="text-xs font-bold text-ink-secondary">Target Deployment</Label>
                  {loadingDeployments ? (
                    <div className="text-xs text-ink-mute">Loading deployments...</div>
                  ) : deploymentsList.length === 0 ? (
                    <div className="text-xs text-ink-mute">No deployments found.</div>
                  ) : (
                    <Select value={selectedDeploymentId} onValueChange={setSelectedDeploymentId}>
                      <SelectTrigger id="deploymentSelect" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                        <SelectValue placeholder="Select deployment" />
                      </SelectTrigger>
                      <SelectContent className="bg-canvas border-hairline text-xs">
                        {deploymentsList.map((d) => (
                          <SelectItem key={d.uid || d.id} value={d.uid || d.id}>
                            {d.url} ({d.state})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {logsError && (
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
                    <AlertCircle className="size-4 shrink-0" />
                    <AlertDescription className="text-xs font-semibold">{logsError}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-[#0c0c0d] text-emerald-400 font-mono text-xs rounded-lg p-4 h-[350px] overflow-y-auto border border-hairline">
                  {loadingLogs ? (
                    <div className="text-ink-mute flex items-center justify-center h-full">Streaming runtime logs...</div>
                  ) : runtimeLogs.length === 0 ? (
                    <div className="text-ink-mute flex items-center justify-center h-full">No runtime logs recorded for this deployment execution.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {runtimeLogs.map((log, index) => (
                        <div key={index} className="flex gap-2 hover:bg-canvas-soft/5 py-0.5 rounded px-1">
                          <span className="text-ink-mute shrink-0">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                          </span>
                          <span className={log.type === "stderr" ? "text-red-400" : "text-emerald-400"}>
                            [{log.type || "INFO"}]
                          </span>
                          <span className="text-gray-300 break-all">{log.message || log.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations */}
        {activeSection === "integrations" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Integrations Directory</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  View and manage connected third-party tools, add-ons, and workspace service connections configured via Vercel.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                {loadingIntegrations ? (
                  <div className="p-6 text-center text-xs text-ink-mute">Loading integrations...</div>
                ) : integrationsError ? (
                  <div className="p-6 text-center text-xs text-destructive">{integrationsError}</div>
                ) : integrationsList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">No integrations configured.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {integrationsList.map((config) => (
                      <Card key={config.id} className="bg-canvas border border-hairline p-4 rounded-md">
                        <div className="flex gap-3 items-start">
                          <div className="size-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">
                            {config.integration?.name ? config.integration.name.slice(0, 2) : "IN"}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-ink">{config.integration?.name || "Third-party Integration"}</div>
                            <div className="text-[10px] text-ink-mute mt-0.5">ID: {config.id}</div>
                            <div className="text-[10px] text-ink-secondary mt-1">
                              View: <span className="font-mono">{config.view}</span> | Mode: <span className="font-mono">{config.installationType}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edge Cache */}
        {activeSection === "edge-cache" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Edge Cache CDN Control</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Manually invalidate CDN Edge Cache by tag parameters to push instant updates to end-users globally.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={purgeEdgeCacheAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div className="space-y-1.5">
                    <Label htmlFor="cacheTagsInput" className="text-xs font-bold text-ink-secondary">Project Name or ID</Label>
                    <Input
                      id="cacheTagsInput"
                      name="projectIdOrName"
                      placeholder="e.g. my-cool-project"
                      defaultValue={project.vercelProjectId || project.name}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Purge CDN Edge Cache
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Webhooks Manager */}
        {activeSection === "webhooks" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Webhooks Manager</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Register webhooks to receive real-time updates from Vercel.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-6">
                
                {/* Webhooks List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-ink-secondary">Registered Webhooks</div>
                  {loadingWebhooks ? (
                    <div className="text-xs text-ink-mute py-4 text-center">Loading webhooks...</div>
                  ) : webhooksError ? (
                    <div className="text-xs text-destructive py-4 text-center">{webhooksError}</div>
                  ) : webhooksList.length === 0 ? (
                    <div className="text-xs text-ink-mute py-4 text-center bg-canvas-soft/10 border border-dashed border-hairline rounded-md">No webhooks registered.</div>
                  ) : (
                    <div className="border border-hairline rounded-md overflow-hidden bg-[#0c0c0d]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Webhook URL</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Events</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {webhooksList.map((webhook) => (
                            <TableRow key={webhook.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                              <TableCell className="px-4 py-3 text-xs font-mono text-ink-secondary break-all">
                                {webhook.url}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                                <div className="flex flex-wrap gap-1">
                                  {webhook.events?.map((e: string) => (
                                    <span key={e} className="text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-sm">
                                      {e}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <form action={deleteWebhookAction}>
                                  <input type="hidden" name="projectId" value={project.id} />
                                  <input type="hidden" name="webhookId" value={webhook.id} />
                                  <input type="hidden" name="returnTo" value={returnTo} />
                                  <Button type="submit" size="icon" variant="ghost" className="size-8 text-ink-mute hover:text-destructive transition-colors">
                                    <Trash2 className="size-4" />
                                  </Button>
                                </form>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Separator className="bg-hairline" />

                {/* Create Webhook Form */}
                <form action={createWebhookAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  
                  <div className="text-xs font-bold text-ink-secondary">Register New Webhook</div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="webhookUrlInput" className="text-xs font-semibold text-ink-secondary">Endpoint URL</Label>
                    <Input
                      id="webhookUrlInput"
                      name="url"
                      placeholder="e.g. https://my-app.com/api/webhooks/vercel"
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-ink-secondary">Events to Subscribe</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-canvas-soft/20 border border-hairline rounded-sm">
                      {["deployment.created", "deployment.succeeded", "deployment.failed", "deployment.cancelled"].map((evt) => (
                        <label key={evt} className="flex items-center gap-2 text-xs font-medium text-ink-secondary cursor-pointer select-none">
                          <input
                            type="checkbox"
                            value={evt}
                            defaultChecked
                            onChange={() => {
                              const checkboxes = document.querySelectorAll('input[name="event_checkbox"]:checked');
                              const values = Array.from(checkboxes).map((el: any) => el.value).join(",");
                              const hiddenInput = document.getElementById("eventsHiddenInput") as HTMLInputElement;
                              if (hiddenInput) hiddenInput.value = values;
                            }}
                            name="event_checkbox"
                            className="rounded border-hairline text-primary focus:ring-0 cursor-pointer size-4 bg-canvas"
                          />
                          {evt}
                        </label>
                      ))}
                    </div>
                    {/* Hidden input for comma-separated events */}
                    <input
                      id="eventsHiddenInput"
                      type="hidden"
                      name="events"
                      value="deployment.created,deployment.succeeded,deployment.failed,deployment.cancelled"
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Register Webhook
                  </Button>
                </form>

              </CardContent>
            </Card>
          </div>
        )}

        {/* Firewall WAF */}
        {activeSection === "waf" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Web Application Firewall (WAF) & Security</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Protect your applications with an integrated firewall layer. Configure bypass settings for development and external testing tools.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-6">

                {/* Firewall Status */}
                {loadingFirewall ? (
                  <div className="text-xs text-ink-mute py-4 text-center">Loading firewall configuration...</div>
                ) : firewallError ? (
                  <div className="text-xs text-destructive py-4 text-center">{firewallError}</div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-canvas-soft/20 border border-hairline rounded-md">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <span className={`size-2.5 rounded-full ${firewallConfig?.firewallEnabled ? "bg-emerald-500 animate-pulse" : "bg-ink-mute"}`} />
                        WAF Status: {firewallConfig?.firewallEnabled ? "Enabled (Active)" : "Disabled (Inactive)"}
                      </div>
                      <div className="text-[10px] text-ink-mute">
                        Configuration version: {firewallConfig?.version || "N/A"} | Last updated: {firewallConfig?.updatedAt ? new Date(parseInt(firewallConfig.updatedAt)).toLocaleString() : "Unknown"}
                      </div>
                    </div>
                    <form action={updateFirewallConfigAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="firewallEnabled" value={firewallConfig?.firewallEnabled ? "false" : "true"} />
                      <Button
                        type="submit"
                        className={`text-xs font-semibold h-9 rounded-sm px-4 ${
                          firewallConfig?.firewallEnabled
                            ? "bg-canvas-soft border border-hairline text-ink hover:bg-canvas-soft/80"
                            : "bg-primary hover:bg-primary-deep text-primary-foreground"
                        }`}
                      >
                        {firewallConfig?.firewallEnabled ? "Disable WAF Firewall" : "Enable WAF Firewall"}
                      </Button>
                    </form>
                  </div>
                )}

                <Separator className="bg-hairline" />

                {/* Bypass IP Rules */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-ink-secondary">Bypass IP Rules</div>
                  {loadingFirewall ? (
                    <div className="text-xs text-ink-mute py-4 text-center">Loading bypass rules...</div>
                  ) : firewallConfig?.ips?.length === 0 ? (
                    <div className="text-xs text-ink-mute py-4 text-center bg-canvas-soft/10 border border-dashed border-hairline rounded-md">No bypass IP rules active.</div>
                  ) : (
                    <div className="border border-hairline rounded-md overflow-hidden bg-[#0c0c0d]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">IP / Range</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Hostname</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Action</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {firewallConfig?.ips?.map((ipRule: any) => (
                            <TableRow key={ipRule.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                              <TableCell className="px-4 py-3 text-xs font-mono text-ink-secondary">{ipRule.ip}</TableCell>
                              <TableCell className="px-4 py-3 text-xs text-ink-secondary">{ipRule.hostname || "All hosts"}</TableCell>
                              <TableCell className="px-4 py-3 text-xs">
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                  {ipRule.action}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <span className="text-[10px] text-ink-mute font-medium">Bypass Rule</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Separator className="bg-hairline" />

                {/* Add Bypass IP Form */}
                <form action={addBypassIpAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div className="text-xs font-bold text-ink-secondary">Add Bypass IP / Range</div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bypassIpInput" className="text-xs font-semibold text-ink-secondary">IP Address or CIDR Range</Label>
                    <Input
                      id="bypassIpInput"
                      name="ip"
                      placeholder="e.g. 192.168.1.1 or 200.100.50.0/24"
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Add Bypass IP Rule
                  </Button>
                </form>

              </CardContent>
            </Card>
          </div>
        )}

        {/* Project Members */}
        {activeSection === "project-members" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Project Collaborators & Members</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  View users who have explicit developer or admin access to this Vercel project deployment target.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0 space-y-6">

                {/* Members List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-ink-secondary">Project Members</div>
                  {loadingMembers ? (
                    <div className="text-xs text-ink-mute py-4 text-center">Loading collaborators...</div>
                  ) : membersError ? (
                    <div className="text-xs text-destructive py-4 text-center">{membersError}</div>
                  ) : projectMembersList.length === 0 ? (
                    <div className="text-xs text-ink-mute py-4 text-center bg-canvas-soft/10 border border-dashed border-hairline rounded-md">No collaborators found.</div>
                  ) : (
                    <div className="border border-hairline rounded-md overflow-hidden bg-[#0c0c0d]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">User</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Role</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Joined</TableHead>
                            <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectMembersList.map((m) => (
                            <TableRow key={m.uid} className="border-b border-hairline hover:bg-canvas-soft/10">
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase overflow-hidden shrink-0">
                                    {m.avatar ? (
                                      <img src={`https://vercel.com/api/www/avatar/${m.avatar}?s=64`} alt={m.name || m.username} className="size-full object-cover" />
                                    ) : (
                                      (m.name || m.username || m.email || "U").slice(0, 2)
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-ink">{m.name || m.username}</div>
                                    <div className="text-[10px] text-ink-mute font-mono">{m.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-xs font-medium text-ink-secondary">
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                  m.role === "ADMIN"
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-hairline bg-canvas-soft text-ink-mute"
                                }`}>
                                  {m.role}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-[10px] text-ink-mute font-mono">
                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <form action={removeProjectMemberAction}>
                                  <input type="hidden" name="projectId" value={project.id} />
                                  <input type="hidden" name="uid" value={m.uid} />
                                  <input type="hidden" name="returnTo" value={returnTo} />
                                  <Button type="submit" size="icon" variant="ghost" className="size-8 text-ink-mute hover:text-destructive transition-colors">
                                    <Trash2 className="size-4" />
                                  </Button>
                                </form>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Separator className="bg-hairline" />

                {/* Add Member Form */}
                <form action={addProjectMemberAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div className="text-xs font-bold text-ink-secondary">Add Project Collaborator</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="memberEmailInput" className="text-xs font-semibold text-ink-secondary">User Email or Username</Label>
                      <Input
                        id="memberEmailInput"
                        name="email"
                        placeholder="e.g. collaborator@company.com"
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="memberRoleSelect" className="text-xs font-semibold text-ink-secondary">Project Role</Label>
                      <Select name="role" defaultValue="MEMBER">
                        <SelectTrigger id="memberRoleSelect" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-canvas border-hairline text-xs">
                          <SelectItem value="MEMBER">Collaborator (MEMBER)</SelectItem>
                          <SelectItem value="ADMIN">Project Admin (ADMIN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Invite Member
                  </Button>
                </form>

              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected Account */}
        {activeSection === "user-profile" && (
          <div className="space-y-6 animate-in fade-in">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">Connected Account Profile</CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Review the currently connected Vercel account profile, tokens, and active plan metadata.
                </CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                {loadingProfile ? (
                  <div className="text-xs text-ink-mute py-4 text-center">Loading account details...</div>
                ) : profileError ? (
                  <div className="text-xs text-destructive py-4 text-center">{profileError}</div>
                ) : !authProfile ? (
                  <div className="text-xs text-ink-mute py-4 text-center">No profile details available.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-canvas-soft/20 border border-hairline rounded-md">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase overflow-hidden shrink-0 border border-hairline">
                        {authProfile.avatar ? (
                          <img src={`https://vercel.com/api/www/avatar/${authProfile.avatar}?s=128`} alt={authProfile.name || authProfile.username} className="size-full object-cover" />
                        ) : (
                          (authProfile.name || authProfile.username || "U").slice(0, 2)
                        )}
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="text-sm font-bold text-ink">{authProfile.name || authProfile.username}</div>
                        <div className="text-xs text-ink-secondary">@{authProfile.username}</div>
                        <div className="text-xs text-ink-mute font-mono">{authProfile.email}</div>
                      </div>
                      <div className="sm:ml-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0c0c0d] border border-hairline text-primary">
                          Vercel Account
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-canvas-soft/10 border border-hairline rounded-md">
                        <div className="text-[10px] text-ink-mute uppercase font-bold tracking-wider mb-1">User ID</div>
                        <div className="text-xs font-mono text-ink-secondary truncate">{authProfile.id}</div>
                      </div>
                      <div className="p-4 bg-canvas-soft/10 border border-hairline rounded-md">
                        <div className="text-[10px] text-ink-mute uppercase font-bold tracking-wider mb-1">Account Created</div>
                        <div className="text-xs text-ink-secondary">
                          {authProfile.createdAt ? new Date(authProfile.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 7. Vercel SDK Feature Matrix */}
        {activeSection === "matrix" && (
          <div className="space-y-6">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("matrix.title")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("matrix.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <div className="overflow-x-auto rounded-md border border-hairline">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_category")}</TableHead>
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_methods")}</TableHead>
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_status")}</TableHead>
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_notes")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 1. Aliases */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Aliases</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Manage domain configurations and aliases.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.aliases.assignAlias()</div>
                          <div>vercel.aliases.listAliases()</div>
                          <div>vercel.aliases.deleteAlias()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Custom domains and vercel.app subdomains can be configured and managed directly in the <span className="font-semibold">Domains</span> tab.
                        </TableCell>
                      </TableRow>

                      {/* 2. Deployments */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Deployments</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Automated web builds and deployment tracking.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.deployments.getDeployments()</div>
                          <div>vercel.deployments.cancelDeployment()</div>
                          <div>vercel.deployments.getDeployment()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Real-time build logs, status badges, cancelation actions, and deployment URL links are inside the <span className="font-semibold">Deployments</span> tab.
                        </TableCell>
                      </TableRow>

                      {/* 3. Projects */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Projects</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Vercel project linking and settings.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.projects.createProject()</div>
                          <div>vercel.projects.getProject()</div>
                          <div>vercel.projects.updateProject()</div>
                          <div>vercel.projects.deleteProject()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Linking and disconnecting Vercel Project IDs or names is configured in <span className="font-semibold">Project Settings</span>.
                        </TableCell>
                      </TableRow>

                      {/* 4. Secrets */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Secrets & API Keys</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Encrypt and store Vercel API authorization credentials.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.secrets.createSecret()</div>
                          <div>vercel.secrets.deleteSecret()</div>
                          <div>vercel.secrets.listSecrets()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. The Vercel Bearer token is saved encrypted in the `user_secrets` DB table, managed under the user's account <span className="font-semibold">Settings</span>.
                        </TableCell>
                      </TableRow>

                      {/* 5. Access Groups */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Access Groups</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Team organization and member permissions.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.accessGroups.createAccessGroup()</div>
                          <div>vercel.accessGroups.deleteAccessGroup()</div>
                          <div>vercel.accessGroups.listAccessGroups()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Access Group creations and revocations are supported directly in the sidebar <span className="font-semibold">Access Groups</span> menu. Requires Enterprise Vercel plan.
                        </TableCell>
                      </TableRow>

                      {/* 6. Auth Tokens */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Auth Tokens</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">API token access scopes.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.authentication.createAuthToken()</div>
                          <div>vercel.authentication.deleteAuthToken()</div>
                          <div>vercel.authentication.listAuthTokens()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. List current active keys, create new API credentials, or revoke tokens in the <span className="font-semibold">Auth Tokens</span> section.
                        </TableCell>
                      </TableRow>

                      {/* 7. Observability */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Observability</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Toggle HTTP request telemetry.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.apiObservability.updateObservabilityConfigurationProject()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Easily toggle API observability metrics compilation for web bundles in the <span className="font-semibold">Observability</span> tab.
                        </TableCell>
                      </TableRow>

                      {/* 8. Certificates */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Certificates</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">TLS/SSL certificates management.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.certs.issueCert()</div>
                          <div>vercel.certs.uploadCert()</div>
                          <div>vercel.certs.removeCert()</div>
                          <div>vercel.certs.getCertById()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Manage custom certificates manually by entering domain CNs, uploading PEM files (cert/key/ca), or removing certificate records under the <span className="font-semibold">SSL Certificates</span> view.
                        </TableCell>
                      </TableRow>

                      {/* 9. Redirects */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Bulk Redirects</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Edge routing path redirects.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.bulkRedirects.stageRedirects()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Stage path redirection rules (source to destination routing) inside the <span className="font-semibold">Redirect Rules</span> section.
                        </TableCell>
                      </TableRow>

                      {/* 10. Billing */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Billing & Credits</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Pre-purchase credits for serverless API endpoints.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.billing.buyCredits()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Buy prepaid billing credits (v0, gateway, agent credit types) in the <span className="font-semibold">Billing Credits</span> sub-tab.
                        </TableCell>
                      </TableRow>

                      {/* 11. Edge Config */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Edge Config</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Low-latency Key-Value store at edge.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.edgeConfig.createEdgeConfig()</div>
                          <div>vercel.edgeConfig.getEdgeConfigs()</div>
                          <div>vercel.edgeConfig.getEdgeConfig()</div>
                          <div>vercel.edgeConfig.updateEdgeConfig()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Plan is to utilize Edge Config to cache configuration flags for the trading signals engine.
                        </TableCell>
                      </TableRow>

                      {/* 12. Env Variables */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Environment Variables</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Project environment variables configuration.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.env.filterProjectEnvs()</div>
                          <div>vercel.env.createProjectEnv()</div>
                          <div>vercel.env.patchProjectEnv()</div>
                          <div>vercel.env.removeProjectEnv()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Currently configured statically in `.env.local`. Planned for dynamic project-wide configurations management.
                        </TableCell>
                      </TableRow>

                      {/* 13. Webhooks */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Webhooks</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Subscribe to deployment events.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.webhooks.createWebhook()</div>
                          <div>vercel.webhooks.getWebhooks()</div>
                          <div>vercel.webhooks.deleteWebhook()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Plan is to notify execution engines when a production build is successfully deployed.
                        </TableCell>
                      </TableRow>

                      {/* 14. Integrations */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Integrations & Log Drains</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Stream web logs to external analysis platforms.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.integrations.getConfigurations()</div>
                          <div>vercel.integrations.createLogDrain()</div>
                          <div>vercel.integrations.deleteLogDrain()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Log stream pipelines are currently ingested locally on the database instead.
                        </TableCell>
                      </TableRow>

                      {/* 15. Teams */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Teams</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Scoping domains, projects, and users to teams.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.teams.createTeam()</div>
                          <div>vercel.teams.getTeam()</div>
                          <div>vercel.teams.getTeamMembers()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Multitenancy scoping is managed locally via the project workspace organization database model.
                        </TableCell>
                      </TableRow>

                      {/* 16. Domains */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Domain Management</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Purchase and register custom domains.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.domains.createOrReplaceDomain()</div>
                          <div>vercel.domains.getDomain()</div>
                          <div>vercel.domains.checkDomainStatus()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Domains are resolved and managed via domain Aliases integration instead.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
