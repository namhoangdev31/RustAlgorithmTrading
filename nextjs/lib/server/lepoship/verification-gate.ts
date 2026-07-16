export type VerificationGateInput = {
  enforcementMode: "legacy" | "shadow" | "enforce";
  releaseId: string;
  fullArtifact: { id: string; checksumSha256: string } | null;
  run: null | {
    releaseId: string;
    artifactId: string;
    artifactChecksum: string;
    policyVersionId: string;
    status: string;
    decision: string | null;
    evaluation: null | { policyVersionId: string; decision: string };
    hasReport: boolean;
  };
  legacySecurityPassed: boolean;
  reviewOverridePassed: boolean;
};

export function verificationGateBlocker(input: VerificationGateInput) {
  if (input.enforcementMode !== "enforce") return input.legacySecurityPassed ? null : "security_scan";
  const { run, fullArtifact } = input;
  if (!run || !fullArtifact) return "verification_eligibility";
  const eligible = run.releaseId === input.releaseId && run.artifactId === fullArtifact.id &&
    run.artifactChecksum === fullArtifact.checksumSha256 && run.status === "completed" &&
    (run.decision === "allow" || run.decision === "warn" || (run.decision === "review" && input.reviewOverridePassed)) && run.hasReport &&
    run.evaluation?.policyVersionId === run.policyVersionId && run.evaluation.decision === run.decision;
  return eligible ? null : "verification_eligibility";
}
