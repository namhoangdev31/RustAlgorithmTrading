import { NextRequest, NextResponse } from "next/server";
import { nativeErrorResponse, requireNativeInternalOrPat } from "@/lib/server/native-platform/auth";
import { upsertScimUser, deleteScimUser, verifyScimBearerToken } from "@/lib/server/native-platform/scim";
import { prisma } from "@/lib/server/prisma";

function getOrganizationId(request: NextRequest) {
  return String(request.nextUrl.searchParams.get("organizationId") || "");
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateScim(request, "scim:read");
    const organizationId = auth.organizationId || getOrganizationId(request);

    if (!organizationId) return scimError("organizationId is required.", 400);

    const mapping = await prisma.nativeScimMapping.findFirst({
      where: {
        organizationId,
        provider: "scim",
        resourceType: "User",
        externalId: params.id,
      },
    });

    if (!mapping) return scimError(`User not found: ${params.id}`, 404);

    return NextResponse.json({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: mapping.externalId,
      userName: (mapping.metadata as any)?.userName || mapping.externalId,
      active: (mapping.metadata as any)?.active ?? true,
      meta: { resourceType: "User" },
    });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateScim(request, "scim:write");
    const body = await request.json();
    const organizationId = auth.organizationId || getOrganizationId(request) || body.organizationId;

    if (!organizationId) return scimError("organizationId is required.", 400);

    const user = await upsertScimUser({
      organizationId,
      externalId: params.id,
      userName: body.userName || params.id,
      active: body.active ?? true,
      role: body.role,
    });

    return NextResponse.json(user);
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateScim(request, "scim:write");
    const body = await request.json();
    const organizationId = auth.organizationId || getOrganizationId(request) || body.organizationId;

    if (!organizationId) return scimError("organizationId is required.", 400);

    let active = true;
    if (body.Operations && Array.isArray(body.Operations)) {
      const activeOp = body.Operations.find(
        (op: any) => op.op?.toLowerCase() === "replace" && op.path === "active"
      );
      if (activeOp) active = activeOp.value === true || activeOp.value === "true";
    } else if (body.active !== undefined) {
      active = body.active === true || body.active === "true";
    }

    const user = await upsertScimUser({
      organizationId,
      externalId: params.id,
      userName: body.userName || params.id,
      active,
      role: body.role,
    });

    return NextResponse.json(user);
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateScim(request, "scim:write");
    const organizationId = auth.organizationId || getOrganizationId(request);

    if (!organizationId) return scimError("organizationId is required.", 400);

    await deleteScimUser(organizationId, params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
