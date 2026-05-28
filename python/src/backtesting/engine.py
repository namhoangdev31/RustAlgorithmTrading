"""
Event-driven backtesting engine.
"""

from collections import deque
from datetime import datetime, date
from typing import Dict, Optional, Any
from uuid import uuid4
import pandas as pd
from loguru import logger

from backtesting.data_handler import HistoricalDataHandler
from backtesting.portfolio_handler import PortfolioHandler
from backtesting.performance import PerformanceAnalyzer
from research.repro_manager import ReproducibilityManager
from bridge.backtest_bridge import RustBacktestBridge
from backtesting.integrity import validate_run_integrity, IntegrityMetrics


class StrategyBatchInterfaceRequired(RuntimeError):
    """Raised when a production backtest strategy lacks the batch signal interface."""


class BacktestEngine:
    """
    Event-driven backtesting engine that processes events in chronological order.

    This engine implements a queue-based event processing system where market data,
    signals, orders, and fills are processed sequentially, mimicking live trading.
    """

    def __init__(
        self,
        data_handler: HistoricalDataHandler,
        portfolio_handler: PortfolioHandler,
        strategy: Any,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        rust_backtest_runtime: Optional[RustBacktestBridge] = None,
    ):
        """
        Initialize backtesting engine.

        Args:
            data_handler: Historical data provider
            portfolio_handler: Portfolio and position tracker
            strategy: Trading strategy instance
            start_date: Backtest start date
            end_date: Backtest end date
        """
        self.data_handler = data_handler
        self.portfolio_handler = portfolio_handler
        self.strategy = strategy
        self.start_date = start_date
        self.end_date = end_date
        self.engine_backend = "rust"
        self.rust_backtest_runtime = rust_backtest_runtime

        # Metrics and traces
        self.reconciliation_failures = 0
        self.reconciliation_checkpoints: list[dict[str, Any]] = []
        self.risk_decision_trace: list[dict[str, Any]] = []
        self._last_market_day: Optional[date] = None

        if self.rust_backtest_runtime is None:
            self.rust_backtest_runtime = RustBacktestBridge(
                initial_capital=self.portfolio_handler.portfolio.cash,
                symbols=self.data_handler.symbols,
            )

            risk_config = self.rust_backtest_runtime._normalize_risk_config(None)
            if hasattr(self.portfolio_handler.position_sizer, "amount"):
                amount = float(self.portfolio_handler.position_sizer.amount)
                risk_config["sizing_amount"] = amount
                risk_config["max_position_size"] = amount * 1.1
                risk_config["max_notional_exposure"] = amount * len(self.data_handler.symbols) * 1.1
                risk_config["max_open_positions"] = len(self.data_handler.symbols) * 2

            self.rust_backtest_runtime.init_state(
                initial_capital=self.portfolio_handler.portfolio.cash,
                symbols=self.data_handler.symbols,
                risk_config=risk_config,
                seed=42,
            )

        self.performance_analyzer = PerformanceAnalyzer()

        # Metrics
        self.events_processed = 0
        self.signals_generated = 0
        self.orders_placed = 0
        self.fills_executed = 0

        # Initialize Governance Managers
        self.reproducibility_manager = ReproducibilityManager()

        logger.info(
            "Initialized BacktestEngine (Rust-Only) from {} to {}",
            start_date,
            end_date,
        )

    def run(self, seed_profile_id: Optional[str] = None) -> Dict:
        """
        Execute backtest and return performance metrics.

        Args:
            seed_profile_id: Optional ID for deterministic seed profile (REPRO-GATED)

        Returns:
            Dictionary containing performance metrics and equity curve
        """
        if seed_profile_id:
            self.reproducibility_manager.apply_seed_profile(seed_profile_id)

        logger.info(f"Starting optimized backtest for {len(self.data_handler.symbols)} symbols...")
        from datetime import timezone

        start_time = datetime.now(timezone.utc)

        self._run_rust_batch_path()

        # Calculate final performance metrics
        from datetime import timezone

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        results = self._generate_results(duration)

        logger.info(
            f"Backtest completed in {duration:.2f}s. " f"Processed {self.events_processed} events"
        )

        return results

    def _generate_results(self, duration: float) -> Dict:
        """
        Generate backtest results and performance metrics.

        Args:
            duration: Backtest duration in seconds

        Returns:
            Results dictionary
        """
        equity_curve = self.portfolio_handler.get_equity_curve()
        holdings = self.portfolio_handler.get_holdings()

        metrics = self.performance_analyzer.calculate_performance_metrics(
            equity_curve=equity_curve, initial_capital=self.portfolio_handler.initial_capital
        )

        risk_allow_count = sum(1 for row in self.risk_decision_trace if row["decision"] == "ALLOW")
        risk_reject_count = sum(
            1 for row in self.risk_decision_trace if row["decision"] == "REJECT"
        )
        risk_blocked_count = sum(
            1 for row in self.risk_decision_trace if row["decision"] == "BLOCKED"
        )

        # Automated Integrity Validation
        integrity_metrics = IntegrityMetrics(
            pnl_drift_pct=0.0,  # Placeholder for drift if comparing against baseline
            exposure_drift_bps=0.0,
            false_allow_delta=0,
            false_reject_delta=0,
            blocked_delta=risk_blocked_count,
            reconciliation_failure_count=self.reconciliation_failures,
        )
        integrity_report = validate_run_integrity(integrity_metrics)

        return {
            "metrics": metrics.to_dict(),
            "equity_curve": equity_curve,
            "holdings": holdings,
            "integrity_report": {
                "is_valid": integrity_report.is_valid,
                "reasons": integrity_report.reasons,
            },
            "risk_decision_trace": list(self.risk_decision_trace),
            "reconciliation_trace": list(self.reconciliation_checkpoints),
            "execution_stats": {
                "duration_seconds": duration,
                "events_processed": self.events_processed,
                "signals_generated": self.signals_generated,
                "orders_placed": self.orders_placed,
                "fills_executed": self.fills_executed,
                "events_per_second": self.events_processed / duration if duration > 0 else 0,
                "rust_fallback_count": 0,
                "reconciliation_failures": self.reconciliation_failures,
                "reconciliation_checks": len(self.reconciliation_checkpoints),
                "risk_allow_count": risk_allow_count,
                "risk_reject_count": risk_reject_count,
                "risk_blocked_count": risk_blocked_count,
            },
        }

    @staticmethod
    def _new_correlation_id() -> str:
        return str(uuid4())

    def _handle_rust_runtime_failure(self, exc: Exception, during_init: bool = False) -> None:
        raise RuntimeError(f"Rust backtest runtime failure: {exc}") from exc

    def _run_rust_batch_path(self) -> None:
        """New Phase 2.2 batch execution path: Python signal frame -> Rust simulation."""
        if self.rust_backtest_runtime is None:
            raise RuntimeError("Rust backtest runtime is required for Phase 2.2")

        logger.info("Executing via Rust-only batch runtime (Phase 2.2)")
        data_by_symbol = {}
        for symbol in self.data_handler.symbols:
            df = self.data_handler.symbol_data.get(symbol)
            if df is None or df.empty:
                continue
            data_by_symbol[symbol] = df
            self.rust_backtest_runtime.load_market_data_columnar(symbol, df)

        # 2. Generate Signals in Batch
        if not hasattr(self.strategy, "generate_signal_frame"):
            name = getattr(self.strategy, "name", self.strategy.__class__.__name__)
            raise StrategyBatchInterfaceRequired(
                f"Strategy {name} requires generate_signal_frame for Rust-only mode."
            )

        signal_frame = self.strategy.generate_signal_frame(data_by_symbol, context={"mode": "rust"})
        self._validate_signal_frame(signal_frame)

        # 3. Load Signals to Rust
        self.rust_backtest_runtime.load_signals(signal_frame)

        # 4. Run to Completion
        self.rust_backtest_runtime.run_to_completion()

        # 5. Extract Final State
        final_state = self.rust_backtest_runtime.state_snapshot()

        # 5. Extract Stats & Metrics
        rust_stats = final_state.get("execution_stats", {})
        
        self.events_processed = rust_stats.get("events_processed", 0)
        self.signals_generated = rust_stats.get("signals_processed", 0)
        self.orders_placed = rust_stats.get("orders_placed", 0)
        self.fills_executed = rust_stats.get("fills_executed", 0)
        
        rust_decisions = self.rust_backtest_runtime.get_new_risk_decisions()
        self._append_risk_decisions(rust_decisions, backend="rust")

        self._sync_portfolio_from_rust(final_state)

    @staticmethod
    def _validate_signal_frame(signal_frame: pd.DataFrame) -> None:
        required = {"timestamp", "symbol", "signal_type", "strength", "strategy_id"}
        missing = required - set(signal_frame.columns)
        if missing:
            raise ValueError(f"signal_frame missing required columns: {sorted(missing)}")

    def _sync_portfolio_from_rust(self, rust_state: dict) -> None:
        """Update Python shadow portfolio with final Rust state for reporting."""
        cash = float(rust_state.get("cash", self.portfolio_handler.portfolio.cash))
        equity = float(rust_state.get("equity", cash))
        realized = float(rust_state.get("realized_pnl", 0.0))
        unrealized = float(rust_state.get("unrealized_pnl", 0.0))

        self.portfolio_handler.portfolio.cash = cash

        latest_timestamp = None
        for df in self.data_handler.symbol_data.values():
            if not df.empty:
                ts = df["timestamp"].iloc[-1]
                latest_timestamp = ts if latest_timestamp is None else max(latest_timestamp, ts)
        latest_timestamp = latest_timestamp or datetime.now()

        total_pnl = realized + unrealized
        return_pct = (
            (equity - self.portfolio_handler.initial_capital)
            / self.portfolio_handler.initial_capital
        ) * 100.0
        self.portfolio_handler._equity_curve_timestamps = [latest_timestamp]
        self.portfolio_handler._equity_curve_equities = [equity]
        self.portfolio_handler._equity_curve_cashes = [cash]
        self.portfolio_handler._equity_curve_total_pnls = [total_pnl]
        self.portfolio_handler._equity_curve_return_pcts = [return_pct]
        self.portfolio_handler.holdings_history = [
            {
                "timestamp": latest_timestamp,
                "symbol": position.get("symbol"),
                "quantity": position.get("signed_quantity", position.get("quantity", 0.0)),
                "price": position.get("current_price", 0.0),
                "commission": 0.0,
                "cash": cash,
                "equity": equity,
            }
            for position in rust_state.get("positions", [])
        ]

    def _append_risk_decisions(
        self, rows: list[dict[str, Any]], backend: str
    ) -> None:
        for row in rows:
            reason_value = row.get("reason_code")
            self.risk_decision_trace.append(
                {
                    "timestamp": str(row["timestamp"]),
                    "symbol": str(row["symbol"]),
                    "signal_type": str(row["signal_type"]).upper(),
                    "strategy_id": str(row["strategy_id"]),
                    "signal_id": str(row.get("signal_id", row.get("sequence_no", ""))),
                    "sequence_no": int(row["sequence_no"]),
                    "decision": str(row["decision"]).upper(),
                    "reason_code": "NONE"
                    if reason_value is None or str(reason_value).strip() == ""
                    else str(reason_value).upper(),
                    "backend": backend,
                }
            )
