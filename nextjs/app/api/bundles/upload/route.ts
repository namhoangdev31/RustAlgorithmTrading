import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Gone", canonicalEndpoint: "/api/v1/releases/upload" }, { status: 410 });
}
