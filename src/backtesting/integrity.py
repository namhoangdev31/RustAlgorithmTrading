"""
Integrity and reliability validation for the backtest engine.

This module provides automated checks to ensure backtest results meet safety
and stability requirements, preventing releases with corrupted logic or drift.
"""

import os
from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(frozen=True)
class IntegrityMetrics:
    """Core metrics for evaluating the health of a backtest run."""
    pnl_drift_pct: float = 0.0
    exposure_drift_bps: float = 0.0
    false_allow_delta: int = 0
    false_reject_delta: int = 0
    blocked_delta: int = 0
    timeout_count: int = 0
    crash_count: int = 0
    fallback_count: int = 0
    reconciliation_failure_count: int = 0
    latency_regression_ratio: float = 1.0


@dataclass(frozen=True)
class IntegrityThresholds:
    """Thresholds for triggering integrity alerts."""
    max_pnl_drift_pct: float = 0.10
    max_exposure_drift_bps: float = 5.0
    max_latency_regression_ratio: float = 1.50
    allow_fallbacks: bool = False
    allow_reconciliation_failures: bool = False


@dataclass(frozen=True)
class IntegrityReport:
    """The final verdict of an integrity check."""
    is_valid: bool
    reasons: list[str]
    metrics: dict[str, Any]


def validate_run_integrity(
    metrics: IntegrityMetrics,
    thresholds: IntegrityThresholds | None = None,
) -> IntegrityReport:
    """
    Validate a backtest run against safety and stability thresholds.
    """
    limits = thresholds or IntegrityThresholds()
    reasons: list[str] = []

    if metrics.pnl_drift_pct > limits.max_pnl_drift_pct:
        reasons.append(
            f"PnL drift breach: {metrics.pnl_drift_pct:.4f}% > {limits.max_pnl_drift_pct:.4f}%"
        )
    if metrics.exposure_drift_bps > limits.max_exposure_drift_bps:
        reasons.append(
            f"Exposure drift breach: {metrics.exposure_drift_bps:.4f} bps > {limits.max_exposure_drift_bps:.4f} bps"
        )
    if metrics.false_allow_delta != 0:
        reasons.append(f"False-allow delta detected: {metrics.false_allow_delta}")
    if metrics.false_reject_delta != 0:
        reasons.append(f"False-reject delta detected: {metrics.false_reject_delta}")
    if metrics.blocked_delta != 0:
        reasons.append(f"Blocked signal delta detected: {metrics.blocked_delta}")
    if metrics.crash_count > 0:
        reasons.append(f"Runtime crashes detected: {metrics.crash_count}")
    if metrics.timeout_count > 0:
        reasons.append(f"Runtime timeouts detected: {metrics.timeout_count}")

    if not limits.allow_fallbacks and metrics.fallback_count > 0:
        reasons.append(f"Unsanctioned fallback to legacy code: {metrics.fallback_count}")

    if not limits.allow_reconciliation_failures and metrics.reconciliation_failure_count > 0:
        reasons.append(f"State reconciliation failures: {metrics.reconciliation_failure_count}")

    if metrics.latency_regression_ratio > limits.max_latency_regression_ratio:
        reasons.append(
            f"Latency regression: {metrics.latency_regression_ratio:.2f}x > {limits.max_latency_regression_ratio:.2f}x"
        )

    from dataclasses import asdict
    return IntegrityReport(
        is_valid=len(reasons) == 0,
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
class SoakStabilityReport:
    pass_gate: bool
    total_memory_growth_pct: float
    timeout_count: int
    crash_count: int
    fallback_count: int
    reconciliation_failure_count: int


def evaluate_soak_stability(
    runs: list[SoakRunTelemetry],
    rust_benchmark_p95_seconds: float,
) -> SoakStabilityReport:
    """
    Evaluate stability across multiple soak test runs.
    """
    if not runs:
        return SoakStabilityReport(False, 0.0, 0, 0, 0, 0)

    timeout_limit = max(rust_benchmark_p95_seconds * 2.5, 900.0)
    timeouts = sum(1 for r in runs if r.duration_seconds > timeout_limit or r.timed_out)
    crashes = sum(1 for r in runs if r.crashed)
    fallbacks = sum(1 for r in runs if r.fallback_count > 0)
    recon_failures = sum(1 for r in runs if r.reconciliation_failure_count > 0)

    # Detect memory leaks via simple linear trend or peak growth
    first_peak = float(runs[0].peak_rss_bytes)
    max_peak = float(max(r.peak_rss_bytes for r in runs))
    growth_pct = ((max_peak - first_peak) / first_peak) * 100.0 if first_peak > 0 else 0.0

    pass_gate = (
        timeouts == 0
        and crashes == 0
        and fallbacks == 0
        and recon_failures == 0
        and growth_pct < 5.0  # Allow up to 5% growth for fragmentation/etc
    )

    return SoakStabilityReport(
        pass_gate=pass_gate,
        total_memory_growth_pct=growth_pct,
        timeout_count=timeouts,
        crash_count=crashes,
        fallback_count=fallbacks,
        reconciliation_failure_count=recon_failures,
    )
