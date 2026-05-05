"""
Portfolio handler for position and cash management during backtesting.
"""

from datetime import datetime
from typing import Dict, List, Optional, TYPE_CHECKING, Any
from loguru import logger

import pandas as pd

from models.portfolio import Portfolio, Position
from models.events import SignalEvent, OrderEvent, FillEvent
from models.market import Bar
from backtesting.position_sizer import (
    PositionSizer,
    FixedAmountSizer,
    PercentageOfEquitySizer,
    KellyPositionSizer,
)
from risk.allocation_manager import AllocationManager, AllocationPolicy
from models.governance import ControlStatus, ControlType

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
        allocation_manager: Optional[AllocationManager] = None,
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
                f"position_sizer must be a PositionSizer instance or None, got {type(position_sizer).__name__}"
            )

        self.initial_capital = initial_capital
        self.data_handler = data_handler
        self.position_sizer = position_sizer or FixedAmountSizer(10000.0)
        self.allocation_manager = allocation_manager or AllocationManager(AllocationPolicy())

        self.portfolio = Portfolio(
            initial_capital=initial_capital,
            cash=initial_capital,
        )

        self.equity_curve: List[Dict] = []
        self.holdings_history: List[Dict] = []

        self.reserved_cash: float = 0.0

        logger.info(f"Initialized PortfolioHandler with ${initial_capital:,.2f}")

    def update_timeindex(self, timestamp: datetime):
        """
        Update portfolio timestamp and record equity snapshot.

        Args:
            timestamp: Current timestamp

        Raises:
            TypeError: If timestamp is not a datetime
        """
        if not isinstance(timestamp, datetime):
            raise TypeError(f"timestamp must be a datetime, got {type(timestamp).__name__}")

        self.portfolio.timestamp = timestamp

        # Update equity and drawdown state
        current_prices = {}
        if self.data_handler:
            for symbol in self.portfolio.positions.keys():
                bar = self.data_handler.get_latest_bar(symbol)
                if bar:
                    current_prices[symbol] = bar.close
        self.portfolio.update_equity(current_prices)

        # Record equity curve point
        self.equity_curve.append(
            {
                "timestamp": timestamp,
                "equity": self.portfolio.equity,
                "cash": self.portfolio.cash,
                "total_pnl": self.portfolio.total_pnl,
                "return_pct": self.portfolio.return_percentage,
            }
        )

    def generate_orders(self, signal: SignalEvent) -> List[OrderEvent]:
        """
        Generate orders from trading signal with race condition protection.

        CRITICAL FIX: EXIT signals bypass position sizing and always close full position.

        This method prevents cash overdraft when multiple orders are generated
        in the same bar by tracking reserved cash for pending orders.

        Args:
            signal: Trading signal (LONG/SHORT/EXIT)

        Returns:
            List of order events (may be empty if insufficient cash or no position)
        """
        orders = []

        # ENHANCED LOGGING: Log incoming signal details
        logger.debug(
            f"📥 Signal received: {signal.signal_type} for {signal.symbol}, "
            f"confidence={signal.strength:.2f}, strategy={signal.strategy_id}"
        )

        # Get current market price
        current_price = None
        if self.data_handler:
            latest_bar = self.data_handler.get_latest_bar(signal.symbol)
            if latest_bar:
                current_price = latest_bar.close
                logger.debug(f"📊 Current market price for {signal.symbol}: ${current_price:.2f}")
            else:
                logger.warning(f"⚠️ No market data available for {signal.symbol}")
        else:
            logger.warning(f"⚠️ No data handler configured for price lookup")

        # Get current position
        current_position = self.portfolio.positions.get(signal.symbol)
        current_quantity = current_position.quantity if current_position else 0
        logger.debug(
            f"💼 Current position: {current_quantity} shares of {signal.symbol} "
            f"(value: ${abs(current_quantity * (current_price or 0)):,.2f})"
        )

        # ================================
        # CRITICAL FIX: Handle EXIT signals FIRST
        # ================================
        # EXIT signals should ALWAYS close the full position, bypassing position sizing
        # This ensures proper exit execution regardless of position sizer logic
        # BUG FIX: For SHORT positions (quantity < 0), we need to BUY to close, not SELL
        if signal.signal_type == "EXIT":
            if current_quantity == 0:
                logger.debug(
                    f"🚫 EXIT signal for {signal.symbol} but no position to close (skipping)"
                )
                return orders

            # Close the entire position (negate current quantity)
            order_quantity = -current_quantity

            # CRITICAL FIX: Determine direction based on position type
            # - LONG position (quantity > 0): SELL to close
            # - SHORT position (quantity < 0): BUY to close (cover)
            if current_quantity > 0:
                direction = "SELL"
                action_desc = "selling long"
            else:
                direction = "BUY"
                action_desc = "covering short"

            logger.info(
                f"🚪 EXIT signal: {action_desc} {abs(current_quantity)} shares of {signal.symbol} "
                f"(current: {current_quantity} → target: 0)"
            )

            # Create order to exit position with correct direction
            order = OrderEvent(
                timestamp=signal.timestamp,
                symbol=signal.symbol,
                order_type="MKT",
                quantity=abs(order_quantity),
                direction=direction,
            )

            orders.append(order)

            logger.info(
                f"✅ EXIT ORDER: {direction} {order.quantity} {signal.symbol} @ market | "
                f"Expected {'proceeds' if direction == 'SELL' else 'cost'}: ${abs(order_quantity) * (current_price or 0):,.2f}"
            )

            return orders

        # ================================
        # Handle LONG and SHORT signals through position sizer
        # ================================

        # RACE FIX: Calculate available cash minus reserved cash
        available_cash = self.portfolio.cash - self.reserved_cash

        logger.debug(
            f"💰 Cash status: portfolio=${self.portfolio.cash:,.2f}, "
            f"reserved=${self.reserved_cash:,.2f}, available=${available_cash:,.2f}"
        )

        if available_cash < 0:
            logger.warning(
                f"❌ Available cash is negative: ${available_cash:,.2f} "
                f"(portfolio: ${self.portfolio.cash:,.2f}, reserved: ${self.reserved_cash:,.2f}) - skipping order"
            )
            return orders

        # Calculate target position based on signal using position sizer
        target_quantity = self.position_sizer.calculate_position_size(
            signal=signal,
            portfolio=self.portfolio,
            current_price=current_price,
        )

        logger.debug(
            f"🎯 Position sizing: signal={signal.signal_type}, current={current_quantity}, "
            f"target={target_quantity}, delta={target_quantity - current_quantity}"
        )

        # Calculate order quantity needed to reach target
        order_quantity = target_quantity - current_quantity

        # Lane 1, 2, 3: Allocation Manager Enforcement
        if order_quantity != 0 and signal.signal_type != "EXIT":
            # Simplified proxy for W15: Fetch volatility/regime/drawdown
            # (In production, these would come from DataHandler/Portfolio state)
            volatility = 0.015  # Proxy
            regime = "NORMAL"  # Proxy
            if hasattr(self.data_handler, "get_regime"):
                regime = self.data_handler.get_regime(signal.symbol)
            if hasattr(self.data_handler, "get_volatility"):
                volatility = self.data_handler.get_volatility(signal.symbol)

            allocation_record = self.allocation_manager.check_allocation(
                strategy_id=signal.strategy_id,
                symbol=signal.symbol,
                requested_quantity=order_quantity,
                price=current_price or 0.0,
                volatility=volatility,
                regime=regime,
                current_drawdown=self.portfolio.max_drawdown,
                total_equity=self.portfolio.equity,
            )

            if allocation_record.status == ControlStatus.REJECT:
                logger.warning(f"🚫 ALLOCATION REJECTED: {allocation_record.decision_reason}")
                return orders
            elif allocation_record.status == ControlStatus.BLOCKED:
                logger.error(
                    f"🛑 ALLOCATION BLOCKED (DRAWDOWN HALT): {allocation_record.decision_reason}"
                )
                return orders

            # Log successful allocation check
            logger.debug(f"✅ ALLOCATION ALLOWED: {allocation_record.decision_reason}")

        if order_quantity == 0:
            logger.debug(
                f"⏸️ No order needed: target position already achieved for {signal.symbol}"
            )
            return orders

        # RACE FIX: For BUY orders, validate cash and reserve funds
        if order_quantity > 0:  # BUY order (opening long or adding to position)
            if current_price is None or current_price <= 0:
                logger.warning(f"❌ Invalid price for {signal.symbol}, cannot generate BUY order")
                return orders

            # Calculate estimated cost (position + commission + slippage)
            position_cost = abs(order_quantity) * current_price
            estimated_commission = position_cost * 0.001  # 0.1% commission
            estimated_slippage = position_cost * 0.0005  # 0.05% slippage
            total_estimated_cost = position_cost + estimated_commission + estimated_slippage

            # Check if we have enough available cash
            if total_estimated_cost > available_cash:
                # Calculate maximum affordable quantity
                max_affordable_value = available_cash / (1 + 0.001 + 0.0005)  # Adjust for fees
                max_affordable_quantity = int(max_affordable_value / current_price)

                if max_affordable_quantity <= 0:
                    logger.info(
                        f"💸 Insufficient cash for {signal.symbol}: "
                        f"need ${total_estimated_cost:,.2f}, have ${available_cash:,.2f} - skipping order"
                    )
                    return orders

                # Adjust order quantity to what we can afford
                logger.info(
                    f"⚠️ Reducing order for {signal.symbol} from {order_quantity} to {max_affordable_quantity} shares "
                    f"(cash constraint: ${available_cash:,.2f} available)"
                )
                order_quantity = max_affordable_quantity

                # Recalculate costs with adjusted quantity
                position_cost = abs(order_quantity) * current_price
                estimated_commission = position_cost * 0.001
                estimated_slippage = position_cost * 0.0005
                total_estimated_cost = position_cost + estimated_commission + estimated_slippage

            # RACE FIX: Reserve cash for this pending BUY order
            self.reserved_cash += total_estimated_cost
            logger.debug(
                f"💰 Reserved ${total_estimated_cost:,.2f} for {signal.symbol} BUY order "
                f"(total reserved: ${self.reserved_cash:,.2f})"
            )
        else:
            # SELL order - closing or reducing position, no cash needed
            logger.debug(
                f"💵 SELL order for {abs(order_quantity)} shares of {signal.symbol} "
                f"(expected proceeds: ~${abs(order_quantity) * (current_price or 0):,.2f})"
            )

        # Create order
        order = OrderEvent(
            timestamp=signal.timestamp,
            symbol=signal.symbol,
            order_type="MKT",
            quantity=abs(order_quantity),
            direction="BUY" if order_quantity > 0 else "SELL",
        )

        orders.append(order)

        # ENHANCED LOGGING: Detailed order generation summary
        logger.info(
            f"✅ ORDER GENERATED: {order.direction} {order.quantity} {signal.symbol} @ market | "
            f"Signal: {signal.signal_type}, Position: {current_quantity}→{current_quantity + order_quantity}, "
            f"Cash: ${self.portfolio.cash:,.2f}"
        )

        return orders

    def update_fill(self, fill: FillEvent):
        """
        Update portfolio with fill event.

        Args:
            fill: Fill event

        Raises:
            ValueError: If fill would result in negative cash
        """
        # CRITICAL FIX: Validate that we have enough cash BEFORE updating
        position_cost = abs(fill.quantity) * fill.fill_price
        total_cost = position_cost + fill.commission

        # Get position before fill
        old_position = self.portfolio.positions.get(fill.symbol)
        old_quantity = old_position.quantity if old_position else 0

        # ENHANCED LOGGING: Fill event details
        logger.debug(
            f"📦 FILL RECEIVED: {fill.direction} {fill.quantity} {fill.symbol} @ ${fill.fill_price:.2f} | "
            f"Cost: ${position_cost:,.2f}, Commission: ${fill.commission:.2f}, Total: ${total_cost:,.2f}"
        )

        # For BUY orders, check if we have enough cash
        if fill.quantity > 0:  # BUY (positive quantity means adding shares)
            if total_cost > self.portfolio.cash:
                error_msg = (
                    f"❌ Insufficient cash for fill: need ${total_cost:,.2f} "
                    f"(position: ${position_cost:,.2f} + commission: ${fill.commission:,.2f}), "
                    f"but only have ${self.portfolio.cash:,.2f}"
                )
                logger.error(error_msg)
                raise ValueError(error_msg)

        # Update position
        self.portfolio.update_position(
            symbol=fill.symbol,
            quantity=fill.quantity,
            price=fill.fill_price,
        )

        # Deduct commission
        self.portfolio.cash -= fill.commission

        # Final safety check
        if self.portfolio.cash < 0:
            error_msg = (
                f"❌ Portfolio cash went negative: ${self.portfolio.cash:,.2f} "
                f"after processing {fill.quantity} {fill.symbol} @ ${fill.fill_price:,.2f}"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)

        # Record holdings
        self.holdings_history.append(
            {
                "timestamp": fill.timestamp,
                "symbol": fill.symbol,
                "quantity": fill.quantity,
                "price": fill.fill_price,
                "commission": fill.commission,
                "cash": self.portfolio.cash,
                "equity": self.portfolio.equity,
            }
        )

        # Log final position state
        new_position = self.portfolio.positions.get(fill.symbol)
        new_quantity = new_position.quantity if new_position else 0
        logger.debug(
            f"📊 Position updated: {fill.symbol} {old_quantity}→{new_quantity} shares, "
            f"Cash: ${self.portfolio.cash:,.2f}, Equity: ${self.portfolio.equity:,.2f}"
        )

    def get_equity_curve(self) -> pd.DataFrame:
        """Get equity curve as DataFrame."""
        return pd.DataFrame(self.equity_curve)

    def get_holdings(self) -> pd.DataFrame:
        """Get holdings history as DataFrame."""
        return pd.DataFrame(self.holdings_history)

    def clear_reserved_cash(self):
        """
        Clear reserved cash after all orders in a bar have been processed.

        This should be called by the engine after processing all fills for a bar
        to reset the reservation system for the next bar.
        """
        if self.reserved_cash > 0:
            logger.debug(f"🔄 Clearing reserved cash: ${self.reserved_cash:,.2f}")
            self.reserved_cash = 0.0
