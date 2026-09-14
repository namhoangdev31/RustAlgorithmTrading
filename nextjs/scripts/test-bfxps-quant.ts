import {
  generateSimCarry6Plan,
  generateAllDaysLadderPlan,
  generateCanonicalQuantPlan,
} from "../lib/server/quant/strategy-engine";
import { evaluateR5, evaluateV44 } from "../lib/server/quant/risk-governors";
import { computeConsensus } from "../lib/server/quant/consensus";
import { IntradayExecutionTracker } from "../lib/server/quant/execution-tracker";
import { MarketSnapshot } from "../lib/server/quant/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTests() {
  console.log("--- Bắt đầu kiểm thử BFXPS Quant Core ---");

  const snapshot: MarketSnapshot = {
    open: 1962.0,
    high: 1988.5,
    low: 1957.0,
    current: 1975.5,
    volume: 225642,
    oi: 32216,
    basis: -1.32,
    timestamp: new Date().toISOString(),
    source: "DNSE_TEST",
  };

  // Test 1: simcarrry6 t+1
  const simCarryPlan = generateSimCarry6Plan(
    "2026-09-10",
    snapshot,
    1961.9,
    15.0,
    1944.9,
    1988.0,
    1945.0,
    1944.9
  );
  assert(simCarryPlan.side === "LONG", "simcarry6 định hướng LONG khi giá mạnh hơn Ref");
  assert(simCarryPlan.tpPrice === Number((simCarryPlan.entryPrice + 22.0).toFixed(1)), "simcarry6 TP đúng +22.0 điểm");
  assert(simCarryPlan.slPrice === 1944.9, "simcarry6 SL đúng 1944.9");

  // Test 2: AllDaysLadder_CAP0.3
  const ladderPlan = generateAllDaysLadderPlan(
    "2026-09-10",
    snapshot,
    1961.9,
    1944.9
  );
  assert(ladderPlan.maxCap === 0.3, "AllDaysLadder khống chế vị thế tối đa 30% NAV");
  assert(ladderPlan.tpPrice === Number((ladderPlan.entryPrice + 4.1).toFixed(1)), "AllDaysLadder TP scalp đúng +4.1 điểm");

  // Test 3: R5 Filter
  const r5Keep = evaluateR5("LONG", 1962.0, 1961.9, 1944.9);
  assert(r5Keep.action === "KEEP", "R5 đánh giá KEEP khi mở cửa bình thường");

  const r5Cancel = evaluateR5("LONG", 1950.0, 1961.9, 1944.9);
  assert(r5Cancel.action === "CANCEL", "R5 đánh giá CANCEL khi mở cửa Gap down sâu");

  // Test 4: V44 Rule
  const v44Normal = evaluateV44("LONG", 1961.9, 1975.0, 1950.0);
  assert(!v44Normal.isV44Active, "V44 không kích hoạt khi Expected-High > Ref");

  const v44Blocked = evaluateV44("LONG", 1961.9, 1960.0, 1950.0);
  assert(v44Blocked.isV44Active, "V44 kích hoạt chặn LONG khi Expected-High < Ref");

  // Test 5: Consensus Gate
  const consensus = computeConsensus([simCarryPlan, ladderPlan]);
  assert(consensus.direction === "LONG", "Consensus đồng thuận LONG 100%");
  assert(consensus.strength === 1.0, "Consensus strength đạt 1.0");

  // Test 6: Intraday Execution Tracker
  const tracker = new IntradayExecutionTracker(ladderPlan);
  assert(!tracker.getState().isFilled, "Trạng thái ban đầu là WAIT_ENTRY");

  // Giá nhúng xuống chạm Entry
  tracker.updateTick({ time: "09:15:00", open: 1962.0, high: 1963.0, low: 1961.5, close: 1961.9 });
  assert(tracker.getState().isFilled, "Lệnh đã được khớp (FILLED)");
  assert(tracker.getState().filledSize === 0.1, "Khớp nấc 1 với size 0.1");

  // Test 7: Canonical Quant Plan (Tối ưu hóa delta 0.10 * ATR và sóng mở rộng 24.0đ)
  const canonicalLong = generateCanonicalQuantPlan(
    "2026-09-10",
    1961.9,
    18.5,
    1965.0,
    1960.0,
    undefined,
    snapshot
  );
  assert(canonicalLong.side === "LONG", "Canonical phát lệnh LONG khi EMA5 >= EMA10");
  const expectedDeltaLong = Number((0.10 * 18.5).toFixed(1));
  assert(canonicalLong.entryPrice === Number((1961.9 + expectedDeltaLong).toFixed(1)), "Canonical entry price tính đúng 0.10 * ATR5");
  assert(canonicalLong.tpPrice === Number((canonicalLong.entryPrice + 24.0).toFixed(1)), "Canonical TP sóng lớn mặc định +24.0 điểm");
  assert(canonicalLong.slPrice === Number((canonicalLong.entryPrice - 8.0).toFixed(1)), "Canonical SL mặc định -8.0 điểm");
  assert(canonicalLong.r5State === "KEEP", "Canonical đánh giá R5 động từ snapshot là KEEP");
  assert(canonicalLong.trailingConfig?.enabled === true, "Canonical bật mặc định Trailing Stop & BE Lock");

  // Test 8: Canonical Quant Plan theo chiều SHORT khi EMA5 < EMA10
  const canonicalShort = generateCanonicalQuantPlan(
    "2026-09-10",
    1961.9,
    18.5,
    1955.0,
    1960.0
  );
  const expectedDeltaShort = Number((0.10 * 18.5).toFixed(1));
  assert(canonicalShort.side === "SHORT", "Canonical phát lệnh SHORT khi EMA5 < EMA10");
  assert(canonicalShort.entryPrice === Number((1961.9 - expectedDeltaShort).toFixed(1)), "Canonical short entry price tính đúng Ref - 0.10 * ATR5");
  assert(canonicalShort.tpPrice === Number((canonicalShort.entryPrice - 24.0).toFixed(1)), "Canonical short TP đúng -24.0 điểm");
  assert(canonicalShort.slPrice === Number((canonicalShort.entryPrice + 8.0).toFixed(1)), "Canonical short SL đúng +8.0 điểm");

  // Test 9: Quant Strategy Config Tùy biến (Custom R:R & ATR Multiplier)
  const customCanonical = generateCanonicalQuantPlan(
    "2026-09-10",
    1961.9,
    20.0,
    1970.0,
    1960.0,
    { atrEntryMultiplier: 0.25, tpPoints: 12.0, slPoints: 6.0, maxCap: 0.8 }
  );
  assert(customCanonical.entryPrice === Number((1961.9 + 0.25 * 20.0).toFixed(1)), "Custom entry price theo multiplier 0.25");
  assert(customCanonical.tpPrice === Number((customCanonical.entryPrice + 12.0).toFixed(1)), "Custom TP đúng 12.0 điểm");
  assert(customCanonical.slPrice === Number((customCanonical.entryPrice - 6.0).toFixed(1)), "Custom SL đúng 6.0 điểm");
  assert(customCanonical.maxCap === 0.8, "Custom maxCap đúng 0.8");

  // Test 10: AllDaysLadder Tự động nhận diện SHORT hoặc nhận cấu hình
  const ladderShort = generateAllDaysLadderPlan(
    "2026-09-10",
    { ...snapshot, open: 1950.0, current: 1950.0 },
    1961.9,
    1970.0
  );
  assert(ladderShort.side === "SHORT", "AllDaysLadder tự động phát hiện xu hướng SHORT khi giá dưới Ref");
  assert(ladderShort.tpPrice === Number((ladderShort.entryPrice - 4.1).toFixed(1)), "AllDaysLadder SHORT TP đúng -4.1 điểm");

  // Test 11: Trailing Stop & Khóa Lợi Nhuận trong IntradayExecutionTracker
  const trailingTracker = new IntradayExecutionTracker(canonicalLong);
  // Khớp lệnh Stop Buy
  trailingTracker.updateTick({ time: "09:30:00", open: canonicalLong.entryPrice, high: canonicalLong.entryPrice + 1.0, low: canonicalLong.entryPrice - 0.5, close: canonicalLong.entryPrice + 0.5 });
  assert(trailingTracker.getState().isFilled, "Trailing tracker đã khớp lệnh Breakout");

  // Giá chạy lên +15đ (vượt ngưỡng trailTrigger 12đ) -> đỉnh = entryPrice + 15, SL dời lên đỉnh - 5 = entryPrice + 10đ
  trailingTracker.updateTick({ time: "10:15:00", open: canonicalLong.entryPrice + 12.0, high: canonicalLong.entryPrice + 15.0, low: canonicalLong.entryPrice + 12.0, close: canonicalLong.entryPrice + 14.0 });
  assert(!trailingTracker.getState().settled, "Vị thế vẫn đang tiếp tục chạy sóng");

  // Giá giật lùi về chạm SL trailing (entryPrice + 10đ)
  trailingTracker.updateTick({ time: "10:45:00", open: canonicalLong.entryPrice + 12.0, high: canonicalLong.entryPrice + 12.0, low: canonicalLong.entryPrice + 9.5, close: canonicalLong.entryPrice + 9.8 });
  assert(trailingTracker.getState().settled, "Vị thế đã được chốt lời qua Trailing Stop");
  assert(trailingTracker.getState().status === "TRAIL_EXIT", "Trạng thái thoát lệnh là TRAIL_EXIT");
  assert(trailingTracker.getState().livePnlPoints >= 10.0, "Bảo toàn trọn vẹn lợi nhuận đỉnh sóng (+10.0đ)");

  // Test 12: Khớp lệnh trượt giá Gap (Slippage Entry & Risk Preservation)
  const gapTracker = new IntradayExecutionTracker(canonicalLong);
  // Nến mở cửa cao hơn 3.0 điểm so với giá Breakout cài đặt -> phải khớp tại giá Open (trượt 3 điểm)
  gapTracker.updateTick({
    time: "09:15:00",
    open: canonicalLong.entryPrice + 3.0,
    high: canonicalLong.entryPrice + 4.0,
    low: canonicalLong.entryPrice + 2.5,
    close: canonicalLong.entryPrice + 3.5,
  });
  assert(gapTracker.getState().avgEntryPrice === canonicalLong.entryPrice + 3.0, "Khớp lệnh trượt giá đúng bằng tick.open khi có gap up");

  // Test 13: Thoát SL khi có Gap Down (Exit Slippage) và Zero-Lookahead
  // Nến mở cửa rơi thủng SL (thấp hơn SL 2.0 điểm) -> phải cắt tại tick.open
  const actualSl = canonicalLong.slPrice;
  gapTracker.updateTick({
    time: "09:16:00",
    open: actualSl - 2.0,
    high: actualSl - 1.0,
    low: actualSl - 3.0,
    close: actualSl - 2.5,
  });
  assert(gapTracker.getState().settled, "Vị thế bị cắt lỗ do gap down thủng SL");
  assert(gapTracker.getState().exitPrice === actualSl - 2.0, "Cắt lỗ đúng giá tick.open khi bị gap down trượt qua SL");
  assert(gapTracker.getState().status === "EXIT_SL", "Trạng thái thoát lệnh đúng là EXIT_SL");

  // Test 14: Dynamic TP khi trung bình giá thay đổi (Laddering)
  const ladderDynamicTracker = new IntradayExecutionTracker(ladderPlan);
  // Khớp nấc 1
  ladderDynamicTracker.updateTick({
    time: "09:20:00",
    open: ladderPlan.entryPrice,
    high: ladderPlan.entryPrice + 0.5,
    low: ladderPlan.entryPrice,
    close: ladderPlan.entryPrice + 0.2,
  });
  // Giá nhúng xuống khớp nấc 2 (-1.0đ) và nấc 3 (-2.0đ)
  ladderDynamicTracker.updateTick({
    time: "09:25:00",
    open: ladderPlan.entryPrice - 0.5,
    high: ladderPlan.entryPrice - 0.2,
    low: ladderPlan.entryPrice - 2.5,
    close: ladderPlan.entryPrice - 1.5,
  });
  assert(ladderDynamicTracker.getState().fillStages === 3, "Đã khớp toàn bộ 3 nấc ladder");
  assert(ladderDynamicTracker.getState().avgEntryPrice < ladderPlan.entryPrice, "Giá vốn bình quân được hạ thấp sau khi rải nấc");

  console.log("🎉 TẤT CẢ TEST QUANT ĐỀU VƯỢT QUA XUẤT SẮC!");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
