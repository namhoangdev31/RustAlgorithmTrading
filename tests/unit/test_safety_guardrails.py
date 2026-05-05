import pytest
from src.utils.safety_manager import (
    SafetyGuardrailsManager,
    SafetyTriggerType,
)


def test_safety_policy_missing_kill_switch_timing():
    manager = SafetyGuardrailsManager()
    # Scenario without KILL_SWITCH keyword in scenario_id so base class doesn't intercept
    record = manager.build_safety_record(
        run_id="RUN-001",
        scenario_id="SAFETY_TRIGGER_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-001",
        trigger_type=SafetyTriggerType.KILL_SWITCH,
        kill_switch_latency_ms=None,  # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_KILL_SWITCH_TIMING"


def test_safety_policy_missing_rollback_result():
    manager = SafetyGuardrailsManager()
    # Scenario without ROLLBACK keyword in scenario_id so base class doesn't intercept
    record = manager.build_safety_record(
        run_id="RUN-002",
        scenario_id="SAFETY_RECOVERY_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-002",
        rollback_required=True,
        rollback_result=None,  # Missing when required
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_ROLLBACK_RESULT"


def test_safety_policy_unmitigated_breach():
    manager = SafetyGuardrailsManager()
    record = manager.build_safety_record(
        run_id="RUN-003",
        scenario_id="BOUNDARY_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-003",
        risk_boundary="MAX_EXPOSURE",
        metadata={"breach_mitigated": False},  # Unmitigated
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "UNMITIGATED_RISK_BOUNDARY_BREACH"


def test_safety_policy_missing_correlation_id():
    manager = SafetyGuardrailsManager()
    record = manager.build_safety_record(
        run_id="RUN-004",
        scenario_id="GENERIC_SAFETY",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id=None,  # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_CORRELATION_ID"


def test_safety_summary_aggregation():
    manager = SafetyGuardrailsManager()

    # Kill-switch
    manager.build_safety_record(
        run_id="RUN-KS",
        scenario_id="KILL_SWITCH_RESPONSE",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-ks",
        trigger_type=SafetyTriggerType.KILL_SWITCH,
        kill_switch_latency_ms=42000,
    )

    # Risk-off
    manager.build_safety_record(
        run_id="RUN-RO",
        scenario_id="RISK_OFF_DRILL",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-ro",
        trigger_type=SafetyTriggerType.RISK_OFF,
    )

    # Rollback
    manager.build_safety_record(
        run_id="RUN-RB",
        scenario_id="ROLLBACK_DRILL",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-rb",
        trigger_type=SafetyTriggerType.ROLLBACK,
        rollback_required=True,
        rollback_result="SUCCESS",
        rollback_success=True,
    )

    summary = manager.get_safety_summary()
    assert summary["max_kill_switch_latency_ms"] == 42000
    assert summary["max_kill_switch_latency_sec"] == 42.0
    assert summary["risk_off_pass_rate"] == 1.0
    assert summary["rollback_pass_rate"] == 1.0
    assert summary["unmitigated_breach_count"] == 0
    assert summary["trigger_distribution"]["KILL_SWITCH"] == 1
    assert summary["trigger_distribution"]["RISK_OFF"] == 1
    assert summary["trigger_distribution"]["ROLLBACK"] == 1
    assert summary["blocked_count"] == 0
