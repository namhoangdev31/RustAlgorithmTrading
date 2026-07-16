import { cancelVerificationAction, retryVerificationAction } from "@/app/actions/lepoship-verification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ locale: string; projectId: string; runId: string }> };

export default async function VerificationRunPage({ params }: PageProps) {
  const { locale, projectId, runId } = await params;
  const user = await requireCurrentUser();
  const access = await getLepoShipProjectDetail(user.id, projectId);
  if (!access.project) redirect(`/${locale}/lepoship`);
  const run = await prisma.verificationRuns.findFirst({
    where: { id: runId, projectId },
    include: {
      artifact: true, pipelineVersion: true, policyVersion: true, score: true, evaluation: true, report: true,
      tasks: { orderBy: { createdAt: "asc" }, include: { engineVersion: true, attempts: { orderBy: { attemptNo: "asc" } }, prerequisites: { include: { prerequisite: { select: { nodeId: true } } } } } },
      findings: { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
      evidence: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!run) redirect(`/${locale}/lepoship/${projectId}/builds`);
  const terminal = ["completed", "incomplete", "cancelled"].includes(run.status);

  return <div className="space-y-4">
    <Card>
      <CardHeader><CardTitle className="flex flex-wrap items-center gap-2 text-base">Verification run <span className="font-mono text-xs">{run.id}</span><Badge>{run.status}</Badge>{run.decision ? <Badge variant={run.decision === "reject" ? "destructive" : "outline"}>{run.decision}</Badge> : null}</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm md:grid-cols-4">
        <Metric label="Overall score" value={run.overallScore?.toFixed(1) ?? "—"} />
        <Metric label="Confidence" value={run.confidence == null ? "—" : `${run.confidence.toFixed(1)}%`} />
        <Metric label="Completeness" value={run.completeness == null ? "—" : `${(run.completeness * 100).toFixed(1)}%`} />
        <Metric label="Artifact SHA-256" value={run.artifactChecksum.slice(0, 16)} mono />
        <div className="md:col-span-4 flex gap-2">
          {!terminal ? <form action={cancelVerificationAction}><input type="hidden" name="projectId" value={projectId}/><input type="hidden" name="runId" value={run.id}/><Button type="submit" variant="outline">Cancel run</Button></form> : null}
          {terminal ? <form action={retryVerificationAction}><input type="hidden" name="projectId" value={projectId}/><input type="hidden" name="releaseId" value={run.releaseId}/><Button type="submit">Retry verification</Button></form> : null}
        </div>
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="text-base">DAG timeline</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="p-2">Node</th><th className="p-2">Engine</th><th className="p-2">Depends on</th><th className="p-2">Status</th><th className="p-2">Attempts</th></tr></thead><tbody>{run.tasks.map((task)=><tr key={task.id} className="border-b"><td className="p-2 font-mono">{task.nodeId}</td><td className="p-2">{task.engineVersion.name}@{task.engineVersion.version}</td><td className="p-2">{task.prerequisites.map((item)=>item.prerequisite.nodeId).join(", ") || "—"}</td><td className="p-2"><Badge variant={task.status.includes("failed") ? "destructive" : "outline"}>{task.status}</Badge></td><td className="p-2">{task.attempts.map((attempt)=>`#${attempt.attemptNo} ${attempt.status}`).join(" · ") || "—"}</td></tr>)}</tbody></table></CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">Findings</CardTitle></CardHeader><CardContent>{run.findings.length ? <div className="space-y-2">{run.findings.map((finding)=><div key={finding.id} className="rounded border p-3 text-sm"><div className="flex gap-2"><Badge variant={finding.severity === "critical" ? "destructive" : "outline"}>{finding.severity}</Badge><strong>{finding.title}</strong></div><p className="mt-1 text-xs text-muted-foreground">{finding.dimension} · {finding.ruleId} · confidence {(finding.confidence*100).toFixed(0)}%</p>{finding.description ? <p className="mt-2 text-xs">{finding.description}</p> : null}{finding.remediation ? <p className="mt-2 text-xs text-emerald-500">Recommendation: {finding.remediation}</p> : null}</div>)}</div> : <p className="text-sm text-muted-foreground">No findings reported.</p>}</CardContent></Card>

    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Evidence</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">{run.evidence.length ? run.evidence.map((item)=><div key={item.id} className="rounded border p-2"><strong>{item.kind}</strong><p className="break-all text-muted-foreground">{item.storageBucket}/{item.storageKey}</p><p>{item.contentType} · {item.fileSize.toString()} bytes</p></div>) : <p className="text-muted-foreground">No evidence artifacts.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Decision provenance</CardTitle></CardHeader><CardContent className="space-y-2 text-xs"><p>Pipeline: {run.pipelineVersion.name} v{run.pipelineVersion.version}</p><p>Policy: {run.policyVersion.name} v{run.policyVersion.version}</p><p>Report: {run.report ? `${run.report.storageBucket}/${run.report.storageKey}` : "pending"}</p><pre className="max-h-64 overflow-auto rounded bg-muted p-2">{JSON.stringify(run.evaluation?.results ?? run.score?.dimensions ?? {}, null, 2)}</pre></CardContent></Card>
    </div>
  </div>;
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 font-semibold ${mono ? "font-mono text-xs" : ""}`}>{value}</p></div>;
}
