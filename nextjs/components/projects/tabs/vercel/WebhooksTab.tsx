"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getWebhooksAction,
  deleteWebhookAction,
  createWebhookAction,
} from "@/app/actions/vercel";

interface WebhooksTabProps {
  project: any;
  returnTo: string;
}

export function WebhooksTab({ project, returnTo }: WebhooksTabProps) {
  const [webhooksList, setWebhooksList] = useState<any[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [webhooksError, setWebhooksError] = useState("");

  useEffect(() => {
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
  }, [project.id]);

  return (
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
                            <Input type="hidden" name="projectId" value={project.id} />
                            <Input type="hidden" name="webhookId" value={webhook.id} />
                            <Input type="hidden" name="returnTo" value={returnTo} />
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
  );
}
