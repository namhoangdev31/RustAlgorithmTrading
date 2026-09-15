import { describe, it, expect } from "vitest";
import {
  calculatePositionMetrics,
  evaluatePositionWarnings,
  calculateRealizedPnL,
  CONTRACT_MULTIPLIER,
} from "../lib/server/quant/user-position-math";

describe("User Position Tracker & Alert System", () => {
  describe("Margin Requirement Calculations", () => {
    it("calculates exact margin requirements for 3%, 5%, and 18% tiers", () => {
      const price = 1280.0;
      const volume = 2; // 2 contracts

      // 18% standard margin tier
      const res18 = calculatePositionMetrics({
        side: "LONG",
        matchedPrice: price,
        matchedVolume: volume,
        marginRate: 0.18,
        currentPrice: price,
      });
      // Expected = 1280 * 100,000 * 2 * 0.18 = 46,080,000 VND
      expect(res18.requiredMargin).toBe(46080000);

      // 5% margin tier
      const res5 = calculatePositionMetrics({
        side: "LONG",
        matchedPrice: price,
        matchedVolume: volume,
        marginRate: 0.05,
        currentPrice: price,
      });
      // Expected = 1280 * 100,000 * 2 * 0.05 = 12,800,000 VND
      expect(res5.requiredMargin).toBe(12800000);

      // 3% margin tier
      const res3 = calculatePositionMetrics({
        side: "LONG",
        matchedPrice: price,
        matchedVolume: volume,
        marginRate: 0.03,
        currentPrice: price,
      });
      // Expected = 1280 * 100,000 * 2 * 0.03 = 7,680,000 VND
      expect(res3.requiredMargin).toBe(7680000);
    });
  });

  describe("Realtime PnL Points & Money Calculations", () => {
    it("calculates positive PnL for LONG position when market rises", () => {
      const metrics = calculatePositionMetrics({
        side: "LONG",
        matchedPrice: 1280.0,
        matchedVolume: 2,
        marginRate: 0.18,
        currentPrice: 1286.5, // +6.5 points
      });

      expect(metrics.pnlPoints).toBe(6.5);
      // 6.5 * 100,000 * 2 = 1,300,000 VND
      expect(metrics.pnlMoney).toBe(1300000);
      expect(metrics.isProfit).toBe(true);
      expect(metrics.roiPercent).toBeCloseTo(2.8, 1);
    });

    it("calculates negative PnL for LONG position when market falls", () => {
      const metrics = calculatePositionMetrics({
        side: "LONG",
        matchedPrice: 1280.0,
        matchedVolume: 1,
        marginRate: 0.18,
        currentPrice: 1275.0, // -5.0 points
      });

      expect(metrics.pnlPoints).toBe(-5.0);
      expect(metrics.pnlMoney).toBe(-500000);
      expect(metrics.isProfit).toBe(false);
    });

    it("calculates positive PnL for SHORT position when market falls", () => {
      const metrics = calculatePositionMetrics({
        side: "SHORT",
        matchedPrice: 1280.0,
        matchedVolume: 3,
        marginRate: 0.18,
        currentPrice: 1272.0, // +8.0 points for SHORT
      });

      expect(metrics.pnlPoints).toBe(8.0);
      // 8.0 * 100,000 * 3 = 2,400,000 VND
      expect(metrics.pnlMoney).toBe(2400000);
      expect(metrics.isProfit).toBe(true);
    });

    it("calculates negative PnL for SHORT position when market rises", () => {
      const metrics = calculatePositionMetrics({
        side: "SHORT",
        matchedPrice: 1280.0,
        matchedVolume: 1,
        marginRate: 0.18,
        currentPrice: 1284.2, // -4.2 points
      });

      expect(metrics.pnlPoints).toBe(-4.2);
      expect(metrics.pnlMoney).toBe(-420000);
      expect(metrics.isProfit).toBe(false);
    });
  });

  describe("Smart Warning Comparison against System Signal", () => {
    it("flags DIRECTION_MISMATCH error when user position opposes system plan", () => {
      const warnings = evaluatePositionWarnings({
        positionSide: "SHORT",
        matchedPrice: 1280.0,
        currentPrice: 1280.0,
        planSide: "LONG",
        planEntry: 1282.0,
        planTp: 1298.0,
        planSl: 1274.0,
      });

      expect(warnings.length).toBeGreaterThanOrEqual(1);
      const mismatch = warnings.find((w) => w.code === "DIRECTION_MISMATCH");
      expect(mismatch).toBeDefined();
      expect(mismatch?.type).toBe("error");
      expect(mismatch?.message).toContain("ngược hướng Kèo hệ thống");
    });

    it("flags SLIPPAGE warning when entry price is worse than system plan by >0.5 pts", () => {
      const warnings = evaluatePositionWarnings({
        positionSide: "LONG",
        matchedPrice: 1283.5, // Slippage = 1283.5 - 1282.0 = 1.5 pts
        currentPrice: 1283.5,
        planSide: "LONG",
        planEntry: 1282.0,
        planTp: 1298.0,
        planSl: 1274.0,
      });

      const slippage = warnings.find((w) => w.code === "SLIPPAGE");
      expect(slippage).toBeDefined();
      expect(slippage?.type).toBe("warning");
      expect(slippage?.message).toContain("+1.5");
    });

    it("flags SL_NEAR danger warning when current price approaches SL within 2.0 pts", () => {
      const warnings = evaluatePositionWarnings({
        positionSide: "LONG",
        matchedPrice: 1282.0,
        currentPrice: 1275.5, // Distance to SL 1274.0 is 1.5 pts <= 2.0
        planSide: "LONG",
        planEntry: 1282.0,
        planTp: 1298.0,
        planSl: 1274.0,
      });

      const slNear = warnings.find((w) => w.code === "SL_NEAR");
      expect(slNear).toBeDefined();
      expect(slNear?.title).toContain("Cảnh Báo Vùng Nguy Hiểm SL");
    });

    it("flags TP_REACHED info when current price hits or exceeds TP", () => {
      const warnings = evaluatePositionWarnings({
        positionSide: "LONG",
        matchedPrice: 1282.0,
        currentPrice: 1298.5, // TP is 1298.0
        planSide: "LONG",
        planEntry: 1282.0,
        planTp: 1298.0,
        planSl: 1274.0,
      });

      const tpReached = warnings.find((w) => w.code === "TP_REACHED");
      expect(tpReached).toBeDefined();
      expect(tpReached?.type).toBe("info");
      expect(tpReached?.title).toContain("Đạt Mục Tiêu Take Profit");
    });
  });

  describe("Realized PnL on Close Position", () => {
    it("computes accurate profit and ROI when closing position", () => {
      const closed = calculateRealizedPnL("LONG", 1280.0, 1292.0, 2, 0.18);

      expect(closed.pnlPoints).toBe(12.0);
      expect(closed.pnlMoney).toBe(2400000); // 12.0 * 100,000 * 2
      expect(closed.isProfit).toBe(true);
      expect(closed.roiPercent).toBeCloseTo(5.2, 1);
    });

    it("computes accurate loss when cutting loss", () => {
      const closed = calculateRealizedPnL("SHORT", 1280.0, 1285.5, 1, 0.18);

      expect(closed.pnlPoints).toBe(-5.5);
      expect(closed.pnlMoney).toBe(-550000);
      expect(closed.isProfit).toBe(false);
    });
  });
});
