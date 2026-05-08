from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import pandas as pd
import pytest

from backtesting.engine import BacktestEngine, StrategyBatchInterfaceRequired
from backtesting.data_handler import HistoricalDataHandler
from backtesting.portfolio_handler import PortfolioHandler
from models.events import SignalEvent
from strategies.base import Signal, Strategy


class BatchMockStrategy(Strategy):
    def __init__(self, name: str = "BatchMockStrategy"):
        super().__init__(name)

    def generate_signals(self, data: Any) -> list[Signal]:
        return []

    def generate_signal_frame(
        self, data_by_symbol: dict[str, pd.DataFrame], context: Any = None
    ) -> pd.DataFrame:
        rows = []
        for symbol, df in data_by_symbol.items():
            if len(df) >= 25:
                row = df.iloc[24]
                rows.append(
                    {
                        "timestamp": row["timestamp"],
                        "symbol": symbol,
                        "signal_type": "LONG",
                        "strength": 1.0,
                        "strategy_id": self.name,
                        "signal_id": f"{symbol}:25:LONG",
                    }
                )
        return pd.DataFrame(
            rows,
            columns=["timestamp", "symbol", "signal_type", "strength", "strategy_id", "signal_id"],
        )

    def calculate_position_size(
        self, signal: Signal, account_value: float, current_position: float = 0.0
    ) -> float:
        return 10.0


class LegacyOnlyStrategy(Strategy):
    def __init__(self):
        super().__init__("LegacyOnlyStrategy")

    def generate_signals(self, data: Any) -> list[Signal]:
        return []

    def calculate_position_size(
        self, signal: Signal, account_value: float, current_position: float = 0.0
    ) -> float:
        return 10.0


class DummyRustRuntime:
    def __init__(self):
        self.market_symbols: list[str] = []
        self.signals = pd.DataFrame()
        self.processed_signals: list[dict[str, Any]] = []
        self.state = {
            "cash": 100000.0,
            "equity": 100000.0,
            "realized_pnl": 0.0,
            "unrealized_pnl": 0.0,
            "positions": [],
            "execution_stats": {
                "events_processed": 25,
                "signals_processed": 1,
                "orders_placed": 1,
                "fills_executed": 1,
            },
        }
        self.decisions = [
            {
                "timestamp": "2024-01-02T00:00:00+00:00",
                "symbol": "TEST",
                "signal_type": "LONG",
                "strategy_id": "BatchMockStrategy",
                "signal_id": "TEST:25:LONG",
                "sequence_no": 1,
                "decision": "ALLOW",
                "reason_code": "NONE",
            }
        ]

    def load_market_data_columnar(self, symbol: str, df: pd.DataFrame) -> None:
        self.market_symbols.append(symbol)

    def load_signals(self, signal_frame: pd.DataFrame) -> None:
        self.signals = signal_frame

    def run_to_completion(self) -> None:
        return None

    def state_snapshot(self) -> dict[str, Any]:
        return self.state

    def get_new_risk_decisions(self) -> list[dict[str, Any]]:
        decisions = list(self.decisions)
        self.decisions.clear()
        return decisions

    def process_signal(self, **kwargs) -> None:
        self.processed_signals.append(kwargs)


def test_initialization_uses_rust_backend(data_handler, portfolio_handler):
    runtime = DummyRustRuntime()
    engine = BacktestEngine(
        data_handler=data_handler,
        portfolio_handler=portfolio_handler,
        strategy=BatchMockStrategy(),
        rust_backtest_runtime=runtime,  # type: ignore[arg-type]
    )

    assert engine.rust_backtest_runtime is runtime
    assert engine.events_processed == 0



def test_missing_batch_strategy_interface_fails(data_handler, portfolio_handler):
    engine = BacktestEngine(
        data_handler=data_handler,
        portfolio_handler=portfolio_handler,
        strategy=LegacyOnlyStrategy(),
        rust_backtest_runtime=DummyRustRuntime(),  # type: ignore[arg-type]
    )

    with pytest.raises(StrategyBatchInterfaceRequired):
        engine.run()


def test_run_uses_rust_batch_runtime(data_handler, portfolio_handler):
    runtime = DummyRustRuntime()
    engine = BacktestEngine(
        data_handler=data_handler,
        portfolio_handler=portfolio_handler,
        strategy=BatchMockStrategy(),
        rust_backtest_runtime=runtime,  # type: ignore[arg-type]
    )

    results = engine.run()

    assert runtime.market_symbols == ["TEST"]
    assert len(runtime.signals) == 1
    assert engine.events_processed == 25
    assert engine.signals_generated == 1
    assert results["execution_stats"]["rust_fallback_count"] == 0
    assert results["risk_decision_trace"][0]["signal_id"] == "TEST:25:LONG"



