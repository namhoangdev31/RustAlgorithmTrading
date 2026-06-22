"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getIntegrationsAction } from "@/app/actions/vercel";

interface IntegrationsTabProps {
  project: any;
}

export function IntegrationsTab({ project }: IntegrationsTabProps) {
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [integrationsError, setIntegrationsError] = useState("");

  useEffect(() => {
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
  }, [project.id]);

  return (
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
  );
}
