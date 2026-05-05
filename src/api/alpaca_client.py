"""
Alpaca API Client for market data and trading operations
"""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv
from alpaca.trading.client import TradingClient
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from loguru import logger


class AlpacaClient:
    """
    Wrapper for Alpaca API providing unified interface for trading and data operations

    Attributes:
        trading_client: Alpaca trading client for order management
        data_client: Alpaca data client for historical market data
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        base_url: Optional[str] = None,
        paper: bool = True,
    ):
        """
        Initialize Alpaca client with credentials

        Args:
            api_key: Alpaca API key (defaults to env variable)
            secret_key: Alpaca secret key (defaults to env variable)
            base_url: API base URL (defaults to env variable)
            paper: Whether to use paper trading (default: True)
        """
        load_dotenv()

        self.api_key = api_key or os.getenv("ALPACA_API_KEY")
        self.secret_key = secret_key or os.getenv("ALPACA_SECRET_KEY")
        self.base_url = base_url or os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")

        if not self.api_key or not self.secret_key:
            raise ValueError("Alpaca API credentials not found in environment variables")

        try:
            self.trading_client = TradingClient(
                api_key=self.api_key, secret_key=self.secret_key, paper=paper
            )

            self.data_client = StockHistoricalDataClient(
                api_key=self.api_key, secret_key=self.secret_key
            )

            logger.info(f"Alpaca client initialized successfully (paper={paper})")
        except Exception as e:
            logger.error(f"Failed to initialize Alpaca client: {e}")
            raise

    def get_account(self) -> Dict[str, Any]:
        """
        Get account information

        Returns:
            Dict containing account details
        """
        try:
            account: Any = self.trading_client.get_account()
            return {
                "cash": (
                    float(account.cash)
                    if hasattr(account, "cash") and account.cash is not None
                    else 0.0
                ),
                "portfolio_value": (
                    float(account.portfolio_value)
                    if hasattr(account, "portfolio_value") and account.portfolio_value is not None
                    else 0.0
                ),
                "buying_power": (
                    float(account.buying_power)
                    if hasattr(account, "buying_power") and account.buying_power is not None
                    else 0.0
                ),
                "equity": (
                    float(account.equity)
                    if hasattr(account, "equity") and account.equity is not None
                    else 0.0
                ),
                "status": account.status if hasattr(account, "status") else "unknown",
            }
        except Exception as e:
            logger.error(f"Failed to fetch account info: {e}")
            raise

    def get_positions(self) -> List[Dict[str, Any]]:
        """
        Get all open positions

        Returns:
            List of position dictionaries
        """
        try:
            positions = self.trading_client.get_all_positions()
            return [
                {
                    "symbol": pos.symbol if hasattr(pos, "symbol") else "",
                    "qty": float(pos.qty) if hasattr(pos, "qty") and pos.qty is not None else 0.0,
                    "avg_entry_price": (
                        float(pos.avg_entry_price)
                        if hasattr(pos, "avg_entry_price") and pos.avg_entry_price is not None
                        else 0.0
                    ),
                    "current_price": (
                        float(pos.current_price)
                        if hasattr(pos, "current_price") and pos.current_price is not None
                        else 0.0
                    ),
                    "market_value": (
                        float(pos.market_value)
                        if hasattr(pos, "market_value") and pos.market_value is not None
                        else 0.0
                    ),
                    "unrealized_pl": (
                        float(pos.unrealized_pl)
                        if hasattr(pos, "unrealized_pl") and pos.unrealized_pl is not None
                        else 0.0
                    ),
                    "unrealized_plpc": (
                        float(pos.unrealized_plpc)
                        if hasattr(pos, "unrealized_plpc") and pos.unrealized_plpc is not None
                        else 0.0
                    ),
                }
                for pos in positions
                if not isinstance(pos, str)
            ]
        except Exception as e:
            logger.error(f"Failed to fetch positions: {e}")
            raise

    def get_historical_bars(
        self, symbol: str, start: datetime, end: datetime, timeframe: TimeFrame = TimeFrame.Day
    ) -> Any:
        """
        Fetch historical price bars

        Args:
            symbol: Stock symbol
            start: Start date
            end: End date
            timeframe: Bar timeframe (default: Day)

        Returns:
            DataFrame with OHLCV data
        """
        try:
            request_params = StockBarsRequest(
                symbol_or_symbols=symbol, timeframe=timeframe, start=start, end=end
            )

            bars = self.data_client.get_stock_bars(request_params)
            if hasattr(bars, "df"):
                df = bars.df
            else:
                import pandas as pd

                df = pd.DataFrame()

            logger.info(f"Fetched {len(df)} bars for {symbol}")
            return df

        except Exception as e:
            logger.error(f"Failed to fetch historical bars for {symbol}: {e}")
            raise

    def place_market_order(
        self, symbol: str, qty: float, side: str, time_in_force: str = "day"
    ) -> Dict[str, Any]:
        """
        Place a market order

        Args:
            symbol: Stock symbol
            qty: Quantity to trade
            side: "buy" or "sell"
            time_in_force: Order duration (default: "day")

        Returns:
            Order details dictionary
        """
        try:
            order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL
            tif_map = {
                "day": TimeInForce.DAY,
                "gtc": TimeInForce.GTC,
                "ioc": TimeInForce.IOC,
                "fok": TimeInForce.FOK,
            }

            market_order_data = MarketOrderRequest(
                symbol=symbol,
                qty=qty,
                side=order_side,
                time_in_force=tif_map.get(time_in_force.lower(), TimeInForce.DAY),
            )

            order = self.trading_client.submit_order(market_order_data)

            logger.info(f"Order placed: {side} {qty} {symbol}")

            return {
                "id": str(order.id) if hasattr(order, "id") else "",
                "symbol": order.symbol if hasattr(order, "symbol") else "",
                "qty": float(order.qty) if hasattr(order, "qty") and order.qty is not None else 0.0,
                "side": order.side.value if hasattr(order, "side") and order.side else "",
                "type": order.type.value if hasattr(order, "type") and order.type else "",
                "status": order.status.value if hasattr(order, "status") and order.status else "",
                "created_at": order.created_at if hasattr(order, "created_at") else datetime.now(),
            }

        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            raise

    def get_orders(self, status: str = "all") -> List[Dict[str, Any]]:
        """
        Get orders with optional status filter

        Args:
            status: Filter by status ("all", "open", "closed")

        Returns:
            List of order dictionaries
        """
        try:
            orders = self.trading_client.get_orders()

            return [
                {
                    "id": str(order.id) if hasattr(order, "id") else "",
                    "symbol": order.symbol if hasattr(order, "symbol") else "",
                    "qty": (
                        float(order.qty) if hasattr(order, "qty") and order.qty is not None else 0.0
                    ),
                    "side": order.side.value if hasattr(order, "side") and order.side else "",
                    "type": order.type.value if hasattr(order, "type") and order.type else "",
                    "status": (
                        order.status.value if hasattr(order, "status") and order.status else ""
                    ),
                    "created_at": (
                        order.created_at if hasattr(order, "created_at") else datetime.now()
                    ),
                }
                for order in orders
                if not isinstance(order, str)
            ]

        except Exception as e:
            logger.error(f"Failed to fetch orders: {e}")
            raise

    def cancel_all_orders(self) -> bool:
        """
        Cancel all open orders

        Returns:
            True if successful
        """
        try:
            self.trading_client.cancel_orders()
            logger.info("All orders cancelled")
            return True
        except Exception as e:
            logger.error(f"Failed to cancel orders: {e}")
            raise

    def close_all_positions(self) -> bool:
        """
        Close all open positions

        Returns:
            True if successful
        """
        try:
            self.trading_client.close_all_positions(cancel_orders=True)
            logger.info("All positions closed")
            return True
        except Exception as e:
            logger.error(f"Failed to close positions: {e}")
            raise
