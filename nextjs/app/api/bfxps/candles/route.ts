import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resolution = searchParams.get("timeframe") || searchParams.get("resolution") || "15m";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 500;

    let filename = "vn30f1m_15m_bars.json";
    if (resolution === "1" || resolution === "1m") {
      filename = "vn30f1m_1m_bars.json";
    }

    const filePath = path.resolve(process.cwd(), "scripts", filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, error: `Không tìm thấy file nến ${filename}` },
        { status: 404 }
      );
    }

    const allBars = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const sliced = limit > 0 ? allBars.slice(-limit) : allBars;

    return NextResponse.json({
      ok: true,
      symbol: "VN30F1M",
      resolution: resolution.includes("m") ? resolution : `${resolution}m`,
      totalCount: allBars.length,
      returnedCount: sliced.length,
      bars: sliced,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi nạp dữ liệu nến" },
      { status: 500 }
    );
  }
}
