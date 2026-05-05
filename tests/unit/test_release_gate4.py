from src.utils.final_release_manager import (
    FinalReleaseManager,
    ApprovalState,
    ReleaseBlockerStatus,
    RollbackReadiness,
)


def test_gate_policy_open_blocker_blocked():
    manager = FinalReleaseManager()
    record = manager.build_gate_record(
        run_id="RUN-001",
        scenario_id="BLOCKER_TEST",
        disposition="PASS",
        reason_code="OK",
        component="GOVERNANCE",
        correlation_id="corr-001",
        release_blocker_status=ReleaseBlockerStatus.OPEN,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "OPEN_RELEASE_BLOCKER"


def test_gate_policy_pending_approval_blocked():
    manager = FinalReleaseManager()
    record = manager.build_gate_record(
        run_id="RUN-002",
        scenario_id="APPROVAL_TEST",
        disposition="PASS",
        reason_code="OK",
        component="GOVERNANCE",
        correlation_id="corr-002",
        approval_state=ApprovalState.PENDING,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "APPROVAL_PENDING"


def test_gate_policy_rollback_not_ready_blocked():
    manager = FinalReleaseManager()
    record = manager.build_gate_record(
        run_id="RUN-003",
        scenario_id="ROLLBACK_TEST",
        disposition="PASS",
        reason_code="OK",
        component="SYSTEM",
        correlation_id="corr-003",
        rollback_readiness=RollbackReadiness.NOT_READY,
        rollback_success=True,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "ROLLBACK_NOT_READY"


def test_gate_policy_regression_detected_blocked():
    manager = FinalReleaseManager()
    record = manager.build_gate_record(
        run_id="RUN-004",
        scenario_id="REGRESSION_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-004",
        regression_count=1,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "REGRESSION_DETECTED"


def test_gate_summary_aggregation():
    manager = FinalReleaseManager()

    manager.build_gate_record(
        run_id="RUN-APP",
        scenario_id="APPROVAL",
        disposition="PASS",
        reason_code="OK",
        component="GOV",
        correlation_id="corr-app",
        approval_state=ApprovalState.APPROVED,
    )

    manager.build_gate_record(
        run_id="RUN-BLK",
        scenario_id="BLOCKER_CHECK",
        disposition="PASS",
        reason_code="OK",
        component="GOV",
        correlation_id="corr-blk",
        release_blocker_status=ReleaseBlockerStatus.CLOSED,
    )
    
    manager.build_gate_record(
        run_id="RUN-RLL",
        scenario_id="ROLLBACK",
        disposition="PASS",
        reason_code="OK",
        component="SYS",
        correlation_id="corr-rll",
        rollback_readiness=RollbackReadiness.READY,
        rollback_success=True,
    )

    summary = manager.get_gate_summary()
    assert summary["approval_rate"] == 1.0
    assert summary["rollback_ready_rate"] == 1.0
    assert summary["open_release_blockers"] == 0
    assert summary["total_regressions"] == 0
    assert summary["blocked_count"] == 0

