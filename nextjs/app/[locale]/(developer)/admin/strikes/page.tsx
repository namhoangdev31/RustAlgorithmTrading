import { prisma } from "@/lib/server/prisma";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StrikeActions, globalActionsRef } from "./StrikeActions";
import { getTranslations } from "next-intl/server";
import { AlertOctagon, CheckCircle2, ShieldAlert, ShieldX } from "lucide-react";
import React from "react";

// Client-side helper triggers
import { ClientTrigger } from "./ClientTrigger";

export default async function AdminStrikesPage() {
  const t = await getTranslations("LepoShip.compliance");

  // Fetch all pending reports
  const pendingReports = await prisma.bundleUserReports.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      bundle: { select: { id: true, name: true } },
      reporter: { select: { fullName: true, email: true } },
    },
  });

  // Fetch active abuse signals
  const abuseSignals = await prisma.bundleAbuseSignals.findMany({
    where: { flaggedForReview: true },
    orderBy: { overallRiskScore: "desc" },
    include: {
      bundle: { select: { id: true, name: true } },
    },
  });

  // Fetch all developer strikes
  const strikes = await prisma.bundleDeveloperStrikes.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      developer: { select: { id: true, fullName: true, email: true } },
      bundle: { select: { name: true } },
      issuer: { select: { fullName: true } },
      revoker: { select: { fullName: true } },
    },
  });

  // Fetch developers and bundles for the "Issue Strike" selector dropdown
  const developers = await prisma.user.findMany({
    where: { userType: "developer" },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });

  const bundles = await prisma.bundles.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t("title")}
          description="Enforce platform compliance rules, inspect report thresholds, and triage strikes."
        />
        <StrikeActions developers={developers} bundles={bundles} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Reports & Abuse Signals */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Reports */}
          <Card className="border-hairline">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertOctagon className="size-4 text-amber-500" />
                Pending Reports ({pendingReports.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Community submissions flagging potential violations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReports.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  No pending user reports.
                </div>
              ) : (
                pendingReports.map((report) => (
                  <div key={report.id} className="p-3 border rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {report.bundle.name}
                      </span>
                      <StatusBadge status="warning" label={report.reason} />
                    </div>
                    {report.description && (
                      <p className="text-muted-foreground line-clamp-2">{report.description}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>
                        Reported by: {report.reporter?.fullName || "Anonymous SDK User"} (
                        {report.createdAt.toLocaleString()})
                      </span>
                      <ClientTrigger action="triage" id={report.id} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Abuse Signals */}
          <Card className="border-hairline">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="size-4 text-red-500" />
                Active Abuse Signals ({abuseSignals.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Automatically triggered indicators showing anomalous report metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {abuseSignals.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  No active abuse signals flagged.
                </div>
              ) : (
                abuseSignals.map((sig) => (
                  <div key={sig.id} className="p-3 border rounded-lg flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{sig.bundle.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Risk Score: {(sig.overallRiskScore * 100).toFixed(1)}% · Anomaly:{" "}
                        {(sig.anomalyScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                        sig.riskLevel === "high"
                          ? "bg-red-500/10 text-red-500 border-red-500/25"
                          : sig.riskLevel === "medium"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/25"
                      }`}
                    >
                      {sig.riskLevel} Risk
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Strike History */}
        <div>
          <Card className="border-hairline h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldX className="size-4 text-indigo-500" />
                Strike Registry ({strikes.length})
              </CardTitle>
              <CardDescription className="text-xs">
                History of compliance actions taken against developers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {strikes.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  No strikes recorded on the platform.
                </div>
              ) : (
                strikes.map((st) => (
                  <div key={st.id} className="p-3 border rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {st.developer.fullName || "Unnamed"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{st.developer.email}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-1.5 py-0 ${
                          st.isActive
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-muted text-muted-foreground border-transparent"
                        }`}
                      >
                        {st.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </div>

                    <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border border-hairline space-y-1">
                      <p>
                        <span className="font-medium text-foreground">Type:</span> {st.strikeType}
                      </p>
                      {st.bundle && (
                        <p>
                          <span className="font-medium text-foreground">Bundle:</span>{" "}
                          {st.bundle.name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-foreground">Reason:</span> {st.description}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Severity:</span> {st.severity}
                      </p>
                      {st.expiresAt && (
                        <p>
                          <span className="font-medium text-foreground">Expires:</span>{" "}
                          {st.expiresAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                      <span>Issued by: {st.issuer?.fullName || "System"}</span>
                      {st.isActive ? (
                        <ClientTrigger action="revoke" id={st.id} />
                      ) : (
                        <span>Revoked by: {st.revoker?.fullName || "System"}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
