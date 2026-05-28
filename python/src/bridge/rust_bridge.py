"""
Python bridge to Rust signal processing components via PyO3.
"""

import sys
import time
from typing import List, Optional

import numpy as np
import pandas as pd
from loguru import logger

RUST_BATCH_FEATURE_COLUMNS = ["close", "log_returns", "momentum_10", "volume", "range_pct"]
REQUIRED_OHLCV_COLUMNS = ["open", "high", "low", "close", "volume"]


class RustFeatureComputer:
    """
    Python wrapper for Rust-based feature computation.

    Phase 1.1 contract:
    - Batch API is columnar NumPy only.
    - No per-row MarketBar conversion for feature offload.
    """

    def __init__(self):
        try:
            from signal_bridge import FeatureComputer

            self._computer = FeatureComputer()
            self._call_counter = 0
            self.last_batch_wrapper_time_ms = 0.0
            self.last_batch_compute_time_ms: Optional[float] = None
            self.last_batch_boundary_time_ms: Optional[float] = None
            self.last_batch_size = 0
            logger.info("[cid:INIT] Rust FeatureComputer initialized successfully")
        except ImportError as e:
            logger.error(f"[cid:INIT] Failed to import signal_bridge: {e}")
            raise RuntimeError("Rust signal_bridge module not available") from e

    @staticmethod
    def _as_float64_contiguous(name: str, values: np.ndarray) -> np.ndarray:
        arr = np.asarray(values, dtype=np.float64)
        if arr.ndim != 1:
            raise ValueError(f"{name} must be a 1D array")
        arr = np.ascontiguousarray(arr, dtype=np.float64)
        return arr

    @staticmethod
    def _as_int64_contiguous(name: str, values: np.ndarray) -> np.ndarray:
        arr = np.asarray(values, dtype=np.int64)
        if arr.ndim != 1:
            raise ValueError(f"{name} must be a 1D array")
        arr = np.ascontiguousarray(arr, dtype=np.int64)
        return arr

    @staticmethod
    def _validate_ohlcv(
        open_arr: np.ndarray,
        high_arr: np.ndarray,
        low_arr: np.ndarray,
        close_arr: np.ndarray,
        volume_arr: np.ndarray,
        timestamp_arr: Optional[np.ndarray] = None,
    ) -> None:
        n = len(close_arr)
        if n == 0:
            raise ValueError("input arrays cannot be empty")
        if (
            len(open_arr) != n
            or len(high_arr) != n
            or len(low_arr) != n
            or len(volume_arr) != n
        ):
            raise ValueError("open/high/low/close/volume must have same length")
        if timestamp_arr is not None and len(timestamp_arr) != n:
            raise ValueError("timestamp must have same length as price arrays")

        if not (
            np.isfinite(open_arr).all()
            and np.isfinite(high_arr).all()
            and np.isfinite(low_arr).all()
            and np.isfinite(close_arr).all()
            and np.isfinite(volume_arr).all()
        ):
            raise ValueError("OHLCV contains NaN/inf")

        if (close_arr <= 0).any():
            raise ValueError("close must be positive for all rows")

    def compute_batch_named(
        self,
        open_arr: np.ndarray,
        high_arr: np.ndarray,
        low_arr: np.ndarray,
        close_arr: np.ndarray,
        volume_arr: np.ndarray,
        timestamp_arr: Optional[np.ndarray] = None,
    ) -> pd.DataFrame:
        """
        Compute batch features via columnar NumPy FFI.
        Returns a DataFrame with stable column names.
        """
        open_arr = self._as_float64_contiguous("open", open_arr)
        high_arr = self._as_float64_contiguous("high", high_arr)
        low_arr = self._as_float64_contiguous("low", low_arr)
        close_arr = self._as_float64_contiguous("close", close_arr)
        volume_arr = self._as_float64_contiguous("volume", volume_arr)
        if timestamp_arr is not None:
            timestamp_arr = self._as_int64_contiguous("timestamp", timestamp_arr)

        self._validate_ohlcv(
            open_arr=open_arr,
            high_arr=high_arr,
            low_arr=low_arr,
            close_arr=close_arr,
            volume_arr=volume_arr,
            timestamp_arr=timestamp_arr,
        )

        start_time = time.perf_counter()
        result, compute_time_ms = self._computer.compute_batch_named(
            open_arr,
            high_arr,
            low_arr,
            close_arr,
            volume_arr,
            timestamp_arr,
        )
        end_time = time.perf_counter()

        self.last_batch_wrapper_time_ms = (end_time - start_time) * 1000
        self.last_batch_compute_time_ms = float(compute_time_ms)
        self.last_batch_boundary_time_ms = max(
            self.last_batch_wrapper_time_ms - self.last_batch_compute_time_ms, 0.0
        )
        self.last_batch_size = len(close_arr)

        df = pd.DataFrame(result, columns=RUST_BATCH_FEATURE_COLUMNS)
        missing_columns = set(RUST_BATCH_FEATURE_COLUMNS) - set(df.columns)
        if missing_columns:
            raise ValueError(f"Rust backend missing feature columns: {missing_columns}")
        return df

    def compute_streaming(
        self,
        symbol: str,
        open_price: float,
        high: float,
        low: float,
        close: float,
        volume: float,
        timestamp: int,
    ) -> List[float]:
        """
        Legacy streaming helper kept for non-batch real-time paths.
        """
        from signal_bridge import Bar

        self._call_counter += 1
        bar = Bar(
            symbol=symbol,
            open=float(open_price),
            high=float(high),
            low=float(low),
            close=float(close),
            volume=float(volume),
            timestamp=int(timestamp),
        )
        features = self._computer.compute_streaming(bar)
        if self._call_counter % 100 == 0:
            logger.debug(
                f"[cid:INIT] Computed {len(features)} streaming features for {symbol} (sampled)"
            )
        return features

    def compute_microstructure(
        self, bid_price: float, ask_price: float, bid_depth: float, ask_depth: float
    ) -> List[float]:
        return self._computer.compute_microstructure(
            bid_price, ask_price, bid_depth, ask_depth
        )


def test_rust_bridge() -> bool:
    logger.info("[cid:INIT] Testing Rust feature computation bridge...")

    try:
        computer = RustFeatureComputer()

        streaming_features = computer.compute_streaming(
            symbol="AAPL",
            open_price=150.0,
            high=152.5,
            low=149.5,
            close=151.0,
            volume=1_000_000.0,
            timestamp=1234567890,
        )
        logger.info(f"[cid:INIT] ✓ Streaming features: {len(streaming_features)} values")

        open_arr = np.linspace(150.0, 160.0, 20, dtype=np.float64)
        high_arr = open_arr + 1.0
        low_arr = open_arr - 1.0
        close_arr = open_arr + 0.5
        volume_arr = np.full(20, 1_000_000.0, dtype=np.float64)

        batch_features_df = computer.compute_batch_named(
            open_arr=open_arr,
            high_arr=high_arr,
            low_arr=low_arr,
            close_arr=close_arr,
            volume_arr=volume_arr,
        )
        logger.info(f"[cid:INIT] ✓ Batch features shape: {batch_features_df.shape}")

        micro_features = computer.compute_microstructure(
            bid_price=150.95,
            ask_price=151.05,
            bid_depth=10_000.0,
            ask_depth=8_000.0,
        )
        logger.info(f"[cid:INIT] ✓ Microstructure features: {micro_features}")
        logger.info("[cid:INIT] ✅ All Rust bridge tests passed!")
        return True
    except Exception as e:
        logger.error(f"[cid:INIT] ❌ Rust bridge test failed: {e}")
        return False


if __name__ == "__main__":
    logger.remove()
    logger.add(sys.stderr, format="{time} | {level: <8} | {message}", level="DEBUG")
    success = test_rust_bridge()
    sys.exit(0 if success else 1)
