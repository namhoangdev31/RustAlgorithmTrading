"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSdkTokenAction, revokeSdkTokenAction } from "@/app/actions/lepoship-sdk-tokens";
import { Key, Copy, Check, Trash2, Eye, ShieldAlert } from "lucide-react";

interface TokenItem {
  id: string;
  tokenPrefix: string;
  label: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface TokensListProps {
  projectId: string;
  initialTokens: TokenItem[];
}

export function TokensList({ projectId, initialTokens }: TokensListProps) {
  const [tokens, setTokens] = React.useState<TokenItem[]>(initialTokens);
  const [label, setLabel] = React.useState("");
  const [newPlaintextToken, setNewPlaintextToken] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setNewPlaintextToken(null);
    try {
      const res = await createSdkTokenAction(projectId, label);
      setNewPlaintextToken(res.plaintextToken);
      setLabel("");

      // Add to list locally
      setTokens((prev) => [
        {
          id: res.id,
          tokenPrefix: res.plaintextToken.slice(7, 15), // extracted prefix prefix
          label: res.label,
          lastUsedAt: null,
          createdAt: res.createdAt,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err.message || "Failed to generate SDK Ingestion key.");
    } finally {
      setPending(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this SDK token? External clients using it will lose access immediately.")) return;
    try {
      await revokeSdkTokenAction(projectId, id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to revoke token.");
    }
  };

  const handleCopy = () => {
    if (!newPlaintextToken) return;
    navigator.clipboard.writeText(newPlaintextToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Show newly generated token once */}
      {newPlaintextToken && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-lg space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
            <Eye className="size-4" />
            Make sure to copy your SDK Ingestion Key now!
          </div>
          <p className="text-[11px] text-muted-foreground">
            For security reasons, this token will not be displayed again. Store it safely in your client environment.
          </p>
          <div className="flex gap-2 max-w-xl">
            <Input
              readOnly
              value={newPlaintextToken}
              className="h-9 bg-canvas text-xs font-mono text-foreground border-emerald-500/20"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-9 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 cursor-pointer"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Generate Form */}
      <form onSubmit={handleGenerate} className="max-w-md space-y-3">
        <div className="space-y-2">
          <Label htmlFor="tokenLabel" className="text-xs font-semibold text-muted-foreground">Key Label / Name</Label>
          <div className="flex gap-2">
            <Input
              id="tokenLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production Mobile App Client"
              className="h-9 text-xs bg-canvas"
              required
            />
            <Button
              type="submit"
              disabled={pending}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 h-9 text-xs cursor-pointer shadow-light"
            >
              Generate Key
            </Button>
          </div>
        </div>
      </form>

      {/* List of active keys */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Keys</h4>

        {tokens.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            No active SDK Ingestion keys generated for this project.
          </div>
        ) : (
          <div className="border border-hairline rounded-lg overflow-hidden divide-y divide-hairline">
            {tokens.map((tk) => (
              <div key={tk.id} className="p-3 bg-secondary/15 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="size-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{tk.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      (Prefix: lp_sdk_{tk.tokenPrefix}...)
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Created on {new Date(tk.createdAt).toLocaleDateString()}
                    {tk.lastUsedAt && ` · Last used ${new Date(tk.lastUsedAt).toLocaleString()}`}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(tk.id)}
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50/50 cursor-pointer p-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
