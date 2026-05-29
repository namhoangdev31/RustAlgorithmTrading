import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const state = randomUUID();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/projects?tab=overview";

  cookieStore.set("github_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  cookieStore.set("github_oauth_return", returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  const clientId =
    process.env.GITHUB_APP_CLIENT_ID ||
    process.env.GITHUB_CLIENT_ID ||
    process.env.AUTH_GITHUB_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/projects?tab=overview&github=missing_client_id", request.url));
  }

  const callbackUrl =
    process.env.GITHUB_APP_CALLBACK_URL?.trim() ||
    process.env.GITHUB_OAUTH_CALLBACK_URL?.trim() ||
    new URL("/api/github/callback", request.url).toString();
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("scope", "read:user repo");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("allow_signup", "true");

  return NextResponse.redirect(authorizeUrl);
}
