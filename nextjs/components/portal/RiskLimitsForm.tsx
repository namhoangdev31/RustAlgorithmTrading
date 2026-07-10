"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, ShieldAlert } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export type RiskLimitsValue = {
  maxShares: number;
  maxNotionalPerPosition: number;
  maxTotalExposure: number;
  maxOpenPositions: number;
  defaultStopLossPercent: number;
  trailingStopPercent: number;
  circuitBreakerEnabled: boolean;
  dailyLossThreshold: number;
  maxDailyLoss: number;
  maxWeeklyLoss: number;
  maxMonthlyLoss: number;
  enforceMarketHours: boolean;
  maxPositionCorrelation: number;
  enforceCorrelationCheck: boolean;
};

const numberFields: Array<{ key: keyof RiskLimitsValue; label: string; step?: string }> = [
  { key: "maxShares", label: "Maximum shares" },
  { key: "maxNotionalPerPosition", label: "Maximum notional per position", step: "0.01" },
  { key: "maxTotalExposure", label: "Maximum total exposure", step: "0.01" },
  { key: "maxOpenPositions", label: "Maximum open positions" },
  { key: "defaultStopLossPercent", label: "Default stop loss (%)", step: "0.01" },
  { key: "trailingStopPercent", label: "Trailing stop (%)", step: "0.01" },
  { key: "dailyLossThreshold", label: "Circuit breaker threshold", step: "0.01" },
  { key: "maxDailyLoss", label: "Maximum daily loss", step: "0.01" },
  { key: "maxWeeklyLoss", label: "Maximum weekly loss", step: "0.01" },
  { key: "maxMonthlyLoss", label: "Maximum monthly loss", step: "0.01" },
  { key: "maxPositionCorrelation", label: "Maximum position correlation", step: "0.01" },
];

export function RiskLimitsForm({ initialValue }: { initialValue: RiskLimitsValue }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => startTransition(async () => {
    const response = await fetch("/api/admin/risk-limits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...value, password }),
    });
    const payload = await response.json().catch(() => ({}));
    setPassword("");
    setMessage(response.ok ? "Risk limits updated." : String(payload.error || "Risk limit update failed."));
    if (response.ok) router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform safeguards</CardTitle>
        <CardDescription>Changes are sent to the Go control plane and recorded as risk events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {numberFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type="number"
                min="0"
                step={field.step || "1"}
                value={String(value[field.key])}
                onChange={(event) => setValue((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["circuitBreakerEnabled", "Circuit breaker"],
            ["enforceMarketHours", "Enforce market hours"],
            ["enforceCorrelationCheck", "Enforce correlation checks"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Label htmlFor={key}>{label}</Label>
              <Switch id={key} checked={value[key]} onCheckedChange={(checked) => setValue((current) => ({ ...current, [key]: checked }))} />
            </div>
          ))}
        </div>

        {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
        <AlertDialog>
          <AlertDialogTrigger asChild><Button><Save className="size-4" />Save changes</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="size-5" />Confirm risk policy change</AlertDialogTitle><AlertDialogDescription>Re-enter your administrator password. These limits affect live order validation.</AlertDialogDescription></AlertDialogHeader>
            <div className="space-y-2"><Label htmlFor="admin-password">Administrator password</Label><Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></div>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={pending || !password} onClick={save}>{pending ? <Loader2 className="size-4 animate-spin" /> : null}Confirm and save</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
