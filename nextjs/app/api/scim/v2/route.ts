import { NextRequest, NextResponse } from "next/server";
import { verifyScimBearerToken } from "@/lib/server/native-platform/scim";

function scimError(detail: string, status: number) {
  return NextResponse.json(
    {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail,
      status: String(status),
    },
    { status },
  );
}

/**
 * Provides an authenticated health descriptor for the configured SCIM base URL.
 * Resource requests remain at /Users and /Groups, scoped by the bearer token.
 */
export async function GET(request: NextRequest) {
  const authentication = await verifyScimBearerToken(request.headers.get("authorization"));
  if (!authentication.valid) {
    return scimError("A valid SCIM bearer token is required.", 401);
  }

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "Bearer token",
        description: "Workspace-scoped SCIM bearer credential.",
      },
    ],
  });
}
