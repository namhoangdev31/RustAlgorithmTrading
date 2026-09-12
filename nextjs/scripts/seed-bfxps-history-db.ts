import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/server/prisma";
import { Prisma } from "../prisma/generated/client";

async function main() {
  console.log("==========================================================================");
  console.log("  ĐỒNG BỘ LỊCH SỬ KIỂM ĐỊNH BFXPS (413 PHIÊN 2025-2026) VÀO DATABASE       ");
  console.log("==========================================================================");

  const reportPath = path.resolve(__dirname, "canonical_1plan_report.json");
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Không tìm thấy tệp: ${reportPath}. Hãy chạy run-canonical-1plan-backtest.ts trước.`);
  }

  const data = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  const trades = data.trades || [];
  console.log(`Đang nạp ${trades.length} phiên vào DB...`);

  let syncedPlans = 0;
  let syncedLedgers = 0;

  for (const t of trades) {
    const planDate = new Date(`${t.date}T00:00:00.000Z`);
    const status =
      t.exitType === "NO_FILL"
        ? "NO_FILL"
        : t.isWin
        ? "FILLED_TP"
        : t.exitType === "ATC"
        ? "FILLED_ATC"
        : "FILLED_SL";

    const pnlStatus =
      t.exitType === "NO_FILL"
        ? "NO_FILL"
        : t.isWin
        ? "WIN"
        : "LOSS";

    const notes = `Phiên ${t.date}: ${t.side} Entry ${t.entryPrice}, Thoát ${t.exitType} (${t.exitMinute || "14:45"}), PnL: ${t.pnl > 0 ? "+" + t.pnl : t.pnl}đ`;

    // 1. Upsert BfxpsTradingPlan
    await prisma.bfxpsTradingPlan.upsert({
      where: {
        date_engine: {
          date: planDate,
          engine: "CanonicalDirectionalBreakout",
        },
      },
      update: {
        side: t.side,
        entryPrice: new Prisma.Decimal(t.entryPrice),
        tpPrice: new Prisma.Decimal(t.tpPrice),
        slPrice: new Prisma.Decimal(t.slPrice),
        exitPrice: new Prisma.Decimal(t.exitPrice),
        exitType: t.exitType,
        exitMinute: t.exitMinute,
        pnlPoints: new Prisma.Decimal(t.pnl),
        isWin: t.isWin,
        status,
        notes,
        settledAt: new Date(`${t.date}T15:00:00.000Z`),
      },
      create: {
        date: planDate,
        engine: "CanonicalDirectionalBreakout",
        profile: "M1_INTRADAY",
        horizon: "INTRADAY",
        side: t.side,
        entryPrice: new Prisma.Decimal(t.entryPrice),
        tpPrice: new Prisma.Decimal(t.tpPrice),
        slPrice: new Prisma.Decimal(t.slPrice),
        exitPrice: new Prisma.Decimal(t.exitPrice),
        exitType: t.exitType,
        exitMinute: t.exitMinute,
        pnlPoints: new Prisma.Decimal(t.pnl),
        isWin: t.isWin,
        maxCap: new Prisma.Decimal(0.3),
        status,
        isCanonical: true,
        notes,
        settledAt: new Date(`${t.date}T15:00:00.000Z`),
      },
    });
    syncedPlans++;

    // 2. Upsert BfxpsLiveLedger
    await prisma.bfxpsLiveLedger.upsert({
      where: {
        date_engine: {
          date: planDate,
          engine: "CanonicalDirectionalBreakout",
        },
      },
      update: {
        side: t.side,
        avgEntry: new Prisma.Decimal(t.entryPrice),
        exitPrice: new Prisma.Decimal(t.exitPrice),
        exitType: t.exitType,
        pnlPoints: new Prisma.Decimal(t.pnl),
        pnlStatus,
        isSettled: true,
        notes,
      },
      create: {
        date: planDate,
        engine: "CanonicalDirectionalBreakout",
        side: t.side,
        avgEntry: new Prisma.Decimal(t.entryPrice),
        exitPrice: new Prisma.Decimal(t.exitPrice),
        exitType: t.exitType,
        pnlPoints: new Prisma.Decimal(t.pnl),
        pnlStatus,
        size: new Prisma.Decimal(0.3),
        isSettled: true,
        notes,
      },
    });
    syncedLedgers++;
  }

  // 3. Cũng lưu kèo tương lai cho ngày 14/09/2026 vào DB
  if (data.planNextDay) {
    const np = data.planNextDay;
    const planDate = new Date(`${np.date}T00:00:00.000Z`);
    await prisma.bfxpsTradingPlan.upsert({
      where: {
        date_engine: {
          date: planDate,
          engine: "CanonicalDirectionalBreakout",
        },
      },
      update: {
        side: np.side,
        entryPrice: new Prisma.Decimal(np.entryPrice),
        tpPrice: new Prisma.Decimal(np.tpPrice),
        slPrice: new Prisma.Decimal(np.slPrice),
        status: "PENDING",
        r5State: "PRE_OPEN",
        isCanonical: true,
        notes: np.reason,
      },
      create: {
        date: planDate,
        engine: "CanonicalDirectionalBreakout",
        profile: "M1_INTRADAY",
        horizon: "INTRADAY",
        side: np.side,
        entryPrice: new Prisma.Decimal(np.entryPrice),
        tpPrice: new Prisma.Decimal(np.tpPrice),
        slPrice: new Prisma.Decimal(np.slPrice),
        maxCap: new Prisma.Decimal(0.3),
        r5State: "PRE_OPEN",
        status: "PENDING",
        isCanonical: true,
        notes: np.reason,
      },
    });
    console.log(`Đã lưu kèo phiên tiếp theo (${np.date}): ${np.side} Stop ${np.entryPrice} vào DB!`);
  }

  console.log(`ĐỒNG BỘ THÀNH CÔNG:`);
  console.log(`- BfxpsTradingPlan: ${syncedPlans} phiên`);
  console.log(`- BfxpsLiveLedger: ${syncedLedgers} bản ghi`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
