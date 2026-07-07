import os

# Mitigate httpx crash on Python 3.14 due to IPv6 CIDR in no_proxy
for key in ["no_proxy", "NO_PROXY"]:
    val = os.environ.get(key)
    if val:
        # Remove components with IPv6 CIDRs like ::1/128 or [::1]/128
        parts = [p for p in val.split(",") if not ("/" in p and ":" in p)]
        os.environ[key] = ",".join(parts)

try:
    import signal_bridge

    HAS_SIGNAL_BRIDGE = True
except ImportError:
    HAS_SIGNAL_BRIDGE = False


def pytest_runtest_setup(item: Any) -> None:
    if not HAS_SIGNAL_BRIDGE:
        required_files = [
            "test_full_system.py",
            "test_backtest_signal_flow.py",
            "test_backtest_signal_validation.py",
            "test_exit_signal_fix.py",
            "test_portfolio_handler_shorts.py",
            "test_signal_execution_bug.py",
            "test_backtest_engine.py",
        ]
        if any(req in str(item.fspath) for req in required_files):
            import pytest

            pytest.skip(f"signal_bridge extension is required for rust backend gate")


import pytest
from typing import Any, Dict, List


@pytest.fixture
def signal_trace() -> List[Dict[str, Any]]:
    """
    Golden fixture for deterministic signal traces.
    """
    return [
        {
            "timestamp": "2026-07-07T12:00:00Z",
            "symbol": "AAPL",
            "signal_type": "BUY",
            "price": 150.0,
            "quantity": 10.0,
            "strategy_id": "strategy-alpha",
            "signal_id": "SIG-001",
        },
        {
            "timestamp": "2026-07-07T12:05:00Z",
            "symbol": "MSFT",
            "signal_type": "BUY",
            "price": 300.0,
            "quantity": 5.0,
            "strategy_id": "strategy-alpha",
            "signal_id": "SIG-002",
        },
    ]


@pytest.fixture
def risk_decision_trace() -> List[Dict[str, Any]]:
    """
    Golden fixture for deterministic risk decision traces.
    Matches the fields expected by compare_risk_decision_traces.
    """
    return [
        {
            "timestamp": "2026-07-07T12:00:01Z",
            "symbol": "AAPL",
            "signal_type": "BUY",
            "strategy_id": "strategy-alpha",
            "signal_id": "SIG-001",
            "sequence_no": 1,
            "decision": "ALLOW",
            "reason_code": "OK",
        },
        {
            "timestamp": "2026-07-07T12:05:02Z",
            "symbol": "MSFT",
            "signal_type": "BUY",
            "strategy_id": "strategy-alpha",
            "signal_id": "SIG-002",
            "sequence_no": 2,
            "decision": "ALLOW",
            "reason_code": "OK",
        },
    ]


@pytest.fixture
def backtest_output() -> Dict[str, Any]:
    """
    Golden fixture for deterministic backtest output.
    """
    return {
        "metrics": {
            "sharpe_ratio": 1.85,
            "max_drawdown": 0.05,
            "win_rate": 0.62,
            "profit_factor": 1.45,
            "total_trades": 12,
            "final_equity": 105000.0,
        },
        "equity_curve": [
            {"timestamp": "2026-07-07T12:00:00Z", "equity": 100000.0},
            {"timestamp": "2026-07-07T12:05:00Z", "equity": 101500.0},
            {"timestamp": "2026-07-07T12:10:00Z", "equity": 105000.0},
        ],
    }
