from utils.canary_launch_manager import (
    CanaryLaunchManager,
    LaunchTier,
    EscalationState,
)


def test_launch_policy_missing_escalation_result():
    manager = CanaryLaunchManager()
    record = manager.build_launch_record(
        run_id="RUN-001",
        scenario_id="ESCALATION_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-001",
        escalation_state=EscalationState.TRIGGERED,
        escalation_result=None,  # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_ESCALATION_RESULT"


def test_launch_policy_missing_rollback_result():
    manager = CanaryLaunchManager()
    # Use scenario_id without ROLLBACK keyword to test launch-specific policy
    record = manager.build_launch_record(
        run_id="RUN-002",
        scenario_id="LAUNCH_RECOVERY_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-002",
        rollback_required=True,
        rollback_result=None,  # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_ROLLBACK_RESULT"


def test_launch_policy_unmitigated_breach():
    manager = CanaryLaunchManager()
    record = manager.build_launch_record(
        run_id="RUN-003",
        scenario_id="BOUNDARY_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-003",
        risk_boundary="MAX_EXPOSURE",
        metadata={"breach_mitigated": False},
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "UNMITIGATED_BOUNDARY_BREACH"


def test_launch_policy_missing_correlation_id():
    manager = CanaryLaunchManager()
    record = manager.build_launch_record(
        run_id="RUN-004",
        scenario_id="LAUNCH_SCENARIO",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id=None,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_CORRELATION_ID"


def test_launch_summary_aggregation():
    manager = CanaryLaunchManager()

    manager.build_launch_record(
        run_id="RUN-KS",
        scenario_id="KILL_SWITCH_LAUNCH",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-ks",
        kill_switch_latency_ms=38000,
    )

    manager.build_launch_record(
        run_id="RUN-ESC",
        scenario_id="ESCALATION_DRILL",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-esc",
        escalation_state=EscalationState.TRIGGERED,
        escalation_result="RESOLVED",
    )

    manager.build_launch_record(
        run_id="RUN-RB",
        scenario_id="LAUNCH_ROLLBACK",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-rb",
        rollback_required=True,
        rollback_result="SUCCESS",
        rollback_success=True,
        launch_tier=LaunchTier.NARROW,
    )

    summary = manager.get_launch_summary()
    assert summary["max_kill_switch_latency_ms"] == 38000
    assert summary["max_kill_switch_latency_sec"] == 38.0
    assert summary["escalation_pass_rate"] == 1.0
    assert summary["rollback_pass_rate"] == 1.0
    assert summary["unmitigated_breach_count"] == 0
    assert summary["launch_tier_distribution"]["NARROW"] == 1
    assert summary["blocked_count"] == 0
