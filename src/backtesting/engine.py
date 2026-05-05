"""
Event-driven backtesting engine.
"""

from collections import deque
from datetime import datetime
from typing import Dict, Optional, Any
import pandas as pd
from loguru import logger

from models.events import Event, EventType, MarketEvent, SignalEvent, OrderEvent, FillEvent
from backtesting.data_handler import HistoricalDataHandler
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.portfolio_handler import PortfolioHandler
from backtesting.performance import PerformanceAnalyzer
from risk.allocation_manager import AllocationManager, AllocationPolicy
from research.repro_manager import ReproducibilityManager


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

        logger.info(f"Initialized BacktestEngine from {start_date} to {end_date}")

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
            # Update market data bars
            if self.data_handler.continue_backtest:
                self.data_handler.update_bars()

                # Optimized (Wave-3): Emit MarketEvent for ALL symbols to support parallel
                # strategies. This ensures each strategy gets data for all symbols it tracks.
                for symbol in self.data_handler.symbols:
                    bar = self.data_handler.get_latest_bar(symbol)
                    if bar:
                        market_event = MarketEvent(
                            timestamp=bar.timestamp,
                            symbol=symbol,
                            price=bar.close,
                            volume=bar.volume,
                        )
                        self.events.append(market_event)
            else:
                self.continue_backtest = False

            # Process event queue for this bar
            while self.events:
                event = self.events.popleft()
                self._dispatch_event(event)
                self.events_processed += 1

            # RACE FIX: Clear reserved cash after all events in bar are processed
            self.portfolio_handler.clear_reserved_cash()

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
            self.orders_placed += 1
        elif event.event_type == EventType.FILL and isinstance(event, FillEvent):
            self._handle_fill_event(event)
            self.fills_executed += 1

    def _handle_market_event(self, event: MarketEvent) -> None:
        """
        Handle market data update for a specific symbol.

        Args:
            event: Market event
        """
        # Update portfolio with latest prices
        self.portfolio_handler.update_timeindex(event.timestamp)

        try:
            # OPTIMIZATION (Wave-3): Only process the symbol that triggered the event
            symbol = event.symbol

            # Get latest bars for the specific symbol
            bars = self.data_handler.get_latest_bars(symbol, n=50)
            if not bars or len(bars) < 20:
                return

            # Convert to DataFrame format
            df = pd.DataFrame(
                [
                    {
                        "timestamp": bar.timestamp,
                        "open": bar.open,
                        "high": bar.high,
                        "low": bar.low,
                        "close": bar.close,
                        "volume": bar.volume,
                    }
                    for bar in bars
                ]
            )
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
        # Convert signal to orders
        orders = self.portfolio_handler.generate_orders(event)

        # Add order events to queue
        for order in orders:
            self.events.append(order)

    def _handle_order_event(self, event: OrderEvent) -> None:
        """
        Handle order placement.

        Args:
            event: Order event
        """
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

        return {
            "metrics": metrics.to_dict(),
            "equity_curve": equity_curve,
            "holdings": holdings,
            "execution_stats": {
                "duration_seconds": duration,
                "events_processed": self.events_processed,
                "signals_generated": self.signals_generated,
                "orders_placed": self.orders_placed,
                "fills_executed": self.fills_executed,
                "events_per_second": self.events_processed / duration if duration > 0 else 0,
            },
        }
