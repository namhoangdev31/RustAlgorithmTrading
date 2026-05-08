"""
Bridge between Python backtest engine and Rust BacktestRuntime.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4
from loguru import logger

import numpy as np
import pandas as pd

try:
    from signal_bridge import BacktestRuntime
except ImportError:
    logger.warning("Rust signal_bridge not found. BacktestRuntime will be unavailable.")
    BacktestRuntime = None


class RustBacktestBridge:
    """Adapter for Rust BacktestRuntime with correlation-aware tracing."""

    def __init__(
        self,
        initial_capital: float,
        symbols: List[str],
        risk_config: Optional[Dict[str, Any]] = None,
        seed: int = 42,
    ):
        if BacktestRuntime is None:
            raise RuntimeError(
                "Rust BacktestRuntime is not available. Please build/install signal-bridge."
            )

        normalized_risk = self._normalize_risk_config(risk_config)
        self.runtime = BacktestRuntime(
            initial_capital,
            symbols,
            normalized_risk["max_position_size"],
            normalized_risk["max_notional_exposure"],
            normalized_risk["max_open_positions"],
            normalized_risk["stop_loss_percent"],
            normalized_risk["max_loss_threshold"],
            normalized_risk["sizing_amount"],
            seed,
        )
        logger.info(
            "Initialized Rust BacktestRuntime with capital={} symbols={} seed={}",
            initial_capital,
            len(symbols),
            seed,
        )

    @staticmethod
    def _normalize_risk_config(risk_config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        defaults = {
            "max_position_size": 10000.0,
            "max_notional_exposure": 50000.0,
            "max_open_positions": 5,
            "stop_loss_percent": 2.0,
            "max_loss_threshold": 500.0,
            "sizing_amount": 0.0,
        }
        if risk_config is None:
            return defaults

        merged = defaults.copy()
        merged.update({k: v for k, v in risk_config.items() if k in defaults})
        return merged

    @staticmethod
    def _cid(correlation_id: Optional[str] = None) -> str:
        return correlation_id or str(uuid4())

    def init_state(
        self,
        initial_capital: float,
        symbols: List[str],
        risk_config: Optional[Dict[str, Any]] = None,
        seed: int = 42,
    ) -> None:
        normalized_risk = self._normalize_risk_config(risk_config)
        self.runtime.init_state(
            initial_capital,
            symbols,
            normalized_risk["max_position_size"],
            normalized_risk["max_notional_exposure"],
            normalized_risk["max_open_positions"],
            normalized_risk["stop_loss_percent"],
            normalized_risk["max_loss_threshold"],
            normalized_risk["sizing_amount"],
            seed,
        )

    def ingest_bar(
        self,
        symbol: str,
        timestamp: int,
        open: float,
        high: float,
        low: float,
        close: float,
        volume: float,
        correlation_id: Optional[str] = None,
    ) -> None:
        cid = self._cid(correlation_id)
        logger.debug("[cid:{}] Rust ingest_bar {} @ {}", cid, symbol, timestamp)
        self.runtime.ingest_bar(symbol, timestamp, open, high, low, close, volume)

    def process_signal(
        self,
        symbol: str,
        signal_type: str,
        strength: float,
        strategy_id: str,
        correlation_id: Optional[str] = None,
    ) -> None:
        cid = self._cid(correlation_id)
        logger.debug(
            "[cid:{}] Rust process_signal symbol={} type={} strength={} strategy={}",
            cid,
            symbol,
            signal_type,
            strength,
            strategy_id,
        )
        self.runtime.process_signal(symbol, signal_type, strength, strategy_id)

    def dispatch_until_idle(self, correlation_id: Optional[str] = None) -> None:
        cid = self._cid(correlation_id)
        logger.debug("[cid:{}] Rust dispatch_until_idle", cid)
        self.runtime.dispatch_until_idle()

    def get_new_fills(self) -> List[Dict[str, Any]]:
        fills = self.runtime.get_new_fills()
        return list(fills)

    def get_new_risk_decisions(self) -> List[Dict[str, Any]]:
        if not hasattr(self.runtime, "get_new_risk_decisions"):
            return []
        decisions = self.runtime.get_new_risk_decisions()
        return list(decisions)

    def get_state(self) -> Dict[str, Any]:
        return dict(self.runtime.state_snapshot())

    def get_execution_stats(self) -> Dict[str, Any]:
        return dict(self.runtime.execution_stats_snapshot())

    def get_equity(self) -> float:
        return float(self.runtime.get_equity())

    def reset(self, seed: int) -> None:
        self.runtime.reset(seed)

    def load_market_data_columnar(self, symbol: str, df: pd.DataFrame) -> None:
        """Load entire symbol history to Rust in one columnar call."""
        if "timestamp" in df.columns:
            ts = pd.to_datetime(df["timestamp"], utc=True).astype("int64").to_numpy() // 1_000_000_000
        else:
            ts = pd.to_datetime(df.index, utc=True).astype("int64").to_numpy() // 1_000_000_000

        self.runtime.load_market_data_columnar(
            symbol,
            np.ascontiguousarray(ts, dtype=np.int64),
            np.ascontiguousarray(df["open"].to_numpy(dtype=np.float64, copy=False)),
            np.ascontiguousarray(df["high"].to_numpy(dtype=np.float64, copy=False)),
            np.ascontiguousarray(df["low"].to_numpy(dtype=np.float64, copy=False)),
            np.ascontiguousarray(df["close"].to_numpy(dtype=np.float64, copy=False)),
            np.ascontiguousarray(df["volume"].to_numpy(dtype=np.float64, copy=False)),
        )

    def load_market_data(self, data_by_symbol: Dict[str, pd.DataFrame]) -> None:
        """Load a complete multi-symbol dataset into Rust without per-bar Python events."""
        for symbol, frame in data_by_symbol.items():
            self.load_market_data_columnar(symbol, frame)

    def load_signals(self, signal_frame: pd.DataFrame) -> None:
        """Load pre-generated signal table to Rust."""
        required = {"timestamp", "symbol", "signal_type", "strength", "strategy_id"}
        missing = required - set(signal_frame.columns)
        if missing:
            raise ValueError(f"signal_frame missing required columns: {sorted(missing)}")

        if signal_frame.empty:
            self.runtime.load_signals_columnar(
                np.ascontiguousarray([], dtype=np.int64),
                [],
                [],
                np.ascontiguousarray([], dtype=np.float64),
                [],
                [],
            )
            return

        frame = signal_frame.copy()
        if "signal_id" not in frame.columns:
            frame["signal_id"] = [
                f"{pd.Timestamp(row['timestamp']).value}_{row['symbol']}_{row['strategy_id']}_{idx}"
                for idx, row in frame.reset_index(drop=True).iterrows()
            ]

        ts = pd.to_datetime(frame["timestamp"], utc=True).astype("int64").to_numpy() // 1_000_000_000
        self.runtime.load_signals_columnar(
            np.ascontiguousarray(ts, dtype=np.int64),
            frame["symbol"].astype(str).values.tolist(),
            frame["signal_type"].astype(str).str.upper().values.tolist(),
            np.ascontiguousarray(frame["strength"].to_numpy(dtype=np.float64, copy=False)),
            frame["strategy_id"].astype(str).values.tolist(),
            frame["signal_id"].astype(str).values.tolist(),
        )

    def run_to_completion(self) -> None:
        """Run the full backtest simulation in Rust."""
        self.runtime.run_to_completion()

    def state_snapshot(self) -> Dict[str, Any]:
        """Return a snapshot of the current simulation state."""
        return self.runtime.state_snapshot()

    def metrics_snapshot(self) -> Dict[str, Any]:
        """Return compact Rust runtime metrics."""
        if hasattr(self.runtime, "metrics_snapshot"):
            return dict(self.runtime.metrics_snapshot())
        return self.get_execution_stats()

    def risk_decision_trace(self) -> List[Dict[str, Any]]:
        """Return and drain Rust risk decisions."""
        if hasattr(self.runtime, "risk_decision_trace"):
            return list(self.runtime.risk_decision_trace())
        return self.get_new_risk_decisions()
