import { NextRequest } from "next/server";

import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");
    const lastEventId = request.headers.get("last-event-id");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let cursor = lastEventId;
        const deadline = Date.now() + 25_000;
        while (Date.now() < deadline && !request.signal.aborted) {
          const cursorEvent = cursor ? await prisma.verificationTelemetryEvents.findUnique({ where: { eventId: cursor }, select: { occurredAt: true } }) : null;
          const events = await prisma.verificationTelemetryEvents.findMany({
            where: { projectId, ...(cursorEvent ? { occurredAt: { gt: cursorEvent.occurredAt } } : {}) },
            orderBy: { occurredAt: "asc" }, take: 100,
          });
          for (const event of events) {
            controller.enqueue(encoder.encode(`id: ${event.eventId}\nevent: ${event.kind}\ndata: ${JSON.stringify(event.payload)}\n\n`));
            cursor = event.eventId;
          }
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
          await new Promise((resolve) => setTimeout(resolve, 1_000));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
