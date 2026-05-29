"use client";

import { Info, KeyRound } from "lucide-react";
import {
  deleteVercelApiKeyAction,
  saveVercelApiKeyAction,
  testVercelApiKeyAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function VercelApiKeyForm({
  hasSavedKey,
  status,
}: {
  hasSavedKey: boolean;
  status?: string;
}) {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>Vercel API Key</CardTitle>
            <CardDescription>
              Luu khoa API phia server o dang ma hoa de lam nen tang cho Vercel SDK deploy hosting.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status === "ok" ? (
          <Alert className="mb-4"><AlertDescription>Test connection thanh cong.</AlertDescription></Alert>
        ) : null}
        {status === "invalid_key" || status === "missing_key" || status === "test_failed" ? (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>Khong the xac thuc Vercel API key. Vui long kiem tra lai.</AlertDescription>
          </Alert>
        ) : null}
        <form action={saveVercelApiKeyAction} className="grid gap-4">
          <input type="hidden" name="returnTo" value="/dashboard/settings" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="vercelApiKey">API Key</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex text-muted-foreground hover:text-foreground">
                      <Info className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Vao Vercel Dashboard {" > "} Settings {" > "} Tokens {" > "} Create Token. Cap quyen can thiet, copy key va dan vao day.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="vercelApiKey"
              name="vercelApiKey"
              type="password"
              autoComplete="off"
              placeholder={hasSavedKey ? "******** (saved)" : "vercel_xxx..."}
              required
            />
            <p className="text-xs text-muted-foreground">
              Key duoc ma hoa AES-256-GCM tren server. Khong hien thi lai plaintext.
            </p>
            <p className="text-xs text-muted-foreground">
              Scope toi thieu khuyen nghi: chi cap quyen can cho deployment/project, tranh cap full account.
            </p>
          </div>
          <Button className="w-fit" type="submit">
            {hasSavedKey ? "Update Vercel API Key (Rotate)" : "Save Vercel API Key"}
          </Button>
        </form>
        {hasSavedKey ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={testVercelApiKeyAction}>
              <input type="hidden" name="returnTo" value="/dashboard/settings" />
              <Button type="submit" variant="outline">Test Connection</Button>
            </form>
            <form action={deleteVercelApiKeyAction}>
              <input type="hidden" name="returnTo" value="/dashboard/settings" />
              <Button type="submit" variant="destructive">Delete Key</Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
