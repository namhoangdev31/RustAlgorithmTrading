"use client";

import { useState } from "react";
import {
  Check,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Plug,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  installNativePluginAction,
  submitNativePluginAction,
  toggleNativePluginAction,
  uninstallNativePluginAction,
  reviewNativePluginAction,
} from "@/app/actions/native-platform";

type Plugin = {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string | null;
  bundleUrl: string;
  permissions: string[];
  metadata: any;
  createdAt: Date | string;
};

type InstalledPlugin = {
  id: string;
  projectId: string;
  pluginId: string;
  enabled: boolean;
  config: any;
  createdAt: Date | string;
  plugin: Plugin;
};

type PluginHubClientProps = {
  projectId: string;
  installedPlugins: InstalledPlugin[];
  allPlugins: Plugin[];
  returnTo?: string;
};

export function PluginHubClient({
  projectId,
  installedPlugins,
  allPlugins,
  returnTo,
}: PluginHubClientProps) {
  const [activeSubTab, setActiveSubTab] = useState<"marketplace" | "installed" | "review">("marketplace");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [selectedInstall, setSelectedInstall] = useState<InstalledPlugin | null>(null);
  const [configJson, setConfigJson] = useState("");
  const [configError, setConfigError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mở modal cài đặt / cập nhật cấu hình cho plugin
  const handleOpenConfig = (plugin: Plugin, install?: InstalledPlugin) => {
    setSelectedPlugin(plugin);
    setSelectedInstall(install || null);
    setConfigJson(install?.config ? JSON.stringify(install.config, null, 2) : "{\n  \n}");
    setConfigError("");
    setIsConfigModalOpen(true);
  };

  const validateAndSubmitConfig = (e: React.FormEvent<HTMLFormElement>) => {
    if (configJson.trim()) {
      try {
        JSON.parse(configJson);
      } catch (err: any) {
        e.preventDefault();
        setConfigError(`Invalid JSON: ${err.message}`);
        return;
      }
    }
    setIsSubmitting(true);
  };

  return (
    <div className="space-y-4">
      {/* Sub tabs and Submit Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-2.5">
        <div className="flex items-center gap-1.5 bg-canvas-soft border border-hairline rounded-md p-1 select-none w-fit">
          <button
            onClick={() => setActiveSubTab("marketplace")}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "marketplace"
                ? "bg-canvas text-ink shadow-sm border border-hairline"
                : "text-ink-mute hover:text-ink border border-transparent"
            }`}
          >
            App Store Hub
          </button>
          <button
            onClick={() => setActiveSubTab("installed")}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "installed"
                ? "bg-canvas text-ink shadow-sm border border-hairline"
                : "text-ink-mute hover:text-ink border border-transparent"
            }`}
          >
            Installed ({installedPlugins.length})
          </button>
          <button
            onClick={() => setActiveSubTab("review")}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "review"
                ? "bg-canvas text-ink shadow-sm border border-hairline"
                : "text-ink-mute hover:text-ink border border-transparent"
            }`}
          >
            Plugin Reviews
          </button>
        </div>

        <Button
          onClick={() => setIsSubmitModalOpen(true)}
          className="h-8 rounded-sm bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-deep flex items-center gap-1.5 cursor-pointer shadow-light"
        >
          <Plus className="size-3.5" />
          Submit Plugin
        </Button>
      </div>

      {/* Tab: Marketplace (App Store Hub) */}
      {activeSubTab === "marketplace" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPlugins.length === 0 ? (
            <div className="md:col-span-2 py-10 text-center text-xs text-ink-mute border border-dashed border-hairline rounded-lg bg-canvas-soft/30">
              No plugins available in App Store Hub yet.
            </div>
          ) : (
            allPlugins.map((plugin) => {
              const installed = installedPlugins.find((ip) => ip.pluginId === plugin.id);
              return (
                <Card
                  key={plugin.id}
                  className="border border-hairline bg-canvas hover:border-hairline-strong transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0">
                          <Plug className="size-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-ink">
                            {plugin.name}
                          </CardTitle>
                          <p className="text-[10px] font-mono text-ink-mute">
                            {plugin.slug}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono font-semibold py-0">
                        v{plugin.version}
                      </Badge>
                    </div>
                    {plugin.description && (
                      <CardDescription className="text-xs text-ink-secondary pt-1.5 line-clamp-2 leading-relaxed">
                        {plugin.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3.5 flex-1 flex flex-col justify-between">
                    {/* Permissions & Bundle Link */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {plugin.permissions.map((perm) => (
                          <Badge
                            key={perm}
                            variant="secondary"
                            className="bg-canvas-soft text-ink-secondary border border-hairline text-[9px] font-semibold flex items-center gap-1 py-0 px-1.5"
                          >
                            <Lock className="size-2 text-ink-mute" />
                            {perm}
                          </Badge>
                        ))}
                        {plugin.permissions.length === 0 && (
                          <span className="text-[10px] text-ink-mute italic">
                            No special permissions required.
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink-mute font-mono truncate max-w-full">
                        <Globe className="size-3 text-ink-mute-2 shrink-0" />
                        <span className="truncate">{plugin.bundleUrl}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-hairline-cool gap-3">
                      {installed ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold select-none">
                            <Check className="size-4" />
                            Installed
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleOpenConfig(plugin, installed)}
                              variant="outline"
                              className="h-8 text-[11px] font-semibold border-hairline-strong hover:bg-canvas-soft text-ink shrink-0 px-2.5 rounded-sm"
                            >
                              <Settings className="size-3 mr-1" />
                              Configure
                            </Button>
                            <form
                              action={uninstallNativePluginAction}
                              onSubmit={() => setIsSubmitting(true)}
                            >
                              <input type="hidden" name="projectId" value={projectId} />
                              <input type="hidden" name="pluginId" value={plugin.id} />
                              {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                              <Button
                                type="submit"
                                variant="destructive"
                                disabled={isSubmitting}
                                className="h-8 text-[11px] font-semibold px-2.5 rounded-sm bg-destructive hover:bg-destructive-deep flex items-center shrink-0"
                              >
                                <Trash2 className="size-3 mr-1" />
                                Uninstall
                              </Button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-ink-mute">Ready to install</span>
                          <Button
                            onClick={() => handleOpenConfig(plugin)}
                            className="h-8 text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary-deep px-3 rounded-sm shadow-light"
                          >
                            <Plus className="size-3 mr-1" />
                            Install
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Installed Plugins */}
      {activeSubTab === "installed" && (
        <Card className="border border-hairline bg-canvas py-0">
          <CardContent className="p-0 overflow-x-auto">
            {installedPlugins.length === 0 ? (
              <div className="p-10 text-center text-xs text-ink-mute">
                No plugins installed in this project yet. Go to App Store Hub to explore plugins.
              </div>
            ) : (
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                      Plugin
                    </TableHead>
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                      Version
                    </TableHead>
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                      Permissions
                    </TableHead>
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installedPlugins.map((install) => (
                    <TableRow
                      key={install.id}
                      className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline"
                    >
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded bg-canvas-soft border border-hairline flex items-center justify-center text-ink-secondary shrink-0">
                            <Plug className="size-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-ink">{install.plugin.name}</div>
                            <div className="text-[10px] text-ink-mute font-mono">{install.plugin.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs font-mono text-ink-secondary">
                        v{install.plugin.version}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {install.plugin.permissions.map((perm) => (
                            <Badge
                              key={perm}
                              variant="outline"
                              className="text-[9px] font-semibold py-0 px-1 border-hairline"
                            >
                              {perm}
                            </Badge>
                          ))}
                          {install.plugin.permissions.length === 0 && (
                            <span className="text-[10px] text-ink-mute italic">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <form action={toggleNativePluginAction} onSubmit={() => setIsSubmitting(true)}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="pluginId" value={install.pluginId} />
                          <input type="hidden" name="enabled" value={install.enabled ? "false" : "true"} />
                          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                          <Button
                            type="submit"
                            variant="ghost"
                            disabled={isSubmitting}
                            className={`h-6 text-[10px] font-bold uppercase px-2 rounded-full border cursor-pointer select-none transition-colors ${
                              install.enabled
                                ? "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                : "bg-canvas-soft border-hairline text-ink-mute hover:bg-canvas-soft-strong"
                            }`}
                          >
                            {install.enabled ? "Active" : "Disabled"}
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleOpenConfig(install.plugin, install)}
                            variant="outline"
                            className="h-8 text-[11px] font-semibold border-hairline-strong hover:bg-canvas-soft text-ink rounded-sm px-2.5"
                          >
                            <Settings className="size-3.5 mr-1" />
                            Config
                          </Button>
                          <form
                            action={uninstallNativePluginAction}
                            onSubmit={() => setIsSubmitting(true)}
                          >
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="pluginId" value={install.pluginId} />
                            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                            <Button
                              type="submit"
                              variant="destructive"
                              disabled={isSubmitting}
                              className="h-8 text-[11px] font-semibold px-2.5 rounded-sm bg-destructive hover:bg-destructive-deep"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Uninstall
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
      )}

      {/* Tab: Reviews Dashboard */}
      {activeSubTab === "review" && (
        <Card className="border border-hairline bg-canvas py-0">
          <CardContent className="p-0 overflow-x-auto">
            {allPlugins.length === 0 ? (
              <div className="p-10 text-center text-xs text-ink-mute">
                No plugins registered in the system.
              </div>
            ) : (
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Plugin Info</TableHead>
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Metadata Status</TableHead>
                    <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Bundle & Details</TableHead>
                    <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Review Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPlugins.map((plugin) => {
                    const status = plugin.metadata?.status || "pending";
                    const reviewer = plugin.metadata?.reviewedBy || "None";
                    const notes = plugin.metadata?.notes || "";

                    return (
                      <TableRow key={plugin.id} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-7 rounded bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0">
                              <Plug className="size-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-ink">{plugin.name}</div>
                              <div className="text-[10px] text-ink-mute font-mono">{plugin.slug} (v{plugin.version})</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {status === "approved" && (
                              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] w-fit font-bold">
                                Approved
                              </Badge>
                            )}
                            {status === "rejected" && (
                              <Badge className="bg-red-500/10 border-red-500/20 text-red-400 text-[9px] w-fit font-bold">
                                Rejected
                              </Badge>
                            )}
                            {status === "pending" && (
                              <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-[9px] w-fit font-bold">
                                Pending Review
                              </Badge>
                            )}
                            {reviewer !== "None" && (
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5">By: {reviewer}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
                            <span className="truncate max-w-[220px]">URL: {plugin.bundleUrl}</span>
                            <span>Perms: {plugin.permissions.join(", ") || "none"}</span>
                            {notes && <span className="text-slate-500 italic max-w-[220px] truncate font-sans">Notes: {notes}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <form action={reviewNativePluginAction} onSubmit={() => setIsSubmitting(true)} className="flex items-center justify-end gap-2">
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="pluginId" value={plugin.id} />
                            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                            <input 
                              type="text" 
                              name="notes" 
                              placeholder="Review notes..." 
                              defaultValue={notes}
                              className="h-8 px-2 border border-hairline rounded bg-slate-900 text-xs text-slate-300 focus:outline-none w-32"
                            />
                            <Button
                              type="submit"
                              name="status"
                              value="approved"
                              disabled={isSubmitting}
                              className="h-8 text-[10px] font-bold px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              type="submit"
                              name="status"
                              value="rejected"
                              disabled={isSubmitting}
                              className="h-8 text-[10px] font-bold px-2.5 rounded bg-red-600 hover:bg-red-500 text-white"
                            >
                              Reject
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: Submit Plugin (Dynamic extensions hub) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in flex justify-center items-start p-4 md:py-12">
          <div
            onClick={() => setIsSubmitModalOpen(false)}
            className="fixed inset-0 cursor-default"
            aria-hidden="true"
          />
          <Card className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 relative z-10 border border-hairline bg-canvas">
            <CardHeader className="border-b border-hairline p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                  <Sparkles className="size-4.5 text-primary" />
                  Submit Dynamic Plugin
                </CardTitle>
                <CardDescription className="text-xs text-ink-mute mt-0.5">
                  Register a new native-bridge compatible dynamic bundle to the hub.
                </CardDescription>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="size-6 rounded-md hover:bg-canvas-soft flex items-center justify-center text-ink-mute hover:text-ink transition-colors cursor-pointer border border-transparent hover:border-hairline"
              >
                <X className="size-4" />
              </button>
            </CardHeader>
            <CardContent className="p-5">
              <form
                action={submitNativePluginAction}
                onSubmit={() => setIsSubmitting(true)}
                className="space-y-4"
              >
                <input type="hidden" name="projectId" value={projectId} />
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                      Plugin Name
                    </label>
                    <Input
                      name="name"
                      required
                      placeholder="Camera Capture"
                      className="h-9 border-hairline bg-canvas text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                      Unique Slug
                    </label>
                    <Input
                      name="slug"
                      required
                      placeholder="camera-capture-plugin"
                      className="h-9 border-hairline bg-canvas text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                      Version
                    </label>
                    <Input
                      name="version"
                      required
                      defaultValue="0.1.0"
                      placeholder="1.0.0"
                      className="h-9 border-hairline bg-canvas text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                      Required Permissions
                    </label>
                    <Input
                      name="permissions"
                      placeholder="camera,photos,contacts"
                      className="h-9 border-hairline bg-canvas text-xs"
                    />
                    <p className="text-[9px] text-ink-mute leading-none mt-1">
                      Comma separated permission scopes.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                    Bundle URL (JS Content)
                  </label>
                  <Input
                    name="bundleUrl"
                    required
                    type="url"
                    placeholder="https://cdn.lepos.dev/plugins/camera-1.0.js"
                    className="h-9 border-hairline bg-canvas text-xs font-mono"
                  />
                  <p className="text-[9px] text-ink-mute leading-none mt-1">
                    Webhosted bundle loaded dynamically by the LepoShip WebView runtime.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                    Description
                  </label>
                  <Input
                    name="description"
                    placeholder="Enables direct native camera frame capturing inside application overlays."
                    className="h-9 border-hairline bg-canvas text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline-cool">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="h-9 text-xs font-semibold border-hairline-strong hover:bg-canvas-soft rounded-sm px-4 text-ink"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 text-xs font-semibold bg-primary hover:bg-primary-deep text-primary-foreground rounded-sm px-4 shadow-light cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Register Plugin"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 2: Plugin Configuration (Install/Update Config) */}
      {isConfigModalOpen && selectedPlugin && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in flex justify-center items-start p-4 md:py-12">
          <div
            onClick={() => setIsConfigModalOpen(false)}
            className="fixed inset-0 cursor-default"
            aria-hidden="true"
          />
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 relative z-10 border border-hairline bg-canvas">
            <CardHeader className="border-b border-hairline p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                  <Settings className="size-4.5 text-ink-secondary" />
                  {selectedInstall ? "Configure Plugin" : `Install ${selectedPlugin.name}`}
                </CardTitle>
                <CardDescription className="text-xs text-ink-mute mt-0.5">
                  Configure variables in JSON layout to apply to the plugin instance.
                </CardDescription>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="size-6 rounded-md hover:bg-canvas-soft flex items-center justify-center text-ink-mute hover:text-ink transition-colors cursor-pointer border border-transparent hover:border-hairline"
              >
                <X className="size-4" />
              </button>
            </CardHeader>
            <CardContent className="p-5">
              <form
                action={installNativePluginAction}
                onSubmit={validateAndSubmitConfig}
                className="space-y-4"
              >
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="pluginId" value={selectedPlugin.id} />
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                      Instance Config (JSON)
                    </label>
                    <span className="text-[9px] text-ink-mute font-mono">key-value map</span>
                  </div>
                  <textarea
                    name="config"
                    value={configJson}
                    onChange={(e) => {
                      setConfigJson(e.target.value);
                      if (configError) setConfigError("");
                    }}
                    rows={6}
                    placeholder={`{\n  "apiKey": "12345",\n  "allowOffline": true\n}`}
                    className="w-full bg-canvas border border-hairline rounded-md p-3 text-xs font-mono text-ink-secondary focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-hairline-strong shadow-inner leading-relaxed"
                  />
                  {configError && (
                    <p className="text-xs text-destructive font-semibold">{configError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline-cool">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="h-9 text-xs font-semibold border-hairline-strong hover:bg-canvas-soft rounded-sm px-4 text-ink"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 text-xs font-semibold bg-primary hover:bg-primary-deep text-primary-foreground rounded-sm px-4 shadow-light cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : selectedInstall ? (
                      "Save Settings"
                    ) : (
                      "Confirm Install"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
