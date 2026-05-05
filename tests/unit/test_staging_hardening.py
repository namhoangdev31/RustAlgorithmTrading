from datetime import datetime, timezone

from src.utils.staging_manager import StagingHardeningManager


def test_staging_record_contract():
    manager = StagingHardeningManager(owner="tester")
    record = manager.build_record(
        run_id="RUN-001",
        scenario_id="TEST_SCENARIO",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-123",
        evidence_ids=["EV-W17-201"],
    )
    
    assert record.run_id == "RUN-001"
    assert record.scenario_id == "TEST_SCENARIO"
    assert record.reason_code == "OK"
    assert record.component == "UNIT_TEST"
    assert record.correlation_id == "corr-123"
    assert record.evidence_ids == ["EV-W17-201"]
    assert record.owner == "tester"
    assert record.eta == "IMMEDIATE"
    assert record.disposition == "PASS"


def test_policy_missing_correlation_id():
    manager = StagingHardeningManager()
    record = manager.build_record(
        run_id="RUN-002",
        scenario_id="TEST_SCENARIO",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id=None,
    )
    
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_CORRELATION_ID"


def test_policy_missing_rollback_evidence():
    manager = StagingHardeningManager()
    record = manager.build_record(
        run_id="RUN-003",
        scenario_id="ROLLBACK_REHEARSAL",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-456",
        rollback_success=None,
    )
    
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_ROLLBACK_EVIDENCE"


def test_policy_missing_kill_switch_latency_or_timestamp():
    manager = StagingHardeningManager()
    missing_latency = manager.build_record(
        run_id="RUN-004",
        scenario_id="KILL_SWITCH_TEST",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-789",
        latency_sec=None,
    )
    missing_timestamp = manager.build_record(
        run_id="RUN-005",
        scenario_id="KILL_SWITCH_TEST",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-987",
        latency_sec=45.0,
        timestamp=None,
    )
    
    assert missing_latency.disposition == "BLOCKED"
    assert missing_latency.reason_code == "MISSING_LATENCY_METRIC"
    assert missing_timestamp.disposition == "BLOCKED"
    assert missing_timestamp.reason_code == "MISSING_LATENCY_METRIC"


def test_pass_thresholds():
    manager = StagingHardeningManager()
    
    # Kill switch <= 60s
    manager.build_record(
        run_id="RUN-KS",
        scenario_id="KILL_SWITCH_1",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-ks",
        latency_sec=45.0,
        timestamp=datetime.now(timezone.utc),
    )
    
    # Rollback 100%
    manager.build_record(
        run_id="RUN-RB",
        scenario_id="ROLLBACK_1",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-rb",
        rollback_success=True,
    )

    manager.build_record(
        run_id="RUN-ALERT",
        scenario_id="ALERT_QUALITY",
        disposition="PASS",
        reason_code="OK",
        component="UNIT_TEST",
        correlation_id="corr-alert",
        metadata={"fp_rate": 0.12, "fn_count": 0},
    )
    
    summary = manager.get_summary()
    assert summary["kill_switch_latency_sec"] <= 60.0
    assert summary["rollback_success_rate"] == 1.0
    assert summary["alert_fp_rate"] <= 0.15
    assert summary["critical_fn_count"] == 0
    assert summary["blocked_count"] == 0
