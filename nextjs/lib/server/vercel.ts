import { Vercel } from "@vercel/sdk";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret } from "@/lib/server/secret-crypto";

export async function getVercelClient(userId: string): Promise<Vercel> {
  const rows = await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
    "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
    userId,
    "vercel"
  );

  if (!rows || rows.length === 0) {
    throw new Error("Vercel API key is not configured. Please set it in Settings.");
  }

  const apiKey = decryptSecret(rows[0].encrypted_value);
  return new Vercel({
    bearerToken: apiKey,
  });
}

export async function hasVercelApiKey(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
      "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
      userId,
      "vercel"
    );
    return !!rows && rows.length > 0;
  } catch (error) {
    console.error("Error checking Vercel API key:", error);
    return false;
  }
}

export async function testVercelToken(apiKey: string): Promise<boolean> {
  const vercel = new Vercel({
    bearerToken: apiKey,
  });

  await vercel.user.getAuthUser();
  return true;
}

export async function getAuthorizedVercelClient(
  currentUserId: string,
  vercelProjectId: string,
  minRole: "admin" | "editor" | "viewer"
): Promise<{ vercel: Vercel; ownerId: string }> {
  // 1. Fetch project with organization and bundle details (collaborators)
  const project = await prisma.project.findFirst({
    where: { vercelProjectId, deletedAt: null },
    include: {
      organization: {
        select: {
          userId: true, // Organization owner user ID
        },
      },
      bundle: {
        select: {
          id: true,
          collaborators: {
            where: { userId: currentUserId },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found in workspace records.");
  }

  const ownerId = project.organization.userId;
  
  // 2. Check if current user is owner
  if (currentUserId === ownerId) {
    // Owner always has full access (admin equivalent)
    const vercel = await getVercelClient(ownerId);
    return { vercel, ownerId };
  }

  // 3. Otherwise, check collaborator entry
  const collaborator = project.bundle?.collaborators[0];
  if (!collaborator) {
    throw new Error("You do not have collaborator access to this project.");
  }

  // 4. Validate roles
  const role = collaborator.role;
  if (minRole === "admin" && role !== "admin") {
    throw new Error("Access denied: Only administrators are authorized to perform this operation.");
  }
  if (minRole === "editor" && role !== "admin" && role !== "editor") {
    throw new Error("Access denied: You must be an editor or administrator to perform this operation.");
  }

  // Collaborator is authorized! Let's use the owner's Vercel client.
  const vercel = await getVercelClient(ownerId);
  return { vercel, ownerId };
}
