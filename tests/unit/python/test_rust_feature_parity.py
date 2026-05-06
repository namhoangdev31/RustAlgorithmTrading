import numpy as np
import pandas as pd
import pytest

from data.features import FeatureEngine


def _market_data(num_bars: int = 64) -> pd.DataFrame:
    dates = pd.date_range("2024-01-01", periods=num_bars, freq="1min")
    close = np.linspace(102.0, 202.0, num_bars)
    return pd.DataFrame(
        {
            "open": close - 1.0,
            "high": close + 3.0,
            "low": close - 4.0,
            "close": close,
            "volume": np.linspace(1_000.0, 2_000.0, num_bars),
        },
        index=dates,
    )


def _rust_computer_or_skip():
    try:
        from bridge.rust_bridge import RustFeatureComputer

        computer = RustFeatureComputer()
        if not hasattr(computer._computer, "compute_batch_named"):
            pytest.skip("Rust signal_bridge is installed but lacks Phase 1 compute_batch_named")
        return computer
    except Exception as exc:
        pytest.skip(f"Rust signal_bridge not available: {exc}")


def test_rust_feature_computer_compute_batch_named_contract():
    from bridge.rust_bridge import RUST_BATCH_FEATURE_COLUMNS

    data = _market_data()
    computer = _rust_computer_or_skip()

    rust_features = computer.compute_batch_named(
        open_arr=data["open"].to_numpy(dtype=np.float64, copy=False),
        high_arr=data["high"].to_numpy(dtype=np.float64, copy=False),
        low_arr=data["low"].to_numpy(dtype=np.float64, copy=False),
        close_arr=data["close"].to_numpy(dtype=np.float64, copy=False),
        volume_arr=data["volume"].to_numpy(dtype=np.float64, copy=False),
    )

    assert list(rust_features.columns) == RUST_BATCH_FEATURE_COLUMNS
    assert len(rust_features) == len(data)

    expected_log_returns = np.log(data["close"] / data["close"].shift(1)).fillna(0.0)
    expected_momentum_10 = (
        (data["close"] - data["close"].shift(10)) / data["close"].shift(10) * 100.0
    ).fillna(0.0)
    expected_range_pct = (data["high"] - data["low"]) / data["close"] * 100.0

    np.testing.assert_allclose(
        rust_features["log_returns"].to_numpy(),
        expected_log_returns.to_numpy(),
        rtol=1e-10,
        atol=1e-12,
    )
    np.testing.assert_allclose(
        rust_features["momentum_10"].to_numpy(),
        expected_momentum_10.to_numpy(),
        rtol=1e-10,
        atol=1e-12,
    )
    np.testing.assert_allclose(
        rust_features["volume"].to_numpy(),
        data["volume"].to_numpy(),
        rtol=0,
        atol=0,
    )
    np.testing.assert_allclose(
        rust_features["range_pct"].to_numpy(),
        expected_range_pct.to_numpy(),
        rtol=1e-10,
        atol=1e-12,
    )


def test_feature_engine_rust_backend_fallback_behavior():
    data = _market_data(80)

    class FailingRustComputer:
        def compute_batch_named(
            self, open_arr, high_arr, low_arr, close_arr, volume_arr, timestamp_arr=None
        ):
            raise RuntimeError("simulated FFI failure")

    engine = FeatureEngine(
        feature_backend="rust",
        rust_feature_computer=FailingRustComputer(),
        rust_fallback_to_python=True,
    )

    features = engine.create_features(
        data,
        feature_config={
            "sma_periods": [10, 20, 50],
            "ema_periods": [12, 26],
            "rsi_periods": [14],
        },
    )

    assert "log_returns" in features.columns
    assert "momentum_10" in features.columns
    assert not features.empty


def test_feature_engine_rust_backend_can_disable_fallback():
    data = _market_data(20)

    class FailingRustComputer:
        def compute_batch_named(
            self, open_arr, high_arr, low_arr, close_arr, volume_arr, timestamp_arr=None
        ):
            raise RuntimeError("simulated FFI failure")

    engine = FeatureEngine(
        feature_backend="rust",
        rust_feature_computer=FailingRustComputer(),
        rust_fallback_to_python=False,
    )

    with pytest.raises(RuntimeError, match="simulated FFI failure"):
        engine.create_features(data)


def test_rust_feature_computer_fail_fast_on_invalid_batch_inputs():
    computer = _rust_computer_or_skip()
    data = _market_data(16)

    with pytest.raises(ValueError, match="same length"):
        computer.compute_batch_named(
            open_arr=data["open"].to_numpy(dtype=np.float64, copy=False)[:-1],
            high_arr=data["high"].to_numpy(dtype=np.float64, copy=False),
            low_arr=data["low"].to_numpy(dtype=np.float64, copy=False),
            close_arr=data["close"].to_numpy(dtype=np.float64, copy=False),
            volume_arr=data["volume"].to_numpy(dtype=np.float64, copy=False),
        )

    close_nan = data["close"].to_numpy(dtype=np.float64, copy=True)
    close_nan[3] = np.nan
    with pytest.raises(ValueError, match="NaN/inf"):
        computer.compute_batch_named(
            open_arr=data["open"].to_numpy(dtype=np.float64, copy=False),
            high_arr=data["high"].to_numpy(dtype=np.float64, copy=False),
            low_arr=data["low"].to_numpy(dtype=np.float64, copy=False),
            close_arr=close_nan,
            volume_arr=data["volume"].to_numpy(dtype=np.float64, copy=False),
        )

    close_zero = data["close"].to_numpy(dtype=np.float64, copy=True)
    close_zero[0] = 0.0
    with pytest.raises(ValueError, match="close must be positive"):
        computer.compute_batch_named(
            open_arr=data["open"].to_numpy(dtype=np.float64, copy=False),
            high_arr=data["high"].to_numpy(dtype=np.float64, copy=False),
            low_arr=data["low"].to_numpy(dtype=np.float64, copy=False),
            close_arr=close_zero,
            volume_arr=data["volume"].to_numpy(dtype=np.float64, copy=False),
        )
