"""
Phase 2 production-like benchmark for python vs rust backtest engine backends.
"""

from __future__ import annotations

import argparse
import json
import threading
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import numpy as np
import pandas as pd
import psutil

import sys

from loguru import logger

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC_ROOT = REPO_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from backtesting.data_handler import HistoricalDataHandler
from backtesting.engine import BacktestEngine
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.phase2_governance import resolve_engine_backend
from backtesting.portfolio_handler import FixedAmountSizer, PortfolioHandler
from backtesting.risk_integrity import compare_risk_decision_traces
from strategies.base import Signal, SignalType, Strategy


AGGRESSIVE_MIN_SPEEDUP = {"P10K": 1.20, "P100K": 1.40}
AGGRESSIVE_P95_RATIO_LIMIT = 0.75
AGGRESSIVE_RUST_MAX_MEMORY_BYTES = int(3.2 * 1024 * 1024 * 1024)
AGGRESSIVE_RUST_MEMORY_MULTIPLIER = 1.10


def configure_logging(level: str) -> None:
    logger.remove()
    logger.add(sys.stderr, level=level.upper())


@dataclass(frozen=True)
class ProfileConfig:
    name: str
    symbols: int
    bars_per_symbol: int


@dataclass(frozen=True)
class RunTelemetry:
    backend: str
    profile: str
    run_index: int
    warmup: bool
    duration_seconds: float
    throughput_bars_per_second: float
    peak_rss_bytes: int
    fallback_count: int
    reconciliation_failures: int
    crashed: bool
    crash_reason: str | None


class MemorySampler:
    def __init__(self, interval_seconds: float = 0.05):
        self.interval_seconds = interval_seconds
        self._process = psutil.Process()
        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self.peak_rss_bytes = self._process.memory_info().rss

    def _run(self) -> None:
        while not self._stop_event.is_set():
            try:
                rss = self._process.memory_info().rss
            except Exception:
                break
            if rss > self.peak_rss_bytes:
                self.peak_rss_bytes = rss
            self._stop_event.wait(self.interval_seconds)

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> int:
        self._stop_event.set()
        self._thread.join(timeout=1.0)
        return self.peak_rss_bytes


class BenchmarkSignalStrategy(Strategy):
    """
    Deterministic strategy for benchmarking event processing and risk/execution path.
    """

    def __init__(self, symbols: list[str]):
        super().__init__(name="BenchmarkSignalStrategy")
        self._symbols = set(symbols)
        self._position_open: dict[str, bool] = {symbol: False for symbol in symbols}

    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        symbol = data.attrs.get("symbol", "")
        if symbol not in self._symbols:
            return []

        bar_index = len(data)
        timestamp = pd.Timestamp(data.index[-1]).to_pydatetime()
        price = float(data["close"].iloc[-1])
        open_position = self._position_open[symbol]
        cycle = bar_index % 200

        signals: list[Signal] = []
        if not open_position and cycle == 25:
            signals.append(
                Signal(
                    timestamp=timestamp,
                    symbol=symbol,
                    signal_type=SignalType.LONG,
                    price=price,
                    confidence=1.0,
                )
            )
            self._position_open[symbol] = True
        elif open_position and cycle == 125:
            signals.append(
                Signal(
                    timestamp=timestamp,
                    symbol=symbol,
                    signal_type=SignalType.EXIT,
                    price=price,
                    confidence=1.0,
                )
            )
            self._position_open[symbol] = False

        return signals

    def calculate_position_size(
        self,
        signal: Signal,
        account_value: float,
        current_position: float = 0.0,
    ) -> float:
        return 100.0


def percentile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    return float(np.percentile(np.array(values, dtype=np.float64), q))


def write_profile_data(
    output_dir: Path,
    symbol_count: int,
    bars_per_symbol: int,
    seed: int,
) -> list[str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    symbols = [f"SYM{i:03d}" for i in range(symbol_count)]

    rng = np.random.default_rng(seed)
    base_timestamps = pd.date_range(
        start="2024-01-01 00:00:00",
        periods=bars_per_symbol,
        freq="min",
        tz="UTC",
    )

    for symbol in symbols:
        drift = rng.normal(0.0002, 0.00005)
        vol = abs(rng.normal(0.006, 0.001))
        raw_returns = rng.normal(drift, vol, bars_per_symbol)
        close = 100.0 * np.exp(np.cumsum(raw_returns))
        close = np.maximum(close, 0.01)

        high = close * (1.0 + np.abs(rng.normal(0.0015, 0.0004, bars_per_symbol)))
        low = close * (1.0 - np.abs(rng.normal(0.0015, 0.0004, bars_per_symbol)))
        open_ = close * (1.0 + rng.normal(0.0, 0.0006, bars_per_symbol))
        volume = rng.integers(50_000, 500_000, bars_per_symbol, endpoint=False).astype(np.float64)

        df = pd.DataFrame(
            {
                "timestamp": base_timestamps,
                "open": open_,
                "high": np.maximum(high, np.maximum(open_, close)),
                "low": np.minimum(low, np.minimum(open_, close)),
                "close": close,
                "volume": volume,
            }
        )
        df.to_csv(output_dir / f"{symbol}.csv", index=False)

    return symbols


def run_single_backtest(
    profile: ProfileConfig,
    symbols: list[str],
    data_dir: Path,
    backend: str,
    run_index: int,
    warmup: bool,
    seed: int,
) -> tuple[RunTelemetry, dict[str, Any]]:
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
        position_sizer=FixedAmountSizer(50_000.0),
        data_handler=data_handler,
    )
    strategy = BenchmarkSignalStrategy(symbols)
    engine = BacktestEngine(
        data_handler=data_handler,
        execution_handler=execution_handler,
        portfolio_handler=portfolio_handler,
        strategy=strategy,
        engine_backend=backend,
        rust_fallback_to_python=False,
    )

    total_bars = float(profile.symbols * profile.bars_per_symbol)
    memory_sampler = MemorySampler(interval_seconds=0.02)
    memory_sampler.start()

    crashed = False
    crash_reason: str | None = None
    start = time.perf_counter()
    results: dict[str, Any] = {}
    try:
        results = engine.run()
    except Exception as exc:
        crashed = True
        crash_reason = str(exc)
    duration = max(time.perf_counter() - start, 1e-9)
    peak_rss_bytes = memory_sampler.stop()

    execution_stats = results.get("execution_stats", {}) if isinstance(results, dict) else {}
    fallback_count = int(execution_stats.get("rust_fallback_count", 0))
    reconciliation_failures = int(execution_stats.get("reconciliation_failures", 0))

    telemetry = RunTelemetry(
        backend=backend,
        profile=profile.name,
        run_index=run_index,
        warmup=warmup,
        duration_seconds=duration,
        throughput_bars_per_second=total_bars / duration,
        peak_rss_bytes=peak_rss_bytes,
        fallback_count=fallback_count,
        reconciliation_failures=reconciliation_failures,
        crashed=crashed,
        crash_reason=crash_reason,
    )
    return telemetry, results


def aggregate_backend_runs(runs: list[RunTelemetry]) -> dict[str, Any]:
    durations = [run.duration_seconds for run in runs]
    throughputs = [run.throughput_bars_per_second for run in runs]
    peaks = [float(run.peak_rss_bytes) for run in runs]
    return {
        "count": len(runs),
        "runtime_seconds": {
            "p50": percentile(durations, 50),
            "p95": percentile(durations, 95),
            "p99": percentile(durations, 99),
        },
        "throughput_bars_per_second": {
            "p50": percentile(throughputs, 50),
            "p95": percentile(throughputs, 95),
            "p99": percentile(throughputs, 99),
        },
        "peak_rss_bytes": {
            "p50": int(percentile(peaks, 50)),
            "p95": int(percentile(peaks, 95)),
            "max": int(max(peaks) if peaks else 0),
        },
        "fallback_count_total": sum(run.fallback_count for run in runs),
        "reconciliation_failures_total": sum(run.reconciliation_failures for run in runs),
        "crash_count": sum(1 for run in runs if run.crashed),
        "all_runs_passed": all(
            (not run.crashed)
            and run.fallback_count == 0
            and run.reconciliation_failures == 0
            for run in runs
        ),
    }


def evaluate_aggressive_gate(
    profile_name: str,
    python_agg: dict[str, Any],
    rust_agg: dict[str, Any],
) -> dict[str, Any]:
    py_p95 = float(python_agg["runtime_seconds"]["p95"])
    rust_p95 = float(rust_agg["runtime_seconds"]["p95"])
    speedup = (py_p95 / rust_p95) if rust_p95 > 0 else 0.0
    p95_ratio = (rust_p95 / py_p95) if py_p95 > 0 else float("inf")

    py_peak_max = int(python_agg["peak_rss_bytes"]["max"])
    rust_peak_max = int(rust_agg["peak_rss_bytes"]["max"])
    rust_peak_limit = min(
        AGGRESSIVE_RUST_MAX_MEMORY_BYTES,
        int(py_peak_max * AGGRESSIVE_RUST_MEMORY_MULTIPLIER),
    )

    reasons: list[str] = []
    min_speedup = AGGRESSIVE_MIN_SPEEDUP[profile_name]

    if speedup < min_speedup:
        reasons.append(
            f"Speedup gate failed: {speedup:.4f}x < {min_speedup:.4f}x ({profile_name})"
        )
    if p95_ratio > AGGRESSIVE_P95_RATIO_LIMIT:
        reasons.append(
            "p95 ratio gate failed: "
            f"{p95_ratio:.4f} > {AGGRESSIVE_P95_RATIO_LIMIT:.4f}"
        )
    if rust_peak_max > rust_peak_limit:
        reasons.append(
            f"Memory gate failed: rust_peak_max={rust_peak_max} > limit={rust_peak_limit}"
        )
    if not rust_agg["all_runs_passed"]:
        reasons.append("Rust measured runs must pass 12/12 without crash/fallback/reconciliation failure")
    if int(rust_agg["count"]) < 12:
        reasons.append("Rust measured run count must be 12")

    return {
        "pass": len(reasons) == 0,
        "speedup_p95": speedup,
        "p95_ratio_rust_over_python": p95_ratio,
        "rust_peak_memory_limit_bytes": rust_peak_limit,
        "reasons": reasons,
    }


def run_risk_integrity_pair_check(
    profile: ProfileConfig,
    symbols: list[str],
    data_dir: Path,
    seed: int,
) -> dict[str, Any]:
    py_telemetry, py_results = run_single_backtest(
        profile=profile,
        symbols=symbols,
        data_dir=data_dir,
        backend="python",
        run_index=-1,
        warmup=False,
        seed=seed,
    )
    rust_telemetry, rust_results = run_single_backtest(
        profile=profile,
        symbols=symbols,
        data_dir=data_dir,
        backend="rust",
        run_index=-1,
        warmup=False,
        seed=seed,
    )

    py_trace = py_results.get("risk_decision_trace", [])
    rust_trace = rust_results.get("risk_decision_trace", [])
    comparison = compare_risk_decision_traces(py_trace, rust_trace)

    return {
        "python_telemetry": asdict(py_telemetry),
        "rust_telemetry": asdict(rust_telemetry),
        "comparison": comparison.to_dict(),
        "pass": (
            comparison.false_allow_delta == 0
            and comparison.false_reject_delta == 0
            and comparison.blocked_delta == 0
            and comparison.missing_keys_in_candidate == 0
            and comparison.extra_keys_in_candidate == 0
        ),
    }


def run_profile(
    profile: ProfileConfig,
    warmup_runs: int,
    measured_runs: int,
    seed: int,
) -> dict[str, Any]:
    with TemporaryDirectory(prefix=f"phase2_{profile.name.lower()}_") as tmpdir:
        data_dir = Path(tmpdir)
        symbols = write_profile_data(
            output_dir=data_dir,
            symbol_count=profile.symbols,
            bars_per_symbol=profile.bars_per_symbol,
            seed=seed,
        )

        all_runs: list[RunTelemetry] = []
        for backend in ("python", "rust"):
            for run_index in range(warmup_runs + measured_runs):
                warmup = run_index < warmup_runs
                telemetry, _ = run_single_backtest(
                    profile=profile,
                    symbols=symbols,
                    data_dir=data_dir,
                    backend=backend,
                    run_index=run_index,
                    warmup=warmup,
                    seed=seed + run_index,
                )
                all_runs.append(telemetry)

        measured_by_backend = {
            backend: [
                run
                for run in all_runs
                if run.backend == backend and not run.warmup
            ]
            for backend in ("python", "rust")
        }
        aggregates = {
            backend: aggregate_backend_runs(measured_by_backend[backend])
            for backend in ("python", "rust")
        }
        aggressive_gate = evaluate_aggressive_gate(
            profile_name=profile.name,
            python_agg=aggregates["python"],
            rust_agg=aggregates["rust"],
        )
        risk_integrity = run_risk_integrity_pair_check(
            profile=profile,
            symbols=symbols,
            data_dir=data_dir,
            seed=seed + 999,
        )

        return {
            "profile": asdict(profile),
            "env_backend_default": resolve_engine_backend(None),
            "warmup_runs": warmup_runs,
            "measured_runs": measured_runs,
            "raw_runs": [asdict(run) for run in all_runs],
            "aggregates": aggregates,
            "aggressive_gate": aggressive_gate,
            "risk_integrity": risk_integrity,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-json",
        type=Path,
        default=REPO_ROOT / "data" / "benchmarks" / "phase2_backtest_benchmark.json",
        help="Path to write benchmark artifact JSON.",
    )
    parser.add_argument("--warmup-runs", type=int, default=2)
    parser.add_argument("--measured-runs", type=int, default=12)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument(
        "--log-level",
        type=str,
        default="WARNING",
        help="Loguru level for benchmark runtime (default: WARNING).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    configure_logging(args.log_level)

    profiles = [
        ProfileConfig(name="P10K", symbols=20, bars_per_symbol=10_000),
        ProfileConfig(name="P100K", symbols=20, bars_per_symbol=100_000),
    ]

    results = {
        "generated_at_utc": pd.Timestamp.utcnow().isoformat(),
        "profiles": [],
    }

    overall_pass = True
    for profile in profiles:
        profile_result = run_profile(
            profile=profile,
            warmup_runs=args.warmup_runs,
            measured_runs=args.measured_runs,
            seed=args.seed,
        )
        results["profiles"].append(profile_result)
        profile_pass = bool(profile_result["aggressive_gate"]["pass"]) and bool(
            profile_result["risk_integrity"]["pass"]
        )
        overall_pass = overall_pass and profile_pass

    results["overall_pass"] = overall_pass
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(results, indent=2))

    print(f"[phase2-benchmark] wrote artifact: {args.output_json}")
    print(f"[phase2-benchmark] overall_pass={overall_pass}")
    return 0 if overall_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
