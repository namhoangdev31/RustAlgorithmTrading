from models.governance import ControlStatus, ControlType
from risk.portfolio_controls import PortfolioPolicy, RiskControlManager


def test_exposure_control_rejects_when_limit_exceeded():
    policy = PortfolioPolicy(max_exposure_per_symbol_pct=0.10)
    manager = RiskControlManager(policy=policy, owner="ops")

    record = manager.check_exposure(
        strategy_id="strategy-alpha",
        symbol="AAPL",
        quantity=50,
        price=100,
        total_equity=10_000,
        current_positions={"AAPL": 10_000},
    )

    assert record.control_type == ControlType.EXPOSURE
    assert record.status == ControlStatus.REJECT
    assert record.breach_flag is True
    assert record.measured_value > record.limit_value
    assert record.evidence_ids == ["EV-W14-201"]
    assert record.owner == "ops"
    assert record.next_action == "BLOCK_ORDER"
    assert record.eta == "IMMEDIATE"


def test_exposure_control_allows_when_within_limit():
    policy = PortfolioPolicy(max_exposure_per_symbol_pct=0.20)
    manager = RiskControlManager(policy=policy, owner="ops")

    record = manager.check_exposure(
        strategy_id="strategy-beta",
        symbol="MSFT",
        quantity=5,
        price=100,
        total_equity=10_000,
        current_positions={},
    )

    assert record.control_type == ControlType.EXPOSURE
    assert record.status == ControlStatus.ALLOW
    assert record.breach_flag is False
    assert record.measured_value <= record.limit_value
    assert record.evidence_ids == ["EV-W14-201"]


def test_concentration_control_rejects_when_limit_exceeded():
    policy = PortfolioPolicy(max_concentration_top_10_pct=0.20)
    manager = RiskControlManager(policy=policy, owner="ops")

    record = manager.check_concentration(
        strategy_id="strategy-gamma",
        positions={"AAPL": 7_000, "MSFT": 1_000},
        total_equity=10_000,
    )

    assert record.control_type == ControlType.CONCENTRATION
    assert record.status == ControlStatus.REJECT
    assert record.breach_flag is True
    assert record.measured_value > record.limit_value
    assert record.evidence_ids == ["EV-W14-202"]
    assert record.next_action == "BLOCK_PORTFOLIO"


def test_control_record_has_mandatory_trace_fields():
    policy = PortfolioPolicy()
    manager = RiskControlManager(policy=policy, owner="ops")

    record = manager.check_concentration(
        strategy_id="strategy-delta",
        positions={},
        total_equity=100_000,
    )

    assert record.portfolio_check_id
    assert record.strategy_set_id
    assert record.control_type == ControlType.CONCENTRATION
    assert record.status == ControlStatus.ALLOW
    assert record.owner
    assert record.decision_reason
    assert isinstance(record.evidence_ids, list) and len(record.evidence_ids) > 0
    assert record.next_action
    assert record.eta
