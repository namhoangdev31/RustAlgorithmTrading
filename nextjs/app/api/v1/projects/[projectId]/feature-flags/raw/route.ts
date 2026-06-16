import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  // Enforce internal key security
  const internalKey = process.env.LEPOS_INTERNAL_API_KEY;
  const providedInternalKey = request.headers.get("x-lepos-internal-key");
  if (internalKey && providedInternalKey !== internalKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId } = await context.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: { bundle: true }
    });
    if (!project || !project.bundle) {
      return NextResponse.json({ flags: [] });
    }

    const abTests = await prisma.bundleAbTests.findMany({
      where: { bundleId: project.bundle.id },
    });

    const flags = abTests.map((t) => {
      let targetingRules = [];
      if (t.hypothesis) {
        try {
          const parsed = JSON.parse(t.hypothesis);
          if (parsed.targetingRules) {
            targetingRules = parsed.targetingRules;
          }
        } catch {}
      }

      return {
        id: t.id,
        name: t.testName,
        status: t.status,
        trafficSplit: t.trafficSplit,
        variantAConfig: t.variantAConfig,
        variantBConfig: t.variantBConfig,
        targetingRules,
      };
    });

    return NextResponse.json({ flags });
  } catch (error: any) {
    console.error("[FeatureFlags Raw API] Failed to fetch flags:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch raw feature flags config" },
      { status: 500 }
    );
  }
}
