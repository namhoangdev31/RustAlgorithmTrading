import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanupTestData,
  createTestOrganization,
  createTestProject,
  createTestUser,
  prisma,
  testNamespace,
} from "./test-utils";

test.describe("Portal Phase 2 persisted data contracts", () => {
  test.afterEach(cleanupTestData);

  test("persists form definitions instead of client seed fields", async () => {
    const owner = await createTestUser();
    const organization = await createTestOrganization(owner.id);
    const project = await createTestProject(organization.id);
    const definition = [
      { id: "email", type: "email", label: "Email", placeholder: "name@example.com", required: true },
    ];

    const form = await prisma.form.create({
      data: { projectId: project.id, name: `${testNamespace}-form`, definition },
    });
    const persisted = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    assert.deepEqual(persisted.definition, definition);
  });

  test("persists provider bindings, audit evidence, builds, and compatibility runs", async () => {
    const owner = await createTestUser();
    const organization = await createTestOrganization(owner.id);
    const project = await createTestProject(organization.id);
    const connection = await prisma.workspaceProviderConnection.create({
      data: {
        organizationId: organization.id,
        provider: "vercel",
        encryptedCredential: "encrypted-test-value",
        status: "connected",
      },
    });
    const binding = await prisma.projectProviderBinding.create({
      data: { projectId: project.id, connectionId: connection.id, externalId: `${testNamespace}-external` },
    });
    const audit = await prisma.workspaceAuditEvent.create({
      data: {
        workspaceId: organization.id,
        actorId: owner.id,
        actorEmail: owner.email!,
        action: "project.bind",
        resourceType: "provider_binding",
        resourceId: binding.id,
        metadata: { provider: "vercel" },
      },
    });
    const build = await prisma.lepoShipBuild.create({
      data: {
        projectId: project.id,
        status: "success",
        sourceCommit: "0123456789abcdef",
        platform: "ios",
        logs: "build completed",
        artifactUrl: "https://artifacts.example.test/app.ipa",
        triggeredById: owner.id,
      },
    });
    const run = await prisma.marketplaceCompatibilityRun.create({
      data: {
        integrationId: `${testNamespace}-integration`,
        endpoint: "https://integration.example.test/health",
        checkResults: { reachable: true, status: 200 },
        logs: "HTTP 200",
      },
    });

    assert.equal(binding.externalId, `${testNamespace}-external`);
    assert.equal(audit.action, "project.bind");
    assert.equal(build.status, "success");
    assert.deepEqual(run.checkResults, { reachable: true, status: 200 });
  });
});
