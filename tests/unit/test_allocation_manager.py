from models.governance import ControlStatus, ControlType
from risk.allocation_manager import AllocationManager, AllocationPolicy


def test_allocation_allows_within_policy_band():
    manager = AllocationManager(AllocationPolicy(max_sizing_band=0.10), owner="ops")
    record = manager.check_allocation(
        strategy_id="s-allow",
        symbol="AAPL",
        requested_quantity=5,
        price=100,
        volatility=0.02,
        regime="BULL",
        current_drawdown=0.02,
        total_equity=10_000,
    )

    assert record.control_type == ControlType.ALLOCATION
    assert record.status == ControlStatus.ALLOW
    assert record.breach_flag is False


def test_allocation_rejects_when_over_limit():
    manager = AllocationManager(AllocationPolicy(max_sizing_band=0.10), owner="ops")
    record = manager.check_allocation(
        strategy_id="s-reject",
        symbol="MSFT",
        requested_quantity=1000,
        price=100,
        volatility=0.01,
        regime="SIDEWAYS",
        current_drawdown=0.02,
        total_equity=10_000,
    )

    assert record.control_type == ControlType.ALLOCATION
    assert record.status == ControlStatus.REJECT
    assert record.breach_flag is True


def test_allocation_blocks_on_drawdown_halt():
    manager = AllocationManager(AllocationPolicy(max_drawdown_limit=0.15), owner="ops")
    record = manager.check_allocation(
        strategy_id="s-block",
        symbol="GOOGL",
        requested_quantity=1,
        price=100,
        volatility=0.01,
        regime="BEAR",
        current_drawdown=0.20,
        total_equity=10_000,
    )

    assert record.status == ControlStatus.BLOCKED
    assert record.metadata["drawdown_state"] == "HALT"


def test_allocation_record_has_required_metadata():
    manager = AllocationManager(AllocationPolicy(), owner="ops")
    record = manager.check_allocation(
        strategy_id="s-meta",
        symbol="TSLA",
        requested_quantity=1,
        price=100,
        volatility=0.03,
        regime="HIGH_VOL",
        current_drawdown=0.01,
        total_equity=10_000,
    )

    assert record.owner
    assert record.decision_reason
    assert record.evidence_ids
    assert record.metadata["sizing_mode"]
    assert record.metadata["regime_class"]
    assert record.metadata["volatility_bucket"]
    assert record.metadata["drawdown_state"]
