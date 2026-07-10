import test from "node:test";
import assert from "node:assert";
import {
  prisma,
  createTestUser,
  createTestOrganization,
  createTestProject,
  cleanupTestData,
} from "./test-utils";
import { requireProjectRole, requireWorkspaceRole } from "../../lib/server/permissions";

test.describe("Portal Phase 2 Membership Model Tests", () => {
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should successfully create and query OrganizationMembership", async () => {
    const owner = await createTestUser();
    const org = await createTestOrganization(owner.id);
    const member = await createTestUser();

    // Create membership record
    const membership = await prisma.organizationMembership.create({
      data: {
        organizationId: org.id,
        userId: member.id,
        role: "editor",
        inviteStatus: "accepted",
      },
    });

    assert.ok(membership.id);
    assert.strictEqual(membership.role, "editor");
    assert.strictEqual(membership.inviteStatus, "accepted");

    // Query organization with members
    const orgWithMembers = await prisma.organization.findUnique({
      where: { id: org.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    assert.ok(orgWithMembers);
    assert.strictEqual(orgWithMembers.members.length, 1);
    assert.strictEqual(orgWithMembers.members[0].user.id, member.id);
  });

  test("should successfully create and query ProjectMembership", async () => {
    const owner = await createTestUser();
    const org = await createTestOrganization(owner.id);
    const project = await createTestProject(org.id);
    const member = await createTestUser();

    // Create project membership record
    const membership = await prisma.projectMembership.create({
      data: {
        projectId: project.id,
        userId: member.id,
        role: "viewer",
        inviteStatus: "accepted",
      },
    });

    assert.ok(membership.id);
    assert.strictEqual(membership.role, "viewer");

    // Query project with members
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    assert.ok(projectWithMembers);
    assert.strictEqual(projectWithMembers.members.length, 1);
    assert.strictEqual(projectWithMembers.members[0].user.id, member.id);
  });

  test("resolves persisted workspace and project roles without bundle collaborators", async () => {
    const owner = await createTestUser();
    const organization = await createTestOrganization(owner.id);
    const project = await createTestProject(organization.id);
    const member = await createTestUser();

    await prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        userId: member.id,
        role: "editor",
        inviteStatus: "accepted",
      },
    });
    await prisma.projectMembership.create({
      data: {
        projectId: project.id,
        userId: member.id,
        role: "viewer",
        inviteStatus: "accepted",
      },
    });

    const workspaceAccess = await requireWorkspaceRole(member.id, organization.id, "editor");
    const projectAccess = await requireProjectRole(member.id, project.id, "viewer");

    assert.strictEqual(workspaceAccess.role, "editor");
    assert.strictEqual(projectAccess.role, "editor");
    await assert.rejects(() => requireProjectRole(member.id, project.id, "admin"));
  });
});
