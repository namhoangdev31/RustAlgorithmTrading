"""
Phase 2.2 production-like benchmark for Rust-only backtest runtime.
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

REPO_ROOT = Path(__file__).resolve().parents[3]
SRC_ROOT = REPO_ROOT / "python" / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from backtesting.data_handler import HistoricalDataHandler
from backtesting.engine import BacktestEngine
from backtesting.portfolio_handler import FixedAmountSizer, PortfolioHandler
from backtesting.risk_integrity import compare_risk_decision_traces
from strategies.base import Signal, SignalType, Strategy


AGGRESSIVE_MIN_SPEEDUP = {"P10K": 1.20, "P100K": 1.40}
AGGRESSIVE_P95_RATIO_LIMIT = 0.75
AGGRESSIVE_RUST_MAX_MEMORY_BYTES = int(3.2 * 1024 * 1024 * 1024)
AGGRESSIVE_RUST_MEMORY_MULTIPLIER = 1.10
BASELINE_FIXTURE = REPO_ROOT / "tests" / "fixtures" / "phase2" / "python_baseline_metrics.json"
RISK_GOLDEN_FIXTURE = REPO_ROOT / "rust" / "tests" / "fixtures" / "phase2" / "risk_decision_golden.json"


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
    total_events: int
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

        # Use a stateful counter instead of len(data) because data is now a sliding window
        if not hasattr(self, "_bar_counts"):
            self._bar_counts = {}
        
        self._bar_counts[symbol] = self._bar_counts.get(symbol, 0) + 1
        bar_index = self._bar_counts[symbol]
        
        if len(data) == 0:
            return []

        try:
            timestamp = pd.Timestamp(data.index[-1]).to_pydatetime()
            price = float(data["close"].iloc[-1])
        except (IndexError, AttributeError, ValueError):
            return []

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

    def generate_signal_frame(self, data_by_symbol: dict[str, pd.DataFrame], context: Any = None) -> pd.DataFrame:
        signals = []
        for symbol, df in data_by_symbol.items():
            if symbol not in self._symbols or df.empty:
                continue
            
            n_bars = len(df)
            indices = np.arange(1, n_bars + 1)
            cycles = indices % 200
            
            long_mask = (cycles == 25)
            exit_mask = (cycles == 125)
            
            timestamps = df["timestamp"].values if "timestamp" in df.columns else df.index.values
            close_prices = df["close"].values
            
            for idx in np.where(long_mask)[0]:
                signals.append({
                    "timestamp": timestamps[idx],
                    "symbol": symbol,
                    "signal_type": "LONG",
                    "strength": 1.0,
                    "strategy_id": self.name,
                    "signal_id": f"{symbol}:{idx + 1}:LONG",
                    "price": float(close_prices[idx])
                })
                
            for idx in np.where(exit_mask)[0]:
                signals.append({
                    "timestamp": timestamps[idx],
                    "symbol": symbol,
                    "signal_type": "EXIT",
                    "strength": 1.0,
                    "strategy_id": self.name,
                    "signal_id": f"{symbol}:{idx + 1}:EXIT",
                    "price": float(close_prices[idx])
                })
                
        if not signals:
            return pd.DataFrame(
                columns=[
                    "timestamp",
                    "symbol",
                    "signal_type",
                    "strength",
                    "strategy_id",
                    "signal_id",
                    "price",
                ]
            )
            
        res = pd.DataFrame(signals)
        res["timestamp"] = pd.to_datetime(res["timestamp"], utc=True)
        res = res.sort_values(["timestamp", "symbol"]).reset_index(drop=True)
        return res


def percentile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    return float(np.percentile(np.array(values, dtype=np.float64), q))


def write_profile_data(
    output_dir: Path,
    symbol_count: int,
    bars_per_symbol: int,
    seed: int = 42,
    extension: str = "parquet",
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

    print(f"  > Generating synthetic data for {symbol_count} symbols...", end="", flush=True)
    for i, symbol in enumerate(symbols):
        if i % 5 == 0 and i > 0:
            print(f" {i}/{symbol_count}...", end="", flush=True)
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
        if extension == "parquet":
            df.to_parquet(output_dir / f"{symbol}.parquet", index=False)
        else:
            df.to_csv(output_dir / f"{symbol}.csv", index=False)

    print(f" Done.")
    return symbols


def run_single_backtest(
    profile: ProfileConfig,
    symbols: list[str],
    data_dir: Path,
    run_index: int,
    warmup: bool,
    seed: int,
) -> tuple[RunTelemetry, dict[str, Any]]:
    data_handler = HistoricalDataHandler(symbols=symbols, data_dir=data_dir)
    portfolio_handler = PortfolioHandler(
        initial_capital=1_000_000.0,
        position_sizer=FixedAmountSizer(50_000.0),
        data_handler=data_handler,
    )
    strategy = BenchmarkSignalStrategy(symbols)
    engine = BacktestEngine(
        data_handler=data_handler,
        portfolio_handler=portfolio_handler,
        strategy=strategy,
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
        backend="rust",
        profile=profile.name,
        run_index=run_index,
        warmup=warmup,
        duration_seconds=duration,
        throughput_bars_per_second=total_bars / duration,
        total_events=engine.events_processed,
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
    required_measured_runs: int,
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
    if int(rust_agg["count"]) < required_measured_runs:
        reasons.append(f"Rust measured run count must be {required_measured_runs}")

    return {
        "pass": len(reasons) == 0,
        "speedup_p95": speedup,
        "p95_ratio_rust_over_python": p95_ratio,
        "rust_peak_memory_limit_bytes": rust_peak_limit,
        "reasons": reasons,
    }


def load_python_baseline() -> dict[str, Any]:
    if not BASELINE_FIXTURE.exists():
        raise FileNotFoundError(f"Frozen Python baseline fixture not found: {BASELINE_FIXTURE}")
    return json.loads(BASELINE_FIXTURE.read_text())


def python_baseline_aggregate(profile_name: str) -> dict[str, Any]:
    payload = load_python_baseline()
    profile = payload["profiles"][profile_name]
    p95 = float(profile["runtime_seconds"]["p95"])
    peak = int(profile["peak_rss_bytes"]["max"])
    return {
        "count": int(profile.get("measured_runs", 12)),
        "runtime_seconds": {
            "p50": float(profile["runtime_seconds"].get("p50", p95)),
            "p95": p95,
            "p99": float(profile["runtime_seconds"].get("p99", p95)),
        },
        "throughput_bars_per_second": profile.get("throughput_bars_per_second", {}),
        "peak_rss_bytes": {
            "p50": int(profile["peak_rss_bytes"].get("p50", peak)),
            "p95": int(profile["peak_rss_bytes"].get("p95", peak)),
            "max": peak,
        },
        "fallback_count_total": 0,
        "reconciliation_failures_total": 0,
        "crash_count": 0,
        "all_runs_passed": True,
    }


def expand_golden_risk_trace(profile: ProfileConfig, symbols: list[str]) -> list[dict[str, Any]]:
    if not RISK_GOLDEN_FIXTURE.exists():
        raise FileNotFoundError(f"Golden risk baseline not found: {RISK_GOLDEN_FIXTURE}")

    payload = json.loads(RISK_GOLDEN_FIXTURE.read_text())
    if isinstance(payload, list):
        return payload

    spec = payload["profiles"][profile.name]
    start = pd.Timestamp(spec["first_timestamp"])
    period = int(spec["cycle_period"])
    long_cycle = int(spec["long_cycle"])
    rows: list[dict[str, Any]] = []
    sequence_no = 0
    for bar_index in range(1, profile.bars_per_symbol + 1):
        if bar_index % period != long_cycle:
            continue
        timestamp = start + pd.Timedelta(minutes=bar_index - 1)
        for symbol in symbols:
            sequence_no += 1
            rows.append(
                {
                    "timestamp": timestamp.isoformat(),
                    "symbol": symbol,
                    "signal_type": "LONG",
                    "strategy_id": spec["strategy_id"],
                    "signal_id": f"{symbol}:{bar_index}:LONG",
                    "sequence_no": sequence_no,
                    "decision": spec["decision"],
                    "reason_code": spec["reason_code"],
                }
            )
    return rows


def run_risk_integrity_pair_check(
    profile: ProfileConfig,
    symbols: list[str],
    data_dir: Path,
    seed: int,
) -> dict[str, Any]:
    golden_trace = expand_golden_risk_trace(profile, symbols)
        
    rust_telemetry, rust_results = run_single_backtest(
        profile=profile,
        symbols=symbols,
        data_dir=data_dir,
        run_index=-1,
        warmup=False,
        seed=seed,
    )

    rust_trace = rust_results.get("risk_decision_trace", [])
    comparison = compare_risk_decision_traces(golden_trace, rust_trace)

    return {
        "golden_source": str(RISK_GOLDEN_FIXTURE),
        "golden_decision_count": len(golden_trace),
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
            extension="csv"
        )

        all_runs: list[RunTelemetry] = []
        for run_index in range(warmup_runs + measured_runs):
            warmup = run_index < warmup_runs
            run_type = "warmup" if warmup else f"measured {run_index - warmup_runs + 1}/{measured_runs}"
            print(f"  > Running rust {run_type}...", end="", flush=True)

            telemetry, _ = run_single_backtest(
                profile=profile,
                symbols=symbols,
                data_dir=data_dir,
                run_index=run_index,
                warmup=warmup,
                seed=seed + run_index,
            )
            all_runs.append(telemetry)
            print(f" Done ({telemetry.duration_seconds:.2f}s, {telemetry.throughput_bars_per_second:,.0f} bars/s, events: {telemetry.total_events:,})")

        measured_by_backend = {
            "rust": [run for run in all_runs if not run.warmup],
        }
        aggregates = {
            "python_baseline": python_baseline_aggregate(profile.name),
            "rust": aggregate_backend_runs(measured_by_backend["rust"]),
        }
        aggressive_gate = evaluate_aggressive_gate(
            profile_name=profile.name,
            python_agg=aggregates["python_baseline"],
            rust_agg=aggregates["rust"],
            required_measured_runs=measured_runs,
        )
        risk_integrity = run_risk_integrity_pair_check(
            profile=profile,
            symbols=symbols,
            data_dir=data_dir,
            seed=seed + 999,
        )

        return {
            "profile": asdict(profile),
            "env_backend_default": "rust",
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
        "--output",
        "--output-json",
        dest="output_json",
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
        default="INFO",
        help="Loguru level for benchmark runtime (default: INFO).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    configure_logging(args.log_level)
    
    print("=" * 60)
    print("PHASE 2 PRODUCTION BACKTEST BENCHMARK")
    print(f"Started at: {pd.Timestamp.utcnow()}")
    print("=" * 60)

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
        print(f"\n[Benchmarking Profile: {profile.name}] ({profile.symbols} symbols, {profile.bars_per_symbol:,} bars/symbol)")
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
