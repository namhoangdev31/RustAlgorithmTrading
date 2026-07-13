import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Gone", message: "Artifact URLs are returned by /api/v1/ota/check." }, { status: 410 });
}
