"""Python-Rust bridge module for algorithmic trading system."""
from .backtest_bridge import RustBacktestBridge
from .rust_bridge import RustFeatureComputer, test_rust_bridge
from .zmq_bridge import MessageType, Position, Signal, ZMQPublisher, ZMQSubscriber, test_zmq_bridge

__all__ = [
    # Rust bridge
    "RustFeatureComputer",
    "RustBacktestBridge",
    "test_rust_bridge",
    # ZMQ bridge
    "ZMQPublisher",
    "ZMQSubscriber",
    "MessageType",
    "Signal",
    "Position",
    "test_zmq_bridge",
]


def __getattr__(name):
    if name in {"RustFeatureComputer", "test_rust_bridge", "RustBacktestBridge"}:
        from .backtest_bridge import RustBacktestBridge
        from .rust_bridge import RustFeatureComputer, test_rust_bridge

        return {
            "RustFeatureComputer": RustFeatureComputer,
            "RustBacktestBridge": RustBacktestBridge,
            "test_rust_bridge": test_rust_bridge,
        }[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
