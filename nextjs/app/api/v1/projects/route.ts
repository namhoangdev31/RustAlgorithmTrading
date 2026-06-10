import { validatePersonalAccessToken } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7); // Remove "Bearer "
  return validatePersonalAccessToken(token);
}

export async function GET(request: Request) {
  const authResult = await authenticate(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized: Invalid or expired PAT." }, { status: 401 });
  }

  const { user } = authResult;

  // Fetch projects in user's organizations
  const projects = await prisma.project.findMany({
    where: {
      organization: {
        userId: user.id,
      },
      deletedAt: null,
    },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const authResult = await authenticate(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized: Invalid or expired PAT." }, { status: 401 });
  }

  const { user } = authResult;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, description, organizationId } = body;
  if (!name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  // Find organization and verify ownership
  const orgId = organizationId;
  let organization;
  if (orgId) {
    organization = await prisma.organization.findFirst({
      where: { id: orgId, userId: user.id },
    });
  } else {
    // Default to user's first organization
    organization = await prisma.organization.findFirst({
      where: { userId: user.id },
    });
  }

  if (!organization) {
    return NextResponse.json({ error: "Organization not found or access denied." }, { status: 404 });
  }

  const newProject = await prisma.project.create({
    data: {
      id: crypto.randomUUID(),
      name,
      description,
      organizationId: organization.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ project: newProject }, { status: 201 });
}
