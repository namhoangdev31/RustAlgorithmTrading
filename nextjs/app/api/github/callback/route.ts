import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const savedState = cookieStore.get("github_oauth_state")?.value;
  const returnTo = cookieStore.get("github_oauth_return")?.value || "/projects?tab=overview";

  const buildReturnUrl = (reason?: string) => {
    const url = new URL(returnTo, request.url);
    if (reason) {
      url.searchParams.set("github", reason);
    }
    return url;
  };

  cookieStore.delete("github_oauth_state");
  cookieStore.delete("github_oauth_return");

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(buildReturnUrl("invalid_state"));
  }

  const clientId =
    process.env.GITHUB_APP_CLIENT_ID ||
    process.env.GITHUB_CLIENT_ID ||
    process.env.AUTH_GITHUB_ID;
  const clientSecret =
    process.env.GITHUB_APP_CLIENT_SECRET ||
    process.env.GITHUB_CLIENT_SECRET ||
    process.env.AUTH_GITHUB_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(buildReturnUrl("missing_secret"));
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenJson = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenJson.access_token || tokenJson.error) {
    return NextResponse.redirect(buildReturnUrl("token_error"));
  }

  cookieStore.set("github_access_token", tokenJson.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.redirect(buildReturnUrl());
}
