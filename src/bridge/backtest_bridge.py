"""
Bridge between Python backtest engine and Rust BacktestRuntime.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4
from loguru import logger

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
            initial_capital=initial_capital,
            symbols=symbols,
            max_position_size=normalized_risk["max_position_size"],
            max_notional_exposure=normalized_risk["max_notional_exposure"],
            max_open_positions=normalized_risk["max_open_positions"],
            stop_loss_percent=normalized_risk["stop_loss_percent"],
            max_loss_threshold=normalized_risk["max_loss_threshold"],
            seed=seed,
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
            initial_capital=initial_capital,
            symbols=symbols,
            max_position_size=normalized_risk["max_position_size"],
            max_notional_exposure=normalized_risk["max_notional_exposure"],
            max_open_positions=normalized_risk["max_open_positions"],
            stop_loss_percent=normalized_risk["stop_loss_percent"],
            max_loss_threshold=normalized_risk["max_loss_threshold"],
            seed=seed,
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
