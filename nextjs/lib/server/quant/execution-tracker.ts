import { ExecutionState, LadderConfig, LadderStep, MarketSnapshot, TradingPlan } from "./types";

export interface M1Tick {
  time: string; 
  open: number;
  high: number;
  low: number;
  close: number;
}

const ATC_MINUTE_OF_DAY = 14 * 60 + 45;

export function isAtcBar(timeHHMMSS: string): boolean {
  const [h, m] = timeHHMMSS.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  return h * 60 + m >= ATC_MINUTE_OF_DAY;
}

export class IntradayExecutionTracker {
  private state: ExecutionState;
  private plan: TradingPlan;
  private peakPrice: number = 0;
  private currentSl: number = 0;
  private fillPrices: number[] = [];

  constructor(plan: TradingPlan, initialState?: Partial<ExecutionState>) {
    this.plan = plan;
    this.currentSl = plan.slPrice;
    this.state = {
      planId: plan.id,
      isFilled: false,
      fillStages: 0,
      filledSize: 0,
      avgEntryPrice: 0,
      livePnlPoints: 0,
      status: "WAIT_ENTRY",
      settled: false,
      ...initialState,
    };
  }

  public getState(): ExecutionState {
    return { ...this.state };
  }

  public updateTick(tick: M1Tick, isAtcTime = false): ExecutionState {
    if (this.state.settled) {
      return this.state;
    }

    const orderType: "STOP" | "LIMIT" =
      this.plan.orderType ||
      (this.plan.engine === "CanonicalDirectionalBreakout" ? "STOP" : "LIMIT");

    const ladderConfig: LadderConfig = this.plan.ladderConfig || {
      enabled:
        this.plan.engine === "AllDaysLadder_CAP0.3",
      steps: [
        { offsetPoints: 0, size: 0.1 },
        { offsetPoints: 1.0, size: 0.1 },
        { offsetPoints: 2.0, size: 0.1 },
      ],
    };

    if (this.state.status === "WAIT_ENTRY") {
      let isTriggered = false;
      let fillPrice = this.plan.entryPrice;

      if (orderType === "STOP") {
        
        if (this.plan.side === "LONG") {
          isTriggered = tick.high >= this.plan.entryPrice;
          if (isTriggered) {
            
            fillPrice = tick.open > this.plan.entryPrice ? tick.open : this.plan.entryPrice;
          }
        } else {
          isTriggered = tick.low <= this.plan.entryPrice;
          if (isTriggered) {
            
            fillPrice = tick.open < this.plan.entryPrice ? tick.open : this.plan.entryPrice;
          }
        }
      } else {
        
        if (this.plan.side === "LONG") {
          isTriggered = tick.low <= this.plan.entryPrice;
          if (isTriggered) {
            
            fillPrice = tick.open < this.plan.entryPrice ? tick.open : this.plan.entryPrice;
          }
        } else {
          isTriggered = tick.high >= this.plan.entryPrice;
          if (isTriggered) {
            
            fillPrice = tick.open > this.plan.entryPrice ? tick.open : this.plan.entryPrice;
          }
        }
      }

      if (isTriggered) {
        this.state.isFilled = true;
        this.state.status = "FILLED";
        this.state.fillStages = 1;
        const initialSize = ladderConfig.steps[0]?.size || 0.1;
        this.state.filledSize = Math.min(initialSize, this.plan.maxCap || 1.0);
        this.state.avgEntryPrice = fillPrice;
        this.peakPrice = fillPrice;
        this.fillPrices = [fillPrice];

        this.currentSl = this.plan.slPrice;
      }
    }

    if (this.state.status === "FILLED" && ladderConfig.enabled) {
      while (this.state.fillStages < ladderConfig.steps.length) {
        const nextStageIdx = this.state.fillStages;
        const nextStep = ladderConfig.steps[nextStageIdx];

        let nextTargetPrice = this.plan.entryPrice;
        let isNextFilled = false;
        let stepFillPrice = nextTargetPrice;

        if (this.plan.side === "LONG") {
          nextTargetPrice = Number((this.plan.entryPrice - nextStep.offsetPoints).toFixed(1));
          isNextFilled = tick.low <= nextTargetPrice;
          if (isNextFilled) {
            stepFillPrice = tick.open < nextTargetPrice ? tick.open : nextTargetPrice;
          }
        } else {
          nextTargetPrice = Number((this.plan.entryPrice + nextStep.offsetPoints).toFixed(1));
          isNextFilled = tick.high >= nextTargetPrice;
          if (isNextFilled) {
            stepFillPrice = tick.open > nextTargetPrice ? tick.open : nextTargetPrice;
          }
        }

        if (isNextFilled) {
          this.state.fillStages = nextStageIdx + 1;
          this.fillPrices.push(stepFillPrice);

          let totalCost = 0;
          let totalSize = 0;
          for (let i = 0; i < this.state.fillStages; i++) {
            const step = ladderConfig.steps[i];
            const p = this.fillPrices[i];
            totalCost += p * step.size;
            totalSize += step.size;
          }

          this.state.filledSize = Math.min(
            Number(totalSize.toFixed(2)),
            this.plan.maxCap || 1.0
          );
          this.state.avgEntryPrice = Number((totalCost / totalSize).toFixed(1));
        } else {
          break;
        }
      }
    }

    if (this.state.status === "FILLED") {
      const trailing = this.plan.trailingConfig;
      const targetPoints = Math.abs(this.plan.tpPrice - this.plan.entryPrice);
      const effectiveTp = this.plan.tpPrice > 0
        ? (this.plan.side === "LONG"
          ? Number((this.state.avgEntryPrice + targetPoints).toFixed(1))
          : Number((this.state.avgEntryPrice - targetPoints).toFixed(1)))
        : 0;

      const effectiveSl = trailing?.enabled ? this.currentSl : this.plan.slPrice;

      if (this.plan.side === "LONG") {
        if (tick.low <= effectiveSl) {
          const actualExitPrice = tick.open < effectiveSl ? tick.open : effectiveSl;
          const isTrailingWin = actualExitPrice > this.state.avgEntryPrice + 0.5;
          const isBe = actualExitPrice >= this.state.avgEntryPrice - 0.1 && actualExitPrice <= this.state.avgEntryPrice + 0.5;

          this.state.status = isTrailingWin ? "TRAIL_EXIT" : isBe ? "BE_EXIT" : "EXIT_SL";
          this.state.exitPrice = actualExitPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (actualExitPrice - this.state.avgEntryPrice).toFixed(1)
          );
          return this.state;
        }

        if (effectiveTp > 0 && tick.high >= effectiveTp) {
          const actualExitPrice = tick.open > effectiveTp ? tick.open : effectiveTp;
          this.state.status = "TP_EXIT";
          this.state.exitPrice = actualExitPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (actualExitPrice - this.state.avgEntryPrice).toFixed(1)
          );
          return this.state;
        }

        if (tick.high > this.peakPrice) this.peakPrice = tick.high;

        if (trailing?.enabled) {
          const maxProfit = this.peakPrice - this.state.avgEntryPrice;
          const beTrigger = trailing.beTriggerPoints ?? 6.0;
          const trailTrigger = trailing.trailTriggerPoints ?? 12.0;
          const trailDist = trailing.trailDistance ?? 5.0;

          if (maxProfit >= trailTrigger) {
            const newSl = Number((this.peakPrice - trailDist).toFixed(1));
            if (newSl > this.currentSl) this.currentSl = newSl;
          } else if (maxProfit >= beTrigger) {
            const beSl = Number((this.state.avgEntryPrice + 0.5).toFixed(1));
            if (beSl > this.currentSl) this.currentSl = beSl;
          }
        }
      } else {

        if (tick.high >= effectiveSl) {
          
          const actualExitPrice = tick.open > effectiveSl ? tick.open : effectiveSl;
          const isTrailingWin = actualExitPrice < this.state.avgEntryPrice - 0.5;
          const isBe = actualExitPrice <= this.state.avgEntryPrice + 0.1 && actualExitPrice >= this.state.avgEntryPrice - 0.5;

          this.state.status = isTrailingWin ? "TRAIL_EXIT" : isBe ? "BE_EXIT" : "EXIT_SL";
          this.state.exitPrice = actualExitPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (this.state.avgEntryPrice - actualExitPrice).toFixed(1)
          );
          return this.state;
        }

        if (effectiveTp > 0 && tick.low <= effectiveTp) {
          
          const actualExitPrice = tick.open < effectiveTp ? tick.open : effectiveTp;
          this.state.status = "TP_EXIT";
          this.state.exitPrice = actualExitPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (this.state.avgEntryPrice - actualExitPrice).toFixed(1)
          );
          return this.state;
        }

        if (this.peakPrice === 0 || tick.low < this.peakPrice) this.peakPrice = tick.low;

        if (trailing?.enabled) {
          const maxProfit = this.state.avgEntryPrice - this.peakPrice;
          const beTrigger = trailing.beTriggerPoints ?? 6.0;
          const trailTrigger = trailing.trailTriggerPoints ?? 12.0;
          const trailDist = trailing.trailDistance ?? 5.0;

          if (maxProfit >= trailTrigger) {
            const newSl = Number((this.peakPrice + trailDist).toFixed(1));
            if (newSl < this.currentSl) this.currentSl = newSl;
          } else if (maxProfit >= beTrigger) {
            const beSl = Number((this.state.avgEntryPrice - 0.5).toFixed(1));
            if (beSl < this.currentSl) this.currentSl = beSl;
          }
        }
      }

      if (isAtcTime) {
        this.state.status = "ATC_EXIT";
        this.state.exitPrice = tick.close;
        this.state.exitTime = tick.time || "14:45:00";
        this.state.settled = true;
        this.state.livePnlPoints =
          this.plan.side === "LONG"
            ? Number((tick.close - this.state.avgEntryPrice).toFixed(1))
            : Number((this.state.avgEntryPrice - tick.close).toFixed(1));
        return this.state;
      }

      this.state.livePnlPoints =
        this.plan.side === "LONG"
          ? Number((tick.close - this.state.avgEntryPrice).toFixed(1))
          : Number((this.state.avgEntryPrice - tick.close).toFixed(1));
    }

    return this.state;
  }
}

export function replayExecution(
  plan: TradingPlan,
  bars: M1Tick[]
): ExecutionState {
  const tracker = new IntradayExecutionTracker(plan);
  let last: ExecutionState = tracker.getState();
  for (const bar of bars) {
    last = tracker.updateTick(bar, isAtcBar(bar.time));
    if (last.settled) break;
  }
  return last;
}

const replayCache = new Map<string, { barKey: string; state: ExecutionState }>();

export function replayExecutionCached(
  plan: TradingPlan,
  bars: M1Tick[]
): ExecutionState {
  const barKey = bars.length > 0 ? bars[bars.length - 1].time : "EMPTY";
  const planKey = `${plan.id}-${plan.side}-${plan.entryPrice}-${plan.tpPrice}-${plan.slPrice}`;
  const cached = replayCache.get(planKey);
  if (cached && cached.barKey === barKey) {
    return cached.state;
  }
  const state = replayExecution(plan, bars);
  replayCache.set(planKey, { barKey, state });
  return state;
}

export function clearReplayCache() {
  replayCache.clear();
}
