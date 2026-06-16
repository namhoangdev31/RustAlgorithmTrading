import { NextRequest, NextResponse } from "next/server";
import { nativeErrorResponse, requireNativeInternalOrPat } from "@/lib/server/native-platform/auth";
import { listScimUsers, upsertScimUser, verifyScimBearerToken } from "@/lib/server/native-platform/scim";
import { prisma } from "@/lib/server/prisma";

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
    const spOrgId = getOrganizationId(request);
    const organizationId = auth.organizationId || spOrgId;

    if (!organizationId) {
      return scimError("organizationId is required.", 400);
    }

    // Handle filtering (e.g. userName eq "user@example.com")
    const filter = request.nextUrl.searchParams.get("filter");
    if (filter) {
      const match = filter.match(/userName\s+eq\s+["']([^"']+)["']/i);
      const userNameFilter = match ? match[1] : null;

      if (userNameFilter) {
        const mapping = await prisma.nativeScimMapping.findFirst({
          where: {
            organizationId,
            provider: "scim",
            resourceType: "User",
            metadata: {
              path: ["userName"],
              equals: userNameFilter,
            },
          },
        });

        if (mapping) {
          return NextResponse.json({
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: 1,
            Resources: [{
              id: mapping.externalId,
              userName: userNameFilter,
              active: (mapping.metadata as any)?.active ?? true,
              meta: { resourceType: "User" },
            }],
          });
        }

        return NextResponse.json({
          schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
          totalResults: 0,
          Resources: [],
        });
      }
    }

    const users = await listScimUsers(organizationId);
    return NextResponse.json(users);
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

    const user = await upsertScimUser({
      organizationId,
      externalId: String(body.id || body.externalId || body.userName),
      userName: body.userName,
      active: body.active ?? true,
      role: body.role || "viewer",
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
