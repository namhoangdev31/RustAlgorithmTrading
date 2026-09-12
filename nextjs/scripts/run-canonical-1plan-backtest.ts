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
  exitType: "TP" | "SL" | "ATC" | "NO_FILL";
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

  // Bộ đệm bứt phá: 0.20 * ATR5
  const delta = Number((0.20 * atr5).toFixed(1));

  const entryPrice = side === "LONG"
    ? Number((refPrice + delta).toFixed(1))
    : Number((refPrice - delta).toFixed(1));

  // Chốt lời +16.0 điểm, Cắt lỗ -8.0 điểm (Risk:Reward = 1:2)
  const tpPrice = side === "LONG"
    ? Number((entryPrice + 16.0).toFixed(1))
    : Number((entryPrice - 16.0).toFixed(1));

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
    reason: `Kèo duy nhất theo xu hướng EMA5 ${isBull ? ">= EMA10 (Long Stop)" : "< EMA10 (Short Stop)"}`,
  };
}

// 3. Chạy Replay từng phút một (Streaming Simulation)
export function replaySingleDay(day: DailyBar, plan: CanonicalPlan): TradeResult {
  const mBars = day.bars1m;
  const { side, entryPrice, slPrice, tpPrice } = plan;

  let isFilled = false;
  let isClosed = false;
  let tradePnl = 0;
  let exitType: "TP" | "SL" | "ATC" | "NO_FILL" = "NO_FILL";
  let exitPrice = 0;
  let exitMinute = "";

  for (let m = 15; m < mBars.length; m++) {
    const mb = mBars[m];
    const timeStr = new Date((mb.time + 7 * 3600) * 1000).toISOString().slice(11, 16);

    // Kiểm tra khớp lệnh Stop Breakout
    if (!isFilled) {
      if (side === "LONG" && mb.high >= entryPrice) {
        isFilled = true;
      } else if (side === "SHORT" && mb.low <= entryPrice) {
        isFilled = true;
      }
    }

    // Nếu đã khớp lệnh: Kiểm tra SL trước ở từng phút
    if (isFilled && !isClosed) {
      if (side === "LONG") {
        if (mb.low <= slPrice) {
          isClosed = true;
          exitType = "SL";
          exitPrice = slPrice;
          exitMinute = timeStr;
          tradePnl = Number((slPrice - entryPrice).toFixed(1));
          break;
        } else if (mb.high >= tpPrice) {
          isClosed = true;
          exitType = "TP";
          exitPrice = tpPrice;
          exitMinute = timeStr;
          tradePnl = Number((tpPrice - entryPrice).toFixed(1));
          break;
        }
      } else {
        if (mb.high >= slPrice) {
          isClosed = true;
          exitType = "SL";
          exitPrice = slPrice;
          exitMinute = timeStr;
          tradePnl = Number((entryPrice - slPrice).toFixed(1));
          break;
        } else if (mb.low <= tpPrice) {
          isClosed = true;
          exitType = "TP";
          exitPrice = tpPrice;
          exitMinute = timeStr;
          tradePnl = Number((entryPrice - tpPrice).toFixed(1));
          break;
        }
      }
    }
  }

  // Nếu đến cuối phiên (14:45) chưa chạm SL/TP -> Đóng ATC
  if (isFilled && !isClosed) {
    const lastBar = mBars[mBars.length - 1];
    exitType = "ATC";
    exitPrice = lastBar.close;
    exitMinute = "14:45";
    tradePnl = side === "LONG"
      ? Number((lastBar.close - entryPrice).toFixed(1))
      : Number((entryPrice - lastBar.close).toFixed(1));
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
  console.log(`- Điểm kích hoạt Entry  : ${planNextDay.entryPrice.toFixed(1)}`);
  console.log(`- Chốt lời (TP)         : ${planNextDay.tpPrice.toFixed(1)} (+16.0 điểm)`);
  console.log(`- Cắt lỗ (SL)           : ${planNextDay.slPrice.toFixed(1)} (-8.0 điểm)`);
  console.log(`- Tỷ lệ R:R             : 1:2`);
  console.log(`- Cơ chế đóng vị thế    : 14:45 đóng lệnh theo giá ATC nếu chưa chạm TP hoặc SL`);
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
