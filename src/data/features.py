"""
Feature engineering pipeline for ML models.
"""

from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from loguru import logger

from .indicators import TechnicalIndicators
from bridge.rust_bridge import (
    REQUIRED_OHLCV_COLUMNS,
    RUST_BATCH_FEATURE_COLUMNS,
    RustFeatureComputer,
)


class FeatureEngine:
    """
    Feature engineering pipeline for creating ML-ready features.

    Features include:
    - Technical indicators
    - Price-based features
    - Volume-based features
    - Market microstructure features
    - Time-based features
    """

    def __init__(
        self,
        include_indicators: bool = True,
        include_price_features: bool = True,
        include_volume_features: bool = True,
        include_time_features: bool = True,
        feature_backend: str = "rust",
        rust_feature_computer: Optional[RustFeatureComputer] = None,
        rust_fallback_to_python: bool = True,
    ):
        """
        Initialize feature engine.

        Args:
            include_indicators: Include technical indicators
            include_price_features: Include price-based features
            include_volume_features: Include volume-based features
            include_time_features: Include time-based features
            feature_backend: "rust" (default) or "python"
            rust_feature_computer: Optional existing RustFeatureComputer
            rust_fallback_to_python: If Rust fails, fallback to python
        """
        self.include_indicators = include_indicators
        self.include_price_features = include_price_features
        self.include_volume_features = include_volume_features
        self.include_time_features = include_time_features
        
        if feature_backend not in {"python", "rust"}:
            raise ValueError(f"Unsupported feature_backend: {feature_backend}")

        self.feature_backend = feature_backend
        self.rust_fallback_to_python = rust_fallback_to_python
        self.rust_feature_computer: Optional[RustFeatureComputer] = rust_feature_computer
        self.rust_feature_computer = RustFeatureComputer()

        self.indicators = TechnicalIndicators()
        logger.info(f"Initialized FeatureEngine (backend: {self.feature_backend})")

    def _should_use_rust(self, feature_config: Optional[Dict[str, Any]] = None) -> bool:
        """Check if we should use Rust backend."""
        if feature_config and feature_config.get("feature_backend") == "python":
            return False
        return self.feature_backend == "rust"

    def _create_rust_batch_features(
        self,
        data: pd.DataFrame,
        feature_config: Optional[Dict[str, Any]] = None,
    ) -> pd.DataFrame:
        """Create features using Rust PyO3 columnar kernel (Phase 1.1)."""
        missing_columns = set(REQUIRED_OHLCV_COLUMNS) - set(data.columns)
        if missing_columns:
            raise ValueError(f"Missing required OHLCV columns for Rust backend: {missing_columns}")

        if self.rust_feature_computer is None:
            self.rust_feature_computer = RustFeatureComputer()

        open_arr = np.ascontiguousarray(data["open"].to_numpy(dtype=np.float64, copy=False))
        high_arr = np.ascontiguousarray(data["high"].to_numpy(dtype=np.float64, copy=False))
        low_arr = np.ascontiguousarray(data["low"].to_numpy(dtype=np.float64, copy=False))
        close_arr = np.ascontiguousarray(data["close"].to_numpy(dtype=np.float64, copy=False))
        volume_arr = np.ascontiguousarray(data["volume"].to_numpy(dtype=np.float64, copy=False))

        # Phase 1.1 policy: fail-fast entire batch on invalid numeric input.
        if (
            not np.isfinite(open_arr).all()
            or not np.isfinite(high_arr).all()
            or not np.isfinite(low_arr).all()
            or not np.isfinite(close_arr).all()
            or not np.isfinite(volume_arr).all()
        ):
            raise ValueError("Rust backend received non-finite OHLCV values (NaN/inf)")
        if (close_arr <= 0.0).any():
            raise ValueError("Rust backend requires close > 0 for every row")

        rust_features_df = self.rust_feature_computer.compute_batch_named(
            open_arr=open_arr,
            high_arr=high_arr,
            low_arr=low_arr,
            close_arr=close_arr,
            volume_arr=volume_arr,
        )

        # Sync index with original data
        rust_features_df.index = data.index

        return rust_features_df

    def create_features(
        self,
        data: pd.DataFrame,
        feature_config: Optional[Dict[str, Any]] = None,
    ) -> pd.DataFrame:
        """
        Create all features.

        Args:
            data: OHLCV DataFrame
            feature_config: Feature configuration

        Returns:
            DataFrame with features
        """
        if self._should_use_rust(feature_config):
            try:
                rust_df = self._create_rust_batch_features(data, feature_config)
                df = data.copy()
                for column in RUST_BATCH_FEATURE_COLUMNS:
                    df[column] = rust_df[column]
                df = df.dropna()
                logger.info(f"Created Rust features: {len(data)} -> {len(df)} rows")
                return df
            except Exception as e:
                if self.rust_fallback_to_python:
                    logger.warning(f"Rust feature computation failed, falling back to python: {e}")
                else:
                    raise

        # Python default behavior
        df = data.copy()

        if self.include_indicators:
            df = self._add_technical_indicators(df, feature_config)

        if self.include_price_features:
            df = self._add_price_features(df)

        if self.include_volume_features:
            df = self._add_volume_features(df)

        if self.include_time_features:
            df = self._add_time_features(df)

        # Remove NaN rows created by indicators
        original_len = len(df)
        df = df.dropna()

        logger.info(
            f"Created features: {original_len} -> {len(df)} rows, " f"{len(df.columns)} features"
        )

        return df

    def _add_technical_indicators(
        self,
        df: pd.DataFrame,
        config: Optional[Dict[str, Any]] = None,
    ) -> pd.DataFrame:
        """Add technical indicators."""
        config = config or {}

        # Moving averages
        for period in config.get("sma_periods", [10, 20, 50, 200]):
            df[f"sma_{period}"] = self.indicators.sma(df["close"], period)

        for period in config.get("ema_periods", [12, 26, 50]):
            df[f"ema_{period}"] = self.indicators.ema(df["close"], period)

        # RSI
        for period in config.get("rsi_periods", [14]):
            df[f"rsi_{period}"] = self.indicators.rsi(df["close"], period)

        # MACD
        macd_config = config.get("macd", {"fast": 12, "slow": 26, "signal": 9})
        macd, signal, hist = self.indicators.macd(
            df["close"], macd_config["fast"], macd_config["slow"], macd_config["signal"]
        )
        df["macd"] = macd
        df["macd_signal"] = signal
        df["macd_hist"] = hist

        # Bollinger Bands
        bb_config = config.get("bollinger", {"period": 20, "std": 2})
        upper, middle, lower = self.indicators.bollinger_bands(
            df["close"], bb_config["period"], bb_config["std"]
        )
        df["bb_upper"] = upper
        df["bb_middle"] = middle
        df["bb_lower"] = lower
        df["bb_width"] = (upper - lower) / middle

        # ATR
        for period in config.get("atr_periods", [14]):
            df[f"atr_{period}"] = self.indicators.atr(df["high"], df["low"], df["close"], period)

        logger.debug(f"Added technical indicators: {len(df.columns)} columns")
        return df

    def _add_price_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add price-based features."""
        # Returns
        df["returns"] = df["close"].pct_change()
        df["log_returns"] = np.log(df["close"] / df["close"].shift(1))

        # Price ranges
        df["high_low_range"] = (df["high"] - df["low"]) / df["close"]
        df["close_open_range"] = (df["close"] - df["open"]) / df["open"]

        # Rolling volatility
        for window in [5, 10, 20]:
            df[f"volatility_{window}"] = df["returns"].rolling(window).std()

        # Price momentum
        for window in [5, 10, 20]:
            df[f"momentum_{window}"] = df["close"] / df["close"].shift(window) - 1

        # Distance from moving averages
        for period in [10, 20, 50]:
            sma = df["close"].rolling(period).mean()
            df[f"distance_sma_{period}"] = (df["close"] - sma) / sma

        logger.debug(f"Added price features: {len(df.columns)} columns")
        return df

    def _add_volume_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add volume-based features."""
        # Volume changes
        df["volume_change"] = df["volume"].pct_change()

        # Rolling volume statistics
        for window in [5, 10, 20]:
            df[f"volume_sma_{window}"] = df["volume"].rolling(window).mean()
            df[f"volume_ratio_{window}"] = df["volume"] / df[f"volume_sma_{window}"]

        # On-Balance Volume (OBV)
        df["obv"] = (np.sign(df["close"].diff()) * df["volume"]).cumsum()

        # Volume-weighted price
        df["vwap"] = (df["close"] * df["volume"]).cumsum() / df["volume"].cumsum()

        # Money Flow Index (MFI)
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        money_flow = typical_price * df["volume"]

        positive_flow = money_flow.where(typical_price > typical_price.shift(1), 0)
        negative_flow = money_flow.where(typical_price < typical_price.shift(1), 0)

        positive_mf = positive_flow.rolling(14).sum()
        negative_mf = negative_flow.rolling(14).sum()

        mfi = 100 - (100 / (1 + positive_mf / negative_mf))
        df["mfi"] = mfi

        logger.debug(f"Added volume features: {len(df.columns)} columns")
        return df

    def _add_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-based features."""
        if not isinstance(df.index, pd.DatetimeIndex):
            return df

        # Time components
        df["hour"] = df.index.hour
        df["day_of_week"] = df.index.dayofweek
        df["day_of_month"] = df.index.day
        df["month"] = df.index.month
        df["quarter"] = df.index.quarter

        # Cyclical encoding
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"].values / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"].values / 24)

        df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"].values / 7)
        df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"].values / 7)

        df["month_sin"] = np.sin(2 * np.pi * df["month"].values / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"].values / 12)

        logger.debug(f"Added time features: {len(df.columns)} columns")
        return df

    def select_features(
        self,
        df: pd.DataFrame,
        target: str = "returns",
        method: str = "correlation",
        top_k: int = 20,
    ) -> List[str]:
        """
        Select top features based on correlation with target.

        Args:
            df: DataFrame with features
            target: Target variable
            method: Selection method (correlation, mutual_info)
            top_k: Number of features to select

        Returns:
            List of selected feature names
        """
        # Remove target and non-numeric columns
        feature_cols = [
            col for col in df.columns if col != target and pd.api.types.is_numeric_dtype(df[col])
        ]

        if method == "correlation":
            # Calculate correlation with target
            correlations = df[feature_cols].corrwith(df[target]).abs()
            selected = correlations.nlargest(top_k).index.tolist()
        else:
            # Could implement mutual information or other methods
            selected = feature_cols[:top_k]

        logger.info(f"Selected {len(selected)} features using {method}")
        return selected
