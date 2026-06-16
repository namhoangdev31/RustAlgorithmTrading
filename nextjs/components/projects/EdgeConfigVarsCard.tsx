"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  Link2, 
  Play, 
  X,
  AlertCircle,
  CheckCircle2,
  Sliders,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  getEdgeConfigsAction, 
  getEdgeConfigItemsAction, 
  linkProjectEdgeConfigAction, 
  createAndLinkEdgeConfigAction, 
  patchEdgeConfigItemAction,
  getProjectProvidersAction,
  linkProjectProviderAction,
  unlinkProjectProviderAction,
  saveProviderApiKeyAction
} from "@/app/actions/vercel";

interface EdgeConfigVarsCardProps {
  vercelProjectEnvVars?: any[];
  vercelProjectId: string;
  projectId: string;
  locale: string;
  returnTo: string;
}

export function EdgeConfigVarsCard({
  vercelProjectEnvVars = [],
  vercelProjectId,
  projectId,
  locale,
  returnTo,
}: EdgeConfigVarsCardProps) {
  const t = useTranslations("VercelTab");
  const [isPending, startTransition] = useTransition();

  // Edge Config Connection State
  const [edgeConfigId, setEdgeConfigId] = useState<string | null>(null);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");

  // Items State
  const [items, setItems] = useState<Record<string, any>>({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // CRUD Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [flagType, setFlagType] = useState<"boolean" | "string" | "number" | "json">("boolean");

  // Multi-Provider States
  const [linkedProviders, setLinkedProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  
  // Link Provider Form State
  const [isLinkingFormOpen, setIsLinkingFormOpen] = useState(false);
  const [linkProvider, setLinkProvider] = useState<"vercel" | "cloudflare">("vercel");
  const [linkAccountId, setLinkAccountId] = useState("");
  const [linkTargetProjectId, setLinkTargetProjectId] = useState("");
  const [linkEdgeConfigId, setLinkEdgeConfigId] = useState("");
  const [linkDisplayName, setLinkDisplayName] = useState("");
  const [linkApiKey, setLinkApiKey] = useState("");

  const fetchProviders = async () => {
    setLoadingProviders(true);
    const res = await getProjectProvidersAction(projectId);
    setLoadingProviders(false);
    if (res.success) {
      setLinkedProviders(res.providers || []);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [projectId]);

  // Determine connection status based on EDGE_CONFIG env var
  useEffect(() => {
    const edgeConfigEnv = vercelProjectEnvVars.find(
      (v) => v.key === "EDGE_CONFIG"
    );
    if (edgeConfigEnv && edgeConfigEnv.value) {
      // Parse edgeConfigId from connection string
      // Format: https://edge-config.vercel.com/ecfg_xxxxxxxxxxxxxx?token=...
      const match = edgeConfigEnv.value.match(/\/ecfg_([a-zA-Z0-9]+)/);
      if (match) {
        setEdgeConfigId(`ecfg_${match[1]}`);
      } else {
        setEdgeConfigId(null);
      }
    } else {
      setEdgeConfigId(null);
    }
  }, [vercelProjectEnvVars]);

  // Load available stores if not connected
  useEffect(() => {
    if (!edgeConfigId && vercelProjectId) {
      const loadStores = async () => {
        const res = await getEdgeConfigsAction(vercelProjectId);
        if (res.success) {
          setAvailableStores(res.edgeConfigs || []);
          if (res.edgeConfigs && res.edgeConfigs.length > 0) {
            setSelectedStoreId(res.edgeConfigs[0].id || "");
          }
        }
      };
      loadStores();
    }
  }, [edgeConfigId, vercelProjectId]);

  // Load items if connected
  const fetchItems = async (idToUse: string) => {
    setLoadingItems(true);
    setErrorMsg("");
    const res = await getEdgeConfigItemsAction(vercelProjectId, idToUse);
    setLoadingItems(false);
    if (res.success) {
      setItems(res.items || {});
    } else {
      setErrorMsg(res.error || "Failed to load Edge Config items.");
    }
  };

  useEffect(() => {
    if (edgeConfigId) {
      fetchItems(edgeConfigId);
    }
  }, [edgeConfigId]);

  const handleOpenAdd = () => {
    setEditingKey(null);
    setKey("");
    setValue("true");
    setFlagType("boolean");
    setIsFormOpen(true);
    setErrorMsg("");
  };

  const handleOpenEdit = (k: string, val: any) => {
    setEditingKey(k);
    setKey(k);
    
    let type: "boolean" | "string" | "number" | "json" = "string";
    if (typeof val === "boolean") {
      type = "boolean";
      setValue(val ? "true" : "false");
    } else if (typeof val === "number") {
      type = "number";
      setValue(String(val));
    } else if (typeof val === "object") {
      type = "json";
      setValue(JSON.stringify(val, null, 2));
    } else {
      type = "string";
      setValue(String(val));
    }
    
    setFlagType(type);
    setIsFormOpen(true);
    setErrorMsg("");
  };

  const handleDelete = (k: string) => {
    if (!window.confirm(`Are you sure you want to delete flag "${k}"?`)) return;
    if (!edgeConfigId) return;

    const formData = new FormData();
    formData.append("projectId", vercelProjectId);
    formData.append("edgeConfigId", edgeConfigId);
    formData.append("key", k);
    formData.append("operation", "delete");
    formData.append("returnTo", returnTo);

    startTransition(async () => {
      // We can directly call the server action and fetch items again on completion
      await patchEdgeConfigItemAction(formData);
      setSuccessMsg(`Flag "${k}" deleted successfully.`);
      fetchItems(edgeConfigId);
    });
  };

  const handleSubmitFlag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!edgeConfigId) return;

    let finalValue = value;
    if (flagType === "boolean") {
      finalValue = value === "true" ? "true" : "false";
    }

    const formData = new FormData();
    formData.append("projectId", vercelProjectId);
    formData.append("edgeConfigId", edgeConfigId);
    formData.append("key", key);
    formData.append("value", finalValue);
    formData.append("operation", editingKey ? "update" : "create");
    formData.append("returnTo", returnTo);

    startTransition(async () => {
      await patchEdgeConfigItemAction(formData);
      setIsFormOpen(false);
      setSuccessMsg(`Flag "${key}" saved successfully.`);
      fetchItems(edgeConfigId);
    });
  };

  return (
    <Card className="bg-canvas border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
            <Sliders className="size-4 text-emerald-400" />
            Feature Flags (Edge Config)
          </CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Configure real-time Key-Value flags at Vercel's Edge without site redeployments.
          </CardDescription>
        </div>
        {edgeConfigId && !isFormOpen && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchItems(edgeConfigId)}
              className="h-8 text-xs font-semibold px-3 flex items-center gap-1.5 cursor-pointer"
              disabled={loadingItems}
            >
              <RefreshCw className={`size-3.5 ${loadingItems ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleOpenAdd}
              className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 rounded-sm px-3 flex items-center gap-1.5 cursor-pointer shadow-light"
            >
              <Plus className="size-3.5" />
              Add Flag
            </Button>
          </div>
        )}
      </CardHeader>

      <Separator className="bg-hairline my-4" />

      <CardContent className="px-0 pb-0">
        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* 1. Connection Step (If not linked yet) */}
        {!edgeConfigId ? (
          <div className="space-y-6 max-w-lg">
            <div className="p-4 bg-canvas-soft/40 border border-hairline border-dashed rounded-md text-center">
              <Link2 className="size-8 mx-auto mb-2 text-ink-mute opacity-60" />
              <p className="text-sm font-medium text-ink">Edge Config is not connected</p>
              <p className="text-xs text-ink-mute mt-1">
                Link this project to a Vercel Edge Config store to enable real-time feature flagging.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Link Existing Store */}
              <div className="border border-hairline p-4 rounded-md space-y-4">
                <p className="text-xs font-bold uppercase text-ink-mute tracking-wider">Option A: Link Existing Store</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!selectedStoreId) return;
                    const formData = new FormData(e.currentTarget);
                    formData.append("projectId", vercelProjectId);
                    formData.append("edgeConfigId", selectedStoreId);
                    formData.append("returnTo", returnTo);
                    startTransition(async () => {
                      await linkProjectEdgeConfigAction(formData);
                    });
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="edgeConfigSelect" className="text-xs font-semibold text-ink-mute">Select Store</Label>
                    <select
                      id="edgeConfigSelect"
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full h-8 px-2 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                      disabled={availableStores.length === 0}
                    >
                      {availableStores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.slug} ({store.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-canvas-soft hover:bg-canvas-soft/80 border border-hairline text-ink text-xs font-semibold h-8 rounded"
                    disabled={isPending || availableStores.length === 0}
                  >
                    {isPending ? "Connecting..." : "Link Selected Store"}
                  </Button>
                </form>
              </div>

              {/* Option B: Create and Link Store */}
              <div className="border border-hairline p-4 rounded-md space-y-4">
                <p className="text-xs font-bold uppercase text-ink-mute tracking-wider">Option B: Create New Store</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newStoreSlug) return;
                    const formData = new FormData(e.currentTarget);
                    formData.append("projectId", vercelProjectId);
                    formData.append("slug", newStoreSlug);
                    formData.append("returnTo", returnTo);
                    startTransition(async () => {
                      await createAndLinkEdgeConfigAction(formData);
                    });
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="storeSlug" className="text-xs font-semibold text-ink-mute">Store Slug</Label>
                    <Input
                      id="storeSlug"
                      placeholder="e.g. trading-flags"
                      value={newStoreSlug}
                      onChange={(e) => setNewStoreSlug(e.target.value)}
                      className="h-8 text-xs bg-canvas"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 rounded"
                    disabled={isPending || !newStoreSlug}
                  >
                    {isPending ? "Creating..." : "Create & Link Store"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* 2. Flag CRUD Area */
          <div className="space-y-4">
            {/* Form */}
            {isFormOpen && (
              <form onSubmit={handleSubmitFlag} className="bg-canvas-soft/40 p-4 border border-hairline rounded-md space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase">
                    {editingKey ? "Edit Feature Flag" : "Add Feature Flag"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-ink-mute hover:text-ink cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="flagKey" className="text-xs font-semibold text-ink-mute">Key</Label>
                    <Input
                      id="flagKey"
                      placeholder="e.g. enable_signup"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      disabled={!!editingKey}
                      className="h-8 text-xs bg-canvas font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="flagType" className="text-xs font-semibold text-ink-mute">Type</Label>
                    <select
                      id="flagType"
                      value={flagType}
                      onChange={(e) => {
                        const nextType = e.target.value as any;
                        setFlagType(nextType);
                        if (nextType === "boolean") {
                          setValue("true");
                        } else {
                          setValue("");
                        }
                      }}
                      className="w-full h-8 px-2 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                    >
                      <option value="boolean">Boolean</option>
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="json">JSON Object / Array</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="flagValue" className="text-xs font-semibold text-ink-mute">Value</Label>
                  {flagType === "boolean" ? (
                    <select
                      id="flagValue"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full h-8 px-2 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : flagType === "json" ? (
                    <textarea
                      id="flagValue"
                      rows={4}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder='e.g. { "allowedUsers": [123] }'
                      className="w-full p-2 bg-canvas border border-hairline rounded text-xs text-ink font-mono focus:outline-none focus:border-primary resize-y"
                      required
                    />
                  ) : (
                    <Input
                      id="flagValue"
                      placeholder={flagType === "number" ? "e.g. 100" : "e.g. active"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      type={flagType === "number" ? "number" : "text"}
                      className="h-8 text-xs bg-canvas font-mono"
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="h-8 text-xs px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 rounded px-4"
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save Flag"}
                  </Button>
                </div>
              </form>
            )}

            {/* Flags Table */}
            {loadingItems ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <RefreshCw className="size-6 text-primary animate-spin" />
                <span className="text-xs text-ink-mute">Fetching flags from Vercel Edge...</span>
              </div>
            ) : Object.keys(items).length === 0 ? (
              <div className="p-8 border border-hairline rounded-md text-center">
                <p className="text-xs text-ink-mute">No Feature Flags found in this Edge Config store.</p>
                <Button
                  onClick={handleOpenAdd}
                  className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 mt-3 rounded-sm px-3 flex items-center gap-1.5 cursor-pointer mx-auto"
                >
                  <Plus className="size-3.5" />
                  Add First Flag
                </Button>
              </div>
            ) : (
              <div className="border border-hairline rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-canvas-soft/35 select-none">
                    <TableRow className="border-b border-hairline">
                      <TableHead className="text-xs font-bold text-ink-mute h-9">Flag Key</TableHead>
                      <TableHead className="text-xs font-bold text-ink-mute h-9">Type</TableHead>
                      <TableHead className="text-xs font-bold text-ink-mute h-9">Value</TableHead>
                      <TableHead className="text-xs font-bold text-ink-mute h-9 w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(items).map(([k, val]) => {
                      const typeLabel = typeof val;
                      const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val);
                      return (
                        <TableRow key={k} className="border-b border-hairline last:border-0 hover:bg-canvas-soft/10">
                          <TableCell className="text-xs font-mono text-ink h-10 font-bold">{k}</TableCell>
                          <TableCell className="text-xs text-ink-mute h-10">
                            <span className="px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline text-[10px] font-mono capitalize">
                              {typeLabel}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-ink-mute max-w-md truncate h-10">
                            {displayVal}
                          </TableCell>
                          <TableCell className="text-right h-10 space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(k, val)}
                              className="text-ink-mute hover:text-ink cursor-pointer p-1"
                              title="Edit flag"
                            >
                              <Edit3 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(k)}
                              className="text-ink-mute hover:text-destructive cursor-pointer p-1"
                              title="Delete flag"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-ink-mute">
              <span className="font-semibold text-emerald-400">● Live Synchronization:</span>
              <span>Updates apply immediately on Vercel's Global Edge Network.</span>
            </div>

            <Separator className="bg-hairline my-6" />

            {/* Centralized Edge Config Sync & Providers Dashboard */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                    <Link2 className="size-4 text-primary" />
                    Centralized Sync Targets
                  </h4>
                  <p className="text-xs text-ink-mute">
                    Automatically replicate Edge Config changes in parallel to these providers.
                  </p>
                </div>
                {!isLinkingFormOpen && (
                  <Button
                    onClick={() => {
                      setIsLinkingFormOpen(true);
                      setLinkProvider("vercel");
                      setLinkAccountId("");
                      setLinkTargetProjectId("");
                      setLinkEdgeConfigId("");
                      setLinkDisplayName("");
                      setLinkApiKey("");
                    }}
                    className="bg-canvas-soft hover:bg-canvas-soft/80 border border-hairline text-ink text-xs font-semibold h-8 rounded px-3 flex items-center gap-1.5 cursor-pointer shadow-light"
                  >
                    <Plus className="size-3.5" />
                    Link Sync Provider
                  </Button>
                )}
              </div>

              {/* Form to link provider */}
              {isLinkingFormOpen && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!linkAccountId || !linkTargetProjectId) return;

                    startTransition(async () => {
                      // 1. If API Key is provided, save it first
                      if (linkApiKey) {
                        const credentialsFormData = new FormData();
                        credentialsFormData.append("provider", linkProvider);
                        credentialsFormData.append("accountId", linkAccountId);
                        credentialsFormData.append("apiKey", linkApiKey);
                        credentialsFormData.append("returnTo", returnTo);
                        await saveProviderApiKeyAction(credentialsFormData);
                      }

                      // 2. Link provider to project
                      const linkFormData = new FormData();
                      linkFormData.append("projectId", projectId);
                      linkFormData.append("provider", linkProvider);
                      linkFormData.append("accountId", linkAccountId);
                      linkFormData.append("targetProjectId", linkTargetProjectId);
                      if (linkEdgeConfigId) {
                        linkFormData.append("edgeConfigId", linkEdgeConfigId);
                      }
                      linkFormData.append("displayName", linkDisplayName || `${linkProvider} (${linkAccountId})`);
                      linkFormData.append("returnTo", returnTo);

                      await linkProjectProviderAction(linkFormData);
                      setIsLinkingFormOpen(false);
                      fetchProviders();
                    });
                  }}
                  className="bg-canvas-soft/40 p-4 border border-hairline rounded-md space-y-4 animate-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink uppercase">
                      Link External Sync Provider
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLinkingFormOpen(false)}
                      className="text-ink-mute hover:text-ink cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="linkProvider" className="text-xs font-semibold text-ink-mute">Provider Type</Label>
                      <select
                        id="linkProvider"
                        value={linkProvider}
                        onChange={(e) => setLinkProvider(e.target.value as any)}
                        className="w-full h-8 px-2 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                      >
                        <option value="vercel">Vercel Account/Org</option>
                        <option value="cloudflare">Cloudflare Workers KV</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="linkAccountId" className="text-xs font-semibold text-ink-mute">
                        {linkProvider === "vercel" ? "Vercel Team/User ID" : "Cloudflare Account ID"}
                      </Label>
                      <Input
                        id="linkAccountId"
                        placeholder={linkProvider === "vercel" ? "team_xxxxxxxx" : "cf_xxxxxxxx"}
                        value={linkAccountId}
                        onChange={(e) => setLinkAccountId(e.target.value)}
                        className="h-8 text-xs bg-canvas"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="linkTargetProjectId" className="text-xs font-semibold text-ink-mute">
                        {linkProvider === "vercel" ? "Vercel Project ID" : "Cloudflare KV Namespace ID"}
                      </Label>
                      <Input
                        id="linkTargetProjectId"
                        placeholder={linkProvider === "vercel" ? "prj_xxxxxxxx" : "kv_namespace_xxxxxxxx"}
                        value={linkTargetProjectId}
                        onChange={(e) => setLinkTargetProjectId(e.target.value)}
                        className="h-8 text-xs bg-canvas"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="linkDisplayName" className="text-xs font-semibold text-ink-mute">Display Name</Label>
                      <Input
                        id="linkDisplayName"
                        placeholder="e.g. Vercel Staging or CF Prod KV"
                        value={linkDisplayName}
                        onChange={(e) => setLinkDisplayName(e.target.value)}
                        className="h-8 text-xs bg-canvas"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="linkEdgeConfigId" className="text-xs font-semibold text-ink-mute">
                        {linkProvider === "vercel" ? "Edge Config ID (Optional)" : "N/A (Disabled)"}
                      </Label>
                      <Input
                        id="linkEdgeConfigId"
                        placeholder="ecfg_xxxxxxxx"
                        value={linkEdgeConfigId}
                        onChange={(e) => setLinkEdgeConfigId(e.target.value)}
                        disabled={linkProvider !== "vercel"}
                        className="h-8 text-xs bg-canvas"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="linkApiKey" className="text-xs font-semibold text-ink-mute">
                        API Token / Token Key (Optional)
                      </Label>
                      <Input
                        id="linkApiKey"
                        placeholder="••••••••••••••••"
                        type="password"
                        value={linkApiKey}
                        onChange={(e) => setLinkApiKey(e.target.value)}
                        className="h-8 text-xs bg-canvas"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLinkingFormOpen(false)}
                      className="h-8 text-xs px-3"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 rounded px-4"
                      disabled={isPending}
                    >
                      {isPending ? "Linking..." : "Link Provider"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Linked Providers Table */}
              {loadingProviders ? (
                <div className="text-center py-4 text-xs text-ink-mute">
                  Loading sync targets...
                </div>
              ) : linkedProviders.length === 0 ? (
                <div className="p-4 bg-canvas-soft/20 border border-hairline border-dashed rounded text-center text-xs text-ink-mute">
                  No additional sync targets linked. Configuration changes are only pushed to the primary Edge Config store.
                </div>
              ) : (
                <div className="border border-hairline rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-canvas-soft/35 select-none">
                      <TableRow className="border-b border-hairline">
                        <TableHead className="text-xs font-bold text-ink-mute h-9">Provider</TableHead>
                        <TableHead className="text-xs font-bold text-ink-mute h-9">Account/Team</TableHead>
                        <TableHead className="text-xs font-bold text-ink-mute h-9">Project/Namespace ID</TableHead>
                        <TableHead className="text-xs font-bold text-ink-mute h-9">Sync Status</TableHead>
                        <TableHead className="text-xs font-bold text-ink-mute h-9 w-[60px] text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedProviders.map((p, index) => (
                        <TableRow key={index} className="border-b border-hairline last:border-0 hover:bg-canvas-soft/10">
                          <TableCell className="text-xs h-10 font-bold text-ink-secondary">
                            <span className="capitalize">{p.provider}</span>
                            <span className="text-[10px] text-ink-mute block font-normal mt-0.5">{p.displayName}</span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-ink-mute h-10">{p.accountId}</TableCell>
                          <TableCell className="text-xs font-mono text-ink-mute h-10">{p.projectId}</TableCell>
                          <TableCell className="text-xs text-ink-secondary h-10">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
                              Synced
                            </span>
                          </TableCell>
                          <TableCell className="text-right h-10">
                            <button
                              onClick={() => {
                                if (!window.confirm(`Are you sure you want to unlink provider "${p.displayName}"?`)) return;
                                const unlinkFormData = new FormData();
                                unlinkFormData.append("projectId", projectId);
                                unlinkFormData.append("provider", p.provider);
                                unlinkFormData.append("accountId", p.accountId || "");
                                unlinkFormData.append("targetProjectId", p.projectId || "");
                                unlinkFormData.append("returnTo", returnTo);

                                startTransition(async () => {
                                  await unlinkProjectProviderAction(unlinkFormData);
                                  fetchProviders();
                                });
                              }}
                              className="text-ink-mute hover:text-destructive cursor-pointer p-1"
                              title="Unlink provider"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
