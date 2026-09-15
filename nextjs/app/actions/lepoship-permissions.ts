"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { PERMISSION_GROUPS } from "@/lib/server/permission-groups";

async function requireCollaboratorManager(userId: string, projectId: string) {
  
  const access = await requireProjectRole(userId, projectId, "owner");
  return access;
}

export async function updateCollaboratorPermissionsAction(
  projectId: string,
  collaboratorUserId: string,
  groupKey: keyof typeof PERMISSION_GROUPS
) {
  const user = await requireCurrentUser();
  await requireCollaboratorManager(user.id, projectId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { bundle: { select: { id: true } } },
  });

  if (!project?.bundle) {
    throw new Error("LepoShip bundle not found for this project.");
  }

  const bundleId = project.bundle.id;
  const permissionKeys = PERMISSION_GROUPS[groupKey];

  if (!permissionKeys) {
    throw new Error("Invalid permission group key.");
  }

  const updated = await prisma.bundleCollaborators.update({
    where: {
      bundleId_userId: { bundleId, userId: collaboratorUserId },
    },
    data: {
      role: groupKey, 
      permissionKeys,
    },
  });

  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/lepoship/${projectId}/overview`);

  return updated;
}

/**
 * Verify if the user has a specific permission key.
 * Used to safeguard builds, list edits, or settings updates.
 */
export async function checkBundlePermission(
  userId: string,
  bundleId: string,
  requiredPermission: string
): Promise<boolean> {
  // 1. Check if user is platform administrator
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });
  if (user?.userType === "admin") return true;

  // 2. Resolve project ID linked to this bundle
  const bundle = await prisma.bundles.findUnique({
    where: { id: bundleId },
    select: { projectId: true },
  });

  if (!bundle?.projectId) return false;

  // 3. Fall back to standard project roles check: owner/admin/editor bypasses required permissions
  try {
    const access = await requireProjectRole(userId, bundle.projectId, "editor");
    if (access) return true;
  } catch {}

  // 4. Check custom permission keys
  const collaborator = await prisma.bundleCollaborators.findUnique({
    where: {
      bundleId_userId: { bundleId, userId },
    },
    select: { permissionKeys: true },
  });

  if (!collaborator) return false;

  return collaborator.permissionKeys.includes(requiredPermission);
}
