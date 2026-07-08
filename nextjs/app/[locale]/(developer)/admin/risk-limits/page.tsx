"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, AlertTriangle, RefreshCw, KeyRound, Save, Activity, Layers, Clock, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RiskLimits {
  accountId: string | null;
  maxShares: number;
  maxPositionSize: number;
  maxNotionalExposure: number;
  maxOpenPositions: number;
  stopLossPercent: number;
  trailingStopPercent: number;
  circuitBreakerEnabled: boolean;
  dailyLossThreshold: number;
  maxDailyLoss: number;
  maxWeeklyLoss: number;
  maxMonthlyLoss: number;
  enforceMarketHours: boolean;
  maxPositionCorrelation: number;
  enforceCorrelationCheck: boolean;
}

interface AuditLog {
  id: string;
  eventType: string;
  severity: string;
  message: string;
  metadata: any;
  occurredAt: string;
}

export default function RiskLimitsPage() {
  const [limits, setLimits] = useState<RiskLimits>({
    accountId: "",
    maxShares: 1000,
    maxPositionSize: 250,
    maxNotionalExposure: 10000,
    maxOpenPositions: 2,
    stopLossPercent: 1.0,
    trailingStopPercent: 0.75,
    circuitBreakerEnabled: true,
    dailyLossThreshold: 1000,
    maxDailyLoss: 1000,
    maxWeeklyLoss: 15000,
    maxMonthlyLoss: 50000,
    enforceMarketHours: true,
    maxPositionCorrelation: 0.7,
    enforceCorrelationCheck: true,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const limitsRes = await fetch("/api/admin/risk-limits");
      if (limitsRes.ok) {
        const data = await limitsRes.json();
        setLimits({
          accountId: data.account_id || "",
          maxShares: data.max_shares || 1000,
          maxPositionSize: data.max_notional_per_position || 250,
          maxNotionalExposure: data.max_total_exposure || 10000,
          maxOpenPositions: data.max_open_positions || 2,
          stopLossPercent: data.default_stop_loss_percent || 1.0,
          trailingStopPercent: data.trailing_stop_percent || 0.75,
          circuitBreakerEnabled: data.circuit_breaker_enabled !== false,
          dailyLossThreshold: data.daily_loss_threshold || 1000,
          maxDailyLoss: data.max_daily_loss || 1000,
          maxWeeklyLoss: data.max_weekly_loss || 15000,
          maxMonthlyLoss: data.max_monthly_loss || 50000,
          enforceMarketHours: data.enforce_market_hours !== false,
          maxPositionCorrelation: data.max_position_correlation || 0.7,
          enforceCorrelationCheck: data.enforce_correlation_check !== false,
        });
      } else {
        toast.error("Failed to load current risk limits.");
      }

      const logsRes = await fetch("/api/admin/risk-limits/audit");
      if (logsRes.ok) {
        const logs = await logsRes.json();
        setAuditLogs(logs);
      }
    } catch (error) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmPassword("");
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!confirmPassword) {
      toast.error("Please enter your admin password.");
      return;
    }
    setSubmitting(true);
    setConfirmOpen(false);

    try {
      const res = await fetch("/api/admin/risk-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...limits,
          password: confirmPassword,
        }),
      });

      if (res.ok) {
        toast.success("Risk limits updated successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update risk limits.");
      }
    } catch (err) {
      toast.error("An error occurred during update.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Risk Parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" /> System Risk Safeguards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure hard platform limits protecting brokerage accounts and routing pipelines.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={submitting}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reload
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveClick}>
            <Tabs defaultValue="volume" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-lg">
                <TabsTrigger value="volume" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Size & Volume
                </TabsTrigger>
                <TabsTrigger value="protection" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Circuit Breaker
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Market & Correlation
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Size & Volume Limits */}
              <TabsContent value="volume" className="mt-4">
                <Card className="border-border/60 shadow-lg bg-card/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Position Size & Volume Safeguards</CardTitle>
                    <CardDescription>Configure constraints on trade quantities, position sizes, and aggregate exposures.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxShares">Max Shares per Order</Label>
                        <Input
                          id="maxShares"
                          type="number"
                          value={limits.maxShares}
                          onChange={(e) => setLimits({ ...limits, maxShares: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Absolute cap on shares count per single transaction.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPositionSize">Max Notional per Position ($)</Label>
                        <Input
                          id="maxPositionSize"
                          type="number"
                          value={limits.maxPositionSize}
                          onChange={(e) => setLimits({ ...limits, maxPositionSize: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Maximum value allocation allowed per individual stock.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="maxNotionalExposure">Max Portfolio Exposure ($)</Label>
                        <Input
                          id="maxNotionalExposure"
                          type="number"
                          value={limits.maxNotionalExposure}
                          onChange={(e) => setLimits({ ...limits, maxNotionalExposure: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Aggregate value across all open positions.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxOpenPositions">Max Concurrent Open Positions</Label>
                        <Input
                          id="maxOpenPositions"
                          type="number"
                          value={limits.maxOpenPositions}
                          onChange={(e) => setLimits({ ...limits, maxOpenPositions: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Limit total active tickers.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Loss & Stop Loss & Circuit Breaker */}
              <TabsContent value="protection" className="mt-4">
                <Card className="border-border/60 shadow-lg bg-card/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Stop Loss & Circuit Breakers</CardTitle>
                    <CardDescription>Prevent massive daily losses and control stop order parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stopLossPercent">Default Stop Loss %</Label>
                        <Input
                          id="stopLossPercent"
                          type="number"
                          step="0.01"
                          value={limits.stopLossPercent}
                          onChange={(e) => setLimits({ ...limits, stopLossPercent: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Initial stop-loss offset percentage for safety.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trailingStopPercent">Trailing Stop %</Label>
                        <Input
                          id="trailingStopPercent"
                          type="number"
                          step="0.01"
                          value={limits.trailingStopPercent}
                          onChange={(e) => setLimits({ ...limits, trailingStopPercent: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Trailing stop-loss distance from highest peak.</span>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label htmlFor="circuitBreakerEnabled" className="text-sm font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" /> Daily Circuit Breaker
                        </Label>
                        <span className="text-xs text-muted-foreground block">
                          Temporarily pauses order execution if daily loss threshold is hit.
                        </span>
                      </div>
                      <Switch
                        id="circuitBreakerEnabled"
                        checked={limits.circuitBreakerEnabled}
                        onCheckedChange={(checked) => setLimits({ ...limits, circuitBreakerEnabled: checked })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
                        <Input
                          id="maxDailyLoss"
                          type="number"
                          value={limits.maxDailyLoss}
                          onChange={(e) => setLimits({ ...limits, maxDailyLoss: parseFloat(e.target.value) || 0, dailyLossThreshold: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Loss cap before circuit breaker trips.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxWeeklyLoss">Max Weekly Loss ($)</Label>
                        <Input
                          id="maxWeeklyLoss"
                          type="number"
                          value={limits.maxWeeklyLoss}
                          onChange={(e) => setLimits({ ...limits, maxWeeklyLoss: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Loss cap for the week.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxMonthlyLoss">Max Monthly Loss ($)</Label>
                        <Input
                          id="maxMonthlyLoss"
                          type="number"
                          value={limits.maxMonthlyLoss}
                          onChange={(e) => setLimits({ ...limits, maxMonthlyLoss: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-muted-foreground">Loss cap for the month.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Market Hours & Correlation */}
              <TabsContent value="advanced" className="mt-4">
                <Card className="border-border/60 shadow-lg bg-card/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Market Hours & Correlation Filters</CardTitle>
                    <CardDescription>Enforce strictly regulated trading windows and correlation risk limits.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label htmlFor="enforceMarketHours" className="text-sm font-semibold">
                          Enforce Regular Market Hours
                        </Label>
                        <span className="text-xs text-muted-foreground block">
                          Block orders placed during premarket and afterhours sessions.
                        </span>
                      </div>
                      <Switch
                        id="enforceMarketHours"
                        checked={limits.enforceMarketHours}
                        onCheckedChange={(checked) => setLimits({ ...limits, enforceMarketHours: checked })}
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label htmlFor="enforceCorrelationCheck" className="text-sm font-semibold">
                          Enforce Correlation Controls
                        </Label>
                        <span className="text-xs text-muted-foreground block">
                          Calculate and restrict portfolio overlap risk between assets.
                        </span>
                      </div>
                      <Switch
                        id="enforceCorrelationCheck"
                        checked={limits.enforceCorrelationCheck}
                        onCheckedChange={(checked) => setLimits({ ...limits, enforceCorrelationCheck: checked })}
                      />
                    </div>

                    <div className="space-y-2 mt-2 w-1/2">
                      <Label htmlFor="maxPositionCorrelation">Max Correlation Limit</Label>
                      <Input
                        id="maxPositionCorrelation"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={limits.maxPositionCorrelation}
                        onChange={(e) => setLimits({ ...limits, maxPositionCorrelation: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-[11px] text-muted-foreground">Maximum allowable statistical overlap correlation (0.0 to 1.0).</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="lg" className="w-full md:w-auto shadow-md" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" /> Save Configuration
              </Button>
            </div>
          </form>
        </div>

        {/* Security Warning Panel */}
        <div className="space-y-6">
          <Card className="border-amber-500/20 bg-amber-500/5 shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
              <div>
                <CardTitle className="text-base text-amber-800 dark:text-amber-300">Operational Risk Notice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-amber-800/80 dark:text-amber-300/80 space-y-2 leading-relaxed">
              <p>
                Modifications to risk limits directly impact execution capability and real broker capital. Incorrect setups may lead to order placement blocks or exposure risks.
              </p>
              <p className="font-semibold">
                Applying updates will trigger hot-reloads via Redis Pub/Sub directly to the Rust trading core immediately without restarting the instance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Audit Log Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" /> Change Audit Log
        </h2>
        <Card className="border-border/60 shadow-md">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[120px]">Event Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Details (Payload)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                    No change records found.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">
                      {new Date(log.occurredAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400">
                        {log.eventType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.message}</TableCell>
                    <TableCell className="text-right text-xs font-mono max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                      {JSON.stringify(log.metadata)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* High Security Password Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card backdrop-blur-lg border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <KeyRound className="h-5 w-5" /> Admin Re-verification
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Warning: You are attempting to alter hard capital boundaries. Enter your password to authenticate and save the limits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Enter Account Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={submitting}>
              Verify & Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
