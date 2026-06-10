import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { bundleId, name, value, version, sessionId } = body;
  if (!bundleId || !name || value === undefined) {
    return NextResponse.json({ error: "bundleId, name, and value are required." }, { status: 400 });
  }

  // Verify bundle exists
  const bundle = await prisma.bundles.findUnique({
    where: { id: bundleId },
  });

  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found." }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  // Create analytics event record
  const event = await prisma.bundleAnalyticsEvents.create({
    data: {
      id: crypto.randomUUID(),
      bundleId,
      eventType: `web-vital:${name.toLowerCase()}`,
      eventData: JSON.stringify({ name, value }),
      bundleVersion: version || bundle.version,
      sessionId: sessionId || null,
      ipAddress: ip,
      createdAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, eventId: event.id }, { status: 201 });
}
