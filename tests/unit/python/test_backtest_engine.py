import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Any
from unittest.mock import MagicMock

from backtesting.engine import BacktestEngine
from backtesting.data_handler import HistoricalDataHandler
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.portfolio_handler import PortfolioHandler
from backtesting.position_sizer import FixedAmountSizer
from models.events import SignalEvent, MarketEvent, EventType
from strategies.base import Strategy, Signal, SignalType
from models.governance import ControlRecord, ControlStatus, ControlType


class MockStrategy(Strategy):
    """Simple mock strategy for testing"""

    def __init__(self, name="MockStrategy", signals_to_generate=None):
        super().__init__(name)
        self.signals_to_generate = signals_to_generate or []

    def generate_signals(self, data: Any) -> list[Signal]:
        """Return predefined signals"""
        return self.signals_to_generate

    def calculate_position_size(
        self, signal: Signal, account_value: float, current_position: float = 0.0
    ) -> float:
        """Fixed position size of 10 shares"""
        return 10.0


class TestBacktestEngine:
    """Test engine initialization and core loop"""

    def test_initialization(self, data_handler, execution_handler, portfolio_handler):
        """Test engine initialization"""
        strategy = MockStrategy()
        engine = BacktestEngine(
            data_handler=data_handler,
            execution_handler=execution_handler,
            portfolio_handler=portfolio_handler,
            strategy=strategy,
        )

        assert engine.data_handler == data_handler
        assert engine.execution_handler == execution_handler
        assert engine.portfolio_handler == portfolio_handler
        assert engine.strategy == strategy
        assert engine.events_processed == 0

    def test_run_empty_data(self, temp_data_dir, execution_handler):
        """Test backtest with empty data"""
        # Create empty CSV
        empty_data = pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])
        empty_data.to_csv(temp_data_dir / "EMPTY.csv", index=False)

        data_handler = HistoricalDataHandler(symbols=["EMPTY"], data_dir=temp_data_dir)
        portfolio_handler = PortfolioHandler(initial_capital=100000.0, data_handler=data_handler)
        strategy = MockStrategy()

        engine = BacktestEngine(
            data_handler=data_handler,
            execution_handler=execution_handler,
            portfolio_handler=portfolio_handler,
            strategy=strategy,
        )

        results = engine.run()
        assert results["metrics"]["total_trades"] == 0
        assert results["metrics"]["total_return"] == 0.0

    def test_event_processing_flow(self, data_handler, execution_handler):
        """Test the full event flow: Market -> Signal -> Order -> Fill"""
        portfolio_handler = PortfolioHandler(
            initial_capital=100000.0,
            data_handler=data_handler,
            position_sizer=FixedAmountSizer(amount=1000.0),
        )

        signal = Signal(
            timestamp=datetime.now(timezone.utc),
            symbol="TEST",
            signal_type=SignalType.LONG,
            price=100.0,
            quantity=10.0,
        )
        strategy = MockStrategy(signals_to_generate=[signal])

        engine = BacktestEngine(
            data_handler=data_handler,
            execution_handler=execution_handler,
            portfolio_handler=portfolio_handler,
            strategy=strategy,
        )

        # Run full engine loop
        results = engine.run()

        # Check if events were processed
        assert engine.events_processed > 0
        assert "metrics" in results


class TestPositionManagementIntegration:
    """Test position management through the engine and handlers"""

    def test_successful_trade_cycle(self, data_handler, execution_handler):
        """Test a full buy-then-sell cycle"""
        portfolio_handler = PortfolioHandler(
            initial_capital=100000.0,
            data_handler=data_handler,
            position_sizer=FixedAmountSizer(amount=10000.0),
        )
        strategy = MockStrategy()
        engine = BacktestEngine(
            data_handler=data_handler,
            execution_handler=execution_handler,
            portfolio_handler=portfolio_handler,
            strategy=strategy,
        )

        # Mock AllocationManager to always allow
        mock_record = ControlRecord(
            portfolio_check_id="TEST-CHECK",
            strategy_set_id="TEST-STRATEGY",
            control_type=ControlType.ALLOCATION,
            status=ControlStatus.ALLOW,
            owner="test_owner",
            limit_value=10000.0,
            measured_value=1000.0,
            breach_flag=False,
            decision_reason="Mocked allow",
            evidence_ids=["EV-1"],
            risk_impact_flag=False,
            next_action="PROCEED",
            eta="IMMEDIATE",
        )
        engine.allocation_manager.check_allocation = MagicMock(return_value=mock_record)

        # 1. Update bars to have a current price
        data_handler.update_bars()
        bar = data_handler.get_latest_bar("TEST")

        # 2. Dispatch SignalEvent via engine.dispatch to ensure metrics are updated
        signal_event = SignalEvent(
            symbol="TEST",
            timestamp=bar.timestamp,
            signal_type="LONG",
            strength=1.0,
            strategy_id="MockStrategy",
        )
        engine._dispatch_event(signal_event)

        assert engine.signals_generated == 1

        # Check if order event is in the queue
        assert len(engine.events) == 1
        order_event = engine.events.popleft()
        assert order_event.event_type == EventType.ORDER

        # 3. Dispatch the order event
        engine._dispatch_event(order_event)
        assert engine.orders_placed == 1

        # Check if fill event is in the queue
        assert len(engine.events) == 1
        fill_event = engine.events.popleft()
        assert fill_event.event_type == EventType.FILL

        # 4. Dispatch the fill event
        engine._dispatch_event(fill_event)
        assert engine.fills_executed == 1

        # Check portfolio position
        assert "TEST" in portfolio_handler.portfolio.positions
        assert portfolio_handler.portfolio.positions["TEST"].quantity > 0
