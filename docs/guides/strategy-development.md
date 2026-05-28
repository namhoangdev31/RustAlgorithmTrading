# Strategy Development Guide
## Tri-Runtime Architecture (Python Research Layer)

This guide covers how to develop trading strategies within the Python Research Layer of the Tri-Runtime architecture.

---

## 1. Strategy Architecture

Strategies in this system are designed to be "Signal Generators". They ingest market data (OHLCV) and emit structured `Signal` objects which are then processed by the Rust Trading Kernel via the ZMQ Bridge.

### The Signal Flow
1. **Python**: Fetches data -> Generates `Signal` list -> Pushes to ZMQ.
2. **Rust**: Subscribes to ZMQ -> Validates Signal (Risk Manager) -> Executes (Execution Engine).

---

## 2. Core Components

### 2.1 The `Signal` Object
Signals are no longer simple integers. They are structured dataclasses:

```python
@dataclass
class Signal:
    timestamp: datetime
    symbol: str
    signal_type: SignalType  # LONG, SHORT, EXIT, HOLD
    price: float
    quantity: float = 0.0
    confidence: float = 1.0
    metadata: Optional[Dict[str, Any]] = None
```

### 2.2 The `Strategy` Base Class
Found in `python/src/strategies/base.py`. Every strategy must implement these methods:

```python
class MyStrategy(Strategy):
    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        # Logic for live/step-by-step signals
        pass

    def generate_signal_frame(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Batch Signal Interface (Optimized for Rust Simulation)
        Returns a DataFrame indexed by timestamp with 'signal' column.
        """
        # Vectorized logic here
        pass

    def calculate_position_size(
        self, signal: Signal, account_value: float, current_position: float = 0.0
    ) -> float:
        # Sizing logic
        pass
```

---

## 3. Implementation Example: Momentum Strategy

```python
from src.strategies.base import Strategy, Signal, SignalType
from datetime import datetime
import pandas as pd

class SimpleMomentum(Strategy):
    def __init__(self, window=20):
        super().__init__("SimpleMomentum", {"window": window})
        self.window = window

    def generate_signals(self, data: pd.DataFrame) -> list[Signal]:
        signals = []
        if len(data) < self.window:
            return signals

        # Logic: Buy if current close > moving average
        ma = data['close'].rolling(self.window).mean()
        current_price = data['close'].iloc[-1]

        if current_price > ma.iloc[-1]:
            signals.append(Signal(
                timestamp=datetime.now(),
                symbol=data['symbol'].iloc[-1],
                signal_type=SignalType.LONG,
                price=current_price
            ))
        elif current_price < ma.iloc[-1]:
            signals.append(Signal(
                timestamp=datetime.now(),
                symbol=data['symbol'].iloc[-1],
                signal_type=SignalType.SHORT,
                price=current_price
            ))

        return signals

    def calculate_position_size(self, signal, account_value, current_position=0.0):
        # Risk 1% of account per trade
        return (account_value * 0.01) / signal.price
```

---

## 4. Testing Your Strategy

### Unit Testing
Strategies should be tested using `pytest`. Focus on ensuring the `generate_signals` method returns the expected `SignalType` for specific data patterns.

```python
def test_momentum_signal():
    strategy = SimpleMomentum(window=2)
    data = pd.DataFrame({
        'close': [100, 110],
        'symbol': ['AAPL', 'AAPL']
    })
    signals = strategy.generate_signals(data)
    assert len(signals) == 1
    assert signals[0].signal_type == SignalType.LONG
```

---

## 5. Deployment Checklist

1. **Parameterize**: Use the `parameters` dict in `__init__`.
2. **Type Safety**: Ensure `generate_signals` returns a list of `Signal` objects.
3. **Bridge Verification**: Check `python/src/bridge/zmq_bridge.py` to see how your signals are serialized for the Rust kernel.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026