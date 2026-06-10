import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const event = request.headers.get("x-gitlab-event") || "Push Hook";

    const projectPath = payload?.project?.path_with_namespace;
    if (!projectPath) {
      return NextResponse.json({ error: "Missing project namespace" }, { status: 400 });
    }

    const integration = await prisma.bundleExternalIntegrations.findFirst({
      where: {
        integrationType: "gitlab",
        displayName: projectPath,
        isActive: true,
      },
      include: {
        bundle: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Verify secret token (standard GitLab webhook secret token)
    const token = request.headers.get("x-gitlab-token");
    let configObj: any = {};
    try {
      configObj = JSON.parse(integration.config);
    } catch (e) {
      return NextResponse.json({ error: "Malformed configuration" }, { status: 500 });
    }

    const expectedToken = configObj.webhookSecret || configObj.secretToken;
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized: Token mismatch" }, { status: 401 });
    }

    // Process push / merge_request events to trigger deployment
    if (event === "Push Hook" || event === "Merge Request Hook") {
      // Logic for triggering the corresponding build/deployment runs here
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
