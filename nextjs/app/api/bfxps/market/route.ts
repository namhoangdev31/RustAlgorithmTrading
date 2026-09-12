import { NextResponse } from "next/server";
import { getLatestMarketSnapshot } from "@/lib/server/market/market-service";

export async function GET() {
  try {
    const snapshot = await getLatestMarketSnapshot();
    return NextResponse.json({ ok: true, live: snapshot });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi lấy dữ liệu thị trường" },
      { status: 500 }
    );
  }
}
