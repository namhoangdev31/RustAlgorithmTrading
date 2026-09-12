import { ExecutionState, MarketSnapshot, TradingPlan } from "./types";

export interface M1Tick {
  time: string; // HH:mm:ss
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Máy trạng thái Quản lý Khớp Lệnh & Vị Thế Intraday (Execution State Machine)
 */
export class IntradayExecutionTracker {
  private state: ExecutionState;
  private plan: TradingPlan;

  constructor(plan: TradingPlan, initialState?: Partial<ExecutionState>) {
    this.plan = plan;
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

  /**
   * Cập nhật theo nến M1 hoặc giá thời gian thực
   */
  public updateTick(tick: M1Tick, isAtcTime = false): ExecutionState {
    if (this.state.settled) {
      return this.state;
    }

    // 1. Kiểm tra khớp lệnh (Fill Laddering) nếu đang chờ
    if (this.state.status === "WAIT_ENTRY") {
      if (this.plan.side === "LONG") {
        // Giá chạm hoặc xuyên qua Entry
        if (tick.low <= this.plan.entryPrice) {
          this.state.isFilled = true;
          this.state.status = "FILLED";
          // Bắt đầu nấc 1 (0.1 units)
          this.state.fillStages = 1;
          this.state.filledSize = 0.1;
          this.state.avgEntryPrice = this.plan.entryPrice;
        }
      } else {
        // SHORT
        if (tick.high >= this.plan.entryPrice) {
          this.state.isFilled = true;
          this.state.status = "FILLED";
          this.state.fillStages = 1;
          this.state.filledSize = 0.1;
          this.state.avgEntryPrice = this.plan.entryPrice;
        }
      }
    }

    // 2. Nếu đã khớp nấc 1, kiểm tra các nấc tiếp theo (nếu giá lùi sâu hơn 1-2 điểm)
    if (this.state.status === "FILLED") {
      if (this.plan.side === "LONG") {
        if (this.state.fillStages === 1 && tick.low <= this.plan.entryPrice - 1.0) {
          this.state.fillStages = 2;
          this.state.filledSize = 0.2;
          this.state.avgEntryPrice = Number(
            ((this.plan.entryPrice + (this.plan.entryPrice - 1.0)) / 2).toFixed(1)
          );
        } else if (this.state.fillStages === 2 && tick.low <= this.plan.entryPrice - 2.0) {
          this.state.fillStages = 3;
          this.state.filledSize = 0.3; // Chạm max 0.3
          this.state.avgEntryPrice = Number(
            (
              (this.plan.entryPrice +
                (this.plan.entryPrice - 1.0) +
                (this.plan.entryPrice - 2.0)) /
              3
            ).toFixed(1)
          );
        }

        // 3. Kiểm tra TP
        if (tick.high >= this.plan.tpPrice) {
          this.state.status = "TP_EXIT";
          this.state.exitPrice = this.plan.tpPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (this.plan.tpPrice - this.state.avgEntryPrice).toFixed(1)
          );
          return this.state;
        }

        // 4. Kiểm tra SL
        if (tick.low <= this.plan.slPrice) {
          this.state.status = "EXIT_SL";
          this.state.exitPrice = this.plan.slPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (this.plan.slPrice - this.state.avgEntryPrice).toFixed(1)
          );
          return this.state;
        }
      } else {
        // SHORT
        if (tick.low <= this.plan.tpPrice) {
          this.state.status = "TP_EXIT";
          this.state.exitPrice = this.plan.tpPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (this.state.avgEntryPrice - this.plan.tpPrice).toFixed(1)
          );
          return this.state;
        }

        if (tick.high >= this.plan.slPrice) {
          this.state.status = "EXIT_SL";
          this.state.exitPrice = this.plan.slPrice;
          this.state.exitTime = tick.time;
          this.state.settled = true;
          this.state.livePnlPoints = Number(
            (this.state.avgEntryPrice - this.plan.slPrice).toFixed(1)
          );
          return this.state;
        }
      }

      // 5. Kiểm tra chốt phiên ATC nếu đến giờ (sau 14:30 / 14:45)
      if (isAtcTime) {
        this.state.status = "ATC_EXIT";
        this.state.exitPrice = tick.close;
        this.state.exitTime = "14:45:00";
        this.state.settled = true;
        this.state.livePnlPoints =
          this.plan.side === "LONG"
            ? Number((tick.close - this.state.avgEntryPrice).toFixed(1))
            : Number((this.state.avgEntryPrice - tick.close).toFixed(1));
        return this.state;
      }

      // 6. Tính PnL MTM (Mark-to-Market) tức thời
      this.state.livePnlPoints =
        this.plan.side === "LONG"
          ? Number((tick.close - this.state.avgEntryPrice).toFixed(1))
          : Number((this.state.avgEntryPrice - tick.close).toFixed(1));
    }

    return this.state;
  }
}
