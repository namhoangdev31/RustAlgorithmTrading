import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const logs = await prisma.riskEvent.findMany({
      where: {
        eventType: "CONFIG_CHANGE",
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
