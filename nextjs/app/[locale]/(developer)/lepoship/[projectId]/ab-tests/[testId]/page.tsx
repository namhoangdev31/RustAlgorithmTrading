import { notFound } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/portal/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExperimentChart } from "./ExperimentChart";
import { ExperimentControls } from "./ExperimentControls";

type Props = { params: Promise<{ projectId: string; testId: string }> };

const percent = (value: number | null | undefined, digits = 2) => value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;

export default async function AbTestDetailPage({ params }: Props) {
  const { projectId, testId } = await params;
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundleId = access.project.bundle?.id;
  if (!bundleId) notFound();
  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, bundleId },
    include: {
      controlRelease: { include: { channel: { select: { name: true } } } },
      treatmentRelease: { include: { channel: { select: { name: true } } } },
      analysisSnapshots: { orderBy: { bucketStart: "asc" }, take: 500 },
    },
  });
  if (!test) notFound();
  const latest = test.analysisSnapshots.at(-1);
  const canAdmin = access.role === "admin" || access.role === "owner";
  const canPromoteB = test.analysisStatus === "conclusive" && test.recommendedWinner === "B" && test.status === "running";
  const chartData = test.analysisSnapshots.map((snapshot) => ({
    time: snapshot.bucketStart.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    variantA: snapshot.exposedA,
    variantB: snapshot.exposedB,
  }));
  const banner = test.status === "paused_guardrail"
    ? test.pauseReason || "Experiment paused by the crash-rate guardrail."
    : test.analysisStatus === "conclusive"
      ? `Variant ${test.recommendedWinner} passed the sequential gate; posterior P(B>A) is ${latest?.posteriorProbabilityB ? (latest.posteriorProbabilityB * 100).toFixed(1) : "—"}%.`
      : test.analysisStatus === "inconclusive"
        ? "The experiment is inconclusive. Keep Variant A as the safe production baseline."
        : `Collecting data: ${latest ? Math.min(latest.analyzableA, latest.analyzableB) : 0} / ${test.minimumSamplePerVariant || 0} analyzable devices per arm.`;

  return (
    <div className="space-y-6">
      <PageHeader title={test.testName} description={test.hypothesis || "Scientific OTA bundle experiment"} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{test.status}</Badge>
        <Badge variant="secondary">{test.analysisStatus}</Badge>
        <Badge variant="outline">{test.metricType}{test.metricEventName ? `: ${test.metricEventName}` : ""}</Badge>
      </div>
      <Card className={test.status === "paused_guardrail" ? "border-destructive/40" : "border-primary/30"}>
        <CardContent className="py-4 text-sm">{banner}</CardContent>
      </Card>
      {canAdmin && <ExperimentControls projectId={projectId} testId={test.id} status={test.status} canPromoteB={canPromoteB} />}

      <div className="grid gap-4 md:grid-cols-2">
        {[{ label: "Variant A · Control", track: test.controlRelease }, { label: "Variant B · Treatment", track: test.treatmentRelease }].map(({ label, track }) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{track ? `${track.channel.name} · v${track.version} · build #${track.buildNumber} · ${track.id}` : "Release freezes when the experiment starts."}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Eligibility and fixed design</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <span>Countries: {test.targetCountries.join(", ") || "All"}</span>
          <span>Locales: {test.targetLocales.join(", ") || "All"}</span>
          <span>Platforms: {test.targetPlatforms.join(", ") || "All"}</span>
          <span>OS ranges: {test.targetOsVersions ? JSON.stringify(test.targetOsVersions) : "All"}</span>
          <span>Traffic to B: {test.trafficSplit}%</span>
          <span>Baseline: {percent(test.baselineConversionRate)}</span>
          <span>Required sample/arm: {test.minimumSamplePerVariant || "Calculated at start"}</span>
          <span>Maximum duration: {test.maxDurationDays} days</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cumulative unique exposures</CardTitle></CardHeader>
        <CardContent><ExperimentChart data={chartData} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Experiment evidence</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Variant A</TableHead><TableHead>Variant B</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell>Total exposed</TableCell><TableCell>{latest?.exposedA || 0}</TableCell><TableCell>{latest?.exposedB || 0}</TableCell></TableRow>
              <TableRow><TableCell>Analyzable sample</TableCell><TableCell>{latest?.analyzableA || 0}</TableCell><TableCell>{latest?.analyzableB || 0}</TableCell></TableRow>
              <TableRow><TableCell>Conversions</TableCell><TableCell>{latest?.conversionsA || 0}</TableCell><TableCell>{latest?.conversionsB || 0}</TableCell></TableRow>
              <TableRow><TableCell>Conversion rate</TableCell><TableCell>{percent(latest?.conversionRateA)}</TableCell><TableCell>{percent(latest?.conversionRateB)}</TableCell></TableRow>
              <TableRow><TableCell>Crash-affected devices</TableCell><TableCell>{latest?.crashAffectedA || 0}</TableCell><TableCell>{latest?.crashAffectedB || 0}</TableCell></TableRow>
              <TableRow><TableCell>Crash rate</TableCell><TableCell>{percent(latest?.crashRateA)}</TableCell><TableCell>{percent(latest?.crashRateB)}</TableCell></TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-4">
            <span>Lift: {latest?.liftPercent === null || latest?.liftPercent === undefined ? "—" : `${latest.liftPercent.toFixed(2)}%`}</span>
            <span>Difference CI: {latest ? `${percent(latest.confidenceIntervalLow)} – ${percent(latest.confidenceIntervalHigh)}` : "—"}</span>
            <span>P-value: {latest?.pValue?.toFixed(4) || "—"}</span>
            <span>Crash guardrail p-value: {latest?.crashPValue?.toFixed(4) || "—"}</span>
            <span>Sequential evidence: {latest?.sequentialEvidence?.toFixed(2) || "—"} / 20</span>
            <span>Posterior P(B&gt;A): {percent(latest?.posteriorProbabilityB)}</span>
            <span>Expected loss A: {percent(latest?.expectedLossA, 3)}</span>
            <span>Expected loss B: {percent(latest?.expectedLossB, 3)}</span>
            <span>SRM p-value: {latest?.srmPValue?.toExponential(2) || "—"}</span>
            <span>SRM health: {latest?.srmDetected ? "Failed — experiment paused" : "Pass"}</span>
            <span>Data maturity delay: {latest?.dataDelayMinutes ?? 0} minutes</span>
            <span>Last analysis: {test.lastAnalyzedAt?.toLocaleString() || "Pending"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
