from utils.e2e_gate_manager import (
    E2EGateManager,
    E2ESuiteType,
    E2EDebtStatus,
)


def test_gate_policy_open_e2e_debt_blocked():
    manager = E2EGateManager()
    record = manager.build_gate_record(
        run_id="RUN-001",
        scenario_id="DEBT_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-001",
        e2e_debt_status=E2EDebtStatus.OPEN,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "OPEN_E2E_FAULT_DEBT"


def test_gate_policy_suite_failure_blocked():
    manager = E2EGateManager()
    record = manager.build_gate_record(
        run_id="RUN-002",
        scenario_id="FAULT_INJECTION_TEST",
        disposition="FAIL",
        reason_code="TEST_FAILED",
        component="TEST",
        correlation_id="corr-002",
        suite_type=E2ESuiteType.FAULT_INJECTION,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "FAULT_INJECTION_SUITE_FAIL"


def test_gate_policy_regression_detected_blocked():
    manager = E2EGateManager()
    record = manager.build_gate_record(
        run_id="RUN-003",
        scenario_id="REGRESSION_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-003",
        regression_count=1,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "REGRESSION_DETECTED"


def test_gate_policy_missing_correlation_id():
    manager = E2EGateManager()
    record = manager.build_gate_record(
        run_id="RUN-004",
        scenario_id="GATE_SCENARIO",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id=None,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_CORRELATION_ID"


def test_gate_summary_aggregation():
    manager = E2EGateManager()

    manager.build_gate_record(
        run_id="RUN-SOAK",
        scenario_id="SOAK_SUITE",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-soak",
        suite_type=E2ESuiteType.SOAK,
    )

    manager.build_gate_record(
        run_id="RUN-DEBT",
        scenario_id="DEBT_CHECK",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-debt",
        e2e_debt_status=E2EDebtStatus.CLOSED,
    )

    summary = manager.get_gate_summary()
    assert summary["suite_pass_rate"] == 1.0
    assert summary["open_e2e_fault_debt"] == 0
    assert summary["total_regressions"] == 0
    assert summary["suite_distribution"]["SOAK"] == 1
    assert summary["blocked_count"] == 0
