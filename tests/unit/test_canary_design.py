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
        exposure_tier=None # Missing
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
        breach_class=None # Missing
    )
    assert record.disposition == "BLOCKED"
    assert record.reason_code == "MISSING_BREACH_CLASS"

def test_canary_summary_aggregation():
    manager = CanaryDesignManager()
    
    manager.build_canary_record(
        run_id="RUN-003",
        scenario_id="CANARY_T1",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-789",
        exposure_tier=ExposureTier.T1
    )
    
    manager.build_canary_record(
        run_id="RUN-004",
        scenario_id="BREACH_LATENCY",
        disposition="PASS",
        reason_code="OK",
        component="TEST",
        correlation_id="corr-101",
        breach_class=BreachClass.LATENCY
    )
    
    summary = manager.get_canary_summary()
    assert summary["canary_scenario_count"] == 1
    assert summary["breach_handling_count"] == 1
    assert summary["tier_distribution"]["T1"] == 1
    assert summary["tier_distribution"]["T2"] == 0
