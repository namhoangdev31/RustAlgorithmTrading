"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";
import { assignAliasAction, deleteAliasAction, listAliasesAction } from "@/app/actions/vercel";

interface AliasesTabProps {
  project: any;
  locale: string;
  returnTo: string;
}

export function AliasesTab({ project, locale, returnTo }: AliasesTabProps) {
  const t = useTranslations("VercelTab");

  const [aliasesList, setAliasesList] = useState<any[]>([]);
  const [loadingAliases, setLoadingAliases] = useState(false);
  const [aliasesError, setAliasesError] = useState("");

  useEffect(() => {
    const fetchAliases = async () => {
      setLoadingAliases(true);
      setAliasesError("");
      try {
        const res = await listAliasesAction(project.id);
        if (res.success && res.aliases) {
          setAliasesList((res.aliases as any).aliases || []);
        } else {
          setAliasesError(res.error || "Failed to load aliases");
        }
      } catch (err: any) {
        setAliasesError(err?.message || "Failed to load aliases");
      } finally {
        setLoadingAliases(false);
      }
    };
    fetchAliases();
  }, [project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Account Aliases</CardTitle>
          <CardDescription className="text-xs text-ink-mute">Assign and manage custom domain aliases for your deployments across Vercel.</CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          <form action={assignAliasAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assignAliasName" className="text-xs font-bold text-ink-secondary">Alias URL / Domain</Label>
                <Input
                  id="assignAliasName"
                  name="alias"
                  placeholder="e.g. my-app.vercel.app"
                  required
                  className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignAliasDpl" className="text-xs font-bold text-ink-secondary">Deployment ID</Label>
                <Input
                  id="assignAliasDpl"
                  name="deploymentId"
                  placeholder="e.g. dpl_xyz123"
                  required
                  className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                />
              </div>
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              Assign Alias
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-canvas border border-hairline rounded-lg p-0">
        <CardHeader className="p-5 border-b border-hairline">
          <CardTitle className="text-sm font-bold text-ink">Domain Aliases List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAliases ? (
            <div className="p-6 text-center text-xs text-ink-mute">Loading aliases...</div>
          ) : aliasesError ? (
            <div className="p-6 text-center text-xs text-destructive">{aliasesError}</div>
          ) : aliasesList.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-mute">No domain aliases configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Alias</TableHead>
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Deployment ID</TableHead>
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Created</TableHead>
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliasesList.map((item) => (
                  <TableRow key={item.uid} className="border-b border-hairline hover:bg-canvas-soft/10">
                    <TableCell className="px-5 py-3 text-xs font-semibold text-ink">
                      <a href={`https://${item.alias}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        {item.alias}
                      </a>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{item.deploymentId}</TableCell>
                    <TableCell className="px-5 py-3 text-xs text-ink-mute">
                      {item.createdAt ? formatRelativeTime(new Date(item.createdAt), locale) : "N/A"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <form action={deleteAliasAction}>
                        <input type="hidden" name="aliasId" value={item.uid} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </form>
                    </TableCell>
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
