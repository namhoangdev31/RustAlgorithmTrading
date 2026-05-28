"""
Portfolio handler for position and cash management during backtesting.
"""

from datetime import datetime
from typing import Dict, List, Optional, TYPE_CHECKING, Any
from loguru import logger

import pandas as pd

from models.portfolio import Portfolio
from models.events import SignalEvent, OrderEvent, FillEvent

# from models.market import Bar  # Removed unused
from backtesting.position_sizer import (
    PositionSizer,
    FixedAmountSizer,
    PercentageOfEquitySizer,
    KellyPositionSizer,
)
from models.governance import ControlStatus

if TYPE_CHECKING:
    from .data_handler import HistoricalDataHandler

__all__ = [
    "PortfolioHandler",
    "PositionSizer",
    "FixedAmountSizer",
    "PercentageOfEquitySizer",
    "KellyPositionSizer",
]


class PortfolioHandler:
    """
    Manages portfolio state during backtesting.

    Tracks positions, cash, and equity over time. Generates orders based on
    trading signals and position sizing rules.
    """

    def __init__(
        self,
        initial_capital: float,
        position_sizer: Optional["PositionSizer"] = None,
        data_handler: Optional["HistoricalDataHandler"] = None,
    ):
        """
        Initialize portfolio handler.

        Args:
            initial_capital: Starting capital
            position_sizer: Position sizing strategy (defaults to FixedAmountSizer)
            data_handler: Data handler for getting current prices

        Raises:
            TypeError: If initial_capital is not a number
            ValueError: If initial_capital is not positive
        """
        # Validate initial_capital
        if not isinstance(initial_capital, (int, float)):
            raise TypeError(
                f"initial_capital must be a number, got {type(initial_capital).__name__}"
            )

        if initial_capital <= 0:
            raise ValueError(f"initial_capital must be positive, got {initial_capital}")

        if position_sizer is not None and not isinstance(position_sizer, PositionSizer):
            raise TypeError(
                "position_sizer must be a PositionSizer instance or None, "
                f"got {type(position_sizer).__name__}"
            )

        self.initial_capital = initial_capital
        self.data_handler = data_handler
        self.position_sizer = position_sizer or FixedAmountSizer(10000.0)

        self.portfolio = Portfolio(
            initial_capital=initial_capital,
            cash=initial_capital,
        )

        # Optimized history storage: Use separate lists for columns instead of list of dicts
        self._equity_curve_timestamps: List[datetime] = []
        self._equity_curve_equities: List[float] = []
        self._equity_curve_cashes: List[float] = []
        self._equity_curve_total_pnls: List[float] = []
        self._equity_curve_return_pcts: List[float] = []

        self.holdings_history: List[Dict] = []

        self.reserved_cash: float = 0.0
        self._risk_decision_trace: list[dict[str, Any]] = []
        self._risk_decision_sequence_no: int = 0

        logger.info(f"Initialized PortfolioHandler with ${initial_capital:,.2f}")

    def update_timeindex(self, timestamp: datetime):
        """
        Legacy method kept for minimal compatibility, logic removed as Rust handles state.
        """
        self.portfolio.timestamp = timestamp

    def update_fill(self, fill: FillEvent):
        """
        Legacy method kept for minimal compatibility, logic removed as Rust handles fills.
        """
        pass

    def get_equity_curve(self) -> pd.DataFrame:
        """Get equity curve as DataFrame (Optimized)."""
        return pd.DataFrame(
            {
                "timestamp": self._equity_curve_timestamps,
                "equity": self._equity_curve_equities,
                "cash": self._equity_curve_cashes,
                "total_pnl": self._equity_curve_total_pnls,
                "return_pct": self._equity_curve_return_pcts,
            }
        )

    def get_holdings(self) -> pd.DataFrame:
        """Get holdings history as DataFrame."""
        return pd.DataFrame(self.holdings_history)

    def clear_reserved_cash(self):
        """Legacy method, logic removed."""
        pass

    def pop_risk_decision_trace(self) -> list[dict[str, Any]]:
        """Legacy method, logic removed."""
        return []
