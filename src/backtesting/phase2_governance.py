"""
Phase 2 governance utilities for Rust default promotion and rollback decisions.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Mapping
import os


ENV_BACKEND_DEFAULT = "BACKTEST_ENGINE_BACKEND_DEFAULT"
ENV_RUST_PROMOTION_FLAG = "BACKTEST_ENGINE_PROMOTE_RUST_DEFAULT"


def _parse_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def resolve_engine_backend(
    explicit_backend: str | None,
    env: Mapping[str, str] | None = None,
) -> str:
    """
    Resolve effective engine backend from explicit argument and environment policy.

    Priority:
    1) explicit engine_backend argument
    2) BACKTEST_ENGINE_BACKEND_DEFAULT
    3) BACKTEST_ENGINE_PROMOTE_RUST_DEFAULT flag
    4) fallback to python
    """
    env_view = os.environ if env is None else env

    backend = explicit_backend
    if backend is None:
        backend = env_view.get(ENV_BACKEND_DEFAULT)

    if backend is None and _parse_bool(env_view.get(ENV_RUST_PROMOTION_FLAG)):
        backend = "rust"

    backend = backend or "python"
    backend = backend.strip().lower()

    if backend not in {"python", "rust"}:
        raise ValueError("engine_backend must be either 'python' or 'rust'")

    return backend


@dataclass(frozen=True)
class RollbackGateThresholds:
    max_pnl_drift_pct: float = 0.10
    max_exposure_drift_bps: float = 5.0
    max_latency_regression_ratio: float = 1.0


@dataclass(frozen=True)
class RollbackGateMetrics:
    pnl_drift_pct: float
    exposure_drift_bps: float
    false_allow_delta: int
    false_reject_delta: int
    blocked_delta: int
    timeout_count: int
    crash_count: int
    fallback_count: int
    reconciliation_failure_count: int
    latency_regression_ratio: float


@dataclass(frozen=True)
class RollbackEvaluation:
    should_rollback: bool
    reasons: list[str]
    metrics: dict[str, Any]


def evaluate_rollback_triggers(
    metrics: RollbackGateMetrics,
    thresholds: RollbackGateThresholds | None = None,
) -> RollbackEvaluation:
    """
    Evaluate post-promotion rollback triggers.

    Any breached strict gate should force rollback to python default.
    """
    gate = thresholds or RollbackGateThresholds()
    reasons: list[str] = []

    if metrics.pnl_drift_pct > gate.max_pnl_drift_pct:
        reasons.append(
            "PnL drift breach: "
            f"{metrics.pnl_drift_pct:.4f}% > {gate.max_pnl_drift_pct:.4f}%"
        )
    if metrics.exposure_drift_bps > gate.max_exposure_drift_bps:
        reasons.append(
            "Exposure drift breach: "
            f"{metrics.exposure_drift_bps:.4f} bps > {gate.max_exposure_drift_bps:.4f} bps"
        )
    if metrics.false_allow_delta != 0:
        reasons.append(f"False-allow delta breach: {metrics.false_allow_delta} != 0")
    if metrics.false_reject_delta != 0:
        reasons.append(f"False-reject delta breach: {metrics.false_reject_delta} != 0")
    if metrics.blocked_delta != 0:
        reasons.append(f"Blocked delta breach: {metrics.blocked_delta} != 0")
    if metrics.timeout_count > 0:
        reasons.append(f"Timeout breach: {metrics.timeout_count} > 0")
    if metrics.crash_count > 0:
        reasons.append(f"Crash breach: {metrics.crash_count} > 0")
    if metrics.fallback_count > 0:
        reasons.append(f"Fallback breach: {metrics.fallback_count} > 0")
    if metrics.reconciliation_failure_count > 0:
        reasons.append(
            f"Reconciliation failure breach: {metrics.reconciliation_failure_count} > 0"
        )
    if metrics.latency_regression_ratio > gate.max_latency_regression_ratio:
        reasons.append(
            "Latency regression breach: "
            f"{metrics.latency_regression_ratio:.4f} > {gate.max_latency_regression_ratio:.4f}"
        )

    return RollbackEvaluation(
        should_rollback=len(reasons) > 0,
        reasons=reasons,
        metrics=asdict(metrics),
    )


@dataclass(frozen=True)
class SoakRunTelemetry:
    duration_seconds: float
    peak_rss_bytes: int
    fallback_count: int = 0
    reconciliation_failure_count: int = 0
    crashed: bool = False
    timed_out: bool = False


@dataclass(frozen=True)
class SoakThresholds:
    max_memory_slope_mb_per_hour: float = 20.0
    max_total_memory_growth_pct: float = 5.0
    min_timeout_seconds: float = 900.0
    timeout_multiplier: float = 2.2


@dataclass(frozen=True)
class SoakEvaluation:
    pass_gate: bool
    timeout_threshold_seconds: float
    timeout_count: int
    crash_count: int
    fallback_count: int
    reconciliation_failure_count: int
    memory_slope_mb_per_hour: float
    total_memory_growth_pct: float
    reasons: list[str]


def _fit_linear_slope(hours: list[float], rss_mb: list[float]) -> float:
    if len(hours) < 2:
        return 0.0
    x_mean = sum(hours) / len(hours)
    y_mean = sum(rss_mb) / len(rss_mb)
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(hours, rss_mb))
    denominator = sum((x - x_mean) ** 2 for x in hours)
    if denominator == 0:
        return 0.0
    return numerator / denominator


def evaluate_soak_stability(
    runs: list[SoakRunTelemetry],
    rust_benchmark_p95_seconds: float,
    thresholds: SoakThresholds | None = None,
) -> SoakEvaluation:
    """
    Evaluate soak outcomes against strict stability thresholds.
    """
    gate = thresholds or SoakThresholds()
    timeout_threshold = max(
        gate.timeout_multiplier * rust_benchmark_p95_seconds,
        gate.min_timeout_seconds,
    )

    timeout_count = 0
    crash_count = 0
    fallback_count = 0
    reconciliation_failure_count = 0
    elapsed_hours: list[float] = []
    rss_mb: list[float] = []

    cumulative_seconds = 0.0
    for run in runs:
        cumulative_seconds += max(float(run.duration_seconds), 0.0)
        elapsed_hours.append(cumulative_seconds / 3600.0)
        rss_mb.append(run.peak_rss_bytes / (1024.0 * 1024.0))

        timed_out = run.timed_out or (run.duration_seconds > timeout_threshold)
        if timed_out:
            timeout_count += 1
        if run.crashed:
            crash_count += 1
        fallback_count += max(int(run.fallback_count), 0)
        reconciliation_failure_count += max(int(run.reconciliation_failure_count), 0)

    slope_mb_per_hour = _fit_linear_slope(elapsed_hours, rss_mb)
    total_growth_pct = 0.0
    if rss_mb and rss_mb[0] > 0:
        total_growth_pct = ((rss_mb[-1] - rss_mb[0]) / rss_mb[0]) * 100.0

    reasons: list[str] = []
    if crash_count > 0:
        reasons.append(f"Crash count breach: {crash_count} > 0")
    if timeout_count > 0:
        reasons.append(f"Timeout count breach: {timeout_count} > 0")
    if fallback_count > 0:
        reasons.append(f"Fallback count breach: {fallback_count} > 0")
    if reconciliation_failure_count > 0:
        reasons.append(
            "Reconciliation failure breach: "
            f"{reconciliation_failure_count} > 0"
        )
    if slope_mb_per_hour > gate.max_memory_slope_mb_per_hour:
        reasons.append(
            "Memory slope breach: "
            f"{slope_mb_per_hour:.4f} MB/h > {gate.max_memory_slope_mb_per_hour:.4f} MB/h"
        )
    if total_growth_pct > gate.max_total_memory_growth_pct:
        reasons.append(
            "Memory growth breach: "
            f"{total_growth_pct:.4f}% > {gate.max_total_memory_growth_pct:.4f}%"
        )

    return SoakEvaluation(
        pass_gate=len(reasons) == 0,
        timeout_threshold_seconds=timeout_threshold,
        timeout_count=timeout_count,
        crash_count=crash_count,
        fallback_count=fallback_count,
        reconciliation_failure_count=reconciliation_failure_count,
        memory_slope_mb_per_hour=slope_mb_per_hour,
        total_memory_growth_pct=total_growth_pct,
        reasons=reasons,
    )
