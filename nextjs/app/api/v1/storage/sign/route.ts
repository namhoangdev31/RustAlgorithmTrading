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

export async function POST(request: Request) {
  const authResult = await authenticate(request);
  if (!authResult) {
    // Also allow normal session auth if requested via browser
    // But for API simplicity and safety, we focus on PAT here
    return NextResponse.json({ error: "Unauthorized: Invalid or expired PAT." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { filename, contentType, projectId } = body;
  if (!filename || !contentType || !projectId) {
    return NextResponse.json({ error: "filename, contentType, and projectId are required." }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organization: { userId: authResult.user.id } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
  }

  // Generate unique path key
  const fileKey = `uploads/${projectId}/${crypto.randomUUID()}-${filename}`;

  // Simulate AWS S3 / Cloudflare R2 Signed URL generation
  const mockS3Host = "https://lepos-assets.s3.us-east-1.amazonaws.com";
  const uploadUrl = `${mockS3Host}/${fileKey}?AWSAccessKeyId=MOCKKEY&Signature=MOCKSIGNATURE&Expires=${Math.floor(Date.now() / 1000) + 900}`;
  const publicUrl = `${mockS3Host}/${fileKey}`;

  console.log(`[Storage Presigner] Generated upload presigned URL for ${filename} under project ${projectId}`);

  return NextResponse.json({
    uploadUrl,
    publicUrl,
    fileKey,
  });
}
