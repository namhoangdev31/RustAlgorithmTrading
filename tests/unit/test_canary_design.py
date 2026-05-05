import pytest
from src.utils.canary_manager import CanaryDesignManager, ExposureTier, BreachClass


def test_canary_record_policy_exposure_tier():
    manager = CanaryDesignManager()
    # Missing exposure tier for CANARY scenario
    record = manager.build_canary_record(
        run_id="RUN-001",
        scenario_id="CANARY_FLOW_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-123",
        exposure_tier=None,  # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_EXPOSURE_TIER"


def test_canary_record_policy_breach_class():
    manager = CanaryDesignManager()
    # Missing breach class for BREACH scenario
    record = manager.build_canary_record(
        run_id="RUN-002",
        scenario_id="BREACH_REHEARSAL",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-456",
        breach_class=None,  # Missing
        kill_switch_latency_ms=42000,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_BREACH_CLASS"


def test_canary_record_policy_missing_kill_switch():
    manager = CanaryDesignManager()
    # Missing kill_switch_latency_ms for BREACH scenario
    record = manager.build_canary_record(
        run_id="RUN-003",
        scenario_id="BREACH_REHEARSAL",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-999",
        breach_class=BreachClass.LATENCY,
        kill_switch_latency_ms=None,  # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_KILL_SWITCH_TIMING"


def test_canary_record_policy_missing_rollback_result():
    manager = CanaryDesignManager()
    record = manager.build_canary_record(
        run_id="RUN-004",
        scenario_id="ROLLBACK_REQUIRED_AUDIT",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-888",
        rollback_required=True,
        rollback_result=None,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_ROLLBACK_RESULT"


def test_canary_record_policy_missing_mitigation_evidence():
    manager = CanaryDesignManager()
    record = manager.build_canary_record(
        run_id="RUN-005",
        scenario_id="BREACH_MITIGATION_AUDIT",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-777",
        breach_class=BreachClass.RISK_LIMIT,
        kill_switch_latency_ms=41000,
        metadata={"breach_mitigated": False},
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_MITIGATION_EVIDENCE"


def test_canary_summary_aggregation():
    manager = CanaryDesignManager()

    manager.build_canary_record(
        run_id="RUN-006",
        scenario_id="CANARY_T1",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-789",
        canary_tier="T1",
        exposure_tier=ExposureTier.T1,
    )

    manager.build_canary_record(
        run_id="RUN-007",
        scenario_id="BREACH_LATENCY",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-101",
        breach_class=BreachClass.LATENCY,
        kill_switch_latency_ms=42500,
    )

    manager.build_canary_record(
        run_id="RUN-008",
        scenario_id="ROLLBACK_REHEARSAL",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-104",
        rollback_required=True,
        rollback_result="SUCCESS",
        rollback_success=True,
    )

    manager.build_canary_record(
        run_id="RUN-009",
        scenario_id="COMPLIANCE_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-102",
        metadata={"findings": 0},
    )

    manager.build_canary_record(
        run_id="RUN-010",
        scenario_id="WATERMARK_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-103",
        metadata={"throughput": 5000},
    )

    summary = manager.get_canary_summary()
    assert summary["canary_scenario_count"] == 1
    assert summary["breach_handling_count"] == 1
    assert summary["tier_distribution"]["T1"] == 1
    assert summary["tier_distribution"]["T2"] == 0
    assert summary["compliance_findings"] == 0
    assert summary["throughput_watermark"] == 5000
    assert summary["kill_switch_latency_sec"] == pytest.approx(42.5)
    assert summary["rollback_success_rate"] == 1.0
