"""
Algorithmic Trading System with Backtesting and Monte Carlo Simulations
"""

__version__ = "0.1.0"
__author__ = "Trading System"

from .api.alpaca_client import AlpacaClient
from .backtesting.engine import BacktestEngine
from .simulations.monte_carlo import MonteCarloSimulator
from .strategies.base import Strategy

__all__ = [
    "AlpacaClient",
    "BacktestEngine",
    "MonteCarloSimulator",
    "Strategy",
]
