import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API trả về chuỗi nến VN30F1M trực tiếp từ Sàn giao dịch (Entrade/DNSE)
 * Tuyệt đối không đọc nến tĩnh từ file JSON cục bộ.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawRes = searchParams.get("timeframe") || searchParams.get("resolution") || "15m";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 500;

    // Chuẩn hóa resolution và số ngày lookback cho Entrade API
    let resolution = "15";
    let lookbackDays = 90;

    if (rawRes === "1" || rawRes === "1m") {
      resolution = "1";
      lookbackDays = 15;
    } else if (rawRes === "5" || rawRes === "5m") {
      resolution = "5";
      lookbackDays = 30;
    } else if (rawRes === "15" || rawRes === "15m") {
      resolution = "15";
      lookbackDays = 90;
    } else if (rawRes === "30" || rawRes === "30m") {
      resolution = "30";
      lookbackDays = 120;
    } else if (rawRes === "60" || rawRes === "1h") {
      resolution = "60";
      lookbackDays = 180;
    } else if (rawRes === "1D" || rawRes === "D") {
      resolution = "1D";
      lookbackDays = 730;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = nowSec - 86400 * lookbackDays;

    const res = await fetch(
      `https://services.entrade.com.vn/chart-api/chart?resolution=${resolution}&symbol=VN30F1M&from=${fromSec}&to=${nowSec}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Lỗi kết nối máy chủ nến sàn (${res.status})` },
        { status: 502 }
      );
    }

    const liveData = await res.json();
    if (!liveData || !Array.isArray(liveData.t) || liveData.t.length === 0) {
      return NextResponse.json({
        ok: true,
        symbol: "VN30F1M",
        resolution: rawRes.includes("m") ? rawRes : `${rawRes}m`,
        totalCount: 0,
        returnedCount: 0,
        bars: [],
      });
    }

    const allBars = liveData.t.map((t: number, i: number) => ({
      time: t,
      open: Number(liveData.o[i]),
      high: Number(liveData.h[i]),
      low: Number(liveData.l[i]),
      close: Number(liveData.c[i]),
      volume: Number(liveData.v?.[i] || 0),
    }));

    const sliced = limit > 0 ? allBars.slice(-limit) : allBars;

    return NextResponse.json({
      ok: true,
      symbol: "VN30F1M",
      resolution: rawRes.includes("m") ? rawRes : `${rawRes}m`,
      totalCount: allBars.length,
      returnedCount: sliced.length,
      bars: sliced,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi truy vấn dữ liệu nến sàn trực tiếp" },
      { status: 500 }
    );
  }
}
