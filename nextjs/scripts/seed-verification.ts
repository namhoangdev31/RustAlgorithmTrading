import "dotenv/config";

import crypto from "node:crypto";

import { prisma } from "@/lib/server/prisma";

const NOW = new Date("2026-07-16T00:00:00.000Z");
const PIPELINE_ID = "20000000-0000-4000-8000-000000000001";
const POLICY_ID = "20000000-0000-4000-8000-000000000002";

const nodes = [
  { id: "archive", engine: "bundle-validator", dependsOn: [], timeoutSeconds: 120, required: true },
  { id: "security", engine: "security-suite", dependsOn: ["archive"], timeoutSeconds: 600, required: true },
  { id: "runtime", engine: "playwright-runtime", dependsOn: ["archive"], timeoutSeconds: 600, required: true },
  { id: "accessibility", engine: "axe-accessibility", dependsOn: ["runtime"], timeoutSeconds: 300, required: false },
  { id: "performance", engine: "lighthouse-performance", dependsOn: ["runtime"], timeoutSeconds: 300, required: false },
] as const;

const pipelineDefinition = { schemaVersion: 1, concurrency: 1, nodes };
const policyDefinition = {
  schemaVersion: 1,
  language: "cel",
  rules: [
    { id: "malicious-archive", effect: "reject", expression: "findings.exists(f, f.ruleId == 'MALICIOUS_ARCHIVE')" },
    { id: "critical-security", effect: "reject", expression: "findings.exists(f, f.ruleId in ['CONFIRMED_CRITICAL_SECURITY', 'REPRODUCIBLE_CRASH'])" },
    { id: "required-engine", effect: "review", expression: "requiredFailures > 0" },
    { id: "low-score", effect: "review", expression: "overallScore < 80.0" },
    { id: "warning-score", effect: "warn", expression: "overallScore < 90.0" },
    { id: "default", effect: "allow", expression: "true" },
  ],
};

function digest(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.verificationPolicyVersions.upsert({
      where: { id: POLICY_ID },
      create: {
        id: POLICY_ID,
        name: "lepoship-production-v1",
        version: 1,
        definition: policyDefinition,
        definitionHash: digest(policyDefinition),
        isActive: true,
        effectiveAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      },
      update: {},
    });
    await tx.verificationPipelineVersions.upsert({
      where: { id: PIPELINE_ID },
      create: {
        id: PIPELINE_ID,
        name: "lepoship-production-v1",
        version: 1,
        definition: pipelineDefinition,
        definitionHash: digest(pipelineDefinition),
        enforcementMode: "shadow",
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      },
      update: {},
    });
    for (const [index, node] of nodes.entries()) {
      const manifest = {
        schemaVersion: 1,
        engine: node.engine,
        execution: "lepoship-worker",
        resultSchema: "verification-result.v1",
        timeoutSeconds: node.timeoutSeconds,
      };
      await tx.verificationEngineVersions.upsert({
        where: { name_version: { name: node.engine, version: "1.0.0" } },
        create: {
          id: `20000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
          name: node.engine,
          version: "1.0.0",
          imageDigest: `lepoship-worker@sha256:${digest(manifest)}`,
          manifest,
          configurationSchema: { type: "object", additionalProperties: false },
          isActive: true,
          approvedAt: NOW,
          createdAt: NOW,
          updatedAt: NOW,
        },
        update: {},
      });
    }
  });
  console.info("LepoShip Verification V1 pipeline, policy and engines are seeded in shadow mode.");
}

main().finally(() => prisma.$disconnect());
