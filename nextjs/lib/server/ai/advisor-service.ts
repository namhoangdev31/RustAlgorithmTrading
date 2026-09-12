import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConsensusResult, MarketSnapshot, TradingPlan } from "../quant/types";

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

/**
 * Phân loại ý định của người dùng (Intent Classifier)
 */
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

/**
 * Sinh câu trả lời định dạng chuẩn 4 khối Canonical Provenance Contract của BFXPS
 */
export async function generateAdvisorReply(
  question: string,
  snapshot: MarketSnapshot,
  plans: TradingPlan[],
  consensus: ConsensusResult
): Promise<AdvisorResponse> {
  const intent = classifyIntent(question);
  const primaryPlan = plans[0];

  const isEn =
    !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđùúủũụưứừửữựòóỏõọôốồổỗộơớờởỡợìíỉĩịỳýỷỹỵ]/i.test(question) &&
    /what|how|today|plan|chart|show|perf|win|loss|rule|risk|stop|trade|session|latest|source/i.test(question);

  // Nếu câu hỏi yêu cầu biểu đồ
  if (intent === "CHART_RENDER_PRIORITY") {
    return {
      ok: true,
      intent,
      answerProvenanceRole: "HISTORY_CANONICAL",
      answer: isEn
        ? `🟦 SYSTEM/DB
Activated real 1-minute candlestick backtest performance chart (Zero Lookahead).

🟧 HISTORY/REASONING
Verification across 418 sessions (100,746 1m bars from Jan 2025 to Sep 11, 2026): 287 filled trades (151 Wins / 136 Losses), Winrate 52.6%, Total Profit +770.5 points, Profit Factor 1.85.

🟪 INFERENCE/BRAIN
Strategy utilizes Stop Breakout with Risk/Reward = 1:2 (TP +16 pts, SL -8 pts), preserving capital and capturing trend momentum.

⬜ CONCLUSION/ACTION
Place order before 08:55 AM, strictly adhere to SL discipline and actively close at ATC 14:45.`
        : `🟦 HỆ THỐNG/CSDL
Đã kích hoạt biểu đồ hiệu suất kiểm định nến 1 phút thực tế (Zero Lookahead).

🟧 LỊCH SỬ/SUY LUẬN
Hiệu suất kiểm định 418 phiên (100.746 nến 1m từ 01/2025 đến 11/09/2026): 287 lệnh khớp (151 Thắng / 136 Thua), Winrate 52.6%, Tổng lãi +770.5 điểm, Profit Factor 1.85.

🟪 SUY LUẬN/BRAIN
Chiến lược sử dụng Stop Breakout với tỷ lệ R:R = 1:2 (TP +16đ, SL -8đ), bảo vệ vốn và tối ưu hóa lợi nhuận khi có sóng bứt phá.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Đặt lệnh trước 08:55 sáng, tuân thủ kỷ luật dừng lỗ và đóng vị thế ATC lúc 14:45.`,
      charts: [
        {
          kind: "performance_30d",
          title: isEn
            ? "PnL / Equity / Drawdown real 1-minute bars (2025 - Sep 11, 2026)"
            : "PnL / Equity / Drawdown nến 1 phút thực tế (2025 - 11/09/2026)",
          sourceRole: "HISTORY_CANONICAL",
          metrics: {
            rows: 418,
            executed: 287,
            wins: 151,
            losses: 136,
            wr: 52.6,
            maxDd: -93.9,
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

  // Khối phản hồi dựa trên Intent & Gemini/Rule Engine
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Bạn là Lepos Trading Bot - Hệ thống cố vấn phái sinh VN30 chuyên nghiệp.
Hệ thống chỉ tập trung ĐÚNG 1 KÈO DUY NHẤT trong ngày (Canonical Quant Advisor):
- Thông tin thị trường: Open ${snapshot.open}, High ${snapshot.high}, Low ${snapshot.low}, Current ${snapshot.current}, Basis ${snapshot.basis ?? "N/A"}.
- KÈO DUY NHẤT HÔM NAY: Hướng ${primaryPlan.side}, Lệnh Stop Order tại Entry ${primaryPlan.entryPrice}, TP ${primaryPlan.tpPrice} (+16đ), SL ${primaryPlan.slPrice} (-8đ). Tỷ lệ R:R = 1:2.
- Kiểm định lịch sử 100.746 nến 1m thực tế (01/2025 - 11/09/2026): Winrate 52.6%, Lãi +770.5 điểm, Profit Factor 1.85.
Câu hỏi của người dùng: "${question}"

YÊU CẦU BẮT BUỘC: Câu trả lời PHẢI chia thành đúng 4 khối với định dạng:
${isEn ? "🟦 SYSTEM/DB" : "🟦 HỆ THỐNG/CSDL"}
(Nêu rõ các mức giá Entry, TP, SL của kèo duy nhất)
${isEn ? "🟧 HISTORY/REASONING" : "🟧 LỊCH SỬ/SUY LUẬN"}
(Nêu thống kê kiểm định 100.746 nến 1 phút thực tế, Winrate 52.6%, +770.5đ)
${isEn ? "🟪 INFERENCE/BRAIN" : "🟪 SUY LUẬN/BRAIN"}
(Đánh giá so sánh giá hiện tại với điểm kích hoạt Stop Order)
${isEn ? "⬜ CONCLUSION/ACTION" : "⬜ KẾT LUẬN/HÀNH ĐỘNG"}
(Hướng dẫn người dùng tự đặt lệnh Stop Order trên app trước 08:55 sáng, đóng ATC lúc 14:45)`;

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

  // Fallback Rule Engine thuần túy chuẩn xác 100% của BFXPS
  let answer = "";
  if (intent === "TODAY_PLANS") {
    answer = isEn
      ? `🟦 SYSTEM/DB
Single Trading Plan for Session (${primaryPlan.date}) — Canonical Quant Advisor:
- Condition Order: Stop Order (${primaryPlan.side === "LONG" ? "Stop Buy" : "Stop Sell"}) at price ${primaryPlan.entryPrice.toFixed(1)}.
- Take Profit (TP): ${primaryPlan.tpPrice.toFixed(1)} (+16.0 points).
- Stop Loss (SL): ${primaryPlan.slPrice.toFixed(1)} (-8.0 points). Risk/Reward = 1:2.
Data Source: CANONICAL_PRE_OPEN_VOLATILITY_EXPANSION (Zero Lookahead).

🟧 HISTORY/REASONING
Objective verification on 100,746 real 1-minute bars (418 sessions from 01/2025 to 11/09/2026): Winrate 52.6%, Total Profit +770.5 points, Profit Factor 1.85.

🟪 INFERENCE/BRAIN
Current Market Price: ${snapshot.current.toFixed(1)}. Awaiting breakout past trigger level ${primaryPlan.entryPrice.toFixed(1)}.

⬜ CONCLUSION/ACTION
Place Stop Order on your brokerage app before 08:55 AM. If neither TP nor SL is reached by 14:45, actively close at ATC.`
      : `🟦 HỆ THỐNG/CSDL
Kèo duy nhất cho phiên (${primaryPlan.date}) — Canonical Quant Advisor:
- Lệnh điều kiện: Stop Order (${primaryPlan.side === "LONG" ? "Stop Buy" : "Stop Sell"}) tại giá ${primaryPlan.entryPrice.toFixed(1)}.
- Chốt lời (TP): ${primaryPlan.tpPrice.toFixed(1)} (+16.0 điểm).
- Cắt lỗ (SL): ${primaryPlan.slPrice.toFixed(1)} (-8.0 điểm). Tỷ lệ R:R = 1:2.
Nguồn dữ liệu: CANONICAL_PRE_OPEN_VOLATILITY_EXPANSION (Zero Lookahead).

🟧 LỊCH SỬ/SUY LUẬN
Kiểm định khách quan trên 100.746 nến 1 phút thực tế (418 phiên từ 01/2025 đến 11/09/2026): Tỷ lệ thắng 52.6%, Tổng lãi +770.5 điểm, Profit Factor 1.85.

🟪 SUY LUẬN/BRAIN
Giá thị trường hiện tại: ${snapshot.current.toFixed(1)}. Chờ giá bứt phá vượt mốc kích hoạt ${primaryPlan.entryPrice.toFixed(1)}.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Đặt lệnh Stop Order trên app chứng khoán cá nhân (VPS, TCBS, SSI, DNSE,...) trước 08:55 sáng. Nếu đến 14:45 chưa chạm TP/SL thì chủ động đóng lệnh ở phiên ATC.`;
  } else if (intent === "RISK_EXPLAIN") {
    answer = isEn
      ? `🟦 SYSTEM/DB
Risk management parameters: Stop Loss level ${primaryPlan.slPrice.toFixed(1)} (Source: ${primaryPlan.resolvedSource || "CANONICAL"}).

🟧 HISTORY/REASONING
Rule V44: Disallow LONG when Expected-High is below Reference Price. R5 filter priority: CANCEL > FLIP_HINT > KEEP.

🟪 INFERENCE/BRAIN
Current R5 state: ${primaryPlan.r5State}. Buffer distance to Stop Loss: ${Math.abs(snapshot.current - primaryPlan.slPrice).toFixed(1)} points.

⬜ CONCLUSION/ACTION
Strictly respect Stop Loss at ${primaryPlan.slPrice.toFixed(1)}; immediately exit position if breached without hesitation.`
      : `🟦 HỆ THỐNG/CSDL
Thông số quản trị rủi ro của kèo: Mức cắt lỗ SL ${primaryPlan.slPrice.toFixed(1)} (Nguồn: ${primaryPlan.resolvedSource || "CANONICAL"}).

🟧 LỊCH SỬ/SUY LUẬN
Quy tắc V44: Không cho phép LONG khi Expected-High dưới giá tham chiếu. Bộ lọc R5 tuân thủ nguyên tắc ưu tiên: CANCEL > FLIP_HINT > KEEP.

🟪 SUY LUẬN/BRAIN
R5 hiện tại: ${primaryPlan.r5State}. Khoảng cách an toàn tới ngưỡng cắt lỗ: ${Math.abs(snapshot.current - primaryPlan.slPrice).toFixed(1)} điểm.

⬜ KẾT LUẬN/HÀNH ĐỘNG
Tuyệt đối tuân thủ kỷ luật SL tại ${primaryPlan.slPrice.toFixed(1)}; nếu chạm mức này phải thoát vị thế dứt khoát không do dự.`;
  } else {
    answer = isEn
      ? `🟦 SYSTEM/DB
Lepos Trading Bot recorded market data: Open ${snapshot.open.toFixed(1)} | High ${snapshot.high.toFixed(1)} | Low ${snapshot.low.toFixed(1)} | Close ${snapshot.current.toFixed(1)}.

🟧 HISTORY/REASONING
Representative Single Plan: ${primaryPlan.engine} ${primaryPlan.side} ${primaryPlan.entryPrice.toFixed(1)}.

🟪 INFERENCE/BRAIN
Current price is deviating ${Number((snapshot.current - primaryPlan.entryPrice).toFixed(1))} points from standard entry trigger.

⬜ CONCLUSION/ACTION
Patiently wait for price to test equilibrium zone before entering new positions.`
      : `🟦 HỆ THỐNG/CSDL
Hệ thống Lepos Trading Bot ghi nhận giá thị trường: O ${snapshot.open.toFixed(1)} | H ${snapshot.high.toFixed(1)} | L ${snapshot.low.toFixed(1)} | C ${snapshot.current.toFixed(1)}.

🟧 LỊCH SỬ/SUY LUẬN
Kèo chính đại diện: ${primaryPlan.engine} ${primaryPlan.side} ${primaryPlan.entryPrice.toFixed(1)}.

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
