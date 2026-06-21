import { NextRequest, NextResponse } from "next/server";

import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { listConnectedDevices, upsertConnectedDeviceHeartbeat } from "@/lib/server/native-platform/devices";

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function readNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.round(numberValue) : null;
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId parameter is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");
    const devices = await listConnectedDevices(projectId);
    return NextResponse.json({ devices });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    const deviceId = String(body.deviceId || "");
    const platform = String(body.platform || "");

    if (!projectId || !deviceId || !platform) {
      return NextResponse.json(
        { error: "projectId, deviceId, and platform are required." },
        { status: 400 }
      );
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");

    const device = await upsertConnectedDeviceHeartbeat({
      projectId,
      deviceId,
      platform,
      deviceModel: readNullableString(body.deviceModel),
      osVersion: readNullableString(body.osVersion),
      ramMb: readNullableNumber(body.ramMb),
      pingMs: readNullableNumber(body.pingMs),
      metadata: body.metadata ?? null,
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
