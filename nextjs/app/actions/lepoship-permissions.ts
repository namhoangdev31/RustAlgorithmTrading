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
      role: groupKey, // Map standard group key as role string
      permissionKeys,
    },
  });

  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/lepoship/${projectId}/overview`);

  return updated;
}

export async function checkBundlePermission(
  userId: string,
  bundleId: string,
  requiredPermission: string
): Promise<boolean> {
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });
  if (user?.userType === "admin") return true;

  const bundle = await prisma.bundles.findUnique({
    where: { id: bundleId },
    select: { projectId: true },
  });

  if (!bundle?.projectId) return false;

  try {
    const access = await requireProjectRole(userId, bundle.projectId, "editor");
    if (access) return true;
  } catch {}

  const collaborator = await prisma.bundleCollaborators.findUnique({
    where: {
      bundleId_userId: { bundleId, userId },
    },
    select: { permissionKeys: true },
  });

  if (!collaborator) return false;

  return collaborator.permissionKeys.includes(requiredPermission);
}
