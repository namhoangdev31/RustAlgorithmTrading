import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { activateNativeDeployment } from "@/lib/server/native-platform/deployments";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deployment = await prisma.nativeDeployment.findUnique({ where: { id } });
    if (!deployment) {
      return NextResponse.json({ error: "Native deployment not found." }, { status: 404 });
    }

    await requireNativeProjectAccess(request, deployment.projectId, "deployment:trigger", "admin");
    const activated = await activateNativeDeployment(deployment.projectId, id);
    return NextResponse.json({ deployment: activated });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
