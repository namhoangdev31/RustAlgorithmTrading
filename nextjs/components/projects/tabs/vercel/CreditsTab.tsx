"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { buyCreditsAction } from "@/app/actions/vercel";

interface CreditsTabProps {
  returnTo: string;
}

export function CreditsTab({ returnTo }: CreditsTabProps) {
  const t = useTranslations("VercelTab");

  return (
    <Card className="bg-canvas border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold text-ink">{t("credits.title")}</CardTitle>
        <CardDescription className="text-xs text-ink-mute">{t("credits.desc")}</CardDescription>
      </CardHeader>
      <Separator className="bg-hairline my-4" />
      <CardContent className="px-0 space-y-4">
        <form action={buyCreditsAction} className="space-y-4">
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="creditType" className="text-xs font-bold text-ink-secondary">{t("credits.type_label")}</Label>
              <Select name="creditType" defaultValue="v0">
                <SelectTrigger className="bg-canvas-soft border-hairline text-xs font-medium h-9 rounded-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-canvas border border-hairline rounded-md">
                  <SelectItem value="v0" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">v0 Credits</SelectItem>
                  <SelectItem value="gateway" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">AI Gateway Credits</SelectItem>
                  <SelectItem value="agent" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">AI Agent Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-bold text-ink-secondary">{t("credits.amount_label")}</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder={t("credits.amount_placeholder")}
                required
                min="1"
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
          </div>

          <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
            <CreditCard className="size-3.5 mr-1.5" />
            {t("credits.buy_btn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
