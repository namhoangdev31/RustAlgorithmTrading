import pytest
from unittest.mock import Mock, patch

from backtesting.integrity import (
    IntegrityMetrics,
    SoakRunTelemetry,
    validate_run_integrity,
    evaluate_soak_stability,
)


def test_validate_run_integrity_detects_crashes():
    metrics = IntegrityMetrics(
        crash_count=1,
    )
    mocked = Mock(status_code=200)
    mocked.json.return_value = {
        "is_valid": False,
        "reasons": ["Runtime crashes detected: 1"],
        "metrics": {"crash_count": 1},
    }
    with patch("backtesting.integrity.requests.post", return_value=mocked):
        report = validate_run_integrity(metrics)
    assert report.is_valid is False
    assert any("crashes" in reason for reason in report.reasons)


def test_validate_run_integrity_passes_clean_run():
    metrics = IntegrityMetrics()
    mocked = Mock(status_code=200)
    mocked.json.return_value = {"is_valid": True, "reasons": [], "metrics": {}}
    with patch("backtesting.integrity.requests.post", return_value=mocked):
        report = validate_run_integrity(metrics)
    assert report.is_valid is True
    assert report.reasons == []


def test_evaluate_soak_stability_detects_timeout_and_memory_regression():
    runs = [
        SoakRunTelemetry(duration_seconds=1000.0, peak_rss_bytes=1_000_000_000),
        SoakRunTelemetry(duration_seconds=1000.0, peak_rss_bytes=1_200_000_000),
        SoakRunTelemetry(duration_seconds=1000.0, peak_rss_bytes=1_400_000_000),
    ]
    evaluation = evaluate_soak_stability(runs, rust_benchmark_p95_seconds=100.0)
    assert evaluation.pass_gate is False
    assert evaluation.timeout_count > 0
    assert evaluation.total_memory_growth_pct > 5.0


def test_evaluate_soak_stability_passes_healthy_series():
    runs = [
        SoakRunTelemetry(duration_seconds=300.0, peak_rss_bytes=1_000_000_000),
        SoakRunTelemetry(duration_seconds=310.0, peak_rss_bytes=1_001_000_000),
        SoakRunTelemetry(duration_seconds=320.0, peak_rss_bytes=1_002_000_000),
    ]
    evaluation = evaluate_soak_stability(runs, rust_benchmark_p95_seconds=200.0)
    assert evaluation.pass_gate is True
    assert evaluation.timeout_count == 0
    assert evaluation.crash_count == 0
    assert evaluation.fallback_count == 0
    assert evaluation.reconciliation_failure_count == 0
