"""Integrity and reliability validation for the backtest engine."""

from dataclasses import dataclass, asdict
from typing import Any
import os

import requests


@dataclass(frozen=True)
class IntegrityMetrics:
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
    max_pnl_drift_pct: float = 0.10
    max_exposure_drift_bps: float = 5.0
    max_latency_regression_ratio: float = 1.50
    allow_fallbacks: bool = False
    allow_reconciliation_failures: bool = False


@dataclass(frozen=True)
class IntegrityReport:
    is_valid: bool
    reasons: list[str]
    metrics: dict[str, Any]


def _go_base_url() -> str:
    return os.getenv("GO_CONTROL_PLANE_URL", "http://localhost:8081")


def _go_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("OBSERVABILITY_API_KEY", "")
    if api_key:
        headers["X-API-Key"] = api_key
    return headers


def validate_run_integrity(
    metrics: IntegrityMetrics,
    thresholds: IntegrityThresholds | None = None,
) -> IntegrityReport:
    """Delegate integrity validation to Go runtime endpoint."""
    _ = thresholds  # Go service uses canonical thresholds for now.
    payload = asdict(metrics)
    url = f"{_go_base_url()}/api/system/integrity/validate"
    resp = requests.post(url, json=payload, headers=_go_headers(), timeout=10)
    if resp.status_code >= 400:
        raise RuntimeError(f"Go integrity API error {resp.status_code}: {resp.text}")
    data = resp.json()
    return IntegrityReport(
        is_valid=bool(data.get("is_valid", False)),
        reasons=list(data.get("reasons", [])),
        metrics=dict(data.get("metrics", payload)),
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
    """Evaluate stability across multiple soak test runs."""
    if not runs:
        return SoakStabilityReport(False, 0.0, 0, 0, 0, 0)

    timeout_limit = max(rust_benchmark_p95_seconds * 2.5, 900.0)
    timeouts = sum(1 for r in runs if r.duration_seconds > timeout_limit or r.timed_out)
    crashes = sum(1 for r in runs if r.crashed)
    fallbacks = sum(1 for r in runs if r.fallback_count > 0)
    recon_failures = sum(1 for r in runs if r.reconciliation_failure_count > 0)

    first_peak = float(runs[0].peak_rss_bytes)
    max_peak = float(max(r.peak_rss_bytes for r in runs))
    growth_pct = ((max_peak - first_peak) / first_peak) * 100.0 if first_peak > 0 else 0.0

    pass_gate = (
        timeouts == 0
        and crashes == 0
        and fallbacks == 0
        and recon_failures == 0
        and growth_pct < 5.0
    )

    return SoakStabilityReport(
        pass_gate=pass_gate,
        total_memory_growth_pct=growth_pct,
        timeout_count=timeouts,
        crash_count=crashes,
        fallback_count=fallbacks,
        reconciliation_failure_count=recon_failures,
    )
