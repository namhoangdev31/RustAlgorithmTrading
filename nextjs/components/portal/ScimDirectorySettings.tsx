"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, RefreshCw, Users } from "lucide-react";

import { generateScimCredentialsAction } from "@/app/actions/scim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ScimMapping = {
  id: string;
  provider: string;
  resourceType: string;
  externalId: string;
  localRole: string | null;
  metadata: unknown;
  updatedAt: string;
};

type ScimDirectorySettingsProps = {
  organizationId: string;
  initialBaseUrl: string;
  initialConfigured: boolean;
  mappings: ScimMapping[];
};

function mappingName(mapping: ScimMapping) {
  const metadata = mapping.metadata && typeof mapping.metadata === "object"
    ? mapping.metadata as Record<string, unknown>
    : {};
  return String(metadata.userName || metadata.displayName || mapping.externalId);
}

export function ScimDirectorySettings({
  organizationId,
  initialBaseUrl,
  initialConfigured,
  mappings,
}: ScimDirectorySettingsProps) {
  const [configured, setConfigured] = useState(initialConfigured);
  const baseUrl = initialBaseUrl;
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<"url" | "token" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const copy = async (value: string, target: "url" | "token") => {
    await navigator.clipboard.writeText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const rotateCredential = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateScimCredentialsAction(organizationId);
        setConfigured(true);
        setRawToken(result.scimToken);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to configure SCIM.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4" />
                Directory credentials
              </CardTitle>
              <CardDescription className="mt-1">
                Configure this endpoint in Okta or Microsoft Entra ID. A bearer token is shown only when created or rotated.
              </CardDescription>
            </div>
            <Badge variant={configured ? "default" : "secondary"}>
              {configured ? "Active" : "Not configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="scim-base-url">SCIM base URL</label>
            <div className="flex gap-2">
              <Input id="scim-base-url" readOnly value={baseUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => copy(baseUrl, "url")} aria-label="Copy SCIM base URL">
                {copied === "url" ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {rawToken ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
              <label className="text-sm font-medium" htmlFor="scim-token">New bearer token</label>
              <div className="flex gap-2">
                <Input id="scim-token" readOnly value={rawToken} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={() => copy(rawToken, "token")} aria-label="Copy SCIM bearer token">
                  {copied === "token" ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Copy this token now. It cannot be displayed again.</p>
            </div>
          ) : configured ? (
            <p className="text-sm text-muted-foreground">A credential is stored securely. Rotate it if the current token is unavailable.</p>
          ) : null}

          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

          <Button type="button" onClick={rotateCredential} disabled={pending}>
            {pending ? <RefreshCw className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {configured ? "Rotate credential" : "Create credential"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Synced directory resources
          </CardTitle>
          <CardDescription>Only persisted users and groups received from the configured identity provider appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No SCIM resources have been received yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div className="font-medium">{mappingName(mapping)}</div>
                      <div className="font-mono text-xs text-muted-foreground">{mapping.externalId}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{mapping.resourceType}</Badge></TableCell>
                    <TableCell>{mapping.localRole || "viewer"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(mapping.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
