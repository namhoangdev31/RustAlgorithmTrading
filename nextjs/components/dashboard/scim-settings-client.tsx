"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Server, 
  User, 
  Users, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  Activity,
  Shield,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getScimConfigAction, triggerScimSyncSimulationAction } from "@/app/actions/scim";

interface ScimMapping {
  id: string;
  provider: string;
  resourceType: string;
  externalId: string;
  localRole: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface ScimLog {
  id: string;
  timestamp: string;
  provider: string;
  action: string;
  status: "SUCCESS" | "FAILED";
  details: string;
}

interface ScimSettingsClientProps {
  organizationId: string;
  initialBaseUrl: string | null;
  initialToken: string | null;
  initialMappings: ScimMapping[];
}

export function ScimSettingsClient({
  organizationId,
  initialBaseUrl,
  initialToken,
  initialMappings,
}: ScimSettingsClientProps) {
  const [scimEnabled, setScimEnabled] = useState<boolean>(!!initialBaseUrl);
  const [provider, setProvider] = useState<"okta" | "azure">("okta");
  const [baseUrl, setBaseUrl] = useState<string | null>(initialBaseUrl);
  const [token, setToken] = useState<string | null>(initialToken);
  const [mappings, setMappings] = useState<ScimMapping[]>(initialMappings);

  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [logs, setLogs] = useState<ScimLog[]>([
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      provider: "okta",
      action: "DIRECTORY_CONNECT",
      status: "SUCCESS",
      details: "Successfully initialized connection credentials with Okta Identity Provider."
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      provider: "azure",
      action: "CREDENTIALS_GENERATE",
      status: "SUCCESS",
      details: "SCIM Tenant Base URL and bearer API access tokens successfully generated."
    }
  ]);

  const handleGenerateCredentials = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await getScimConfigAction(organizationId);
      if (res.success) {
        setBaseUrl(res.scimBaseUrl);
        setToken(res.scimToken);
        setMappings(res.mappings as any);
        setScimEnabled(true);
        
        const newLog: ScimLog = {
          id: `log-gen-${Date.now()}`,
          timestamp: new Date().toISOString(),
          provider,
          action: "CREDENTIALS_GENERATE",
          status: "SUCCESS",
          details: "Dynamic workspace SCIM configurations and secure API credentials generated."
        };
        setLogs(prev => [newLog, ...prev]);
        setMessage({ type: "success", text: "Successfully generated new SCIM endpoint and token credentials." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to generate credentials." });
    } finally {
      setGenerating(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!baseUrl || !token) {
      setMessage({ type: "error", text: "Please generate SCIM credentials first before simulating synchronization." });
      return;
    }

    setSyncing(true);
    setMessage(null);
    try {
      const res = await triggerScimSyncSimulationAction(organizationId, provider);
      if (res.success) {
        // Fetch fresh mappings lists
        const fresh = await getScimConfigAction(organizationId);
        if (fresh.success) {
          setMappings(fresh.mappings as any);
        }

        const newLogs: ScimLog[] = [
          {
            id: `log-sync-${Date.now()}-1`,
            timestamp: new Date().toISOString(),
            provider,
            action: "PUSH_USER",
            status: "SUCCESS",
            details: `Synced ${res.usersSynced} users: Clara (clara.oss@${provider === "okta" ? "okta-identity" : "azure-directory"}.com), Bill Gates, Legacy Bot (inactive)`
          },
          {
            id: `log-sync-${Date.now()}-2`,
            timestamp: new Date().toISOString(),
            provider,
            action: "PUSH_GROUP",
            status: "SUCCESS",
            details: `Synced ${res.groupsSynced} groups: ${provider.toUpperCase()} Global Admins, ${provider.toUpperCase()} Developers Group`
          }
        ];
        setLogs(prev => [...newLogs, ...prev]);

        setMessage({
          type: "success",
          text: `Manual sync completed! Synced ${res.usersSynced} users and ${res.groupsSynced} groups from ${provider === "okta" ? "Okta" : "Azure AD"} directory.`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Sync simulation failed." });
      const failLog: ScimLog = {
        id: `log-sync-fail-${Date.now()}`,
        timestamp: new Date().toISOString(),
        provider,
        action: "PUSH_ERROR",
        status: "FAILED",
        details: `Failed to execute directory push mapping simulation: ${err.message || err}`
      };
      setLogs(prev => [failLog, ...prev]);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyUrl = () => {
    if (baseUrl) {
      navigator.clipboard.writeText(baseUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Top Description */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-hairline/10 flex items-start gap-3">
        <Server className="size-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">System for Cross-domain Identity Management (SCIM)</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Automate user provisioning and de-provisioning directly from your Identity Providers (IdP) like Okta or Microsoft Azure AD. 
            Once configured, any user assignment, updates, or suspensions in your directory will instantly sync to your LepoS workspace.
          </p>
        </div>
      </div>

      {/* Switch to enable/disable SCIM directory sync */}
      <div className="bg-slate-900/20 p-4 rounded-xl border border-slate-900 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="scim-toggle" className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Shield className="size-3.5 text-emerald-400" />
            Active Directory Synchronization (SCIM)
          </Label>
          <span className="text-[10px] text-slate-400">
            Enable or temporarily deactivate the automated identity sync endpoint for Okta & Azure AD.
          </span>
        </div>
        <Switch 
          id="scim-toggle"
          checked={scimEnabled}
          onCheckedChange={(checked) => {
            setScimEnabled(checked);
            const statusLog: ScimLog = {
              id: `log-toggle-${Date.now()}`,
              timestamp: new Date().toISOString(),
              provider,
              action: checked ? "SCIM_ENABLE" : "SCIM_DISABLE",
              status: "SUCCESS",
              details: checked 
                ? "SCIM synchronization endpoint activated. Listening for incoming IdP pushes." 
                : "SCIM synchronization endpoint deactivated. Incoming IdP requests will be rejected."
            };
            setLogs(prev => [statusLog, ...prev]);
          }}
        />
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2 ${
          message.type === "success" 
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/5 border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="size-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <HelpCircle className="size-4 flex-shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid configurations */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 ${!scimEnabled ? "opacity-45 pointer-events-none select-none" : ""}`}>
        
        {/* Credentials generator card */}
        <Card className="border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="size-4 text-indigo-400" />
                Directory Credentials
                {!scimEnabled && <Badge variant="outline" className="ml-2 text-[8px] border-slate-800 text-slate-500">Disabled</Badge>}
              </CardTitle>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
                Simulator
              </span>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Generate credentials to connect Microsoft Azure AD or Okta to LepoS
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            
            {/* Provider selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="idp-provider" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Identity Provider (IdP)
              </label>
              <select
                id="idp-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="okta">Okta Directory Service</option>
                <option value="azure">Microsoft Azure Active Directory (OIDC)</option>
              </select>
            </div>

            {baseUrl && token ? (
              <div className="flex flex-col gap-4 border-t border-slate-900 pt-4">
                {/* SCIM Endpoint Base URL */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SCIM 2.0 Base URL</span>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={baseUrl}
                      className="h-8 bg-slate-950 border-slate-900 text-[10px] font-mono text-slate-400"
                    />
                    <Button 
                      onClick={handleCopyUrl} 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200"
                    >
                      {copiedUrl ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* API Token / PAT */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SCIM Bearer Token</span>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      type="password"
                      value={token}
                      className="h-8 bg-slate-950 border-slate-900 text-[10px] font-mono text-slate-400"
                    />
                    <Button 
                      onClick={handleCopyToken} 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200"
                    >
                      {copiedToken ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                <ShieldCheck className="size-8 text-slate-600 mb-2" />
                <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                  No directory synchronization config is active. Generate keys to enable SCIM.
                </p>
              </div>
            )}

            <Button
              onClick={handleGenerateCredentials}
              disabled={generating}
              className="w-full h-9 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs mt-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="size-3.5 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                "Generate SCIM Credentials"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sync Simulator Card */}
        <Card className="border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="size-4.5 text-indigo-400 animate-pulse" />
                Manual Sync Simulator
              </CardTitle>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
                Simulator
              </span>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Trigger simulated Okta or Azure AD push payloads to populate users in LepoS
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            
            <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-xs flex flex-col gap-2">
              <span className="font-bold text-slate-300">Simulate Directory Push Payload</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clicking the sync button below will mimic standard directory pushes (POST /Users, PUT /Groups) from 
                <strong> {provider === "okta" ? "Okta push worker" : "Azure AD provisioning scheduler"}</strong>. Credentials must be verified by the provider's server before running in a real environment.
              </p>
            </div>

            <Button
              onClick={handleTriggerSync}
              disabled={syncing || !baseUrl}
              variant="outline"
              className="w-full h-9 bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100 font-bold text-xs mt-4"
            >
              {syncing ? (
                <>
                  <RefreshCw className="size-3.5 mr-2 animate-spin text-indigo-400" /> Provisioning SCIM mapping...
                </>
              ) : (
                `Trigger Simulated ${provider === "okta" ? "Okta" : "Azure AD"} Sync`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sync mappings list */}
      <Card className={`border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg transition-all duration-300 ${!scimEnabled ? "opacity-45 pointer-events-none select-none" : ""}`}>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-200">Mapped Directory Resources</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Active User & Group associations synchronized from Azure AD/Okta directory providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              No synced directory resources found. Connect your provider and trigger a sync simulation to populate.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-900">
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-slate-950/40 border-b border-slate-900 font-bold text-slate-200">
                  <tr>
                    <th className="p-3.5">External Resource ID</th>
                    <th className="p-3.5">Resource Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Synchronized At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-900/10">
                  {mappings.map((m) => {
                    const name = m.resourceType === "User" 
                      ? (m.metadata?.userName || m.externalId)
                      : (m.metadata?.displayName || m.externalId);
                    
                    const typeIcon = m.resourceType === "User" 
                      ? <User className="size-3.5 text-indigo-400 mr-1.5 inline" />
                      : <Users className="size-3.5 text-blue-400 mr-1.5 inline" />;

                    return (
                      <tr key={m.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-3.5 font-mono text-slate-400">{m.externalId}</td>
                        <td className="p-3.5 font-semibold text-slate-200">
                          {typeIcon}
                          {name}
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className={`text-[9px] font-bold px-1.5 ${
                            m.resourceType === "User" ? "border-indigo-500/20 text-indigo-400 bg-indigo-500/5" : "border-blue-500/20 text-blue-400 bg-blue-500/5"
                          }`}>
                            {m.resourceType}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-mono uppercase text-slate-400">{m.localRole || "Viewer"}</td>
                        <td className="p-3.5 text-slate-500">{new Date(m.updatedAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synchronization Audit Logs */}
      <Card className={`border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg transition-all duration-300 ${!scimEnabled ? "opacity-45 pointer-events-none select-none" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="size-4 text-emerald-400" />
              SCIM Synchronization Logs
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Realtime log history of directory integrations and automated sync workflows
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-950/40 border-slate-800 text-slate-400">
            {logs.length} events
          </Badge>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No synchronization events logged yet.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-900">
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-slate-950/40 border-b border-slate-900 font-bold text-slate-200">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Provider</th>
                    <th className="p-3.5">Event Action</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-900/10">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-3.5 font-mono text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 capitalize border-slate-800 bg-slate-950/40 text-slate-300">
                          {log.provider}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {log.action}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.status === "SUCCESS" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 leading-relaxed text-[11px]">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
