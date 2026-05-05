from src.utils.release_gate_manager import (
    ReleaseGateManager,
    SuiteType,
    DebtStatus,
)


def test_gate_policy_open_debt_blocked():
    manager = ReleaseGateManager()
    record = manager.build_gate_record(
        run_id="RUN-001",
        scenario_id="DEBT_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-001",
        evidence_ids=["EV-W21-204"],
        debt_item_id="DEBT-001",
        debt_status=DebtStatus.OPEN,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "OPEN_TEST_DEBT"


def test_gate_policy_suite_failure_blocked():
    manager = ReleaseGateManager()
    record = manager.build_gate_record(
        run_id="RUN-002",
        scenario_id="UNIT_TEST",
        disposition="FAIL",
        reason_code="TEST_FAILED",
        component="TEST",
        correlation_id="corr-002",
        evidence_ids=["EV-W21-203"],
        suite_id="SUITE-UNIT-001",
        suite_type=SuiteType.UNIT,
        debt_item_id="DEBT-UNIT-001",
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "UNIT_SUITE_FAIL"


def test_gate_policy_regression_detected_blocked():
    manager = ReleaseGateManager()
    record = manager.build_gate_record(
        run_id="RUN-003",
        scenario_id="REGRESSION_TEST",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-003",
        evidence_ids=["EV-W21-207"],
        regression_count=2,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "REGRESSION_DETECTED"


def test_gate_policy_missing_correlation_id():
    manager = ReleaseGateManager()
    record = manager.build_gate_record(
        run_id="RUN-004",
        scenario_id="GATE_SCENARIO",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id=None,
        evidence_ids=["EV-W21-208"],
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_CORRELATION_ID"


def test_gate_policy_missing_debt_mapping_for_failed_suite():
    manager = ReleaseGateManager()
    record = manager.build_gate_record(
        run_id="RUN-005",
        scenario_id="TYPE_SUITE",
        disposition="FAIL",
        reason_code="TYPE_FAIL",
        component="TEST",
        correlation_id="corr-005",
        evidence_ids=["EV-W21-202"],
        suite_id="SUITE-TYPE-001",
        suite_type=SuiteType.TYPE,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_DEBT_MAPPING"


def test_gate_policy_pass_without_evidence_blocked():
    manager = ReleaseGateManager()
    record = manager.build_gate_record(
        run_id="RUN-006",
        scenario_id="LINT_SUITE",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-006",
        suite_id="SUITE-LINT-001",
        suite_type=SuiteType.LINT,
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_EVIDENCE_CAPTURE"


def test_gate_summary_aggregation():
    manager = ReleaseGateManager()

    manager.build_gate_record(
        run_id="RUN-LINT",
        scenario_id="LINT_SUITE",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-lint",
        evidence_ids=["EV-W21-201"],
        suite_id="SUITE-LINT-001",
        suite_type=SuiteType.LINT,
    )

    manager.build_gate_record(
        run_id="RUN-DEBT",
        scenario_id="DEBT_CHECK",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-debt",
        evidence_ids=["EV-W21-204"],
        debt_item_id="DEBT-002",
        debt_status=DebtStatus.CLOSED,
    )

    summary = manager.get_gate_summary()
    assert summary["suite_pass_rate"] == 1.0
    assert summary["open_test_debt"] == 0
    assert summary["total_regressions"] == 0
    assert summary["suite_distribution"]["LINT"] == 1
    assert summary["blocked_count"] == 0
