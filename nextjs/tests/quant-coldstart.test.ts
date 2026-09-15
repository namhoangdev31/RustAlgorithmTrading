import { describe, it, expect, beforeEach, vi } from "vitest";

const { snapshotTable, ctl } = vi.hoisted(() => {
  const snapshotTable = new Map<string, Record<string, any>>();
  const ctl = { createManyShouldThrow: false };
  return { snapshotTable, ctl };
});

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    bfxpsMarketSnapshot: {
      async createMany(args: { data: Record<string, any>[]; skipDuplicates?: boolean }) {
        if (ctl.createManyShouldThrow) throw new Error("DB unavailable (simulated)");
        for (const row of args.data) {
          
          if (snapshotTable.has(row.id)) continue;
          snapshotTable.set(row.id, row);
        }
        return { count: args.data.length };
      },
      async findUnique(args: { where: { id: string } }) {
        return snapshotTable.get(args.where.id) ?? null;
      },
    },
  },
}));

vi.mock("@/prisma/generated/client", () => {
  class Decimal {
    private v: any;
    constructor(v: any) {
      this.v = v;
    }
    toString() {
      return String(this.v);
    }
  }
  return { Prisma: { Decimal } };
});

import {
  deriveLockId,
  getLockedContext,
  saveLockedContext,
} from "../lib/server/quant/db-plan-service";
import { generateMultiEnginePortfolio } from "../lib/server/quant/strategy-engine";
import { MarketSnapshot } from "../lib/server/quant/types";

const DATE = "2026-09-14";

const metrics = {
  refPrice: 1961.9,
  atr5d: 15.0,
  swingLow5d: 1944.9,
  swingHigh5d: 1988.0,
  ema5: 1968.8,
  ema10: 1961.0,
};

function mkSnapshot(over: Partial<MarketSnapshot>): MarketSnapshot {
  return {
    open: 1968.0,
    high: 1975.0,
    low: 1955.0,
    current: 1970.0,
    volume: 100000,
    oi: 30000,
    basis: -1.0,
    timestamp: "2026-09-14T09:15:00.000Z",
    source: "ENTRADE_LIVE",
    ...over,
  };
}

beforeEach(() => {
  snapshotTable.clear();
  ctl.createManyShouldThrow = false;
});

describe("Cold-start & Atomic Lock — BFXPS ATO 09:15", () => {
  it("deriveLockId: tất định theo ngày + format UUID hợp lệ", () => {
    const id1 = deriveLockId(DATE);
    const id2 = deriveLockId(DATE);
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    
    expect(deriveLockId("2026-09-15")).not.toBe(id1);
  });

  it("Race: hai saveLockedContext song song -> chỉ 1 row, cả hai đọc cùng snapshot thắng", async () => {
    const snapA = mkSnapshot({ current: 1999.0, source: "A" });
    const snapB = mkSnapshot({ current: 1900.0, source: "B" });

    const [resA, resB] = await Promise.all([
      saveLockedContext(DATE, snapA),
      saveLockedContext(DATE, snapB),
    ]);

    expect(snapshotTable.size).toBe(1);
    
    expect(resA).not.toBeNull();
    expect(resB).not.toBeNull();
    expect(resA!.source).toBe(resB!.source);
    expect(resA!.current).toBe(resB!.current);
    
    expect(resA!.source).toBe("ATO_LOCKED_CONTEXT");
  });

  it("Cold-start: instance B đọc lại đúng snapshot đã khóa, sinh CÙNG side như instance A", async () => {
    
    const lockedSnap = mkSnapshot({ open: 1968.0, current: 1970.0, basis: -1.0 });
    await saveLockedContext(DATE, lockedSnap);

    const ctxA = (await getLockedContext(DATE))!;
    const plansA = generateMultiEnginePortfolio(DATE, ctxA, metrics, { isOfficial: true, phase: "CONTINUOUS" });
    const sidesA = plansA.map((p) => p.side);

    const ctxB = (await getLockedContext(DATE))!;
    const plansB = generateMultiEnginePortfolio(DATE, ctxB, metrics, { isOfficial: true, phase: "CONTINUOUS" });
    const sidesB = plansB.map((p) => p.side);

    expect(sidesB).toEqual(sidesA);
    expect(ctxB.open).toBe(ctxA.open);
    expect(ctxB.basis).toBe(ctxA.basis);
  });

  it("Cold-start: live current đổi sau khi khóa KHÔNG làm lật side (đọc từ DB, không từ live)", async () => {
    await saveLockedContext(DATE, mkSnapshot({ open: 1968.0, current: 1970.0, basis: -1.0 }));

    const locked = (await getLockedContext(DATE))!;

    const plansLocked1 = generateMultiEnginePortfolio(DATE, locked, metrics, { isOfficial: true, phase: "CONTINUOUS" });
    const plansLocked2 = generateMultiEnginePortfolio(DATE, { ...locked, current: 1900.0 }, metrics, { isOfficial: true, phase: "CONTINUOUS" });

    expect(plansLocked1.map((p) => p.side)).toEqual(plansLocked2.map((p) => p.side));
  });

  it("Lock-fail: createMany throw -> saveLockedContext reject (caller tự xử degraded)", async () => {
    ctl.createManyShouldThrow = true;
    await expect(saveLockedContext(DATE, mkSnapshot({}))).rejects.toThrow();
    
    expect(snapshotTable.size).toBe(0);
    
    expect(await getLockedContext(DATE)).toBeNull();
  });
});
