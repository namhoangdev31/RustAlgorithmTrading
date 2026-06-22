"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";
import { createAuthTokenAction, deleteAuthTokenAction } from "@/app/actions/vercel";

interface TokensTabProps {
  vercelTokens: any[];
  locale: string;
  returnTo: string;
}

export function TokensTab({ vercelTokens, locale, returnTo }: TokensTabProps) {
  const t = useTranslations("VercelTab");

  return (
    <div className="space-y-6">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">{t("tokens.title")}</CardTitle>
          <CardDescription className="text-xs text-ink-mute">{t("tokens.desc")}</CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          <form action={createAuthTokenAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="tokenName" className="text-xs font-bold text-ink-secondary">{t("tokens.name_label")}</Label>
                <Input
                  id="tokenName"
                  name="name"
                  placeholder={t("tokens.name_placeholder")}
                  required
                  className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                />
              </div>
              <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                <Plus className="size-3.5 mr-1.5" />
                {t("tokens.create_btn")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-canvas border border-hairline rounded-lg p-0">
        <CardHeader className="p-5 border-b border-hairline">
          <CardTitle className="text-sm font-bold text-ink">Active Tokens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vercelTokens.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-mute">
              {t("tokens.empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_id")}</TableHead>
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_name")}</TableHead>
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_created")}</TableHead>
                  <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vercelTokens.map((token) => (
                  <TableRow key={token.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                    <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{token.id}</TableCell>
                    <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{token.name}</TableCell>
                    <TableCell className="px-5 py-3 text-xs text-ink-mute">
                      {token.createdAt ? formatRelativeTime(new Date(token.createdAt), locale) : "N/A"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <form action={deleteAuthTokenAction}>
                        <input type="hidden" name="tokenId" value={token.id} />
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
