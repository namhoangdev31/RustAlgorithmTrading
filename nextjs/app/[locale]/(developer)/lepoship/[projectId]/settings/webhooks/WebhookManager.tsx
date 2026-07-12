"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createWebhookAction,
  updateWebhookAction,
  deleteWebhookAction,
  rotateWebhookSecretAction,
} from "@/app/actions/lepoship-webhooks";
import { Globe, Plus, Trash2, Key, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

interface WebhookItem {
  id: string;
  url: string;
  secret: string | null;
  events: string; // JSON array of string events
  isActive: boolean;
  failureCount: number;
  consecutiveFailures: number;
}

interface WebhookManagerProps {
  projectId: string;
  initialWebhooks: WebhookItem[];
}

const AVAILABLE_EVENTS = [
  { value: "build:started", label: "Build Started" },
  { value: "build:success", label: "Build Succeeded" },
  { value: "build:failed", label: "Build Failed" },
  { value: "release:published", label: "OTA Release Published" },
  { value: "order:completed", label: "Marketplace Order Completed" },
];

export function WebhookManager({ projectId, initialWebhooks }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = React.useState<WebhookItem[]>(initialWebhooks);
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  // Form states
  const [url, setUrl] = React.useState("");
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);
  const [isActive, setIsActive] = React.useState(true);

  const resetForm = () => {
    setEditingId(null);
    setUrl("");
    setSelectedEvents(["build:success", "release:published"]);
    setIsActive(true);
  };

  const handleCreateNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (wh: WebhookItem) => {
    setEditingId(wh.id);
    setUrl(wh.url);
    try {
      setSelectedEvents(JSON.parse(wh.events || "[]"));
    } catch {
      setSelectedEvents([]);
    }
    setIsActive(wh.isActive);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || selectedEvents.length === 0) return;
    setPending(true);

    try {
      if (editingId) {
        const updated = await updateWebhookAction(projectId, editingId, {
          url,
          events: selectedEvents,
          isActive,
        });
        setWebhooks((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createWebhookAction(projectId, {
          url,
          events: selectedEvents,
        });
        setWebhooks((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save webhook.");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook subscription?")) return;
    try {
      await deleteWebhookAction(projectId, id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete webhook.");
    }
  };

  const handleRotateSecret = async (id: string) => {
    if (!confirm("Are you sure you want to rotate this webhook's secret? Existing signature verifications will fail until you update your receiver with the new key.")) return;
    try {
      const updated = await rotateWebhookSecretAction(projectId, id);
      setWebhooks((prev) => prev.map((item) => (item.id === id ? updated : item)));
      alert("Webhook signing secret rotated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to rotate secret.");
    }
  };

  const toggleEvent = (val: string) => {
    setSelectedEvents((prev) =>
      prev.includes(val) ? prev.filter((ev) => ev !== val) : [...prev, val]
    );
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configured Webhooks</h3>
        </div>
        <Button onClick={handleCreateNew} size="sm" className="bg-primary text-primary-foreground gap-1.5 cursor-pointer shadow-light">
          <Plus className="size-3.5" />
          Add Webhook Endpoint
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingId ? "Edit Webhook Subscription" : "Add Webhook Subscription"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configuring targets for outbound payload delivery integrations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="webhookUrl" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Payload URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourdomain.com/webhooks/lepoship"
                className="text-xs h-9 bg-canvas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Subscribed Event Types</Label>
              <div className="space-y-2 border border-hairline rounded p-3 bg-secondary/10">
                {AVAILABLE_EVENTS.map((ev) => (
                  <div key={ev.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ev_${ev.value}`}
                      checked={selectedEvents.includes(ev.value)}
                      onCheckedChange={() => toggleEvent(ev.value)}
                    />
                    <Label
                      htmlFor={`ev_${ev.value}`}
                      className="text-xs font-medium text-foreground cursor-pointer select-none"
                    >
                      {ev.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {editingId && (
              <div className="flex items-center pt-1">
                <Checkbox
                  id="isActiveWh"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label htmlFor="isActiveWh" className="text-xs font-semibold text-foreground cursor-pointer select-none ml-2">
                  Active (deliver payloads)
                </Label>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={pending || selectedEvents.length === 0}>
                {pending ? "Saving..." : "Save Webhook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Webhooks list */}
      {webhooks.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
          No webhooks configured for this project.
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => {
            let eventsArray: string[] = [];
            try {
              eventsArray = JSON.parse(wh.events || "[]");
            } catch {}

            return (
              <div key={wh.id} className="p-4 border border-hairline rounded-lg bg-card text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Globe className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground break-all">{wh.url}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      wh.isActive
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {wh.isActive ? "Active" : "Disabled / Failed"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {eventsArray.map((ev) => (
                      <span key={ev} className="text-[9px] bg-secondary border border-hairline rounded px-1.5 py-0">
                        {ev}
                      </span>
                    ))}
                  </div>

                  {wh.secret && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Key className="size-3 shrink-0" />
                      <span className="font-mono truncate max-w-xs">{wh.secret}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRotateSecret(wh.id)}
                        className="h-5 text-[9px] font-medium text-amber-500 p-1 hover:bg-amber-50/50 cursor-pointer"
                      >
                        Rotate Secret
                      </Button>
                    </div>
                  )}

                  {wh.consecutiveFailures > 0 && (
                    <div className="text-[10px] text-red-500 flex items-center gap-1">
                      <ShieldAlert className="size-3" />
                      Consecutive delivery failures: {wh.consecutiveFailures} / 5
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 shrink-0 justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(wh)} className="h-7 text-[10px] cursor-pointer">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(wh.id)} className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50/50 cursor-pointer">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
