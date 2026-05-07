"""
Event-driven backtesting engine.
"""

from collections import deque
from datetime import datetime, date
from typing import Dict, Optional, Any
from uuid import uuid4
import pandas as pd
from loguru import logger

from models.events import Event, EventType, MarketEvent, SignalEvent, OrderEvent, FillEvent
from backtesting.data_handler import HistoricalDataHandler
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.portfolio_handler import PortfolioHandler
from backtesting.performance import PerformanceAnalyzer
from risk.allocation_manager import AllocationManager, AllocationPolicy
from research.repro_manager import ReproducibilityManager
from bridge.backtest_bridge import RustBacktestBridge
from backtesting.phase2_governance import resolve_engine_backend


class BacktestEngine:
    """
    Event-driven backtesting engine that processes events in chronological order.

    This engine implements a queue-based event processing system where market data,
    signals, orders, and fills are processed sequentially, mimicking live trading.
    """

    def __init__(
        self,
        data_handler: HistoricalDataHandler,
        execution_handler: SimulatedExecutionHandler,
        portfolio_handler: PortfolioHandler,
        strategy: Any,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        engine_backend: Optional[str] = None,
        rust_backtest_runtime: Optional[RustBacktestBridge] = None,
        rust_fallback_to_python: bool = True,
    ):
        """
        Initialize backtesting engine.

        Args:
            data_handler: Historical data provider
            execution_handler: Order execution simulator
            portfolio_handler: Portfolio and position tracker
            strategy: Trading strategy instance
            start_date: Backtest start date
            end_date: Backtest end date
        """
        self.data_handler = data_handler
        self.execution_handler = execution_handler
        self.portfolio_handler = portfolio_handler
        self.strategy = strategy
        self.start_date = start_date
        self.end_date = end_date
        self.engine_backend = resolve_engine_backend(engine_backend)
        self.rust_backtest_runtime = rust_backtest_runtime
        self.rust_fallback_to_python = rust_fallback_to_python

        # Metrics and traces
        self.rust_fallback_count = 0
        self.reconciliation_failures = 0
        self.reconciliation_checkpoints: list[dict[str, Any]] = []
        self.risk_decision_trace: list[dict[str, Any]] = []
        self._last_market_day: Optional[date] = None

        if self.engine_backend == "rust" and self.rust_backtest_runtime is None:
            try:
                self.rust_backtest_runtime = RustBacktestBridge(
                    initial_capital=portfolio_handler.initial_capital,
                    symbols=data_handler.symbols,
                )
            except Exception as exc:
                self._handle_rust_runtime_failure(exc, during_init=True)

        # CRITICAL FIX: Connect data handler to execution handler for accurate pricing
        if hasattr(execution_handler, "set_data_handler"):
            execution_handler.set_data_handler(data_handler)

        self.events: deque[Event] = deque()
        self.continue_backtest = True
        self.performance_analyzer = PerformanceAnalyzer()

        # Metrics
        self.events_processed = 0
        self.signals_generated = 0
        self.orders_placed = 0
        self.fills_executed = 0

        # Initialize Governance Managers
        self.allocation_manager = AllocationManager(AllocationPolicy())
        self.reproducibility_manager = ReproducibilityManager()

        if hasattr(self.portfolio_handler, "allocation_manager"):
            self.portfolio_handler.allocation_manager = self.allocation_manager

        logger.info(
            "Initialized BacktestEngine backend={} from {} to {}",
            self.engine_backend,
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

        while self.continue_backtest:
            current_market_day: Optional[date] = None
            # Update market data bars
            if self.data_handler.continue_backtest:
                self.data_handler.update_bars()

                # Optimized (Wave-3): Emit MarketEvent for ALL symbols to support parallel
                # strategies. This ensures each strategy gets data for all symbols it tracks.
                for symbol in self.data_handler.symbols:
                    bar = self.data_handler.get_latest_bar(symbol)
                    if bar:
                        if current_market_day is None:
                            current_market_day = bar.timestamp.date()
                        market_event = MarketEvent(
                            timestamp=bar.timestamp,
                            symbol=symbol,
                            price=bar.close,
                            volume=bar.volume,
                        )
                        self.events.append(market_event)
            else:
                self.continue_backtest = False

            # Process Python-side event queue for this bar
            while self.events:
                event = self.events.popleft()
                self._dispatch_event(event)
                self.events_processed += 1

            # Rust authoritative execution cycle after Python strategy events are emitted.
            if self.engine_backend == "rust" and self.rust_backtest_runtime:
                self._run_rust_execution_cycle(checkpoint="end_of_bar")
                if current_market_day is not None:
                    if self._last_market_day is None:
                        self._last_market_day = current_market_day
                    elif current_market_day != self._last_market_day:
                        self._reconcile_state(checkpoint="end_of_day")
                        self._last_market_day = current_market_day

            # RACE FIX: Clear reserved cash after all events in bar are processed
            self.portfolio_handler.clear_reserved_cash()

        if self.engine_backend == "rust" and self.rust_backtest_runtime:
            self._reconcile_state(checkpoint="end_of_run")

        # Calculate final performance metrics
        from datetime import timezone

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        results = self._generate_results(duration)

        logger.info(
            f"Backtest completed in {duration:.2f}s. " f"Processed {self.events_processed} events"
        )

        return results

    def _dispatch_event(self, event: Event) -> None:
        """
        Dispatch event to appropriate handler.
        """
        if event.event_type == EventType.MARKET and isinstance(event, MarketEvent):
            self._handle_market_event(event)
        elif event.event_type == EventType.SIGNAL and isinstance(event, SignalEvent):
            self._handle_signal_event(event)
            self.signals_generated += 1
        elif event.event_type == EventType.ORDER and isinstance(event, OrderEvent):
            self._handle_order_event(event)
        elif event.event_type == EventType.FILL and isinstance(event, FillEvent):
            self._handle_fill_event(event)
            self.fills_executed += 1

    def _handle_market_event(self, event: MarketEvent) -> None:
        """
        Handle market data update for a specific symbol.
        """
        # Update portfolio with latest prices
        self.portfolio_handler.update_timeindex(event.timestamp)

        # Update Rust runtime if enabled
        if self.engine_backend == "rust" and self.rust_backtest_runtime:
            latest_bar = self.data_handler.get_latest_bar(event.symbol)
            if latest_bar:
                self.rust_backtest_runtime.ingest_bar(
                    symbol=event.symbol,
                    timestamp=int(latest_bar.timestamp.timestamp()),
                    open=latest_bar.open,
                    high=latest_bar.high,
                    low=latest_bar.low,
                    close=latest_bar.close,
                    volume=latest_bar.volume,
                )

        try:
            # ... rest of market event logic ...
            symbol = event.symbol

            # Get latest bars for the specific symbol as a DataFrame (High Performance)
            df = self.data_handler.get_latest_bars_as_df(symbol, n=50).copy()
            if df.empty or len(df) < 20:
                return

            df.set_index("timestamp", inplace=True)
            df.attrs["symbol"] = symbol

            # Generate signals for this specific symbol
            signals = []
            is_portfolio = getattr(self.strategy, "is_portfolio_strategy", False)

            if is_portfolio:
                # For portfolio strategies, only run once per bar (e.g. using the first symbol)
                if symbol != self.data_handler.symbols[0]:
                    return

                # Try to build a combined dataframe if the strategy expects it
                combined_df = None

                # Gather data
                symbol_dfs = {}
                for s in self.data_handler.symbols:
                    s_bars = self.data_handler.get_latest_bars(s, n=50)
                    if s_bars and len(s_bars) >= 20:
                        s_df = pd.DataFrame([b.__dict__ for b in s_bars])
                        s_df.set_index("timestamp", inplace=True)
                        symbol_dfs[s] = s_df

                if not symbol_dfs:
                    return

                # StatArb specific logic (Pairs Trading) wants 'close' and 'close_y'
                if len(symbol_dfs) == 2 and "StatisticalArbitrage" in self.strategy.name:
                    sym1, sym2 = list(symbol_dfs.keys())
                    combined_df = symbol_dfs[sym1].copy()
                    combined_df["close_y"] = symbol_dfs[sym2]["close"]
                    combined_df.attrs["symbol"] = f"{sym1}-{sym2}"
                    signals = self.strategy.generate_signals(combined_df)
                else:
                    # Pass dict for general portfolio strategies
                    signals = self.strategy.generate_signals(symbol_dfs)

            elif hasattr(self.strategy, "generate_signals_for_symbol"):
                signals = self.strategy.generate_signals_for_symbol(symbol, df)
            elif hasattr(self.strategy, "generate_signals"):
                # Compatibility layer: just pass the single dataframe
                signals = self.strategy.generate_signals(df)
            else:
                logger.warning(f"Strategy {self.strategy.name} does not support signal generation")
                return

            # Add signal events to queue
            for signal in signals:
                signal_event = SignalEvent(
                    timestamp=event.timestamp,
                    symbol=signal.symbol,
                    signal_type=signal.signal_type.value,
                    strength=getattr(signal, "confidence", 0.8),
                    strategy_id=self.strategy.name,
                )
                self.events.append(signal_event)

        except Exception as e:
            logger.error(f"[Wave-3] Error in Optimized Engine: {e}", exc_info=True)

    def _handle_signal_event(self, event: SignalEvent) -> None:
        """
        Handle trading signal.

        Args:
            event: Signal event
        """
        if self.engine_backend == "rust" and self.rust_backtest_runtime:
            try:
                self.rust_backtest_runtime.process_signal(
                    symbol=event.symbol,
                    signal_type=event.signal_type,
                    strength=event.strength,
                    strategy_id=event.strategy_id,
                    correlation_id=self._new_correlation_id(),
                )
            except Exception as exc:
                self._handle_rust_runtime_failure(exc)
            return

        # Convert signal to orders
        orders = self.portfolio_handler.generate_orders(event)
        self._collect_python_risk_decisions()

        # Add order events to queue
        for order in orders:
            self.events.append(order)

    def _handle_order_event(self, event: OrderEvent) -> None:
        """
        Handle order placement.
        """
        self.orders_placed += 1

        # In Rust mode, execution happens in Rust authoritative runtime.
        if self.engine_backend == "rust":
            return

        # Execute order through simulated execution
        fill_event = self.execution_handler.execute_order(event)

        if fill_event:
            self.events.append(fill_event)

    def _handle_fill_event(self, event: FillEvent) -> None:
        """
        Handle order fill.

        Args:
            event: Fill event
        """
        # Update portfolio with fill
        self.portfolio_handler.update_fill(event)

        # Record for performance analysis
        self.performance_analyzer.record_fill(event)

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

        return {
            "metrics": metrics.to_dict(),
            "equity_curve": equity_curve,
            "holdings": holdings,
            "risk_decision_trace": list(self.risk_decision_trace),
            "reconciliation_trace": list(self.reconciliation_checkpoints),
            "execution_stats": {
                "duration_seconds": duration,
                "events_processed": self.events_processed,
                "signals_generated": self.signals_generated,
                "orders_placed": self.orders_placed,
                "fills_executed": self.fills_executed,
                "events_per_second": self.events_processed / duration if duration > 0 else 0,
                "rust_fallback_count": self.rust_fallback_count,
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
        if self.rust_fallback_to_python:
            phase = "init" if during_init else "runtime"
            self.rust_fallback_count += 1
            logger.warning(
                "Rust backtest runtime failure during {}: {}. Falling back to python backend.",
                phase,
                exc,
            )
            self.engine_backend = "python"
            self.rust_backtest_runtime = None
            return
        raise RuntimeError(f"Rust backtest runtime failure: {exc}") from exc

    def _collect_python_risk_decisions(self) -> None:
        if not hasattr(self.portfolio_handler, "pop_risk_decision_trace"):
            return
        raw_rows = self.portfolio_handler.pop_risk_decision_trace()
        self._append_risk_decisions(raw_rows, backend="python")

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
                    "sequence_no": int(row["sequence_no"]),
                    "decision": str(row["decision"]).upper(),
                    "reason_code": "NONE"
                    if reason_value is None or str(reason_value).strip() == ""
                    else str(reason_value).upper(),
                    "backend": backend,
                }
            )

    def _run_rust_execution_cycle(self, checkpoint: str = "end_of_bar") -> None:
        if not self.rust_backtest_runtime:
            return

        from datetime import timezone

        cid = self._new_correlation_id()
        try:
            self.rust_backtest_runtime.dispatch_until_idle(correlation_id=cid)
            rust_fills = self.rust_backtest_runtime.get_new_fills()
            rust_decisions = self.rust_backtest_runtime.get_new_risk_decisions()
        except Exception as exc:
            self._handle_rust_runtime_failure(exc)
            return

        for fill in rust_fills:
            side = str(fill.get("side", "")).upper()
            direction = "BUY" if side in {"BID", "BUY", "LONG"} else "SELL"
            quantity = int(round(float(fill.get("quantity", 0.0))))
            if direction == "SELL":
                quantity = -abs(quantity)
            else:
                quantity = abs(quantity)

            fill_event = FillEvent(
                timestamp=datetime.now(timezone.utc),
                symbol=fill["symbol"],
                exchange="RUST_SIMULATED",
                quantity=quantity,
                direction=direction,
                fill_price=float(fill["price"]),
                commission=float(fill["commission"]),
            )
            self._handle_fill_event(fill_event)
            self.fills_executed += 1

        self._append_risk_decisions(rust_decisions, backend="rust")
        self._reconcile_state(checkpoint=checkpoint)

    def _reconcile_state(self, checkpoint: str = "end_of_bar") -> None:
        """
        Perform mandatory reconciliation between Rust authoritative state and Python shadow state.
        """
        if not self.rust_backtest_runtime:
            return

        rust_state = self.rust_backtest_runtime.get_state()
        python_cash = float(self.portfolio_handler.portfolio.cash)
        python_mark_to_market = 0.0
        python_exposure = 0.0
        for symbol, position in self.portfolio_handler.portfolio.positions.items():
            latest_bar = self.data_handler.get_latest_bar(symbol)
            latest_price = (
                float(latest_bar.close) if latest_bar is not None else float(position.current_price)
            )
            signed_qty = float(position.quantity)
            python_mark_to_market += signed_qty * latest_price
            python_exposure += abs(signed_qty * latest_price)

        python_equity = python_cash + python_mark_to_market
        rust_equity = float(rust_state.get("equity", 0.0))

        equity_drift = abs(python_equity - rust_equity) / rust_equity if rust_equity > 0 else 0.0

        rust_exposure = 0.0
        for position in rust_state.get("positions", []):
            qty = float(position.get("signed_quantity", position.get("quantity", 0.0)))
            price = float(position.get("current_price", 0.0))
            rust_exposure += abs(qty * price)

        exposure_drift_bps = (
            abs(python_exposure - rust_exposure) / rust_exposure * 10_000.0
            if rust_exposure > 0
            else 0.0
        )

        checkpoint_record = {
            "checkpoint": checkpoint,
            "equity_drift": equity_drift,
            "exposure_drift_bps": exposure_drift_bps,
            "python_equity": python_equity,
            "rust_equity": rust_equity,
            "passed": equity_drift <= 0.0010 and exposure_drift_bps <= 5.0,
        }
        self.reconciliation_checkpoints.append(checkpoint_record)

        if equity_drift > 0.0010 or exposure_drift_bps > 5.0:
            self.reconciliation_failures += 1
            message = (
                "RECONCILIATION FAILED: "
                f"equity drift={equity_drift:.4%} (limit 0.10%), "
                f"exposure drift={exposure_drift_bps:.2f} bps (limit 5 bps). "
                f"checkpoint={checkpoint}. "
                f"Python equity={python_equity:.2f}, Rust equity={rust_equity:.2f}."
            )
            logger.error(message)
            raise RuntimeError(message)
