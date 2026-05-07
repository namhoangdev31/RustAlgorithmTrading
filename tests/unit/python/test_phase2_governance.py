from backtesting.phase2_governance import (
    RollbackGateMetrics,
    SoakRunTelemetry,
    evaluate_rollback_triggers,
    evaluate_soak_stability,
    resolve_engine_backend,
)


def test_resolve_engine_backend_prefers_explicit_value():
    env = {
        "BACKTEST_ENGINE_BACKEND_DEFAULT": "rust",
        "BACKTEST_ENGINE_PROMOTE_RUST_DEFAULT": "0",
    }
    assert resolve_engine_backend("python", env=env) == "python"
    assert resolve_engine_backend("rust", env=env) == "rust"


def test_resolve_engine_backend_uses_env_default_when_explicit_none():
    env = {"BACKTEST_ENGINE_BACKEND_DEFAULT": "rust"}
    assert resolve_engine_backend(None, env=env) == "rust"


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


def test_evaluate_rollback_triggers_detects_false_allow_delta():
    metrics = RollbackGateMetrics(
        pnl_drift_pct=0.01,
        exposure_drift_bps=1.0,
        false_allow_delta=1,
        false_reject_delta=0,
        blocked_delta=0,
        timeout_count=0,
        crash_count=0,
        fallback_count=0,
        reconciliation_failure_count=0,
        latency_regression_ratio=0.9,
    )
    result = evaluate_rollback_triggers(metrics)
    assert result.should_rollback is True
    assert any("False-allow" in reason for reason in result.reasons)


def test_evaluate_rollback_triggers_passes_clean_metrics():
    metrics = RollbackGateMetrics(
        pnl_drift_pct=0.01,
        exposure_drift_bps=1.0,
        false_allow_delta=0,
        false_reject_delta=0,
        blocked_delta=0,
        timeout_count=0,
        crash_count=0,
        fallback_count=0,
        reconciliation_failure_count=0,
        latency_regression_ratio=0.9,
    )
    result = evaluate_rollback_triggers(metrics)
    assert result.should_rollback is False
    assert result.reasons == []
