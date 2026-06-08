import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const file = formData.get("file") as File | null;
    const version = formData.get("version") as string | null;
    const track = (formData.get("track") as string | null) || "production";
    const releaseNotes = formData.get("releaseNotes") as string | null;

    if (!projectId || !file) {
      return NextResponse.json(
        { error: "Missing required fields (projectId, file)" },
        { status: 400 }
      );
    }

    // Check project ownership
    const orgs = await prisma.organization.findMany({
      where: {
        userId: session.user.id
      },
      select: { id: true }
    });
    const organizationIds = orgs.map(o => o.id);

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: { in: organizationIds },
        deletedAt: null
      },
      include: {
        bundle: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Read the file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compute checksum (SHA-256)
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    const checksum = hash.digest("hex");
    const fileSize = BigInt(buffer.length);

    // Define saving path under public/bundles/[projectId]
    const uploadDir = path.join(process.cwd(), "public", "bundles", projectId);
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save with a timestamp to avoid name collisions
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    const relativeStoragePath = `/bundles/${projectId}/${safeFileName}`;

    // Determine version and build number
    const currentBundle = project.bundle;
    let newVersion = version || "1.0.0";
    let newBuildNumber = 1;

    if (currentBundle) {
      newBuildNumber = currentBundle.buildNumber + 1;
      if (!version) {
        // Simple auto-bump patch version if no version provided
        const parts = currentBundle.version.split(".");
        if (parts.length === 3) {
          const patch = parseInt(parts[2], 10);
          if (!isNaN(patch)) {
            parts[2] = String(patch + 1);
            newVersion = parts.join(".");
          }
        } else {
          newVersion = currentBundle.version; // Fallback
        }
      }
    }

    const now = new Date();
    let updatedBundle: any = null;

    await prisma.$transaction(async (tx) => {
      if (currentBundle) {
        updatedBundle = await tx.bundles.update({
          where: { id: currentBundle.id },
          data: {
            version: newVersion,
            buildNumber: newBuildNumber,
            storagePath: relativeStoragePath,
            bucket: "local",
            fileSize: fileSize,
            checksum: checksum,
            status: "published",
            updatedAt: now
          }
        });
      } else {
        const bundleId = crypto.randomUUID();
        const slug = project.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 80);
        const finalSlug = slug ? `${slug}-${crypto.randomUUID().slice(0, 8)}` : null;

        updatedBundle = await tx.bundles.create({
          data: {
            id: bundleId,
            name: `${project.name} Bundle`,
            slug: finalSlug,
            version: newVersion,
            buildNumber: newBuildNumber,
            storagePath: relativeStoragePath,
            bucket: "local",
            fileSize: fileSize,
            checksum: checksum,
            status: "published",
            projectId: project.id,
            developerId: session.user.id,
            developerName: session.user.name || session.user.email || "Developer",
            developerEmail: session.user.email,
            createdAt: now,
            updatedAt: now
          }
        });
      }

      // Record release track entry
      await tx.bundleReleaseTracks.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: updatedBundle.id,
          track: track,
          version: newVersion,
          buildNumber: newBuildNumber,
          storagePath: relativeStoragePath,
          releaseNotes: releaseNotes || `Manual upload of version ${newVersion} (build ${newBuildNumber})`,
          status: "active",
          createdAt: now
        }
      });
    });

    return NextResponse.json({
      success: true,
      bundle: {
        id: updatedBundle ? updatedBundle.id : null,
        version: newVersion,
        buildNumber: newBuildNumber,
        storagePath: relativeStoragePath,
        checksum: checksum,
        fileSize: String(fileSize)
      }
    });

  } catch (error: any) {
    console.error("Error handling bundle upload:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
