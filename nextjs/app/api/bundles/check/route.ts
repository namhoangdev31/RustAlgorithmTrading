import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Gone", canonicalEndpoint: "/api/v1/ota/check" }, { status: 410 });
}
