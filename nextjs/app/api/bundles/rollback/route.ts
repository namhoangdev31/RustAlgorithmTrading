import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Gone", message: "Use an authenticated admin rollback action." }, { status: 410 });
}
