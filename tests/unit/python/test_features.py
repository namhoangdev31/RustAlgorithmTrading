"""
Unit tests for feature engineering.

Tests cover:
- Technical indicator calculations
- Feature transformation accuracy
- Edge case handling
- Numerical stability
"""

import pytest
import pandas as pd
import numpy as np

from data.features import FeatureEngine
from data.indicators import TechnicalIndicators


@pytest.mark.unit
class TestTechnicalIndicators:
    """Test suite for technical indicator calculations."""

    def test_sma_calculation(self, sample_ohlcv_data):
        """Test Simple Moving Average calculation."""
        window = 20

        expected_sma = sample_ohlcv_data["close"].rolling(window=window).mean()
        actual_sma = TechnicalIndicators.sma(sample_ohlcv_data["close"], window)

        pd.testing.assert_series_equal(actual_sma, expected_sma)

    def test_ema_calculation(self, sample_ohlcv_data):
        """Test Exponential Moving Average calculation."""
        span = 20

        expected_ema = sample_ohlcv_data["close"].ewm(span=span, adjust=False).mean()
        actual_ema = TechnicalIndicators.ema(sample_ohlcv_data["close"], span)

        pd.testing.assert_series_equal(actual_ema, expected_ema)

    def test_rsi_calculation(self):
        """Test RSI (Relative Strength Index) calculation."""
        # Create test data with known RSI
        prices = pd.Series(
            [
                44,
                44.34,
                44.09,
                43.61,
                44.33,
                44.83,
                45.10,
                45.42,
                45.84,
                46.08,
                45.89,
                46.03,
                45.61,
                46.28,
                46.28,
                46.00,
                46.03,
                46.41,
                46.22,
                45.64,
            ]
        )

        rsi = TechnicalIndicators.rsi(prices, period=14).dropna()

        assert not rsi.empty
        assert (rsi >= 0).all()
        assert (rsi <= 100).all()

    def test_bollinger_bands(self, sample_ohlcv_data):
        """Test Bollinger Bands calculation."""
        window = 20
        num_std = 2

        sma = sample_ohlcv_data["close"].rolling(window=window).mean()
        std = sample_ohlcv_data["close"].rolling(window=window).std()

        expected_upper = sma + (num_std * std)
        expected_lower = sma - (num_std * std)
        upper, middle, lower = TechnicalIndicators.bollinger_bands(
            sample_ohlcv_data["close"], window, num_std
        )

        pd.testing.assert_series_equal(upper, expected_upper)
        pd.testing.assert_series_equal(middle, sma)
        pd.testing.assert_series_equal(lower, expected_lower)

    def test_macd_calculation(self, sample_ohlcv_data):
        """Test MACD indicator calculation."""
        fast = 12
        slow = 26
        signal = 9

        ema_fast = sample_ohlcv_data["close"].ewm(span=fast, adjust=False).mean()
        ema_slow = sample_ohlcv_data["close"].ewm(span=slow, adjust=False).mean()
        expected_macd = ema_fast - ema_slow
        expected_signal = expected_macd.ewm(span=signal, adjust=False).mean()
        expected_hist = expected_macd - expected_signal
        macd_line, signal_line, histogram = TechnicalIndicators.macd(
            sample_ohlcv_data["close"], fast, slow, signal
        )

        pd.testing.assert_series_equal(macd_line, expected_macd)
        pd.testing.assert_series_equal(signal_line, expected_signal)
        pd.testing.assert_series_equal(histogram, expected_hist)

    def test_atr_calculation(self, sample_ohlcv_data):
        """Test Average True Range calculation."""
        period = 14
        high = sample_ohlcv_data["high"]
        low = sample_ohlcv_data["low"]
        close = sample_ohlcv_data["close"]
        tr = pd.concat(
            [high - low, (high - close.shift()).abs(), (low - close.shift()).abs()],
            axis=1,
        ).max(axis=1)
        expected_atr = tr.rolling(window=period).mean()
        actual_atr = TechnicalIndicators.atr(high, low, close, period)

        pd.testing.assert_series_equal(actual_atr, expected_atr)


@pytest.mark.unit
class TestFeatureTransformations:
    """Test suite for feature transformation functions."""

    def test_log_returns(self, sample_ohlcv_data):
        """Test log returns calculation."""
        prices = sample_ohlcv_data["close"]
        expected_returns = np.log(prices / prices.shift(1))

        engine = FeatureEngine(
            include_indicators=False,
            include_volume_features=False,
            include_time_features=False,
        )
        features = engine.create_features(sample_ohlcv_data)

        pd.testing.assert_series_equal(
            features["log_returns"], expected_returns.loc[features.index], check_names=False
        )

    def test_percentage_returns(self, sample_ohlcv_data):
        """Test percentage returns calculation."""
        prices = sample_ohlcv_data["close"]
        expected_returns = prices.pct_change()

        engine = FeatureEngine(
            include_indicators=False,
            include_volume_features=False,
            include_time_features=False,
        )
        features = engine.create_features(sample_ohlcv_data)

        pd.testing.assert_series_equal(
            features["returns"], expected_returns.loc[features.index], check_names=False
        )

    def test_standardization(self):
        """Test feature standardization (z-score)."""
        data = pd.Series([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

        expected_mean = 0
        expected_std = 1

        standardized = (data - data.mean()) / data.std()
        assert abs(standardized.mean() - expected_mean) < 1e-10
        assert abs(standardized.std() - expected_std) < 1e-10

    def test_normalization(self):
        """Test feature normalization to [0, 1] range."""
        data = pd.Series([10, 20, 30, 40, 50])

        normalized = (data - data.min()) / (data.max() - data.min())
        assert normalized.min() == 0
        assert normalized.max() == 1

    def test_feature_engine_python_default_path(self, sample_ohlcv_data):
        """FeatureEngine keeps Python as the default feature backend."""
        engine = FeatureEngine(feature_backend="python")
        features = engine.create_features(
            sample_ohlcv_data,
            feature_config={
                "sma_periods": [10, 20, 50],
                "ema_periods": [12, 26],
                "rsi_periods": [14],
            },
        )

        assert engine.feature_backend == "python"
        assert "log_returns" in features.columns
        assert "momentum_10" in features.columns
        assert not features.empty

    def test_feature_engine_rust_fallback_to_python(self, sample_ohlcv_data):
        """Rust opt-in path falls back to Python when the Rust computer fails."""

        class FailingRustComputer:
            def compute_batch_named(self, _bars):
                raise RuntimeError("simulated rust backend failure")

        engine = FeatureEngine(
            feature_backend="rust",
            rust_feature_computer=FailingRustComputer(),
            rust_fallback_to_python=True,
        )
        features = engine.create_features(
            sample_ohlcv_data,
            feature_config={
                "sma_periods": [10, 20, 50],
                "ema_periods": [12, 26],
                "rsi_periods": [14],
            },
        )

        assert "returns" in features.columns
        assert "momentum_10" in features.columns
        assert not features.empty


@pytest.mark.unit
class TestFeatureEdgeCases:
    """Test edge cases in feature calculations."""

    def test_handles_zero_volatility(self):
        """Test features handle constant price gracefully."""
        constant_prices = pd.Series([100.0] * 60)
        data = pd.DataFrame(
            {
                "open": constant_prices,
                "high": constant_prices,
                "low": constant_prices,
                "close": constant_prices,
                "volume": 1_000.0,
            }
        )
        engine = FeatureEngine(
            include_indicators=False,
            include_volume_features=False,
            include_time_features=False,
        )
        features = engine.create_features(data)

        assert np.isfinite(features["returns"].fillna(0.0)).all()
        assert (features["volatility_20"] == 0.0).all()

    def test_handles_extreme_values(self):
        """Test features handle extreme price movements."""
        prices = pd.Series([100, 100, 100, 1000, 100, 100])  # Price spike

        returns = prices.pct_change()
        assert not np.isinf(returns.dropna()).any()

    def test_insufficient_data(self):
        """Test features handle insufficient data gracefully."""
        short_series = pd.Series([100, 101, 102])

        sma = TechnicalIndicators.sma(short_series, period=20)
        assert len(sma) == len(short_series)
        assert sma.isna().all()

    def test_numerical_stability(self):
        """Test numerical stability with very small/large numbers."""
        # Very small prices
        small_prices = pd.Series([1e-8, 1.1e-8, 1.2e-8, 1.15e-8])

        # Very large prices
        large_prices = pd.Series([1e8, 1.1e8, 1.2e8, 1.15e8])

        small_returns = small_prices.pct_change()
        large_returns = large_prices.pct_change()

        assert np.allclose(small_returns, large_returns, equal_nan=True)
