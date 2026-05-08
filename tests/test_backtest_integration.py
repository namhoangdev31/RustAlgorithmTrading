"""Canonical Phase 2.2 gate file for Rust-only backtest integration."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import pytest

pytest.importorskip("signal_bridge", reason="signal_bridge extension is required for rust backend gate")

from backtesting.data_handler import HistoricalDataHandler
from backtesting.engine import BacktestEngine, StrategyBatchInterfaceRequired
from backtesting.portfolio_handler import FixedAmountSizer, PortfolioHandler
from backtesting.risk_integrity import compare_risk_decision_traces
from strategies.base import Signal, Strategy


class DeterministicBatchStrategy(Strategy):
    def __init__(self):
        super().__init__(name="DeterministicBatchStrategy")

    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        return []

    def generate_signal_frame(
        self, data_by_symbol: dict[str, pd.DataFrame], context: Any = None
    ) -> pd.DataFrame:
        rows = []
        for symbol, df in data_by_symbol.items():
            for bar_index, signal_type in [(25, "LONG"), (45, "EXIT")]:
                row = df.iloc[bar_index - 1]
                rows.append(
                    {
                        "timestamp": row["timestamp"],
                        "symbol": symbol,
                        "signal_type": signal_type,
                        "strength": 1.0,
                        "strategy_id": self.name,
                        "signal_id": f"{symbol}:{bar_index}:{signal_type}",
                    }
                )
        return pd.DataFrame(rows)

    def calculate_position_size(
        self,
        signal: Signal,
        account_value: float,
        current_position: float = 0.0,
    ) -> float:
        return 100.0


class LegacyOnlyStrategy(Strategy):
    def __init__(self):
        super().__init__(name="LegacyOnlyStrategy")

    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        return []

    def calculate_position_size(
        self,
        signal: Signal,
        account_value: float,
        current_position: float = 0.0,
    ) -> float:
        return 100.0


@pytest.fixture
def sample_data() -> dict[str, pd.DataFrame]:
    rng = np.random.default_rng(42)
    dates = pd.date_range(start="2024-01-01", periods=120, freq="h", tz="UTC")
    prices = 100 + np.cumsum(rng.normal(0.02, 0.35, 120))
    df = pd.DataFrame(
        {
            "timestamp": dates,
            "open": prices * 0.998,
            "high": prices * 1.002,
            "low": prices * 0.996,
            "close": prices,
            "volume": rng.integers(10_000, 60_000, 120),
        }
    )
    return {"AAPL": df}


def _make_engine(data_dir, strategy: Strategy | None = None) -> BacktestEngine:
    symbols = ["AAPL"]
    data_handler = HistoricalDataHandler(symbols=symbols, data_dir=data_dir)
    portfolio_handler = PortfolioHandler(
        initial_capital=100000.0,
        position_sizer=FixedAmountSizer(10000),
        data_handler=data_handler,
    )

    return BacktestEngine(
        data_handler=data_handler,
        portfolio_handler=portfolio_handler,
        strategy=strategy or DeterministicBatchStrategy(),
    )


def _write_sample_data(sample_data: dict[str, pd.DataFrame], data_dir) -> None:
    data_dir.mkdir()
    for symbol, df in sample_data.items():
        df.to_csv(data_dir / f"{symbol}.csv", index=False)


def _final_equity(results: dict) -> float:
    equity_curve = results["equity_curve"]
    return float(equity_curve["equity"].iloc[-1]) if not equity_curve.empty else 0.0


def test_rust_only_backtest_runs_to_completion(sample_data, tmp_path):
    data_dir = tmp_path / "data"
    _write_sample_data(sample_data, data_dir)

    engine = _make_engine(data_dir)
    results = engine.run()

    assert _final_equity(results) > 0
    assert results["execution_stats"]["rust_fallback_count"] == 0
    assert results["execution_stats"]["signals_generated"] == 2


def test_rust_backend_reproducibility(sample_data, tmp_path):
    data_dir = tmp_path / "data_repro"
    _write_sample_data(sample_data, data_dir)

    outcomes = []
    for _ in range(2):
        engine = _make_engine(data_dir)
        results = engine.run()
        outcomes.append(
            (
                _final_equity(results),
                results["risk_decision_trace"],
                {
                    key: value
                    for key, value in results["execution_stats"].items()
                    if key not in {"duration_seconds", "events_per_second"}
                },
            )
        )

    assert outcomes[0] == outcomes[1]


def test_legacy_strategy_fails_clear_in_rust_only_mode(sample_data, tmp_path):
    data_dir = tmp_path / "data_legacy"
    _write_sample_data(sample_data, data_dir)

    engine = _make_engine(data_dir, strategy=LegacyOnlyStrategy())

    with pytest.raises(StrategyBatchInterfaceRequired):
        engine.run()


def test_risk_integrity_against_golden_trace(sample_data, tmp_path):
    data_dir = tmp_path / "data_risk"
    _write_sample_data(sample_data, data_dir)

    engine = _make_engine(data_dir)
    results = engine.run()
    candidate = results["risk_decision_trace"]
    baseline = [
        {
            "timestamp": pd.Timestamp(sample_data["AAPL"]["timestamp"].iloc[24]).isoformat(),
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "DeterministicBatchStrategy",
            "signal_id": "AAPL:25:LONG",
            "sequence_no": 1,
            "decision": "ALLOW",
            "reason_code": "NONE",
        }
    ]

    comparison = compare_risk_decision_traces(baseline, candidate)

    assert comparison.false_allow_delta == 0
    assert comparison.false_reject_delta == 0
    assert comparison.blocked_delta == 0
    assert comparison.missing_keys_in_candidate == 0
    assert comparison.extra_keys_in_candidate == 0
