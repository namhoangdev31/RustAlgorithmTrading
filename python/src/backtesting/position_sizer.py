"""
Position sizing strategies for backtesting.
"""

from typing import Optional, TYPE_CHECKING
from models.events import SignalEvent

if TYPE_CHECKING:
    from ..models.portfolio import Portfolio


class PositionSizer:
    """Base class for position sizing strategies."""

    def calculate_position_size(
        self,
        signal: SignalEvent,
        portfolio: "Portfolio",
        current_price: Optional[float] = None,
    ) -> int:
        """
        Calculate target position size.

        Args:
            signal: Trading signal
            portfolio: Current portfolio state
            current_price: Current market price for the symbol (optional)

        Returns:
            Target position quantity (positive for long, negative for short, 0 for exit)
        """
        raise NotImplementedError


class FixedAmountSizer(PositionSizer):
    """
    Sizes positions based on a fixed dollar amount per trade.
    """

    def __init__(self, amount: float):
        """
        Initialize fixed amount sizer.

        Args:
            amount: Dollar amount to invest per trade
        """
        self.amount = amount

    def calculate_position_size(
        self,
        signal: SignalEvent,
        portfolio: "Portfolio",
        current_price: Optional[float] = None,
    ) -> int:
        """
        Calculate target position size based on fixed amount.

        Args:
            signal: Trading signal
            portfolio: Current portfolio state
            current_price: Current market price for the symbol

        Returns:
            Target position quantity
        """
        if current_price is None or current_price <= 0:
            return 0

        # Calculate quantity based on fixed amount
        quantity = int(self.amount / current_price)

        # Signal type determines direction
        if signal.signal_type == "LONG":
            return quantity
        elif signal.signal_type == "SHORT":
            return -quantity
        else:
            return 0


class PercentageOfEquitySizer(PositionSizer):
    """
    Sizes positions based on a percentage of total portfolio equity.
    """

    def __init__(self, percentage: float):
        """
        Initialize percentage of equity sizer.

        Args:
            percentage: Fraction of equity to invest (0.0 to 1.0)
        """
        self.percentage = max(0.0, min(1.0, percentage))

    def calculate_position_size(
        self,
        signal: SignalEvent,
        portfolio: "Portfolio",
        current_price: Optional[float] = None,
    ) -> int:
        """
        Calculate target position size based on percentage of equity.

        Args:
            signal: Trading signal
            portfolio: Current portfolio state
            current_price: Current market price for the symbol

        Returns:
            Target position quantity
        """
        if current_price is None or current_price <= 0:
            return 0

        # Calculate quantity based on percentage of equity
        target_value = portfolio.equity * self.percentage
        quantity = int(target_value / current_price)

        # Signal type determines direction
        if signal.signal_type == "LONG":
            return quantity
        elif signal.signal_type == "SHORT":
            return -quantity
        else:
            return 0


class KellyPositionSizer(PositionSizer):
    """
    Sizes positions based on the Kelly Criterion.
    """

    def __init__(self, win_rate: float, win_loss_ratio: float, fraction: float = 1.0):
        """
        Initialize Kelly sizer.

        Args:
            win_rate: Historical win rate (0.0 to 1.0)
            win_loss_ratio: Average win amount divided by average loss amount
            fraction: "Fractional Kelly" to reduce volatility (e.g., 0.5 for half-Kelly)
        """
        self.win_rate = win_rate
        self.win_loss_ratio = win_loss_ratio
        self.fraction = fraction

        # Calculate Kelly percentage: K% = W - (1-W)/R
        if win_loss_ratio > 0:
            self.kelly_pct = win_rate - (1.0 - win_rate) / win_loss_ratio
        else:
            self.kelly_pct = 0.0

        # Apply fraction and clamp to [0, 1]
        self.clamped_kelly = max(0.0, min(1.0, self.kelly_pct * fraction))

    def calculate_position_size(
        self,
        signal: SignalEvent,
        portfolio: "Portfolio",
        current_price: Optional[float] = None,
    ) -> int:
        """
        Calculate target position size based on Kelly Criterion.

        Args:
            signal: Trading signal
            portfolio: Current portfolio state
            current_price: Current market price for the symbol

        Returns:
            Target position quantity
        """
        if current_price is None or current_price <= 0:
            return 0

        # Calculate quantity based on Kelly percentage of equity
        target_value = portfolio.equity * self.clamped_kelly
        quantity = int(target_value / current_price)

        # Signal type determines direction
        if signal.signal_type == "LONG":
            return quantity
        elif signal.signal_type == "SHORT":
            return -quantity
        else:
            return 0
