import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSimCarry6Plan,
  generateAllDaysLadderPlan,
  generateCanonicalQuantPlan,
  generateMultiEnginePortfolio,
  resolveSimCarryDirection,
  getTradingSessionPhase,
  recalibratePlanAfterStopLoss,
  LIVE_CUTOFF_DATE,
} from "../lib/server/quant/strategy-engine";
import { evaluateR5, evaluateV44 } from "../lib/server/quant/risk-governors";
import { computeConsensus } from "../lib/server/quant/consensus";
import {
  IntradayExecutionTracker,
  replayExecution,
  replayExecutionCached,
  clearReplayCache,
  isAtcBar,
  M1Tick,
} from "../lib/server/quant/execution-tracker";
import { MarketSnapshot, TradingPlan } from "../lib/server/quant/types";

describe("BFXPS Quant Core Test Suite", () => {
  let snapshot: MarketSnapshot;

  beforeEach(() => {
    
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
      
      snapshot.open = 1950.0;
      const plan = generateAllDaysLadderPlan("2026-09-10", snapshot, 1961.9, 1970.0);

      expect(plan.side).toBe("SHORT");
      expect(plan.maxCap).toBe(0.3); 
      expect(plan.tpPrice).toBeCloseTo(plan.entryPrice - 4.1, 1);
      expect(plan.orderType).toBe("LIMIT"); 
    });

    it("Canonical Quant: Zero-Lookahead & Cấu hình tùy biến", () => {
      const plan = generateCanonicalQuantPlan("2026-09-10", 1961.9, 20.0, 1970.0, 1960.0, {
        atrEntryMultiplier: 0.25,
        tpPoints: 12.0,
        slPoints: 6.0,
        maxCap: 0.8,
      }, snapshot);

      expect(plan.side).toBe("LONG"); 
      expect(plan.entryPrice).toBeCloseTo(1961.9 + (0.25 * 20.0), 1);
      expect(plan.tpPrice).toBeCloseTo(plan.entryPrice + 12.0, 1);
      expect(plan.slPrice).toBeCloseTo(plan.entryPrice - 6.0, 1);
      expect(plan.maxCap).toBe(0.8);
    });
  });

  describe("2. Risk Governors & Consensus", () => {
    it("R5 & V44: Hoạt động đúng ranh giới", () => {
      expect(evaluateR5("LONG", 1962.0, 1961.9, 1944.9).action).toBe("KEEP");
      expect(evaluateR5("LONG", 1950.0, 1961.9, 1944.9).action).toBe("CANCEL"); 
      
      expect(evaluateV44("LONG", 1961.9, 1975.0, 1950.0).isV44Active).toBe(false);
      expect(evaluateV44("LONG", 1961.9, 1960.0, 1950.0).isV44Active).toBe(true); 
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
      
      longPlan = generateCanonicalQuantPlan("2026-09-10", 1960.0, 10.0, 1965.0, 1960.0); 

      shortPlan = generateCanonicalQuantPlan("2026-09-10", 1960.0, 10.0, 1955.0, 1960.0);
      
    });

    it("Slippage: Khớp lệnh trượt giá Gap (LONG)", () => {
      tracker = new IntradayExecutionTracker(longPlan);
      
      tracker.updateTick({ time: "09:00:00", open: 1964.0, high: 1965.0, low: 1963.0, close: 1964.5 });
      
      expect(tracker.getState().isFilled).toBe(true);
      expect(tracker.getState().avgEntryPrice).toBe(1964.0); 
    });

    it("Slippage: Cắt lỗ trượt giá Gap (SHORT)", () => {
      tracker = new IntradayExecutionTracker(shortPlan);
      tracker.updateTick({ time: "09:00:00", open: 1959.0, high: 1959.0, low: 1958.0, close: 1958.5 }); 

      tracker.updateTick({ time: "09:01:00", open: 1969.0, high: 1970.0, low: 1968.0, close: 1969.5 });
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("EXIT_SL");
      expect(state.exitPrice).toBe(1969.0); 
    });

    it("Trailing Stop: Bảo vệ lợi nhuận đỉnh sóng cho vị thế SHORT", () => {
      tracker = new IntradayExecutionTracker(shortPlan);
      tracker.updateTick({ time: "09:00:00", open: 1959.0, high: 1959.0, low: 1959.0, close: 1959.0 }); 

      tracker.updateTick({ time: "10:00:00", open: 1950.0, high: 1950.0, low: 1944.0, close: 1945.0 });
      expect(tracker.getState().settled).toBe(false);

      tracker.updateTick({ time: "10:15:00", open: 1945.0, high: 1949.5, low: 1945.0, close: 1949.0 });
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("TRAIL_EXIT");
      expect(state.exitPrice).toBeCloseTo(1949.0, 1);
      expect(state.livePnlPoints).toBeCloseTo(10.0, 1); 
    });

    it("Break-Even: Khóa hòa vốn (BE_EXIT) khi không đủ lực Trailing", () => {
      tracker = new IntradayExecutionTracker(longPlan);
      tracker.updateTick({ time: "09:00", open: 1961.0, high: 1961.0, low: 1961.0, close: 1961.0 }); 

      tracker.updateTick({ time: "09:10", open: 1965.0, high: 1969.0, low: 1965.0, close: 1968.0 });

      tracker.updateTick({ time: "09:20", open: 1968.0, high: 1968.0, low: 1955.0, close: 1955.0 });
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("BE_EXIT");
      expect(state.exitPrice).toBeCloseTo(1961.5, 1); 
    });

    it("ATC Exit: Bắt buộc đóng vị thế lúc 14:45", () => {
      tracker = new IntradayExecutionTracker(longPlan);
      tracker.updateTick({ time: "09:00", open: 1961.0, high: 1961.0, low: 1961.0, close: 1961.0 });

      tracker.updateTick({ time: "14:45:00", open: 1962.0, high: 1963.0, low: 1962.0, close: 1962.5 }, true);
      
      const state = tracker.getState();
      expect(state.settled).toBe(true);
      expect(state.status).toBe("ATC_EXIT");
      expect(state.exitPrice).toBe(1962.5); 
    });

    it("Laddering: Tính Toán Chính Xác Trung Bình Giá (Weighted Math)", () => {
      const ladderPlan = generateAllDaysLadderPlan("2026-09-10", snapshot, 1960.0, 1950.0, undefined, undefined, {
        side: "LONG",
        tpPoints: 5.0,
        maxCap: 0.6, 
      });
      tracker = new IntradayExecutionTracker(ladderPlan);

      tracker.updateTick({ time: "09:10", open: 1962.0, high: 1962.0, low: 1957.0, close: 1957.5 });

      const state = tracker.getState();
      expect(state.fillStages).toBe(3);
      expect(state.filledSize).toBeCloseTo(0.6, 1); 

      expect(state.avgEntryPrice).toBeCloseTo(1958.7, 1); 
    });

    it("Short Stop Order: Giữ nguyên Technical SL khi khớp Gap-down có lợi thế", () => {
      
      const testShortPlan = generateCanonicalQuantPlan("2026-09-14", 1939.8, 24.0, 1935.0, 1940.0);
      testShortPlan.entryPrice = 1937.4;
      testShortPlan.slPrice = 1945.4;
      testShortPlan.side = "SHORT";
      testShortPlan.orderType = "STOP";

      const shortTracker = new IntradayExecutionTracker(testShortPlan);
      
      shortTracker.updateTick({ time: "09:00:00", open: 1936.0, high: 1944.7, low: 1931.2, close: 1936.8 });

      const state = shortTracker.getState();
      expect(state.isFilled).toBe(true);
      expect(state.avgEntryPrice).toBe(1936.0);
      
      expect(state.settled).toBe(false);
      expect(state.status).toBe("FILLED");
    });
  });

  describe("4. Determinism — kèo KHÔNG lật theo current (chống bug ATO)", () => {
    it("resolveSimCarryDirection: cùng Open/Ref/Basis, đổi current -> hướng GIỮ NGUYÊN", () => {
      const base = { ...snapshot, open: 1968.0, basis: -1.0 };
      const dirA = resolveSimCarryDirection({ ...base, current: 1990.0 }, 1961.9, 15.0);
      const dirB = resolveSimCarryDirection({ ...base, current: 1920.0 }, 1961.9, 15.0);
      expect(dirA).toBe(dirB); 
    });

    it("generateMultiEnginePortfolio: đổi current giữ open/ref -> cả 3 engine cùng side", () => {
      const metrics = { refPrice: 1961.9, atr5d: 15.0, swingLow5d: 1944.9, swingHigh5d: 1988.0, ema5: 1968.8, ema10: 1961.0 };
      const snapA = { ...snapshot, open: 1968.0, basis: -1.0, current: 1999.0 };
      const snapB = { ...snapshot, open: 1968.0, basis: -1.0, current: 1900.0 };
      const plansA = generateMultiEnginePortfolio("2026-09-10", snapA, metrics, { isOfficial: true, phase: "CONTINUOUS" });
      const plansB = generateMultiEnginePortfolio("2026-09-10", snapB, metrics, { isOfficial: true, phase: "CONTINUOUS" });
      expect(plansA.map((p) => p.side)).toEqual(plansB.map((p) => p.side));
      expect(plansA.every((p) => p.isOfficial === true)).toBe(true);
    });

    it("resolveSimCarryDirection boundaries: gap mạnh -> momentum thắng", () => {
      
      expect(resolveSimCarryDirection({ ...snapshot, open: 1990.0, basis: 1.0 }, 1961.9, 15.0)).toBe("LONG");
      
      expect(resolveSimCarryDirection({ ...snapshot, open: 1930.0, basis: -1.0 }, 1961.9, 15.0)).toBe("SHORT");
    });

    it("resolveSimCarryDirection carry: backwardation sâu thiên LONG, contango sâu thiên SHORT", () => {
      
      expect(resolveSimCarryDirection({ ...snapshot, open: 1961.9, basis: -12.0 }, 1961.9, 15.0)).toBe("LONG");
      
      expect(resolveSimCarryDirection({ ...snapshot, open: 1961.9, basis: 12.0 }, 1961.9, 15.0)).toBe("SHORT");
    });

    it("resolveSimCarryDirection dead-zone: tín hiệu yếu -> fallback EMA", () => {
      
      expect(resolveSimCarryDirection({ ...snapshot, open: 1961.9, basis: 0 }, 1961.9, 15.0, 1960.0, 1965.0)).toBe("SHORT");
      
      expect(resolveSimCarryDirection({ ...snapshot, open: 1961.9, basis: 0 }, 1961.9, 15.0, 1965.0, 1960.0)).toBe("LONG");
    });
  });

  describe("5. getTradingSessionPhase tại ranh giới (UTC+7)", () => {
    
    const at = (h: number, m: number, s: number) =>
      new Date(Date.UTC(2026, 8, 14, h - 7, m, s)); 

    it("ranh giới PRE_ATO / ATO_OBSERVATION", () => {
      expect(getTradingSessionPhase(at(8, 44, 59))).toBe("PRE_ATO");
      expect(getTradingSessionPhase(at(8, 45, 0))).toBe("ATO_OBSERVATION");
    });

    it("ranh giới ATO_OBSERVATION / CONTINUOUS (09:15)", () => {
      expect(getTradingSessionPhase(at(9, 14, 59))).toBe("ATO_OBSERVATION");
      expect(getTradingSessionPhase(at(9, 15, 0))).toBe("CONTINUOUS");
    });

    it("ranh giới CONTINUOUS / LUNCH_BREAK / ATC / CLOSED", () => {
      expect(getTradingSessionPhase(at(11, 30, 0))).toBe("LUNCH_BREAK");
      expect(getTradingSessionPhase(at(13, 0, 0))).toBe("CONTINUOUS");
      expect(getTradingSessionPhase(at(14, 30, 0))).toBe("ATC");
      expect(getTradingSessionPhase(at(14, 45, 0))).toBe("CLOSED");
    });
  });

  describe("6. Consensus nâng cao (V44 exclusion + NEUTRAL)", () => {
    const mkPlan = (over: Partial<TradingPlan>): TradingPlan =>
      ({
        id: "p", date: "2026-09-10", engine: "E", horizon: "t", side: "LONG",
        entryPrice: 1, tpPrice: 2, slPrice: 0.5, maxCap: 1, r5State: "KEEP",
        status: "ACTIVE_TODAY", isCanonical: true, ...over,
      } as TradingPlan);

    it("NEUTRAL khi hòa phiếu -> strength = 0 (không phải 0.5)", () => {
      const c = computeConsensus([
        mkPlan({ id: "a", engine: "L", side: "LONG", consensusWeight: 1 }),
        mkPlan({ id: "b", engine: "S", side: "SHORT", consensusWeight: 1 }),
      ]);
      expect(c.direction).toBe("NEUTRAL");
      expect(c.strength).toBe(0);
    });

    it("Tất cả CANCEL -> NEUTRAL, strength 0, loại hết engine", () => {
      const c = computeConsensus([
        mkPlan({ id: "a", engine: "X", r5State: "CANCEL" }),
        mkPlan({ id: "b", engine: "Y", r5State: "CANCEL" }),
      ]);
      expect(c.direction).toBe("NEUTRAL");
      expect(c.strength).toBe(0);
      expect(c.longCount).toBe(0);
    });

    it("V44-active bị loại khỏi bỏ phiếu (như R5 CANCEL)", () => {
      const c = computeConsensus([
        mkPlan({ id: "a", engine: "BLOCKED", side: "LONG", consensusWeight: 2, v44Active: true }),
        mkPlan({ id: "b", engine: "OK", side: "SHORT", consensusWeight: 1 }),
      ]);
      
      expect(c.direction).toBe("SHORT");
      expect(c.strength).toBe(1.0);
      expect(c.excludedEngines).toContain("BLOCKED");
      expect(c.longCount).toBe(0);
    });
  });

  describe("7. V44 được wire thật vào generator (không còn dead code)", () => {
    it("Canonical LONG với swingHigh < ref -> v44Active = true", () => {
      
      const plan = generateCanonicalQuantPlan(
        "2026-09-10", 1961.9, 15.0, 1970.0, 1960.0,
        undefined, { ...snapshot, open: 1975.0, current: 1975.0 }, 1955.0, 1940.0
      );
      expect(plan.side).toBe("LONG");
      expect(plan.v44Active).toBe(true);
      expect(plan.v44Warning).toBeTruthy();
    });

    it("Canonical LONG với swingHigh > ref -> v44Active = false", () => {
      const plan = generateCanonicalQuantPlan(
        "2026-09-10", 1961.9, 15.0, 1970.0, 1960.0,
        undefined, { ...snapshot, open: 1975.0, current: 1975.0 }, 1990.0, 1940.0
      );
      expect(plan.v44Active).toBe(false);
    });
  });

  describe("8. Replay nến 1m (execution thật, không còn 1 nến tổng hợp)", () => {
    const longPlan = (): TradingPlan => {
      const p = generateCanonicalQuantPlan("2026-09-10", 1960.0, 10.0, 1965.0, 1960.0);
      
      return p;
    };

    it("isAtcBar: phân định đúng mốc 14:45", () => {
      expect(isAtcBar("14:44:00")).toBe(false);
      expect(isAtcBar("14:45:00")).toBe(true);
      expect(isAtcBar("14:46:30")).toBe(true);
      expect(isAtcBar("garbage")).toBe(false);
    });

    it("replayExecution: ATC_EXIT khi nến >=14:45 chưa chạm TP/SL", () => {
      const bars: M1Tick[] = [
        { time: "09:15:00", open: 1960, high: 1962, low: 1960, close: 1961 }, 
        { time: "10:00:00", open: 1961, high: 1963, low: 1960, close: 1962 },
        { time: "14:45:00", open: 1962, high: 1963, low: 1961, close: 1962.5 }, 
      ];
      const st = replayExecution(longPlan(), bars);
      expect(st.settled).toBe(true);
      expect(st.status).toBe("ATC_EXIT");
      expect(st.exitPrice).toBe(1962.5);
    });

    it("replayExecution: trailing tích lũy qua NHIỀU nến (điều 1-nến-tổng-hợp không làm được)", () => {
      const bars: M1Tick[] = [
        { time: "09:15:00", open: 1960, high: 1962, low: 1960, close: 1961 }, 
        { time: "09:30:00", open: 1961, high: 1970, low: 1961, close: 1969 }, 
        { time: "10:00:00", open: 1969, high: 1975, low: 1968, close: 1974 }, 
        { time: "10:15:00", open: 1974, high: 1975, low: 1968, close: 1969 }, 
      ];
      const st = replayExecution(longPlan(), bars);
      expect(st.settled).toBe(true);
      expect(["TRAIL_EXIT", "BE_EXIT", "TP_EXIT"]).toContain(st.status);
      expect(st.livePnlPoints).toBeGreaterThan(0); 
    });

    it("replayExecution: SL/TP cùng 1 nến -> ưu tiên SL (pessimistic)", () => {
      const bars: M1Tick[] = [
        { time: "09:15:00", open: 1960, high: 1962, low: 1960, close: 1961 }, 
        
        { time: "09:16:00", open: 1961, high: 1990, low: 1950, close: 1970 },
      ];
      const st = replayExecution(longPlan(), bars);
      expect(st.settled).toBe(true);
      expect(st.status).toBe("EXIT_SL");
    });

    it("replayExecutionCached: cùng bar cuối -> dùng cache (state giống hệt)", () => {
      clearReplayCache();
      const bars: M1Tick[] = [
        { time: "09:15:00", open: 1960, high: 1962, low: 1960, close: 1961 },
      ];
      const p = longPlan();
      const s1 = replayExecutionCached(p, bars);
      const s2 = replayExecutionCached(p, bars); 
      expect(s2).toEqual(s1);
      
      const bars2: M1Tick[] = [
        ...bars,
        { time: "14:45:00", open: 1961, high: 1962, low: 1960, close: 1961.5 },
      ];
      const s3 = replayExecutionCached(p, bars2);
      expect(s3.status).toBe("ATC_EXIT");
      clearReplayCache();
    });
  });

  describe("9. Hằng số LIVE_CUTOFF_DATE (nguồn duy nhất)", () => {
    it("LIVE_CUTOFF_DATE đúng định dạng ngày", () => {
      expect(LIVE_CUTOFF_DATE).toBe("2026-09-14");
    });
  });

  describe("10. Thuật toán tái lập / đảo kèo sau khi dính Stop Loss", () => {
    it("Kèo SHORT dính SL -> Tái lập đảo sang LONG tại ngưỡng cutloss", () => {
      const shortPlan: TradingPlan = {
        id: "short-test",
        date: "2026-09-15",
        engine: "simcarrry6",
        horizon: "t+1",
        side: "SHORT",
        entryPrice: 1930.9,
        tpPrice: 1908.9,
        slPrice: 1942.8,
        maxCap: 0.3,
        r5State: "KEEP",
        status: "ACTIVE_TODAY",
        isCanonical: true,
      };
      const metrics = {
        refDate: "2026-09-15",
        refPrice: 1936.0,
        atr5d: 14.5,
        swingLow5d: 1916.0,
        swingHigh5d: 1950.0,
        ema5: 1935.0,
        ema10: 1933.0,
      };
      const newPlan = recalibratePlanAfterStopLoss(shortPlan, snapshot, metrics, 1942.8);
      expect(newPlan.side).toBe("LONG");
      expect(newPlan.entryPrice).toBe(1942.8);
      expect(newPlan.tpPrice).toBeGreaterThan(1942.8);
      expect(newPlan.slPrice).toBeLessThan(1942.8);
      expect(newPlan.resolvedSource).toBe("LATEST_SHORT_CUTLOSS_REVERSAL");
      expect(newPlan.isCanonical).toBe(true);
    });

    it("Kèo LONG dính SL -> Tái lập đảo sang SHORT đón nhịp gãy đáy", () => {
      const longPlan: TradingPlan = {
        id: "long-test",
        date: "2026-09-15",
        engine: "simcarrry6",
        horizon: "t+1",
        side: "LONG",
        entryPrice: 1945.0,
        tpPrice: 1967.0,
        slPrice: 1935.0,
        maxCap: 0.3,
        r5State: "KEEP",
        status: "ACTIVE_TODAY",
        isCanonical: true,
      };
      const metrics = {
        refDate: "2026-09-15",
        refPrice: 1940.0,
        atr5d: 14.5,
        swingLow5d: 1916.0,
        swingHigh5d: 1950.0,
        ema5: 1935.0,
        ema10: 1933.0,
      };
      const newPlan = recalibratePlanAfterStopLoss(longPlan, snapshot, metrics, 1935.0);
      expect(newPlan.side).toBe("SHORT");
      expect(newPlan.entryPrice).toBe(1935.0);
      expect(newPlan.tpPrice).toBeLessThan(1935.0);
      expect(newPlan.slPrice).toBeGreaterThan(1935.0);
      expect(newPlan.resolvedSource).toBe("LATEST_LONG_CUTLOSS_REVERSAL");
    });

    it("Quét toàn bộ phiên phát hiện Bull Trap sau khi Short dính SL -> Kèo tối ưu SHORT lại với SL chặt trên đỉnh", () => {
      const shortPlan: TradingPlan = {
        id: "short-test",
        date: "2026-09-15",
        engine: "simcarrry6",
        horizon: "t+1",
        side: "SHORT",
        entryPrice: 1930.0,
        tpPrice: 1910.0,
        slPrice: 1940.0,
        maxCap: 0.3,
        r5State: "KEEP",
        status: "ACTIVE_TODAY",
        isCanonical: true,
      };
      const metrics = {
        refDate: "2026-09-15",
        refPrice: 1935.0,
        atr5d: 14.5,
        swingLow5d: 1920.0,
        swingHigh5d: 1945.0,
        ema5: 1935.0,
        ema10: 1933.0,
      };
      
      const bars = [
        { time: "09:15", open: 1930, high: 1935, low: 1928, close: 1932 },
        { time: "10:00", open: 1932, high: 1942.5, low: 1931, close: 1941 }, 
        { time: "10:30", open: 1941, high: 1941.5, low: 1936, close: 1937 }, 
      ];
      const newPlan = recalibratePlanAfterStopLoss(shortPlan, { ...snapshot, current: 1937.0 }, metrics, 1940.0, bars);
      expect(newPlan.side).toBe("SHORT");
      expect(newPlan.entryPrice).toBe(1937.0);
      expect(newPlan.slPrice).toBeGreaterThan(1942.5); 
      expect(newPlan.tpPrice).toBeLessThan(1937.0);
      expect(newPlan.resolvedSource).toBe("SESSION_OPTIMAL_SWEEP_RE_SHORT");
      expect(newPlan.reason).toContain("Bull Trap");
    });

    it("Quét toàn bộ phiên phát hiện Bear Trap sau khi Long dính SL -> Kèo tối ưu LONG lại với SL chặt dưới đáy", () => {
      const longPlan: TradingPlan = {
        id: "long-test",
        date: "2026-09-15",
        engine: "simcarrry6",
        horizon: "t+1",
        side: "LONG",
        entryPrice: 1945.0,
        tpPrice: 1965.0,
        slPrice: 1935.0,
        maxCap: 0.3,
        r5State: "KEEP",
        status: "ACTIVE_TODAY",
        isCanonical: true,
      };
      const metrics = {
        refDate: "2026-09-15",
        refPrice: 1940.0,
        atr5d: 14.5,
        swingLow5d: 1920.0,
        swingHigh5d: 1950.0,
        ema5: 1938.0,
        ema10: 1936.0,
      };
      
      const bars = [
        { time: "09:15", open: 1945, high: 1948, low: 1942, close: 1944 },
        { time: "10:00", open: 1944, high: 1944, low: 1931.2, close: 1933 }, 
        { time: "10:30", open: 1933, high: 1939, low: 1932, close: 1938.5 }, 
      ];
      const newPlan = recalibratePlanAfterStopLoss(longPlan, { ...snapshot, current: 1938.5 }, metrics, 1935.0, bars);
      expect(newPlan.side).toBe("LONG");
      expect(newPlan.entryPrice).toBe(1938.5);
      expect(newPlan.slPrice).toBeLessThan(1931.2); 
      expect(newPlan.tpPrice).toBeGreaterThan(1938.5);
      expect(newPlan.resolvedSource).toBe("SESSION_OPTIMAL_SWEEP_RE_LONG");
      expect(newPlan.reason).toContain("Bear Trap");
    });
  });
});
