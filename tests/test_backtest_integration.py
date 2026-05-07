"""Canonical Phase 2 gate file for backtest core integration."""

from __future__ import annotations

from datetime import datetime

import numpy as np
import pandas as pd
import pytest

pytest.importorskip("signal_bridge", reason="signal_bridge extension is required for rust backend gate")

from backtesting.data_handler import HistoricalDataHandler
from backtesting.engine import BacktestEngine
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.portfolio_handler import FixedAmountSizer, PortfolioHandler
from backtesting.risk_integrity import compare_risk_decision_traces
from strategies.base import Signal, SignalType, Strategy


class DeterministicSignalStrategy(Strategy):
    """Small deterministic strategy for backend parity/replay tests."""

    def __init__(self):
        super().__init__(name="DeterministicSignalStrategy")
        self._entered = False
        self._exited = False

    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        symbol = data.attrs.get("symbol", "AAPL")
        ts = pd.Timestamp(data.index[-1]).to_pydatetime()
        price = float(data["close"].iloc[-1])

        signals: list[Signal] = []
        if len(data) >= 25 and not self._entered:
            signals.append(
                Signal(
                    timestamp=ts,
                    symbol=symbol,
                    signal_type=SignalType.LONG,
                    price=price,
                    confidence=1.0,
                )
            )
            self._entered = True
        elif len(data) >= 45 and self._entered and not self._exited:
            signals.append(
                Signal(
                    timestamp=ts,
                    symbol=symbol,
                    signal_type=SignalType.EXIT,
                    price=price,
                    confidence=1.0,
                )
            )
            self._exited = True
        return signals

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
    dates = pd.date_range(start="2024-01-01", periods=120, freq="h")
    prices = 100 + np.cumsum(rng.normal(0.02, 0.35, 120))
    df = pd.DataFrame(
        {
            "open": prices * 0.998,
            "high": prices * 1.002,
            "low": prices * 0.996,
            "close": prices,
            "volume": rng.integers(10_000, 60_000, 120),
        },
        index=dates,
    )
    df.index.name = "timestamp"
    return {"AAPL": df}


def _make_engine(data_dir, backend: str, seed: int) -> BacktestEngine:
    symbols = ["AAPL"]
    data_handler = HistoricalDataHandler(symbols=symbols, data_dir=data_dir)
    execution_handler = SimulatedExecutionHandler(
        commission_rate=0.001,
        slippage_bps=0.0,
        market_impact_bps=0.0,
        partial_fill_probability=0.0,
        random_seed=seed,
    )
    portfolio_handler = PortfolioHandler(
        initial_capital=100000.0,
        position_sizer=FixedAmountSizer(10000),
        data_handler=data_handler,
    )
    strategy = DeterministicSignalStrategy()

    return BacktestEngine(
        data_handler=data_handler,
        execution_handler=execution_handler,
        portfolio_handler=portfolio_handler,
        strategy=strategy,
        engine_backend=backend,
        rust_fallback_to_python=False,
    )


def _final_equity(results: dict) -> float:
    equity_curve = results["equity_curve"]
    return float(equity_curve["equity"].iloc[-1]) if not equity_curve.empty else 0.0


def test_backtest_parity_python_vs_rust(sample_data, tmp_path):
    """Strict parity gate: PnL drift <= 0.10%."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    for symbol, df in sample_data.items():
        df.to_csv(data_dir / f"{symbol}.csv")

    engine_py = _make_engine(data_dir, backend="python", seed=42)
    engine_rust = _make_engine(data_dir, backend="rust", seed=42)

    results_py = engine_py.run()
    results_rust = engine_rust.run()

    py_final_equity = _final_equity(results_py)
    rust_final_equity = _final_equity(results_rust)

    drift = abs(py_final_equity - rust_final_equity) / py_final_equity if py_final_equity > 0 else 0.0
    assert drift <= 0.0010, f"PnL drift {drift:.4%} exceeds tolerance 0.10%"


def test_rust_backend_reproducibility(sample_data, tmp_path):
    """Rust backend must be deterministic for identical seed + input."""
    data_dir = tmp_path / "data_repro"
    data_dir.mkdir()
    for symbol, df in sample_data.items():
        df.to_csv(data_dir / f"{symbol}.csv")

    outcomes = []
    for _ in range(2):
        engine = _make_engine(data_dir, backend="rust", seed=42)
        results = engine.run()
        outcomes.append(_final_equity(results))

    assert outcomes[0] == outcomes[1]


def test_default_backend_switch_smoke_with_env(sample_data, tmp_path, monkeypatch):
    """
    Integration smoke: default backend should respect env-driven promotion switch.
    """
    data_dir = tmp_path / "data_default_switch"
    data_dir.mkdir()
    for symbol, df in sample_data.items():
        df.to_csv(data_dir / f"{symbol}.csv")

    monkeypatch.setenv("BACKTEST_ENGINE_BACKEND_DEFAULT", "rust")
    engine = _make_engine(data_dir, backend="rust", seed=123)

    engine_default = BacktestEngine(
        data_handler=engine.data_handler,
        execution_handler=engine.execution_handler,
        portfolio_handler=engine.portfolio_handler,
        strategy=engine.strategy,
        engine_backend=None,
        rust_fallback_to_python=False,
    )
    assert engine_default.engine_backend == "rust"


def test_risk_integrity_zero_deltas_python_vs_rust(sample_data, tmp_path):
    """
    Phase 2 integrity gate: false-allow/reject deltas remain zero.
    """
    data_dir = tmp_path / "data_risk_integrity"
    data_dir.mkdir()
    for symbol, df in sample_data.items():
        df.to_csv(data_dir / f"{symbol}.csv")

    engine_py = _make_engine(data_dir, backend="python", seed=42)
    engine_rust = _make_engine(data_dir, backend="rust", seed=42)

    results_py = engine_py.run()
    results_rust = engine_rust.run()

    comparison = compare_risk_decision_traces(
        results_py.get("risk_decision_trace", []),
        results_rust.get("risk_decision_trace", []),
    )

    assert comparison.false_allow_delta == 0
    assert comparison.false_reject_delta == 0
    assert comparison.blocked_delta == 0
    assert comparison.missing_keys_in_candidate == 0
    assert comparison.extra_keys_in_candidate == 0
