import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const event = request.headers.get("x-event-key") || "repo:push";

    const repoFullName = payload?.repository?.full_name;
    if (!repoFullName) {
      return NextResponse.json({ error: "Missing repository name" }, { status: 400 });
    }

    const integration = await prisma.bundleExternalIntegrations.findFirst({
      where: {
        integrationType: "bitbucket",
        displayName: repoFullName,
        isActive: true,
      },
      include: {
        bundle: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Process push / pullrequest events
    if (event === "repo:push" || event === "pullrequest:created" || event === "pullrequest:fulfilled") {
      // Logic to trigger build/deployment runs here
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
