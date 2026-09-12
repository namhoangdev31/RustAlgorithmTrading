import {
  generateSimCarry6Plan,
  generateAllDaysLadderPlan,
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

  console.log("🎉 TẤT CẢ TEST QUANT ĐỀU VƯỢT QUA XUẤT SẮC!");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
