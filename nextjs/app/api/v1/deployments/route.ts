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

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId parameter is required." }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organization: { userId: authResult.user.id } },
    include: { bundle: true },
  });

  if (!project || !project.bundle) {
    return NextResponse.json({ error: "Project or associated App Bundle not found." }, { status: 404 });
  }

  const deployments = await prisma.bundleVersionHistory.findMany({
    where: { bundleId: project.bundle.id },
    orderBy: { createdAt: "desc" },
  });

  // Serialize BigInt fields safely before sending JSON
  const serializedDeployments = deployments.map(dep => ({
    ...dep,
    fileSize: dep.fileSize ? dep.fileSize.toString() : null,
  }));

  return NextResponse.json({ deployments: serializedDeployments });
}

export async function POST(request: Request) {
  const authResult = await authenticate(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized: Invalid or expired PAT." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { projectId, version, changelog } = body;
  if (!projectId || !version) {
    return NextResponse.json({ error: "projectId and version are required." }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organization: { userId: authResult.user.id } },
    include: { bundle: true },
  });

  if (!project || !project.bundle) {
    return NextResponse.json({ error: "Project or associated App Bundle not found." }, { status: 404 });
  }

  // Get current max build number to increment it
  const lastBuild = await prisma.bundleVersionHistory.findFirst({
    where: { bundleId: project.bundle.id },
    orderBy: { buildNumber: "desc" },
  });
  const nextBuildNumber = (lastBuild?.buildNumber ?? 0) + 1;

  const newDeployment = await prisma.bundleVersionHistory.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: project.bundle.id,
      version,
      buildNumber: nextBuildNumber,
      storagePath: `/bundles/${project.bundle.id}/${nextBuildNumber}.zip`,
      fileSize: 0,
      changelog: changelog || "Programmatic deployment via API",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const serializedDeployment = {
    ...newDeployment,
    fileSize: newDeployment.fileSize ? newDeployment.fileSize.toString() : null,
  };

  return NextResponse.json({ deployment: serializedDeployment }, { status: 201 });
}
