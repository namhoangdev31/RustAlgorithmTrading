"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Loader2, Trash2 } from "lucide-react";

import { createPatAction, revokePatAction } from "@/app/actions/pat";
import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TokenRow = {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

const availableScopes = ["project:read", "project:write", "deployment:trigger"];

export function PersonalAccessTokens({ tokens }: { tokens: TokenRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["project:read"]);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const createToken = () => {
    startTransition(async () => {
      const result = await createPatAction(name, scopes);
      setMessage(result.message);
      if (result.ok && result.data) {
        setRawToken(result.data.rawToken);
        setName("");
        router.refresh();
      }
    });
  };

  const revokeToken = (id: string) => {
    startTransition(async () => {
      const result = await revokePatAction(id);
      setMessage(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create token</CardTitle>
          <CardDescription>Grant the minimum scopes required. Tokens expire after one year.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-name">Token name</Label>
            <Input id="token-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="CI deployment" />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Scopes</legend>
            {availableScopes.map((scope) => (
              <div key={scope} className="flex items-center gap-2">
                <Checkbox
                  id={`scope-${scope}`}
                  checked={scopes.includes(scope)}
                  onCheckedChange={(checked) => setScopes((current) => checked
                    ? [...new Set([...current, scope])]
                    : current.filter((item) => item !== scope))}
                />
                <Label htmlFor={`scope-${scope}`} className="font-mono text-xs">{scope}</Label>
              </div>
            ))}
          </fieldset>
          <Button type="button" onClick={createToken} disabled={pending || !name.trim() || scopes.length === 0}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Create token
          </Button>
          {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      {rawToken ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">Copy your new token</CardTitle>
            <CardDescription>This value is displayed once and cannot be recovered.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input readOnly value={rawToken} className="font-mono text-xs" aria-label="New personal access token" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy personal access token"
              onClick={async () => {
                await navigator.clipboard.writeText(rawToken);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active tokens</CardTitle>
          <CardDescription>Review usage and revoke credentials that are no longer needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {tokens.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No personal access tokens.</div>
          ) : tokens.map((token) => (
            <div key={token.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">{token.name}</p>
                <div className="flex flex-wrap gap-1">{token.scopes.map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}</div>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(token.createdAt).toLocaleDateString()} · {token.lastUsedAt ? `Last used ${new Date(token.lastUsedAt).toLocaleString()}` : "Never used"}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="size-4" />Revoke</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke {token.name}?</AlertDialogTitle>
                    <AlertDialogDescription>Requests using this token will stop working immediately.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => revokeToken(token.id)}>Revoke token</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
