import fs from "fs";
import path from "path";

export interface MinuteBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bars1m: MinuteBar[];
}

export interface CanonicalPlan {
  planId: string;
  date: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  reason: string;
}

export interface TradeResult {
  date: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  exitPrice: number;
  exitType: "TP" | "SL" | "ATC" | "NO_FILL" | "TRAIL" | "BE";
  exitMinute: string;
  pnl: number;
  isWin: boolean;
  cumulativePnl: number;
}

// 1. Tải và cấu trúc 100.746 nến 1 phút thực tế (2025 - 11/09/2026)
export function load1mDataset(): DailyBar[] {
  const jsonPath = path.resolve(__dirname, "vn30f1m_1m_bars.json");
  const rawBars: MinuteBar[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const dayMap: Record<string, MinuteBar[]> = {};
  for (const b of rawBars) {
    const dateVN = new Date((b.time + 7 * 3600) * 1000).toISOString().slice(0, 10);
    if (!dayMap[dateVN]) dayMap[dateVN] = [];
    dayMap[dateVN].push(b);
  }

  const dates = Object.keys(dayMap).sort();
  const dailyBars: DailyBar[] = [];

  for (const d of dates) {
    const mBars = dayMap[d];
    let h = -Infinity;
    let l = Infinity;
    let vol = 0;
    for (const mb of mBars) {
      if (mb.high > h) h = mb.high;
      if (mb.low < l) l = mb.low;
      vol += mb.volume;
    }
    dailyBars.push({
      date: d,
      open: mBars[0].open,
      high: h,
      low: l,
      close: mBars[mBars.length - 1].close,
      volume: vol,
      bars1m: mBars,
    });
  }

  return dailyBars;
}

// 2. Thuật toán phát ĐÚNG 1 KÈO DUY NHẤT TRONG NGÀY (Zero Lookahead - Chỉ dùng dữ liệu tới hôm trước)
export function generateCanonicalPlan(dateStr: string, pastDays: DailyBar[]): CanonicalPlan {
  const n = pastDays.length;
  const lastDay = pastDays[n - 1];
  const refPrice = lastDay.close;

  // Tính ATR 5 ngày
  let trSum = 0;
  const startAtr = Math.max(0, n - 5);
  for (let j = startAtr; j < n; j++) {
    const h = pastDays[j].high;
    const l = pastDays[j].low;
    const pc = j > 0 ? pastDays[j - 1].close : pastDays[j].open;
    trSum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  const atr5 = Number((trSum / (n - startAtr)).toFixed(1));

  // Tính xu hướng động: EMA5 vs EMA10
  function calcEma(period: number) {
    const k = 2 / (period + 1);
    let ema = pastDays[0].close;
    for (let j = 1; j < n; j++) {
      ema = pastDays[j].close * k + ema * (1 - k);
    }
    return ema;
  }
  const ema5 = calcEma(5);
  const ema10 = calcEma(10);
  const isBull = ema5 >= ema10;
  const side: "LONG" | "SHORT" = isBull ? "LONG" : "SHORT";

  // Bộ đệm bứt phá tối ưu: 0.10 * ATR5 (Giảm từ 0.20 xuống 0.10 để tối đa hóa phiên khớp lệnh)
  const delta = Number((0.10 * atr5).toFixed(1));

  const entryPrice = side === "LONG"
    ? Number((refPrice + delta).toFixed(1))
    : Number((refPrice - delta).toFixed(1));

  // Mục tiêu kỳ vọng sóng lớn (+24.0 điểm) kết hợp Trailing Stop ăn trọn sóng
  const tpPrice = side === "LONG"
    ? Number((entryPrice + 24.0).toFixed(1))
    : Number((entryPrice - 24.0).toFixed(1));

  // Cắt lỗ ban đầu -8.0 điểm
  const slPrice = side === "LONG"
    ? Number((entryPrice - 8.0).toFixed(1))
    : Number((entryPrice + 8.0).toFixed(1));

  return {
    planId: `CANONICAL_${dateStr}`,
    date: dateStr,
    side,
    entryPrice,
    tpPrice,
    slPrice,
    reason: `Kèo xu hướng EMA5 ${isBull ? ">= EMA10 (Long Stop)" : "< EMA10 (Short Stop)"} kết hợp Trailing Stop & BE Lock`,
  };
}

// 3. Chạy Replay từng phút một với Cơ chế Trailing Stop & Khóa Hòa Vốn (Break-Even)
export function replaySingleDay(day: DailyBar, plan: CanonicalPlan): TradeResult {
  const mBars = day.bars1m;
  const { side, entryPrice, slPrice, tpPrice } = plan;

  let isFilled = false;
  let isClosed = false;
  let tradePnl = 0;
  let exitType: "TP" | "SL" | "ATC" | "NO_FILL" | "TRAIL" | "BE" = "NO_FILL";
  let exitPrice = 0;
  let exitMinute = "";

  let actualEntryPrice = entryPrice;
  let currentSl = slPrice;
  let peakPrice = entryPrice;

  const BE_TRIGGER = 6.0;      // Lãi >= 6.0đ -> Kéo SL về Entry + 0.5đ (Khóa hòa vốn)
  const TRAIL_TRIGGER = 12.0;  // Lãi >= 12.0đ -> Kích hoạt Trailing Stop
  const TRAIL_DIST = 5.0;      // Khoảng cách Trailing Stop bám đỉnh/đáy 5.0đ

  for (let m = 15; m < mBars.length; m++) {
    const mb = mBars[m];
    const timeStr = new Date((mb.time + 7 * 3600) * 1000).toISOString().slice(11, 16);

    // 1. Kiểm tra khớp lệnh Stop Breakout (có tính trượt giá Gap)
    if (!isFilled) {
      if (side === "LONG" && mb.high >= entryPrice) {
        isFilled = true;
        actualEntryPrice = mb.open > entryPrice ? mb.open : entryPrice;
        peakPrice = actualEntryPrice;
        currentSl = Number((actualEntryPrice - (entryPrice - slPrice)).toFixed(1));
      } else if (side === "SHORT" && mb.low <= entryPrice) {
        isFilled = true;
        actualEntryPrice = mb.open < entryPrice ? mb.open : entryPrice;
        peakPrice = actualEntryPrice;
        currentSl = Number((actualEntryPrice + (slPrice - entryPrice)).toFixed(1));
      }
    }

    // 2. Nếu đã khớp lệnh: Kiểm tra thoát lệnh TRƯỚC (Loại bỏ Lookahead Bias), sau đó mới dời Trailing Stop
    if (isFilled && !isClosed) {
      const targetPoints = Math.abs(tpPrice - entryPrice);
      const effectiveTp = tpPrice > 0
        ? (side === "LONG" ? Number((actualEntryPrice + targetPoints).toFixed(1)) : Number((actualEntryPrice - targetPoints).toFixed(1)))
        : 0;

      if (side === "LONG") {
        // 2.1. Kiểm tra chạm SL / Trailing Stop hiện hành trước
        if (mb.low <= currentSl) {
          isClosed = true;
          // Xử lý Gap-down trượt giá dưới mức SL
          const actualExit = mb.open < currentSl ? mb.open : currentSl;
          exitPrice = actualExit;
          exitMinute = timeStr;
          tradePnl = Number((actualExit - actualEntryPrice).toFixed(1));
          exitType = actualExit > actualEntryPrice + 0.5 ? "TRAIL" : (actualExit >= actualEntryPrice - 0.1 ? "BE" : "SL");
          break;
        }

        // 2.2. Kiểm tra TP (nếu có)
        if (effectiveTp > 0 && mb.high >= effectiveTp) {
          isClosed = true;
          const actualExit = mb.open > effectiveTp ? mb.open : effectiveTp;
          exitPrice = actualExit;
          exitMinute = timeStr;
          tradePnl = Number((actualExit - actualEntryPrice).toFixed(1));
          exitType = "TP";
          break;
        }

        // 2.3. Nếu không chết SL/TP, mới cập nhật đỉnh và dời Trailing Stop cho phút sau
        if (mb.high > peakPrice) peakPrice = mb.high;
        const maxProfit = peakPrice - actualEntryPrice;

        if (maxProfit >= TRAIL_TRIGGER) {
          const newSl = Number((peakPrice - TRAIL_DIST).toFixed(1));
          if (newSl > currentSl) currentSl = newSl;
        } else if (maxProfit >= BE_TRIGGER) {
          const beSl = Number((actualEntryPrice + 0.5).toFixed(1));
          if (beSl > currentSl) currentSl = beSl;
        }
      } else {
        // Chiều SHORT
        // 2.1. Kiểm tra chạm SL / Trailing Stop hiện hành trước
        if (mb.high >= currentSl) {
          isClosed = true;
          // Xử lý Gap-up trượt giá trên mức SL
          const actualExit = mb.open > currentSl ? mb.open : currentSl;
          exitPrice = actualExit;
          exitMinute = timeStr;
          tradePnl = Number((actualEntryPrice - actualExit).toFixed(1));
          exitType = actualExit < actualEntryPrice - 0.5 ? "TRAIL" : (actualExit <= actualEntryPrice + 0.1 ? "BE" : "SL");
          break;
        }

        // 2.2. Kiểm tra TP (nếu có)
        if (effectiveTp > 0 && mb.low <= effectiveTp) {
          isClosed = true;
          const actualExit = mb.open < effectiveTp ? mb.open : effectiveTp;
          exitPrice = actualExit;
          exitMinute = timeStr;
          tradePnl = Number((actualEntryPrice - actualExit).toFixed(1));
          exitType = "TP";
          break;
        }

        // 2.3. Cập nhật đáy và dời Trailing Stop cho phút sau
        if (mb.low < peakPrice) peakPrice = mb.low;
        const maxProfit = actualEntryPrice - peakPrice;

        if (maxProfit >= TRAIL_TRIGGER) {
          const newSl = Number((peakPrice + TRAIL_DIST).toFixed(1));
          if (newSl < currentSl) currentSl = newSl;
        } else if (maxProfit >= BE_TRIGGER) {
          const beSl = Number((actualEntryPrice - 0.5).toFixed(1));
          if (beSl < currentSl) currentSl = beSl;
        }
      }
    }
  }

  // 3. Nếu đến cuối phiên (14:45) chưa chạm SL/Trailing -> Đóng vị thế theo giá ATC
  if (isFilled && !isClosed) {
    const lastBar = mBars[mBars.length - 1];
    exitType = "ATC";
    exitPrice = lastBar.close;
    exitMinute = "14:45";
    tradePnl = side === "LONG"
      ? Number((lastBar.close - actualEntryPrice).toFixed(1))
      : Number((actualEntryPrice - lastBar.close).toFixed(1));
  }

  return {
    date: day.date,
    side,
    entryPrice,
    slPrice,
    tpPrice,
    exitPrice,
    exitType,
    exitMinute,
    pnl: tradePnl,
    isWin: tradePnl > 0,
    cumulativePnl: 0,
  };
}

// 4. Hàm Main chạy kiểm định chuẩn duy nhất
async function main() {
  console.log("==========================================================================================");
  console.log("   HỆ THỐNG ĐỊNH LƯỢNG VN30F1M: 1 KÈO DUY NHẤT / NGÀY (100.746 NẾN 1 PHÚT 2025-2026)      ");
  console.log("==========================================================================================\n");

  const dailyBars = load1mDataset();
  console.log(`Số phiên giao dịch: ${dailyBars.length} phiên (02/01/2025 - 11/09/2026).`);
  console.log(`Mỗi phiên được kiểm tra độc lập trên các nến 1 phút thực tế.\n`);

  const results: TradeResult[] = [];
  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let currentEquity = 0;
  let tradedCount = 0;
  const monthlyPnl: Record<string, number> = {};

  for (let i = 5; i < dailyBars.length; i++) {
    const pastDays = dailyBars.slice(0, i);
    const plan = generateCanonicalPlan(dailyBars[i].date, pastDays);
    const res = replaySingleDay(dailyBars[i], plan);

    const m = res.date.slice(0, 7);
    if (!monthlyPnl[m]) monthlyPnl[m] = 0;

    if (res.exitType !== "NO_FILL") {
      tradedCount++;
      totalPnl += res.pnl;
      monthlyPnl[m] += res.pnl;

      if (res.pnl > 0) {
        wins++;
        grossProfit += res.pnl;
      } else if (res.pnl < 0) {
        losses++;
        grossLoss += Math.abs(res.pnl);
      }

      currentEquity += res.pnl;
      if (currentEquity > peak) peak = currentEquity;
      const dd = currentEquity - peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    res.cumulativePnl = Number(currentEquity.toFixed(1));
    results.push(res);
  }

  const winRate = Number(((wins / tradedCount) * 100).toFixed(1));
  const profitFactor = Number((grossProfit / grossLoss).toFixed(2));

  console.log("----------------------------------------------------------------------------------");
  console.log("| Chỉ số Hiệu năng                               | Kết quả Thực tế               |");
  console.log("----------------------------------------------------------------------------------");
  console.log(`| Tổng phiên khảo sát                            | ${String(dailyBars.length - 5).padStart(29, " ")} |`);
  console.log(`| Số phiên có lệnh khớp                          | ${String(tradedCount).padStart(29, " ")} |`);
  console.log(`| Số phiên THẮNG                                 | ${String(wins).padStart(29, " ")} |`);
  console.log(`| Số phiên THUA                                  | ${String(losses).padStart(29, " ")} |`);
  console.log(`| Tỷ lệ Thắng (Win Rate)                         | ${(winRate + "%").padStart(29, " ")} |`);
  console.log(`| Tổng PnL Thực tế (Điểm)                        | ${("+" + totalPnl.toFixed(1) + "đ").padStart(29, " ")} |`);
  console.log(`| Sụt giảm vốn tối đa (Max Drawdown)             | ${(maxDrawdown.toFixed(1) + "đ").padStart(29, " ")} |`);
  console.log(`| Hệ số Lợi nhuận (Profit Factor)                | ${String(profitFactor).padStart(29, " ")} |`);
  console.log("----------------------------------------------------------------------------------\n");

  console.log("CHI TIẾT PNL TỪNG THÁNG CỦA KÈO DUY NHẤT (2025 - 09/2026):");
  console.log("----------------------------------------------------------------------------------");
  for (const [month, pnl] of Object.entries(monthlyPnl)) {
    console.log(`| Tháng ${month}                              | ${(pnl > 0 ? "+" + pnl.toFixed(1) : pnl.toFixed(1)) + "đ"}`.padEnd(81, " ") + "|");
  }
  console.log("----------------------------------------------------------------------------------\n");

  // 4. LÊN KÈO THỰC CHIẾN CHO PHIÊN TIẾP THEO: THỨ HAI 14/09/2026
  const lastSession = dailyBars[dailyBars.length - 1];
  const planNextDay = generateCanonicalPlan("2026-09-14", dailyBars);
  console.log("==========================================================================================");
  console.log("  KÈO THỰC TẾ SẴN SÀNG CHO PHIÊN GIAO DỊCH TIẾP THEO: THỨ HAI 14/09/2026                 ");
  console.log("==========================================================================================");
  console.log(`- Ngày giao dịch        : 14/09/2026 (Phiên đầu tuần)`);
  console.log(`- Phiên gần nhất chốt   : ${lastSession.date} (Giá đóng cửa RefPrice: ${lastSession.close.toFixed(1)})`);
  console.log(`- Hướng khuyến nghị     : ${planNextDay.side}`);
  console.log(`- Loại lệnh             : Stop Order (${planNextDay.side === "LONG" ? "Stop Buy" : "Stop Sell"})`);
  const tpDelta = Math.abs(Number((planNextDay.tpPrice - planNextDay.entryPrice).toFixed(1)));
  const slDelta = Math.abs(Number((planNextDay.entryPrice - planNextDay.slPrice).toFixed(1)));
  console.log(`- Điểm kích hoạt Entry  : ${planNextDay.entryPrice.toFixed(1)}`);
  console.log(`- Mục tiêu sóng lớn (TP): ${planNextDay.tpPrice.toFixed(1)} (+${tpDelta}đ) kết hợp Trailing Stop ăn trọn sóng`);
  console.log(`- Cắt lỗ ban đầu (SL)   : ${planNextDay.slPrice.toFixed(1)} (-${slDelta}đ)`);
  console.log(`- Quản trị rủi ro       : Khóa hòa vốn khi lãi >= 6đ, Trailing Stop bám đỉnh khi lãi >= 12đ`);
  console.log(`- Cơ chế đóng vị thế    : 14:45 đóng lệnh theo giá ATC nếu chưa chạm Trailing/SL`);
  console.log(`- Hướng dẫn thực chiến  : Đặt trước 08:55 sáng trên app VPS / TCBS / SSI / DNSE...`);
  console.log("==========================================================================================\n");

  // Lưu báo cáo chuẩn hóa và toàn bộ lịch sử 413 phiên vào canonical_1plan_report.json
  const outPath = path.resolve(__dirname, "canonical_1plan_report.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        summary: {
          totalSessions: dailyBars.length - 5,
          tradedCount,
          wins,
          losses,
          winRate,
          profitFactor,
          totalPnl: Number(totalPnl.toFixed(1)),
          maxDrawdown: Number(maxDrawdown.toFixed(1)),
        },
        monthlyPnl,
        planNextDay,
        trades: results,
      },
      null,
      2
    )
  );
  console.log(`Đã lưu toàn bộ lịch sử ${results.length} phiên vào: ${outPath}`);
}

main().catch(console.error);
