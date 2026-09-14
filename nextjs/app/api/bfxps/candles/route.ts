import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resolution = searchParams.get("timeframe") || searchParams.get("resolution") || "15m";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 500;

    let filename = "vn30f1m_15m_bars.json";
    const is1m = resolution === "1" || resolution === "1m";
    if (is1m) {
      filename = "vn30f1m_1m_bars.json";
    }

    const filePath = path.resolve(process.cwd(), "scripts", filename);
    let allBars: any[] = [];
    if (fs.existsSync(filePath)) {
      allBars = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    // Nạp thêm nến Realtime mới nhất từ Entrade trong phiên hôm nay
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const fromSec = nowSec - 86400 * 2;
      const res = await fetch(
        `https://services.entrade.com.vn/chart-api/chart?resolution=${is1m ? "1" : "15"}&symbol=VN30F1M&from=${fromSec}&to=${nowSec}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        }
      );

      if (res.ok) {
        const liveData = await res.json();
        if (liveData && Array.isArray(liveData.t) && liveData.t.length > 0) {
          const liveBars = liveData.t.map((t: number, i: number) => ({
            time: t,
            open: Number(liveData.o[i]),
            high: Number(liveData.h[i]),
            low: Number(liveData.l[i]),
            close: Number(liveData.c[i]),
            volume: Number(liveData.v?.[i] || 0),
          }));

          const barMap = new Map<number, any>();
          for (const b of allBars) barMap.set(b.time, b);
          for (const lb of liveBars) barMap.set(lb.time, lb);
          allBars = Array.from(barMap.values()).sort((a, b) => a.time - b.time);
        }
      }
    } catch {
      // Giữ allBars dự phòng nếu mạng lỗi
    }

    if (allBars.length === 0) {
      return NextResponse.json(
        { ok: false, error: `Không tìm thấy file nến ${filename}` },
        { status: 404 }
      );
    }

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
