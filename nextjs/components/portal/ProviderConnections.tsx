"use client";

import { useState, useTransition } from "react";
import { Loader2, PlugZap, Trash2 } from "lucide-react";

import { connectWorkspaceProviderAction, disconnectWorkspaceProviderAction } from "@/app/actions/provider-connections";
import { useRouter } from "@/i18n/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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

type Connection = { id: string; provider: string; status: string; updatedAt: string; bindingCount: number };

export function ProviderConnections({ organizationId, connections }: { organizationId: string; connections: Connection[] }) {
  const router = useRouter();
  const [provider, setProvider] = useState("github");
  const [credential, setCredential] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const connect = () => startTransition(async () => {
    const result = await connectWorkspaceProviderAction({ organizationId, provider, credential });
    setMessage(result.message);
    if (result.ok) {
      setCredential("");
      setOpen(false);
      router.refresh();
    }
  });

  const disconnect = (connectionId: string) => startTransition(async () => {
    const result = await disconnectWorkspaceProviderAction({ organizationId, connectionId });
    setMessage(result.message);
    router.refresh();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Credentials are validated server-side and stored encrypted.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><PlugZap className="size-4" />Connect provider</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect provider</DialogTitle><DialogDescription>The credential must be accepted by the provider before the connection becomes active.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="provider">Provider</Label><NativeSelect id="provider" value={provider} onChange={(event) => setProvider(event.target.value)}><NativeSelectOption value="github">GitHub</NativeSelectOption><NativeSelectOption value="vercel">Vercel</NativeSelectOption><NativeSelectOption value="cloudflare">Cloudflare</NativeSelectOption><NativeSelectOption value="stripe">Stripe</NativeSelectOption></NativeSelect></div>
              <div className="space-y-2"><Label htmlFor="credential">Credential</Label><Input id="credential" type="password" value={credential} onChange={(event) => setCredential(event.target.value)} autoComplete="off" /></div>
              {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
            </div>
            <DialogFooter><Button type="button" onClick={connect} disabled={pending || !credential.trim()}>{pending ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}Validate and connect</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {message && !open ? <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">{message}</p> : null}
      {connections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No provider connections.</div>
      ) : connections.map((connection) => (
        <div key={connection.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div><p className="font-medium capitalize">{connection.provider}</p><p className="text-xs text-muted-foreground">{connection.bindingCount} project bindings · Updated {new Date(connection.updatedAt).toLocaleString()}</p></div>
          <div className="flex items-center gap-2">
            <StatusBadge status={connection.status === "active" ? "active" : "inactive"} label={connection.status} />
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="size-4" />Disconnect</Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Disconnect {connection.provider}?</AlertDialogTitle><AlertDialogDescription>Provider-backed workflows will become unavailable immediately.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => disconnect(connection.id)}>Disconnect</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
