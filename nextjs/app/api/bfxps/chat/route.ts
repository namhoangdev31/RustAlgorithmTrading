import { NextRequest, NextResponse } from "next/server";
import { getLatestMarketSnapshot } from "@/lib/server/market/market-service";
import {
  generateCanonicalQuantPlan,
  getVietnamTradingDate,
} from "@/lib/server/quant/strategy-engine";
import { computeConsensus } from "@/lib/server/quant/consensus";
import { generateAdvisorReply } from "@/lib/server/ai/advisor-service";
import { getTradingHistoryFromDb } from "@/lib/server/quant/db-plan-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = String(body.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "Câu hỏi không được để trống" },
        { status: 400 }
      );
    }

    const snapshot = await getLatestMarketSnapshot();

    // Cho phép người dùng override OHLC thủ công nếu có
    if (body.session_open != null) snapshot.open = Number(body.session_open);
    if (body.session_high != null) snapshot.high = Number(body.session_high);
    if (body.session_low != null) snapshot.low = Number(body.session_low);
    if (body.live_price != null) snapshot.current = Number(body.live_price);

    const todayStr = getVietnamTradingDate();
    const canonicalPlan = generateCanonicalQuantPlan(
      todayStr,
      snapshot.current || 1940.0,
      26.5,
      1944.0,
      1938.0,
      undefined,
      snapshot
    );
    const plans = [canonicalPlan];
    const consensus = computeConsensus(plans);

    // Lấy thông số kiểm định động từ CSDL
    let dynamicSummary = body.summary || null;
    if (!dynamicSummary) {
      try {
        const dbHistory = await getTradingHistoryFromDb();
        if (dbHistory?.summary) {
          dynamicSummary = dbHistory.summary;
        }
      } catch (dbErr) {
        // Fallback tự động trong advisor-service
      }
    }

    const reply = await generateAdvisorReply(
      question,
      snapshot,
      plans,
      consensus,
      { summary: dynamicSummary }
    );

    return NextResponse.json(reply);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi xử lý câu hỏi" },
      { status: 500 }
    );
  }
}
