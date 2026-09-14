import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSimCarry6Plan,
  generateAllDaysLadderPlan,
  generateCanonicalQuantPlan,
} from "../lib/server/quant/strategy-engine";
import { evaluateR5, evaluateV44 } from "../lib/server/quant/risk-governors";
import { computeConsensus } from "../lib/server/quant/consensus";
import { IntradayExecutionTracker } from "../lib/server/quant/execution-tracker";
import { MarketSnapshot } from "../lib/server/quant/types";

describe("BFXPS Quant Core Test Suite", () => {
  let snapshot: MarketSnapshot;

  beforeEach(() => {
    // Reset snapshot trước mỗi test case để đảm bảo tính cô lập (Isolation)
    snapshot = {
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
  });

  describe("1. Strategy Generators (Signal Engine)", () => {
    it("SimCarry6: Phát lệnh định hướng chuẩn xác", () => {
      const plan = generateSimCarry6Plan("2026-09-10", snapshot, 1961.9, 15.0, 1944.9, 1988.0);
      expect(plan.side).toBe("LONG");
      expect(plan.tpPrice).toBeCloseTo(plan.entryPrice + 22.0, 1);
      expect(plan.slPrice).toBe(1944.9);
      expect(plan.orderType).toBe("STOP");
    });

    it("AllDaysLadder: Khống chế NAV và tự động nhận diện SHORT", () => {
      // Ép giá current xuống thấp hơn Ref để test auto-short
      snapshot.current = 1950.0;
      const plan = generateAllDaysLadderPlan("2026-09-10", snapshot, 1961.9, 1970.0);
      
      expect(plan.side).toBe("SHORT");
      expect(plan.maxCap).toBe(0.3); // Tối đa 30%
      expect(plan.tpPrice).toBeCloseTo(plan.entryPrice - 4.1, 1);
      expect(plan.orderType).toBe("LIMIT"); // Scalp rải đinh dùng Limit
    });

    it("Canonical Quant: Zero-Lookahead & Cấu hình tùy biến", () => {
      const plan = generateCanonicalQuantPlan("2026-09-10", 1961.9, 20.0, 1970.0, 1960.0, {
        atrEntryMultiplier: 0.25,
        tpPoints: 12.0,
        slPoints: 6.0,
        maxCap: 0.8,
      }, snapshot);

      expect(plan.side).toBe("LONG"); // EMA5(1970) > EMA10(1960)
      expect(plan.entryPrice).toBeCloseTo(1961.9 + (0.25 * 20.0), 1);
      expect(plan.tpPrice).toBeCloseTo(plan.entryPrice + 12.0, 1);
      expect(plan.slPrice).toBeCloseTo(plan.entryPrice - 6.0, 1);
      expect(plan.maxCap).toBe(0.8);
    });
  });

  describe("2. Risk Governors & Consensus", () => {
    it("R5 & V44: Hoạt động đúng ranh giới", () => {
      expect(evaluateR5("LONG", 1962.0, 1961.9, 1944.9).action).toBe("KEEP");
      expect(evaluateR5("LONG", 1950.0, 1961.9, 1944.9).action).toBe("CANCEL"); // Gap down sâu
      
      expect(evaluateV44("LONG", 1961.9, 1975.0, 1950.0).isV44Active).toBe(false);
      expect(evaluateV44("LONG", 1961.9, 1960.0, 1950.0).isV44Active).toBe(true); // Exp-High < Ref
    });

    it("Consensus: Đồng thuận tuyệt đối", () => {
      const plan1 = generateSimCarry6Plan("2026-09-10", snapshot, 1961.9, 15.0, 1944.9);
      const plan2 = generateCanonicalQuantPlan("2026-09-10", 1961.9, 18.5, 1965.0, 1960.0);
      const consensus = computeConsensus([plan1, plan2]);
      
      expect(consensus.direction).toBe("LONG");
      expect(consensus.strength).toBe(1.0);
      expect(consensus.isUnanimous).toBe(true);
    });
  });

  describe("3. Execution State Machine (Core Engine)", () => {
    let tracker: IntradayExecutionTracker;
    let longPlan: any;
    let shortPlan: any;

    beforeEach(() => {
      // Default Long Plan
      longPlan = generateCanonicalQuantPlan("2026-09-10", 1960.0, 10.0, 1965.0, 1960.0); 
      // Entry = 1960 + 1 (vì ATR 10 * 0.1) = 1961.0. TP = 1985.0. SL = 1953.0.
      
      // Default Short Plan
      shortPlan = generateCanonicalQuantPlan("2026-09-10", 1960.0, 10.0, 1955.0, 1960.0);
      // Entry = 1960 - 1 = 1959.0. TP = 1935.0. SL = 1967.0.
    });

    it("Slippage: Khớp lệnh trượt giá Gap (LONG)", () => {
      tracker = new IntradayExecutionTracker(longPlan);
      // Entry cài đặt là 1961.0. Mở cửa nấc vọt lên 1964.0
      tracker.updateTick({ time: "09:00:00", open: 1964.0, high: 1965.0, low: 1963.0, close: 1964.5 });
      
      expect(tracker.getState().isFilled).toBe(true);
      expect(tracker.getState().avgEntryPrice).toBe(1964.0); // Bắt buộc khớp giá Open
    });

    it("Slippage: Cắt lỗ trượt giá Gap (SHORT)", () => {
      tracker = new IntradayExecutionTracker(shortPlan);
      tracker.updateTick({ time: "09:00:00", open: 1959.0, high: 1959.0, low: 1958.0, close: 1958.5 }); // Khớp chuẩn
      
      // SL cài là 1967.0. Nến sau mở cửa gap up 1969.0
      tracker.updateTick({ time: "09:01:00", open: 1969.0, high: 1970.0, low: 1968.0, close: 1969.5 });
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("EXIT_SL");
      expect(state.exitPrice).toBe(1969.0); // Phải cắt giá Open, chịu lỗ nặng hơn
    });

    it("Trailing Stop: Bảo vệ lợi nhuận đỉnh sóng cho vị thế SHORT", () => {
      tracker = new IntradayExecutionTracker(shortPlan);
      tracker.updateTick({ time: "09:00:00", open: 1959.0, high: 1959.0, low: 1959.0, close: 1959.0 }); // Khớp Short ở 1959.0
      
      // Đổ đèo 15 điểm (Lãi 15đ > Trail Trigger 12đ). Đáy = 1944.0.
      tracker.updateTick({ time: "10:00:00", open: 1950.0, high: 1950.0, low: 1944.0, close: 1945.0 });
      expect(tracker.getState().settled).toBe(false);

      // Giá giật ngược lên chạm SL trailing. 
      // Trailing SL = Đáy (1944.0) + TrailDist (5.0) = 1949.0.
      tracker.updateTick({ time: "10:15:00", open: 1945.0, high: 1949.5, low: 1945.0, close: 1949.0 });
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("TRAIL_EXIT");
      expect(state.exitPrice).toBeCloseTo(1949.0, 1);
      expect(state.livePnlPoints).toBeCloseTo(10.0, 1); // 1959 - 1949 = +10.0đ
    });

    it("Break-Even: Khóa hòa vốn (BE_EXIT) khi không đủ lực Trailing", () => {
      tracker = new IntradayExecutionTracker(longPlan);
      tracker.updateTick({ time: "09:00", open: 1961.0, high: 1961.0, low: 1961.0, close: 1961.0 }); // Khớp Long
      
      // Kéo lên lãi +8đ (Trigger BE ở +6đ, chưa đủ Trail +12đ)
      tracker.updateTick({ time: "09:10", open: 1965.0, high: 1969.0, low: 1965.0, close: 1968.0 });
      
      // Rớt mạnh về entry
      tracker.updateTick({ time: "09:20", open: 1968.0, high: 1968.0, low: 1955.0, close: 1955.0 });
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("BE_EXIT");
      expect(state.exitPrice).toBeCloseTo(1961.5, 1); // Entry + 0.5đ
    });

    it("ATC Exit: Bắt buộc đóng vị thế lúc 14:45", () => {
      tracker = new IntradayExecutionTracker(longPlan);
      tracker.updateTick({ time: "09:00", open: 1961.0, high: 1961.0, low: 1961.0, close: 1961.0 });
      
      // Chạy cả ngày lình xình không chạm TP/SL. Bắn nến ATC
      tracker.updateTick({ time: "14:45:00", open: 1962.0, high: 1963.0, low: 1962.0, close: 1962.5 }, true);
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("ATC_EXIT");
      expect(state.exitPrice).toBe(1962.5); // Đóng giá ATC
    });

    it("Laddering: Tính Toán Chính Xác Trung Bình Giá (Weighted Math)", () => {
      const ladderPlan = generateAllDaysLadderPlan("2026-09-10", snapshot, 1960.0, 1950.0, undefined, undefined, {
        side: "LONG",
        tpPoints: 5.0,
        maxCap: 0.6, // Mở cap để khớp đủ 3 nấc (0.1, 0.2, 0.3)
      });
      tracker = new IntradayExecutionTracker(ladderPlan);

      // Nhúng sâu xuống quét 1 nhát qua cả 3 nấc (1960.0, 1959.0, 1958.0)
      tracker.updateTick({ time: "09:10", open: 1962.0, high: 1962.0, low: 1957.0, close: 1957.5 });

      const state = tracker.getState();
      expect(state.fillStages).toBe(3);
      expect(state.filledSize).toBeCloseTo(0.6, 1); // 0.1 + 0.2 + 0.3
      
      // Phép tính: (1960*0.1 + 1959*0.2 + 1958*0.3) / 0.6 = 1175.2 / 0.6 = 1958.666...
      expect(state.avgEntryPrice).toBeCloseTo(1958.7, 1); // Đã làm tròn 1 chữ số thập phân
    });
  });
});
