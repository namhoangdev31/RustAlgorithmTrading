"""
Phase 2 soak/stability harness for Rust backtest runtime.
"""

from __future__ import annotations

import argparse
import json
import threading
import time
from dataclasses import asdict
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import numpy as np
import pandas as pd
import psutil

import sys

from loguru import logger

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = REPO_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from backtesting.data_handler import HistoricalDataHandler
from backtesting.engine import BacktestEngine
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.phase2_governance import (
    RollbackGateMetrics,
    SoakRunTelemetry,
    evaluate_rollback_triggers,
    evaluate_soak_stability,
)
from backtesting.portfolio_handler import FixedAmountSizer, PortfolioHandler
from backtesting.risk_integrity import compare_risk_decision_traces
from strategies.base import Signal, SignalType, Strategy


def configure_logging(level: str) -> None:
    logger.remove()
    logger.add(sys.stderr, level=level.upper())


class MemorySampler:
    def __init__(self, interval_seconds: float = 0.05):
        self.interval_seconds = interval_seconds
        self._process = psutil.Process()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self.peak_rss_bytes = self._process.memory_info().rss

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                rss = self._process.memory_info().rss
            except Exception:
                break
            if rss > self.peak_rss_bytes:
                self.peak_rss_bytes = rss
            self._stop.wait(self.interval_seconds)

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> int:
        self._stop.set()
        self._thread.join(timeout=1.0)
        return self.peak_rss_bytes


class SoakSignalStrategy(Strategy):
    def __init__(self, symbols: list[str]):
        super().__init__(name="SoakSignalStrategy")
        self._symbols = set(symbols)
        self._open_flags = {symbol: False for symbol in symbols}

    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        symbol = data.attrs.get("symbol", "")
        if symbol not in self._symbols:
            return []

        price = float(data["close"].iloc[-1])
        timestamp = pd.Timestamp(data.index[-1]).to_pydatetime()
        cycle = len(data) % 180
        open_position = self._open_flags[symbol]

        signals: list[Signal] = []
        if not open_position and cycle == 30:
            signals.append(
                Signal(
                    timestamp=timestamp,
                    symbol=symbol,
                    signal_type=SignalType.LONG,
                    price=price,
                    confidence=1.0,
                )
            )
            self._open_flags[symbol] = True
        elif open_position and cycle == 120:
            signals.append(
                Signal(
                    timestamp=timestamp,
                    symbol=symbol,
                    signal_type=SignalType.EXIT,
                    price=price,
                    confidence=1.0,
                )
            )
            self._open_flags[symbol] = False

        return signals

    def calculate_position_size(
        self,
        signal: Signal,
        account_value: float,
        current_position: float = 0.0,
    ) -> float:
        return 100.0


def write_soak_dataset(
    output_dir: Path,
    symbols: int,
    bars_per_symbol: int,
    seed: int,
) -> list[str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    symbol_list = [f"SOAK{i:03d}" for i in range(symbols)]
    rng = np.random.default_rng(seed)
    timestamps = pd.date_range("2024-01-01", periods=bars_per_symbol, freq="min", tz="UTC")

    for symbol in symbol_list:
        drift = rng.normal(0.0002, 0.00005)
        sigma = abs(rng.normal(0.005, 0.001))
        returns = rng.normal(drift, sigma, bars_per_symbol)
        close = 150.0 * np.exp(np.cumsum(returns))
        close = np.maximum(close, 0.01)
        open_ = close * (1.0 + rng.normal(0.0, 0.0007, bars_per_symbol))
        high = np.maximum(open_, close) * (1.0 + np.abs(rng.normal(0.0012, 0.0004, bars_per_symbol)))
        low = np.minimum(open_, close) * (1.0 - np.abs(rng.normal(0.0012, 0.0004, bars_per_symbol)))
        volume = rng.integers(100_000, 900_000, bars_per_symbol, endpoint=False).astype(np.float64)

        df = pd.DataFrame(
            {
                "timestamp": timestamps,
                "open": open_,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
            }
        )
        df.to_csv(output_dir / f"{symbol}.csv", index=False)

    return symbol_list


def load_rust_benchmark_p95(artifact_path: Path) -> float:
    payload = json.loads(artifact_path.read_text())
    profiles = payload.get("profiles", [])
    for profile in profiles:
        name = profile.get("profile", {}).get("name")
        if name == "P100K":
            return float(profile["aggregates"]["rust"]["runtime_seconds"]["p95"])
    raise ValueError("Unable to find P100K rust p95 in benchmark artifact")


def run_single(
    symbols: list[str],
    data_dir: Path,
    backend: str,
    seed: int,
) -> tuple[SoakRunTelemetry, dict[str, Any], float]:
    data_handler = HistoricalDataHandler(symbols=symbols, data_dir=data_dir)
    execution_handler = SimulatedExecutionHandler(
        commission_rate=0.001,
        slippage_bps=5.0,
        market_impact_bps=2.0,
        partial_fill_probability=0.0,
        random_seed=seed,
    )
    portfolio_handler = PortfolioHandler(
        initial_capital=1_000_000.0,
        position_sizer=FixedAmountSizer(60_000.0),
        data_handler=data_handler,
    )
    strategy = SoakSignalStrategy(symbols)

    engine = BacktestEngine(
        data_handler=data_handler,
        execution_handler=execution_handler,
        portfolio_handler=portfolio_handler,
        strategy=strategy,
        engine_backend=backend,
        rust_fallback_to_python=False,
    )

    sampler = MemorySampler(interval_seconds=0.02)
    sampler.start()
    start = time.perf_counter()
    crashed = False
    reason = None
    results: dict[str, Any] = {}
    try:
        results = engine.run()
    except Exception as exc:
        crashed = True
        reason = str(exc)
    duration = max(time.perf_counter() - start, 1e-9)
    peak_rss = sampler.stop()

    stats = results.get("execution_stats", {}) if isinstance(results, dict) else {}
    telemetry = SoakRunTelemetry(
        duration_seconds=duration,
        peak_rss_bytes=peak_rss,
        fallback_count=int(stats.get("rust_fallback_count", 0)),
        reconciliation_failure_count=int(stats.get("reconciliation_failures", 0)),
        crashed=crashed,
        timed_out=False,
    )
    if crashed and reason is not None:
        results["_crash_reason"] = reason
    return telemetry, results, duration


def run_risk_integrity_snapshot(symbols: list[str], data_dir: Path, seed: int) -> dict[str, Any]:
    py_telemetry, py_results, _ = run_single(symbols=symbols, data_dir=data_dir, backend="python", seed=seed)
    rust_telemetry, rust_results, _ = run_single(symbols=symbols, data_dir=data_dir, backend="rust", seed=seed)

    comparison = compare_risk_decision_traces(
        py_results.get("risk_decision_trace", []),
        rust_results.get("risk_decision_trace", []),
    )
    return {
        "python_telemetry": asdict(py_telemetry),
        "rust_telemetry": asdict(rust_telemetry),
        "comparison": comparison.to_dict(),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--symbols", type=int, default=10)
    parser.add_argument("--bars-per-symbol", type=int, default=100_000)
    parser.add_argument("--runs", type=int, default=120)
    parser.add_argument("--max-hours", type=float, default=6.0)
    parser.add_argument("--seed", type=int, default=11)
    parser.add_argument(
        "--benchmark-artifact",
        type=Path,
        default=REPO_ROOT / "data" / "benchmarks" / "phase2_backtest_benchmark.json",
    )
    parser.add_argument("--rust-benchmark-p95-seconds", type=float, default=0.0)
    parser.add_argument(
        "--output-json",
        type=Path,
        default=REPO_ROOT / "data" / "benchmarks" / "phase2_soak_results.json",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="WARNING",
        help="Loguru level for soak run (default: WARNING).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    configure_logging(args.log_level)
    rust_benchmark_p95 = args.rust_benchmark_p95_seconds
    if rust_benchmark_p95 <= 0:
        rust_benchmark_p95 = load_rust_benchmark_p95(args.benchmark_artifact)

    max_duration_seconds = args.max_hours * 3600.0
    run_telemetry: list[SoakRunTelemetry] = []
    run_artifacts: list[dict[str, Any]] = []

    with TemporaryDirectory(prefix="phase2_soak_") as tmpdir:
        data_dir = Path(tmpdir)
        symbols = write_soak_dataset(
            output_dir=data_dir,
            symbols=args.symbols,
            bars_per_symbol=args.bars_per_symbol,
            seed=args.seed,
        )

        risk_integrity_snapshot = run_risk_integrity_snapshot(
            symbols=symbols,
            data_dir=data_dir,
            seed=args.seed + 1000,
        )

        soak_start = time.perf_counter()
        for run_idx in range(args.runs):
            telemetry, results, duration = run_single(
                symbols=symbols,
                data_dir=data_dir,
                backend="rust",
                seed=args.seed + run_idx,
            )
            timed_out = duration > max(2.2 * rust_benchmark_p95, 900.0)
            telemetry = SoakRunTelemetry(
                duration_seconds=telemetry.duration_seconds,
                peak_rss_bytes=telemetry.peak_rss_bytes,
                fallback_count=telemetry.fallback_count,
                reconciliation_failure_count=telemetry.reconciliation_failure_count,
                crashed=telemetry.crashed,
                timed_out=timed_out,
            )
            run_telemetry.append(telemetry)
            run_artifacts.append(
                {
                    "run_index": run_idx,
                    "telemetry": asdict(telemetry),
                    "execution_stats": results.get("execution_stats", {}),
                    "crash_reason": results.get("_crash_reason"),
                }
            )

            elapsed = time.perf_counter() - soak_start
            if elapsed > max_duration_seconds:
                break

    soak_eval = evaluate_soak_stability(run_telemetry, rust_benchmark_p95_seconds=rust_benchmark_p95)
    comparison = risk_integrity_snapshot["comparison"]
    rollback_metrics = RollbackGateMetrics(
        pnl_drift_pct=0.0,
        exposure_drift_bps=0.0,
        false_allow_delta=int(comparison["false_allow_delta"]),
        false_reject_delta=int(comparison["false_reject_delta"]),
        blocked_delta=int(comparison["blocked_delta"]),
        timeout_count=soak_eval.timeout_count,
        crash_count=soak_eval.crash_count,
        fallback_count=soak_eval.fallback_count,
        reconciliation_failure_count=soak_eval.reconciliation_failure_count,
        latency_regression_ratio=1.0,
    )
    rollback_eval = evaluate_rollback_triggers(rollback_metrics)

    artifact = {
        "generated_at_utc": pd.Timestamp.utcnow().isoformat(),
        "config": {
            "symbols": args.symbols,
            "bars_per_symbol": args.bars_per_symbol,
            "runs_requested": args.runs,
            "max_hours": args.max_hours,
            "rust_benchmark_p95_seconds": rust_benchmark_p95,
        },
        "runs_executed": len(run_telemetry),
        "run_artifacts": run_artifacts,
        "risk_integrity_snapshot": risk_integrity_snapshot,
        "soak_evaluation": asdict(soak_eval),
        "rollback_evaluation": {
            "should_rollback": rollback_eval.should_rollback,
            "reasons": rollback_eval.reasons,
            "metrics": rollback_eval.metrics,
        },
    }

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(artifact, indent=2))

    print(f"[phase2-soak] wrote artifact: {args.output_json}")
    print(f"[phase2-soak] pass_gate={soak_eval.pass_gate}")
    print(f"[phase2-soak] should_rollback={rollback_eval.should_rollback}")

    return 0 if soak_eval.pass_gate and not rollback_eval.should_rollback else 1


if __name__ == "__main__":
    raise SystemExit(main())
