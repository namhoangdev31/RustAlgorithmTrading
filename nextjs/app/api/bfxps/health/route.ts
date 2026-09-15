import { NextResponse } from "next/server";
import {
  getLatestMarketSnapshot,
  getDailyMarketMetrics,
  getIntradayBars,
  isSnapshotFallback,
  IntradayBar,
} from "@/lib/server/market/market-service";
import {
  generateMultiEnginePortfolio,
  getVietnamTradingDate,
  getVnDateString,
  getTradingSessionPhase,
  isWeekend,
} from "@/lib/server/quant/strategy-engine";
import { computeConsensus } from "@/lib/server/quant/consensus";
import {
  saveDailyPlanToDb,
  getTradingHistoryFromDb,
  getTodayRecalibratedPlan,
  getLockedContext,
  saveLockedContext,
  isCanonicalSettlementDone,
  settleDailyPlanAtEod,
  TradeSettlementResult,
} from "@/lib/server/quant/db-plan-service";
import {
  replayExecutionCached,
  isAtcBar,
  M1Tick,
} from "@/lib/server/quant/execution-tracker";
import {
  ExecutionState,
  MarketSnapshot,
  TradingPlan,
  TradingSessionPhase,
} from "@/lib/server/quant/types";

export const dynamic = "force-dynamic";

const SNAPSHOT_STALE_MS = 30_000; // snapshot cũ hơn 30s => AMBER

/** Map trạng thái execution -> exitType dùng cho EOD settlement */
function mapExitType(status: ExecutionState["status"]): TradeSettlementResult["exitType"] {
  switch (status) {
    case "TP_EXIT":
      return "TP";
    case "EXIT_SL":
      return "SL";
    case "TRAIL_EXIT":
      return "TRAIL";
    case "BE_EXIT":
      return "BE";
    case "ATC_EXIT":
      return "ATC";
    default:
      return "NO_FILL";
  }
}

function snapshotAgeMs(snapshot: MarketSnapshot): number {
  const ts = Date.parse(snapshot.timestamp);
  if (!Number.isFinite(ts)) return Number.POSITIVE_INFINITY;
  return Date.now() - ts;
}

function toTick(bar: IntradayBar): M1Tick {
  return { time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
}

export async function GET() {
  try {
    const [liveSnapshot, metrics, bars] = await Promise.all([
      getLatestMarketSnapshot(),
      getDailyMarketMetrics(),
      getIntradayBars(),
    ]);

    const now = new Date();
    const todayStr = getVietnamTradingDate(now); // ngày kèo (cuộn T7/CN -> Thứ 2)
    const realDateVn = getVnDateString(now); // ngày lịch thực tế tại VN
    const isTradingDay = !isWeekend(realDateVn);
    const phase: TradingSessionPhase = getTradingSessionPhase(now);
    const inOfficialWindow = phase !== "PRE_ATO" && phase !== "ATO_OBSERVATION";

    // ---- Khóa ngữ cảnh kèo lúc 09:15 (DB = nguồn sự thật, an toàn trên serverless) ----
    // Trước 09:15: chỉ là kèo quan sát, không khóa, không lưu.
    // Từ 09:15: đóng băng snapshot lần đầu; mọi poll sau đọc lại -> hướng KHÔNG lật.
    let decisionSnapshot: MarketSnapshot = liveSnapshot;
    let isOfficial = false;
    let lockFailed = false;

    if (isTradingDay && inOfficialWindow) {
      try {
        const locked =
          (await getLockedContext(todayStr)) ??
          (await saveLockedContext(todayStr, liveSnapshot));
        if (locked) {
          decisionSnapshot = locked;
          isOfficial = true;
        } else {
          lockFailed = true;
        }
      } catch (lockErr: any) {
        // Mất nguồn sự thật => degraded, KHÔNG được coi là kèo chính thức
        lockFailed = true;
        console.warn("[health] Khóa ngữ cảnh ATO thất bại:", lockErr?.message);
      }
    }

    // ---- Sinh tổ hợp 3 engine từ ngữ cảnh đã quyết định ----
    const plans = generateMultiEnginePortfolio(todayStr, decisionSnapshot, metrics, {
      isOfficial,
      phase,
    });
    let consensus = computeConsensus(plans);

    // ---- Replay nến 1m thật qua execution state machine (có cache theo bar cuối) ----
    const ticks = bars.map(toTick);
    const plansWithExecution = plans.map((plan: TradingPlan) => ({
      ...plan,
      execution: replayExecutionCached(plan, ticks),
    }));

    // Kiểm tra xem hôm nay đã có Kèo Tái Lập Sau Stop Loss được kích hoạt trong CSDL chưa
    const recalibratedDb = await getTodayRecalibratedPlan(todayStr, "simcarrry6");
    if (recalibratedDb) {
      const simIdx = plansWithExecution.findIndex((p) => p.engine === "simcarrry6");
      if (simIdx >= 0) {
        const side = recalibratedDb.side as "LONG" | "SHORT";
        const entryPrice = Number(recalibratedDb.entryPrice.toString());
        const tpPrice = Number(recalibratedDb.tpPrice.toString());
        const slPrice = Number(recalibratedDb.slPrice.toString());
        // QUY TẮC: Kèo tái lập sinh ra trong phiên -> CHỈ replay các nến từ thời điểm tạo trở đi!
        // Tuyệt đối không replay từ 09:00:00 gây khớp lệnh hồi tố và chốt lời giả tạo trong quá khứ!
        const createdDate = recalibratedDb.createdAt ? new Date(recalibratedDb.createdAt) : null;
        const createdTimeStr = createdDate
          ? createdDate.toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" })
          : "13:00:00";
        const relevantTicks = ticks.filter((t) => t.time >= createdTimeStr);
        const exec = relevantTicks.length > 0
          ? replayExecutionCached(
              {
                ...plansWithExecution[simIdx],
                side,
                entryPrice,
                tpPrice,
                slPrice,
              },
              relevantTicks
            )
          : {
              planId: plansWithExecution[simIdx].id,
              isFilled: false,
              fillStages: 0,
              filledSize: 0,
              avgEntryPrice: 0,
              livePnlPoints: 0,
              status: "WAIT_ENTRY" as const,
              settled: false,
            };

        const notesStr = recalibratedDb.notes || "";
        const isSweep = notesStr.includes("Quét thanh khoản") || notesStr.includes("Rút chân");
        const resolvedSource = isSweep
          ? (side === "LONG" ? "SESSION_OPTIMAL_SWEEP_RE_LONG" : "SESSION_OPTIMAL_SWEEP_RE_SHORT")
          : (side === "LONG" ? "LATEST_SHORT_CUTLOSS_REVERSAL" : "LATEST_LONG_CUTLOSS_REVERSAL");

        const cleanNotes = (recalibratedDb.notes || "")
          .replace(/(\s*\|\s*Đang giữ vị thế.*$)+/g, "")
          .replace(/(\s*\|\s*Tự động.*$)+/g, "")
          .trim();

        plansWithExecution[simIdx] = {
          ...plansWithExecution[simIdx],
          profile: "RECALIBRATED_AFTER_SL",
          side,
          entryPrice,
          tpPrice,
          slPrice,
          resolvedSource,
          reason: cleanNotes || `[Tối ưu toàn phiên] Kèo tối ưu toàn phiên: ${side} @ ${entryPrice.toFixed(1)}, TP ${tpPrice.toFixed(1)}, SL ${slPrice.toFixed(1)}`,
          execution: exec,
        };

        // Đồng bộ consensus mới nhất theo kế hoạch đã tối ưu
        consensus = computeConsensus(plansWithExecution);
      }
    }

    const primaryPlan =
      plansWithExecution.find((p) => p.engine === "simcarrry6") ||
      plansWithExecution.find((p) => p.isCanonical) ||
      plansWithExecution[0];

    // ---- Lưu kèo chính thức (chỉ khi đã khóa thành công, đúng ngày giao dịch) ----
    if (isTradingDay && isOfficial && primaryPlan) {
      try {
        await saveDailyPlanToDb(primaryPlan);
      } catch (dbErr: any) {
        console.warn("[health] DB save plan warning:", dbErr?.message);
      }
    }

    // ---- Tự động chốt phiên EOD (idempotent, guard theo settledAt) ----
    let settlementInfo: { settled: boolean; exitType?: string; error?: string } = {
      settled: false,
    };
    if (isTradingDay && phase === "CLOSED" && isOfficial && primaryPlan && bars.length > 0) {
      try {
        const alreadyDone = await isCanonicalSettlementDone(todayStr, primaryPlan.engine);
        if (!alreadyDone) {
          const exec = primaryPlan.execution!;
          const exitType = mapExitType(exec.status);
          const result: TradeSettlementResult = {
            date: todayStr,
            engine: primaryPlan.engine,
            side: primaryPlan.side,
            entryPrice: primaryPlan.entryPrice,
            exitPrice: exec.exitPrice ?? primaryPlan.entryPrice,
            exitType,
            exitMinute: exec.exitTime?.slice(0, 5) || "14:45",
            pnl: Number((exec.isFilled ? exec.livePnlPoints : 0).toFixed(1)),
            isWin: exec.isFilled ? exec.livePnlPoints > 0 : false,
            tpPrice: primaryPlan.tpPrice,
            slPrice: primaryPlan.slPrice,
            notes:
              exitType === "NO_FILL"
                ? `Kèo ${todayStr} không khớp lệnh trong phiên -> NO_FILL.`
                : `Tự động chốt phiên ${todayStr}: thoát ${exitType} lúc ${exec.exitTime || "14:45"
                }, PnL ${exec.livePnlPoints > 0 ? "+" : ""}${exec.livePnlPoints}đ.`,
          };
          await settleDailyPlanAtEod(result);
          settlementInfo = { settled: true, exitType };
        }
      } catch (settleErr: any) {
        console.warn("[health] Auto-settlement thất bại:", settleErr?.message);
        settlementInfo = { settled: false, error: settleErr?.message };
      }
    }

    // ---- Freshness thật: KHÔNG bao giờ GREEN khi dùng dữ liệu dự phòng ----
    const snapshotFallback = isSnapshotFallback(liveSnapshot);
    const stale = snapshotAgeMs(liveSnapshot) > SNAPSHOT_STALE_MS;
    let level: "GREEN" | "AMBER" | "RED" = "GREEN";
    let status = "FRESH";
    let reason = "Dữ liệu trực tiếp từ sàn, kèo đã khóa chính thức.";

    if (snapshotFallback || lockFailed) {
      level = "RED";
      status = "STALE";
      reason = snapshotFallback
        ? "Snapshot dùng giá trị dự phòng (mất kết nối sàn) — số liệu có thể sai lệch."
        : "Không khóa được ngữ cảnh ATO (DB lỗi) — kèo chỉ ở mức quan sát, chưa chính thức.";
    } else if (metrics.isFallback) {
      level = "AMBER";
      status = "DEGRADED";
      reason = "Chỉ số ngày (Ref/ATR/EMA) dùng dữ liệu dự phòng — kèo có thể lệch tham chiếu.";
    } else if (stale) {
      level = "AMBER";
      status = "DELAYED";
      reason = `Snapshot trễ ${Math.round(snapshotAgeMs(liveSnapshot) / 1000)}s so với hiện tại.`;
    } else if (!isTradingDay || !inOfficialWindow) {
      level = "AMBER";
      status = "PRE_OPEN";
      reason = !isTradingDay
        ? "Ngoài ngày giao dịch (cuối tuần) — kèo chỉ mang tính quan sát."
        : "Trước 09:15 — đang quan sát phiên ATO, kèo chưa chính thức.";
    } else if (!bars.length) {
      level = "AMBER";
      status = "NO_BARS";
      reason = "Chưa có nến 1m của phiên hôm nay — trạng thái khớp lệnh chưa xác định.";
    }

    let historySummary = null;
    try {
      const history = await getTradingHistoryFromDb();
      if (history) historySummary = history.summary;
    } catch (histErr: any) {
      console.warn("[health] Đọc lịch sử kèo thất bại:", histErr?.message);
    }

    return NextResponse.json(
      {
        ok: true,
        service: "Lepos Trading Bot Advisor",
        version: "10.4.0",
        live_market: liveSnapshot,
        metrics,
        phase,
        is_trading_day: isTradingDay,
        is_official: isOfficial,
        intraday_bars: bars.length,
        last_atc_bar: isAtcBar(bars[bars.length - 1]?.time ?? "") || undefined,
        settlement: settlementInfo,
        freshness: {
          level,
          status,
          reason,
          reference_date: todayStr,
        },
        plans: plansWithExecution,
        consensus,
        summary: historySummary,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi kiểm tra hệ thống" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
