import { NextRequest, NextResponse } from "next/server";
import { nativeErrorResponse, requireNativeInternalOrPat } from "@/lib/server/native-platform/auth";
import { listScimGroups, upsertScimGroup, verifyScimBearerToken } from "@/lib/server/native-platform/scim";

function getOrganizationId(request: NextRequest, body?: any) {
  const { searchParams } = request.nextUrl;
  return String(body?.organizationId || searchParams.get("organizationId") || "");
}

async function authenticateScim(request: NextRequest, scope: string) {
  const authHeader = request.headers.get("authorization");
  const scimAuth = verifyScimBearerToken(authHeader);
  if (scimAuth.valid) {
    return { organizationId: scimAuth.organizationId };
  }
  await requireNativeInternalOrPat(request, scope);
  return {};
}

function scimError(detail: string, status = 400) {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    detail,
    status: String(status),
  }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateScim(request, "scim:read");
    const organizationId = auth.organizationId || getOrganizationId(request);

    if (!organizationId) {
      return scimError("organizationId is required.", 400);
    }

    const groups = await listScimGroups(organizationId);
    return NextResponse.json(groups);
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateScim(request, "scim:write");
    const body = await request.json();
    const organizationId = auth.organizationId || getOrganizationId(request, body);

    if (!organizationId) {
      return scimError("organizationId is required.", 400);
    }

    const group = await upsertScimGroup({
      organizationId,
      externalId: String(body.id || body.externalId || body.displayName),
      displayName: body.displayName,
      role: body.role,
      members: body.members,
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
