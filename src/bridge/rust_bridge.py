"""
Python bridge to Rust signal processing components via PyO3.

This module provides a clean Python interface to the high-performance
Rust feature computation engine built with PyO3 bindings.
"""

import sys
import time
from typing import List, Optional
from dataclasses import dataclass
import pandas as pd
import numpy as np
from loguru import logger

from typings.signal_bridge import Bar

RUST_BATCH_FEATURE_COLUMNS = ["close", "log_returns", "momentum_10", "volume", "range_pct"]
REQUIRED_OHLCV_COLUMNS = ["open", "high", "low", "close", "volume"]


@dataclass
class MarketBar:
    """Market data bar structure matching Rust Bar type."""

    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: int

    def to_rust_bar(self):
        """Convert to Rust Bar object."""
        try:
            if Bar is None:
                from signal_bridge import Bar as RustBar
            else:
                RustBar = Bar

            return RustBar(
                symbol=self.symbol,
                open=self.open,
                high=self.high,
                low=self.low,
                close=self.close,
                volume=self.volume,
                timestamp=self.timestamp,
            )
        except ImportError as e:
            logger.error(f"[cid:INIT] Failed to import signal_bridge module: {e}")
            logger.warning(
                "[cid:INIT] Make sure the Rust library is built: cd rust && cargo build --release"
            )
            raise

    @classmethod
    def from_series(cls, symbol: str, row: pd.Series) -> Optional["MarketBar"]:
        """
        Create MarketBar from a pandas Series row, with safety checks.
        Returns None if the data is invalid for Rust processing.
        """
        try:
            for col in REQUIRED_OHLCV_COLUMNS:
                if col not in row:
                    logger.warning(f"[cid:INIT] Missing required column {col} for {symbol}")
                    return None

            o = float(np.float64(row["open"]))
            h = float(np.float64(row["high"]))
            l = float(np.float64(row["low"]))
            c = float(np.float64(row["close"]))
            v = float(np.float64(row["volume"]))

            values = np.array([o, h, l, c, v], dtype=np.float64)
            if not np.isfinite(values).all():
                logger.debug(f"[cid:INIT] Rejected non-finite OHLCV row for {symbol}")
                return None

            if c <= 0:
                logger.debug(f"[cid:INIT] Rejected non-positive close for {symbol}: {c}")
                return None

            timestamp = int(row.name.timestamp()) if isinstance(row.name, pd.Timestamp) else 0

            return cls(
                symbol=symbol,
                open=o,
                high=h,
                low=l,
                close=c,
                volume=v,
                timestamp=timestamp,
            )
        except Exception as e:
            logger.debug(f"Failed to create MarketBar from series: {e}")
            return None


class RustFeatureComputer:
    """
    Python wrapper for Rust-based feature computation.

    Provides high-performance technical indicator and feature calculation
    using Rust's SIMD-optimized implementations via PyO3 bindings.

    Example:
        >>> computer = RustFeatureComputer()
        >>> bar = MarketBar("AAPL", 150.0, 152.0, 149.0, 151.0, 1000000, 1234567890)
        >>> features = computer.compute_streaming(bar)
        >>> print(f"Computed {len(features)} features")
    """

    def __init__(self):
        """Initialize the Rust feature computer."""
        try:
            from signal_bridge import FeatureComputer

            self._computer = FeatureComputer()
            self._call_counter = 0  # Wave-3: Sampling counter
            self.last_batch_wrapper_time_ms = 0.0
            self.last_batch_compute_time_ms = None
            self.last_batch_size = 0
            logger.info("[cid:INIT] Rust FeatureComputer initialized successfully")
        except ImportError as e:
            logger.error(f"[cid:INIT] Failed to import signal_bridge: {e}")
            logger.error("[cid:INIT] Please build the Rust library:")
            logger.error("[cid:INIT]   cd rust")
            logger.error("[cid:INIT]   cargo build --release --package signal-bridge")
            logger.error("[cid:INIT]   export PYTHONPATH=$PWD/target/release:$PYTHONPATH")
            raise RuntimeError("Rust signal_bridge module not available") from e

    def compute_streaming(self, bar: MarketBar) -> List[float]:
        """
        Compute features from a single bar (streaming/real-time mode).

        Args:
            bar: Market data bar

        Returns:
            List of feature values (length varies based on available data)

        Features include:
            - Price (close)
            - RSI (14-period)
            - MACD (line, signal, histogram)
            - EMA (fast, slow, spread)
            - SMA (with distance from price)
            - Volume
            - Price range %
        """
        try:
            self._call_counter += 1
            rust_bar = bar.to_rust_bar()
            features = self._computer.compute_streaming(rust_bar)

            # Wave-3: Sampled logging (1 per 100)
            if self._call_counter % 100 == 0:
                msg = f"Computed {len(features)} streaming features for {bar.symbol} (sampled)"
                logger.debug(f"[cid:INIT] {msg}")

            return features
        except Exception as e:
            logger.error(f"[cid:INIT] Error computing streaming features: {e}")
            raise

    def compute_batch(self, bars: List[MarketBar]) -> List[List[float]]:
        """
        Compute features from a list of bars (batch/historical mode).

        Uses SIMD-accelerated calculations for improved performance.

        Args:
            bars: List of market data bars

        Returns:
            List of feature vectors, one per bar

        Features include:
            - Price (close)
            - Returns (log returns)
            - Momentum (10-period)
            - Volume
            - Price range %
        """
        try:
            rust_bars = [bar.to_rust_bar() for bar in bars]
            features = self._computer.compute_batch(rust_bars)
            logger.debug(f"[cid:INIT] Computed batch features for {len(bars)} bars")
            return features
        except Exception as e:
            logger.error(f"[cid:INIT] Error computing batch features: {e}")
            raise

    def compute_batch_named(self, bars: List[MarketBar]) -> pd.DataFrame:
        """
        Compute features and return as a DataFrame with named columns.
        Measures FFI overhead.
        """
        if not bars:
            return pd.DataFrame(columns=RUST_BATCH_FEATURE_COLUMNS)
            
        try:
            start_time = time.perf_counter()
            rust_bars = [bar.to_rust_bar() for bar in bars]
            compute_start = time.perf_counter()
            features_lists = self._computer.compute_batch_named(rust_bars)
            compute_end = time.perf_counter()
            end_time = time.perf_counter()

            self.last_batch_wrapper_time_ms = (end_time - start_time) * 1000
            self.last_batch_compute_time_ms = (compute_end - compute_start) * 1000
            self.last_batch_size = len(bars)
            logger.debug(
                "[cid:INIT] Rust batch_named wrapper time: "
                f"{self.last_batch_wrapper_time_ms:.2f}ms "
                f"(compute boundary: {self.last_batch_compute_time_ms:.2f}ms) "
                f"for {len(bars)} bars"
            )

            return pd.DataFrame(features_lists, columns=RUST_BATCH_FEATURE_COLUMNS)
        except Exception as e:
            logger.error(f"[cid:INIT] Error computing batch named features: {e}")
            raise

    def compute_microstructure(
        self, bid_price: float, ask_price: float, bid_depth: float, ask_depth: float
    ) -> List[float]:
        """
        Compute market microstructure features from order book data.

        Args:
            bid_price: Best bid price
            ask_price: Best ask price
            bid_depth: Total volume at top bid levels
            ask_depth: Total volume at top ask levels

        Returns:
            List containing:
                [spread, spread_bps, depth_imbalance, bid_depth, ask_depth, mid_price]
        """
        try:
            features = self._computer.compute_microstructure(
                bid_price, ask_price, bid_depth, ask_depth
            )
            logger.debug("[cid:INIT] Computed microstructure features")
            return features
        except Exception as e:
            logger.error(f"[cid:INIT] Error computing microstructure features: {e}")
            raise


def test_rust_bridge():
    """Test the Rust bridge functionality."""
    logger.info("[cid:INIT] Testing Rust feature computation bridge...")

    try:
        # Create feature computer
        computer = RustFeatureComputer()

        # Create test bar
        bar = MarketBar(
            symbol="AAPL",
            open=150.0,
            high=152.5,
            low=149.5,
            close=151.0,
            volume=1_000_000.0,
            timestamp=1234567890,
        )

        # Test streaming features
        streaming_features = computer.compute_streaming(bar)
        logger.info(f"[cid:INIT] ✓ Streaming features: {len(streaming_features)} values")
        logger.info(f"[cid:INIT]   First 5 features: {streaming_features[:5]}")

        # Test batch features
        bars = [
            MarketBar("AAPL", 150.0, 151.0, 149.0, 150.5, 1e6, 1234567890 + i) for i in range(20)
        ]
        batch_features = computer.compute_batch(bars)
        logger.info(f"[cid:INIT] ✓ Batch features: {len(batch_features)} bars processed")
        logger.info(f"[cid:INIT]   Features per bar: {len(batch_features[0])}")

        # Test microstructure features
        micro_features = computer.compute_microstructure(
            bid_price=150.95, ask_price=151.05, bid_depth=10000.0, ask_depth=8000.0
        )
        logger.info(f"[cid:INIT] ✓ Microstructure features: {micro_features}")

        logger.info("[cid:INIT] ✅ All Rust bridge tests passed!")
        return True

    except Exception as e:
        logger.error(f"[cid:INIT] ❌ Rust bridge test failed: {e}")
        return False


if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stderr,
        format="{time} | {level: <8} | {message}",
        level="DEBUG",
    )

    # Run tests
    success = test_rust_bridge()
    sys.exit(0 if success else 1)
