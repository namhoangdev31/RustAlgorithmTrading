import assert from "node:assert/strict";
import test from "node:test";

import { verificationGateBlocker, type VerificationGateInput } from "@/lib/server/lepoship/verification-gate";

const valid: VerificationGateInput = {
  enforcementMode: "enforce", releaseId: "release", fullArtifact: { id: "artifact", checksumSha256: "a".repeat(64) }, legacySecurityPassed: false, reviewOverridePassed: false,
  run: { releaseId: "release", artifactId: "artifact", artifactChecksum: "a".repeat(64), policyVersionId: "policy", status: "completed", decision: "allow", evaluation: { policyVersionId: "policy", decision: "allow" }, hasReport: true },
};

test("enforce trusts only a pinned run with matching artifact, policy and report", () => {
  assert.equal(verificationGateBlocker(valid), null);
  assert.equal(verificationGateBlocker({ ...valid, run: { ...valid.run!, artifactChecksum: "b".repeat(64) } }), "verification_eligibility");
  assert.equal(verificationGateBlocker({ ...valid, run: { ...valid.run!, decision: "review", evaluation: { policyVersionId: "policy", decision: "review" } } }), "verification_eligibility");
  assert.equal(verificationGateBlocker({ ...valid, reviewOverridePassed: true, run: { ...valid.run!, decision: "review", evaluation: { policyVersionId: "policy", decision: "review" } } }), null);
  assert.equal(verificationGateBlocker({ ...valid, run: { ...valid.run!, hasReport: false } }), "verification_eligibility");
});

test("shadow and legacy preserve the rollback security projection", () => {
  assert.equal(verificationGateBlocker({ ...valid, enforcementMode: "shadow", run: null, legacySecurityPassed: true }), null);
  assert.equal(verificationGateBlocker({ ...valid, enforcementMode: "legacy", run: null, legacySecurityPassed: false }), "security_scan");
});
