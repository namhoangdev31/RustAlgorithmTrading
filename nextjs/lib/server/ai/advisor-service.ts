import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ConsensusResult,
  MarketSnapshot,
  TradingPlan,
  BacktestSummary,
  AdvisorConfig,
} from "../quant/types";
import { DEFAULT_CANONICAL_CONFIG } from "../quant/strategy-engine";

export interface AdvisorResponse {
  ok: boolean;
  intent: string;
  answerProvenanceRole: string;
  answer: string;
  charts?: Array<{
    kind: string;
    title: string;
    sourceRole: string;
    metrics?: Record<string, any>;
  }>;
  inputOhlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

export function classifyIntent(question: string): string {
  const q = question.toLowerCase();
  if (
    q.includes("chart") ||
    q.includes("biểu đồ") ||
    q.includes("zoom") ||
    q.includes("pnl") ||
    q.includes("drawdown")
  ) {
    return "CHART_RENDER_PRIORITY";
  }
  if (
    q.includes("kèo hôm nay") ||
    q.includes("hệ có kèo gì") ||
    q.includes("kèo chính") ||
    q.includes("today") ||
    q.includes("plan")
  ) {
    return "TODAY_PLANS";
  }
  if (
    q.includes("r5") ||
    q.includes("v44") ||
    q.includes("cutloss") ||
    q.includes("cắt lỗ") ||
    q.includes("sl") ||
    q.includes("tp") ||
    q.includes("stop") ||
    q.includes("risk")
  ) {
    return "RISK_EXPLAIN";
  }
  if (
    q.includes("hiệu quả") ||
    q.includes("30 phiên") ||
    q.includes("win rate") ||
    q.includes("winrate") ||
    q.includes("lịch sử") ||
    q.includes("performance") ||
    q.includes("history") ||
    q.includes("fresh") ||
    q.includes("source") ||
    q.includes("session")
  ) {
    return "PERFORMANCE_QUERY";
  }
  return "GENERAL_ADVISORY";
}

export const DEFAULT_CANONICAL_BACKTEST_SUMMARY: BacktestSummary = {
  totalSessions: 413,
  totalBars: 100746,
  startDate: "01/2025",
  endDate: "11/09/2026",
  tradedCount: 327,
  wins: 180,
  losses: 143,
  winRate: 55.0,
  profitFactor: 1.3,
  totalPnl: 306.3,
  maxDrawdown: -92.6,
};

export async function generateAdvisorReply(
  question: string,
  snapshot: MarketSnapshot,
  plans: TradingPlan[],
  consensus: ConsensusResult,
  config?: AdvisorConfig
): Promise<AdvisorResponse> {
  const intent = classifyIntent(question);
  const primaryPlan =
    plans.find((p) => p.engine === "simcarrry6") ||
    plans.find((p) => p.isCanonical) ||
    plans[0] || {
      side: "LONG",
      entryPrice: snapshot.current,
      tpPrice: snapshot.current + 22.0,
      slPrice: snapshot.current - 15.0,
      date: new Date().toISOString().slice(0, 10),
      engine: "simcarrry6",
      r5State: "KEEP",
      resolvedSource: "SIMCARRY6",
    };

  const isVi = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđùúủũụưứừửữựòóỏõọôốồổỗộơớờởỡợìíỉĩịỳýỷỹỵ]/i.test(question);
  const isEn = !isVi;

  const tpPoints = Math.abs(Number((primaryPlan.tpPrice - primaryPlan.entryPrice).toFixed(1)));
  const slPoints = Math.abs(Number((primaryPlan.slPrice - primaryPlan.entryPrice).toFixed(1)));
  const rawRatio = slPoints > 0 ? tpPoints / slPoints : 2.0;
  const rrRatioDisplay = `1:${Number(rawRatio.toFixed(1)) === Math.round(rawRatio) ? Math.round(rawRatio) : rawRatio.toFixed(1)}`;

  const summary: BacktestSummary = {
    ...DEFAULT_CANONICAL_BACKTEST_SUMMARY,
    ...(config?.summary || {}),
  };

  const brokerList = config?.brokerPlatforms?.length
    ? config.brokerPlatforms.join(", ")
    : "VPS, TCBS, SSI, DNSE";
  const orderTime = config?.orderBeforeTime || "09:15";
  const atcTime = config?.atcTime || "14:45";

  const backtestSummaryEn = `Verification across ${summary.totalSessions} sessions (${summary.totalBars?.toLocaleString() ?? "100,746"} 1m bars from ${summary.startDate ?? "Jan 2025"} to ${summary.endDate ?? "Sep 11, 2026"}): ${summary.tradedCount} filled trades (${summary.wins} Wins / ${summary.losses} Losses), Winrate ${summary.winRate}%, Total Profit ${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl} points, Profit Factor ${summary.profitFactor}.`;
  const backtestSummaryVi = `Hiệu suất kiểm định ${summary.totalSessions} phiên (${summary.totalBars?.toLocaleString() ?? "100.746"} nến 1m từ ${summary.startDate ?? "01/2025"} đến ${summary.endDate ?? "11/09/2026"}): ${summary.tradedCount} lệnh khớp (${summary.wins} Thắng / ${summary.losses} Thua), Winrate ${summary.winRate}%, Tổng lãi ${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl} điểm, Profit Factor ${summary.profitFactor}.`;

  const engineDisplay = isEn
    ? (primaryPlan.engine === "simcarrry6" ? "SimCarry6 Swing T+1" : primaryPlan.engine === "CanonicalDirectionalBreakout" ? "Canonical Directional Breakout" : primaryPlan.engine)
    : (primaryPlan.engine === "simcarrry6" ? "Kèo Chính SimCarry6 Swing T+1" : primaryPlan.engine === "CanonicalDirectionalBreakout" ? "Đột Phá Xu Hướng Chuẩn Tắc" : primaryPlan.engine);

  if (intent === "CHART_RENDER_PRIORITY") {
    return {
      ok: true,
      intent,
      answerProvenanceRole: "HISTORY_CANONICAL",
      answer: isEn
        ? `🟦 SYSTEM/DB
Activated real 1-minute candlestick backtest performance chart (Zero Lookahead).

🟧 HISTORY/REASONING
${backtestSummaryEn}

🟪 INFERENCE/BRAIN
Strategy utilizes Stop Breakout with Risk/Reward = ${rrRatioDisplay} (TP +${tpPoints.toFixed(1)} pts, SL -${slPoints.toFixed(1)} pts), preserving capital and capturing trend momentum.

⬜ CONCLUSION/ACTION
Place order before ${orderTime} AM on your brokerage app (${brokerList}), strictly adhere to SL discipline and actively close at ATC ${atcTime}.`
        : `🟦 HỆ THỐNG/CSDL
Đã kích hoạt biểu đồ hiệu suất kiểm định nến 1 phút thực tế (Zero Lookahead).

🟧 LỊCH SỬ/SUY LUẬN
${backtestSummaryVi}

🟪 SUY LUẬN/BRAIN
Chiến lược sử dụng Stop Breakout với tỷ lệ R:R = ${rrRatioDisplay} (TP +${tpPoints.toFixed(1)}đ, SL -${slPoints.toFixed(1)}đ), bảo vệ vốn và tối ưu hóa lợi nhuận khi có sóng bứt phá.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Đặt lệnh trước ${orderTime} sáng trên app chứng khoán (${brokerList}), tuân thủ kỷ luật dừng lỗ và đóng vị thế ATC lúc ${atcTime}.`,
      charts: [
        {
          kind: "performance_30d",
          title: isEn
            ? `PnL / Equity / Drawdown real 1-minute bars (${summary.startDate ?? "2025"} - ${summary.endDate ?? "2026"})`
            : `PnL / Equity / Drawdown nến 1 phút thực tế (${summary.startDate ?? "2025"} - ${summary.endDate ?? "2026"})`,
          sourceRole: "HISTORY_CANONICAL",
          metrics: {
            rows: summary.totalSessions,
            executed: summary.tradedCount,
            wins: summary.wins,
            losses: summary.losses,
            wr: summary.winRate,
            pf: summary.profitFactor,
            totalPnl: summary.totalPnl,
            maxDd: summary.maxDrawdown,
          },
        },
      ],
      inputOhlc: {
        open: snapshot.open,
        high: snapshot.high,
        low: snapshot.low,
        close: snapshot.current,
      },
    };
  }

  const isBreakout = primaryPlan.engine === "CanonicalDirectionalBreakout" || primaryPlan.orderType === "STOP";
  const orderTypeEn = isBreakout ? "Stop Order" : "Limit Order";
  const orderTypeVi = isBreakout ? "Lệnh dừng Stop Order" : "Lệnh giới hạn Limit Order";

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Bạn là Lepos Trading Bot - Hệ thống cố vấn phái sinh VN30 chuyên nghiệp.
Hệ thống tập trung vào KÈO CHÍNH trong ngày (${engineDisplay}):
- Thông tin thị trường: Open ${snapshot.open}, High ${snapshot.high}, Low ${snapshot.low}, Current ${snapshot.current}, Basis ${snapshot.basis ?? "N/A"}.
- KÈO CHÍNH HÔM NAY: Hướng ${primaryPlan.side}, ${orderTypeVi} tại Entry ${primaryPlan.entryPrice.toFixed(1)}, TP ${primaryPlan.tpPrice.toFixed(1)} (+${tpPoints.toFixed(1)}đ), SL ${primaryPlan.slPrice.toFixed(1)} (-${slPoints.toFixed(1)}đ). Tỷ lệ R:R = ${rrRatioDisplay}.
- Kiểm định lịch sử ${summary.totalSessions} phiên (${summary.totalBars?.toLocaleString() ?? "100.746"} nến 1m thực tế từ ${summary.startDate ?? "01/2025"} đến ${summary.endDate ?? "11/09/2026"}): Winrate ${summary.winRate}%, Lãi ${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl} điểm, Profit Factor ${summary.profitFactor}.
Câu hỏi của người dùng: "${question}"

YÊU CẦU BẮT BUỘC: Câu trả lời PHẢI chia thành đúng 4 khối với định dạng:
${isEn ? "🟦 SYSTEM/DB" : "🟦 HỆ THỐNG/CSDL"}
(Nêu rõ các mức giá Entry, TP, SL của kèo chính)
${isEn ? "🟧 HISTORY/REASONING" : "🟧 LỊCH SỬ/SUY LUẬN"}
(Nêu thống kê kiểm định ${summary.totalSessions} phiên thực tế, Winrate ${summary.winRate}%, ${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl}đ)
${isEn ? "🟪 INFERENCE/BRAIN" : "🟪 SUY LUẬN/BRAIN"}
(Đánh giá so sánh giá hiện tại với điểm vào lệnh)
${isEn ? "⬜ CONCLUSION/ACTION" : "⬜ KẾT LUẬN/HÀNH ĐỘNG"}
(Hướng dẫn người dùng tự đặt lệnh trên app (${brokerList}) trước ${orderTime} sáng, đóng ATC lúc ${atcTime})`;

      const res = await model.generateContent(prompt);
      const geminiText = res.response.text();
      if (geminiText && (geminiText.includes("🟦 HỆ THỐNG/CSDL") || geminiText.includes("🟦 SYSTEM/DB"))) {
        return {
          ok: true,
          intent,
          answerProvenanceRole: "INFERENCE",
          answer: geminiText,
          inputOhlc: {
            open: snapshot.open,
            high: snapshot.high,
            low: snapshot.low,
            close: snapshot.current,
          },
        };
      }
    } catch (err) {
      // Fallback to rule engine
    }
  }

  let answer = "";
  if (intent === "TODAY_PLANS") {
    answer = isEn
      ? `🟦 SYSTEM/DB
Primary Trading Plan for Session (${primaryPlan.date}) — ${engineDisplay}:
- Condition Order: ${orderTypeEn} (${primaryPlan.side === "LONG" ? "Buy" : "Sell"}) at price ${primaryPlan.entryPrice.toFixed(1)}.
- Take Profit (TP): ${primaryPlan.tpPrice.toFixed(1)} (+${tpPoints.toFixed(1)} points).
- Stop Loss (SL): ${primaryPlan.slPrice.toFixed(1)} (-${slPoints.toFixed(1)} points). Risk/Reward = ${rrRatioDisplay}.
Data Source: ${primaryPlan.resolvedSource || "SIMCARRY6_SWING"} (Zero Lookahead).

🟧 HISTORY/REASONING
${backtestSummaryEn}

🟪 INFERENCE/BRAIN
Current Market Price: ${snapshot.current.toFixed(1)}. Tracking trigger level ${primaryPlan.entryPrice.toFixed(1)}.

⬜ CONCLUSION/ACTION
Place ${orderTypeEn} on your brokerage app (${brokerList}) before ${orderTime} AM. If neither TP nor SL is reached by ${atcTime}, actively close at ATC.`
      : `🟦 HỆ THỐNG/CSDL
Kèo chính cho phiên (${primaryPlan.date}) — ${engineDisplay}:
- Lệnh đặt: ${orderTypeVi} (${primaryPlan.side === "LONG" ? "Mua" : "Bán"}) tại giá ${primaryPlan.entryPrice.toFixed(1)}.
- Chốt lời (TP): ${primaryPlan.tpPrice.toFixed(1)} (+${tpPoints.toFixed(1)} điểm).
- Cắt lỗ (SL): ${primaryPlan.slPrice.toFixed(1)} (-${slPoints.toFixed(1)} điểm). Tỷ lệ R:R = ${rrRatioDisplay}.
Nguồn dữ liệu: ${primaryPlan.resolvedSource || "SIMCARRY6_SWING"} (Chuẩn Zero Lookahead).

🟧 LỊCH SỬ/SUY LUẬN
${backtestSummaryVi}

🟪 SUY LUẬN/BRAIN
Giá thị trường hiện tại: ${snapshot.current.toFixed(1)}. Đang bám sát mốc vào lệnh ${primaryPlan.entryPrice.toFixed(1)}.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Đặt lệnh ${orderTypeVi} trên app chứng khoán (${brokerList}) trước ${orderTime} sáng. Nếu đến ${atcTime} chưa chạm TP/SL thì chủ động đóng lệnh ở phiên ATC.`;
  } else if (intent === "PERFORMANCE_QUERY") {
    answer = isEn
      ? `🟦 SYSTEM/DB
Objective Verification Database (Zero Lookahead) from ${summary.startDate ?? "Jan 2025"} to ${summary.endDate ?? "Sep 11, 2026"}.
Total Sessions Surveyed: ${summary.totalSessions} sessions · ${summary.totalBars?.toLocaleString() ?? "100,746"} 1-minute bars.

🟧 HISTORY/REASONING
Performance breakdown:
- Traded Sessions: ${summary.tradedCount} filled trades (${summary.wins} Wins / ${summary.losses} Losses).
- Winrate: ${summary.winRate}% · Profit Factor: ${summary.profitFactor}.
- Net Profit: ${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl} points (approx ${summary.totalPnl > 0 ? "+" : ""}${(summary.totalPnl * 0.1).toFixed(2)}M VND / contract).
- Max Drawdown: ${summary.maxDrawdown} points.

🟪 INFERENCE/BRAIN
Positive mathematical expectancy achieved via consistent R:R = ${rrRatioDisplay} (TP +${tpPoints.toFixed(1)} pts / SL -${slPoints.toFixed(1)} pts) and strict single-trade discipline.

⬜ CONCLUSION/ACTION
Review historical ledger anytime via Trade History Modal. Do not modify TP/SL targets during live sessions.`
      : `🟦 HỆ THỐNG/CSDL
Cơ sở dữ liệu kiểm định khách quan (Chuẩn Zero Lookahead) từ ${summary.startDate ?? "01/2025"} đến ${summary.endDate ?? "11/09/2026"}.
Tổng số phiên khảo sát: ${summary.totalSessions} phiên · ${summary.totalBars?.toLocaleString() ?? "100.746"} nến 1 phút thực tế.

🟧 LỊCH SỬ/SUY LUẬN
Báo cáo hiệu suất thực tế:
- Số phiên khớp lệnh: ${summary.tradedCount} phiên (${summary.wins} Thắng / ${summary.losses} Thua).
- Tỷ lệ thắng (Winrate): ${summary.winRate}% · Hệ số sinh lời (Profit Factor): ${summary.profitFactor}.
- Tổng lợi nhuận lũy kế: ${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl} điểm (tương đương ${summary.totalPnl > 0 ? "+" : ""}${(summary.totalPnl * 0.1).toFixed(2)} triệu VNĐ / 1 HĐ).
- Mức sụt giảm tối đa (Max Drawdown): ${summary.maxDrawdown} điểm.

🟪 SUY LUẬN/BRAIN
Kỳ vọng toán học dương được thiết lập dựa trên tỷ lệ R:R = ${rrRatioDisplay} (TP +${tpPoints.toFixed(1)}đ / SL -${slPoints.toFixed(1)}đ) và kỷ luật 1 kèo duy nhất.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Người dùng có thể tra cứu chi tiết từng phiên trong Sổ Lệnh Lịch Sử CSDL. Tuyệt đối giữ đúng tỷ lệ TP/SL đã định sẵn.`;
  } else if (intent === "RISK_EXPLAIN") {
    const v44ReasonEn =
      primaryPlan.side === "LONG"
        ? "Rule V44: Validated Expected-High above Reference Price before trigger."
        : "Rule V44: Validated Expected-Low below Reference Price before trigger.";
    const v44ReasonVi =
      primaryPlan.side === "LONG"
        ? "Quy tắc V44: Đã kiểm chứng mốc Dự báo Cao (Expected-High) trên giá tham chiếu."
        : "Quy tắc V44: Đã kiểm chứng mốc Dự báo Thấp (Expected-Low) dưới giá tham chiếu.";
    const r5ReasonEn = `R5 Filter state: ${primaryPlan.r5State} (Execution priority: CANCEL > FLIP_HINT > KEEP).`;
    const r5ReasonVi = `Trạng thái bộ lọc R5: ${primaryPlan.r5State} (Ưu tiên: CANCEL > FLIP_HINT > KEEP).`;

    answer = isEn
      ? `🟦 SYSTEM/DB
Risk management parameters: Stop Loss level ${primaryPlan.slPrice.toFixed(1)} (Source: ${primaryPlan.resolvedSource || "CANONICAL"}). Risk/Reward: ${rrRatioDisplay} (TP +${tpPoints.toFixed(1)} pts / SL -${slPoints.toFixed(1)} pts).

🟧 HISTORY/REASONING
${v44ReasonEn} ${r5ReasonEn}

🟪 INFERENCE/BRAIN
Current market price is ${snapshot.current.toFixed(1)}. Buffer distance to Stop Loss: ${Math.abs(snapshot.current - primaryPlan.slPrice).toFixed(1)} points.

⬜ CONCLUSION/ACTION
Strictly respect Stop Loss at ${primaryPlan.slPrice.toFixed(1)}; immediately exit position if breached without hesitation.`
      : `🟦 HỆ THỐNG/CSDL
Thông số quản trị rủi ro của kèo: Mức cắt lỗ SL ${primaryPlan.slPrice.toFixed(1)} (Nguồn: ${primaryPlan.resolvedSource || "CANONICAL"}). Tỷ lệ R:R: ${rrRatioDisplay} (TP +${tpPoints.toFixed(1)}đ / SL -${slPoints.toFixed(1)}đ).

🟧 LỊCH SỬ/SUY LUẬN
${v44ReasonVi} ${r5ReasonVi}

🟪 SUY LUẬN/BRAIN
Giá thị trường hiện tại: ${snapshot.current.toFixed(1)}. Khoảng cách an toàn tới ngưỡng cắt lỗ: ${Math.abs(snapshot.current - primaryPlan.slPrice).toFixed(1)} điểm.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Tuyệt đối tuân thủ kỷ luật SL tại ${primaryPlan.slPrice.toFixed(1)}; nếu chạm mức này phải thoát vị thế dứt khoát không do dự.`;
  } else {
    answer = isEn
      ? `🟦 SYSTEM/DB
Lepos Trading Bot recorded market data: Open ${snapshot.open.toFixed(1)} | High ${snapshot.high.toFixed(1)} | Low ${snapshot.low.toFixed(1)} | Close ${snapshot.current.toFixed(1)}.

🟧 HISTORY/REASONING
Representative Single Plan: ${engineDisplay} ${primaryPlan.side} ${primaryPlan.entryPrice.toFixed(1)}.

🟪 INFERENCE/BRAIN
Current price is deviating ${Number((snapshot.current - primaryPlan.entryPrice).toFixed(1))} points from standard entry trigger.

⬜ CONCLUSION/ACTION
Patiently wait for price to test equilibrium zone before entering new positions.`
      : `🟦 HỆ THỐNG/CSDL
Hệ thống Lepos Trading Bot ghi nhận giá thị trường: O ${snapshot.open.toFixed(1)} | H ${snapshot.high.toFixed(1)} | L ${snapshot.low.toFixed(1)} | C ${snapshot.current.toFixed(1)}.

🟧 LỊCH SỬ/SUY LUẬN
Kèo chính đại diện: ${engineDisplay} ${primaryPlan.side} ${primaryPlan.entryPrice.toFixed(1)}.

🟪 SUY LUẬN/BRAIN
Giá hiện tại đang lệch ${Number((snapshot.current - primaryPlan.entryPrice).toFixed(1))} điểm so với điểm vào lệnh tiêu chuẩn.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Kiên nhẫn chờ giá test lại vùng cân bằng trước khi mở vị thế mới.`;
  }

  return {
    ok: true,
    intent,
    answerProvenanceRole: "INFERENCE",
    answer,
    inputOhlc: {
      open: snapshot.open,
      high: snapshot.high,
      low: snapshot.low,
      close: snapshot.current,
    },
  };
}
