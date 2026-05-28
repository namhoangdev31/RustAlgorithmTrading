import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from strategies.base import SignalType, Signal


@pytest.mark.unit
class TestMomentumStrategy:
    """Test suite for momentum-based strategies."""

    def test_signal_generation(self, simple_momentum_strategy, sample_ohlcv_data):
        """Test that momentum strategy generates valid signals."""
        signals = simple_momentum_strategy.generate_signals(sample_ohlcv_data)

        # Should return a list of Signal objects
        assert isinstance(signals, list)
        if signals:
            assert isinstance(signals[0], Signal)
            assert signals[0].symbol == "TEST"

    def test_uptrend_generates_buy_signal(self, simple_momentum_strategy):
        """Test that strong uptrend generates buy signals."""
        # Create data with clear uptrend
        dates = pd.date_range("2024-01-01", periods=100, freq="1h")
        # Generate an uptrend
        close_prices = np.linspace(100, 150, 100)
        uptrend_data = pd.DataFrame(
            {
                "open": close_prices * 0.99,
                "high": close_prices * 1.01,
                "low": close_prices * 0.98,
                "close": close_prices,
                "volume": 100000,
                "timestamp": dates,
            },
            index=dates,
        )
        uptrend_data.attrs["symbol"] = "TEST"

        signals = simple_momentum_strategy.generate_signals(uptrend_data)

        # Should generate at least one buy/long signal
        buy_signals = [s for s in signals if s.signal_type == SignalType.LONG]
        assert len(buy_signals) > 0

    def test_deterministic_signals(self, simple_momentum_strategy, sample_ohlcv_data):
        """Test that strategy produces same signals for same input."""
        signals1 = simple_momentum_strategy.generate_signals(sample_ohlcv_data)
        # Reset strategy if it has state
        simple_momentum_strategy.reset()
        signals2 = simple_momentum_strategy.generate_signals(sample_ohlcv_data)

        assert len(signals1) == len(signals2)
        for s1, s2 in zip(signals1, signals2):
            assert s1.signal_type == s2.signal_type
            assert s1.price == s2.price


@pytest.mark.unit
class TestStrategyInvariants:
    """Test strategy invariants that should always hold."""

    def test_no_future_data_leakage(self, simple_momentum_strategy, sample_ohlcv_data):
        """Critical: Strategy should not use future data."""
        # This is a bit complex to test perfectly, but we can check if signals
        # for a prefix match the prefix of signals for the full data.

        full_signals = simple_momentum_strategy.generate_signals(sample_ohlcv_data)

        if len(full_signals) > 5:
            # Pick a signal later in the series to ensure warmup
            target_signal = full_signals[5]
            target_time = target_signal.timestamp

            # Get data up to that timestamp
            partial_data = sample_ohlcv_data[sample_ohlcv_data.index <= target_time].copy()
            partial_data.attrs["symbol"] = "TEST"

            simple_momentum_strategy.reset()
            partial_signals = simple_momentum_strategy.generate_signals(partial_data)

            # Find the signal at target_time in partial results
            matches = [s for s in partial_signals if s.timestamp == target_time]
            assert len(matches) > 0
            assert matches[0].signal_type == target_signal.signal_type

    def test_handles_missing_data_gracefully(self, simple_momentum_strategy):
        """Test strategy handles NaN values appropriately."""
        dates = pd.date_range("2024-01-01", periods=100, freq="1h")
        data = pd.DataFrame(
            {
                "open": 100.0,
                "high": 101.0,
                "low": 99.0,
                "close": 100.0,
                "volume": 1000,
                "timestamp": dates,
            },
            index=dates,
        )
        data.attrs["symbol"] = "TEST"

        # Introduce some NaN values
        data.loc[data.index[20:25], "close"] = np.nan

        # Strategy should not crash
        signals = simple_momentum_strategy.generate_signals(data)
        assert isinstance(signals, list)
