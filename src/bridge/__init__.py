"""Python-Rust bridge module for algorithmic trading system."""
from .rust_bridge import MarketBar , RustFeatureComputer , test_rust_bridge
from .zmq_bridge import MessageType, Position, Signal, ZMQPublisher, ZMQSubscriber, test_zmq_bridge

__all__ = [
    # Rust bridge
    "MarketBar",
    "RustFeatureComputer",
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
    if name in {"MarketBar", "RustFeatureComputer", "test_rust_bridge"}:
        from .rust_bridge import MarketBar, RustFeatureComputer, test_rust_bridge

        return {
            "MarketBar": MarketBar,
            "RustFeatureComputer": RustFeatureComputer,
            "test_rust_bridge": test_rust_bridge,
        }[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
