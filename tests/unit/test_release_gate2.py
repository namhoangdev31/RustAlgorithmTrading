from src.utils.integration_gate_manager import (
    IntegrationGateManager,
    RuntimeScope,
    IntegrationSuiteType,
    IntegrationDebtStatus,
)


def test_gate_policy_open_integration_debt_blocked():
    manager = IntegrationGateManager()
    record = manager.build_gate_record(
        run_id="RUN-001",
        scenario_id="DEBT_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-001",
        integration_debt_status=IntegrationDebtStatus.OPEN,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "OPEN_INTEGRATION_DEBT"


def test_gate_policy_suite_failure_blocked():
    manager = IntegrationGateManager()
    record = manager.build_gate_record(
        run_id="RUN-002",
        scenario_id="UNIT_INTEGRATION_TEST",
        disposition="FAIL",
        reason_code="TEST_FAILED",
        component="TEST",
        correlation_id="corr-002",
        runtime_scope=RuntimeScope.CROSS_RUNTIME,
        suite_type=IntegrationSuiteType.UNIT_INTEGRATION,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "CROSS_RUNTIME_INTEGRATION_SUITE_FAIL"


def test_gate_policy_regression_detected_blocked():
    manager = IntegrationGateManager()
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
    manager = IntegrationGateManager()
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
    manager = IntegrationGateManager()

    manager.build_gate_record(
        run_id="RUN-PY",
        scenario_id="PYTHON_SUITE",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-py",
        runtime_scope=RuntimeScope.PYTHON,
        suite_type=IntegrationSuiteType.UNIT_INTEGRATION,
    )

    manager.build_gate_record(
        run_id="RUN-DEBT",
        scenario_id="DEBT_CHECK",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-debt",
        integration_debt_status=IntegrationDebtStatus.CLOSED,
    )

    summary = manager.get_gate_summary()
    assert summary["suite_pass_rate"] == 1.0
    assert summary["open_integration_debt"] == 0
    assert summary["total_regressions"] == 0
    assert summary["runtime_distribution"]["PYTHON"] == 1
    assert summary["blocked_count"] == 0
