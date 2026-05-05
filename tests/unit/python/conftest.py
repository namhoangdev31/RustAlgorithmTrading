import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# W21 Test Debt: Skip tests with broken imports during collection
from pathlib import Path
from backtesting.data_handler import HistoricalDataHandler
from backtesting.execution_handler import SimulatedExecutionHandler
from backtesting.portfolio_handler import PortfolioHandler
from risk.allocation_manager import AllocationManager, AllocationPolicy


@pytest.fixture
def temp_data_dir(tmp_path):
    """Temporary directory for test data"""
    d = tmp_path / "data"
    d.mkdir()
    return d


@pytest.fixture
def data_handler(temp_data_dir, sample_ohlcv_data):
    """Historical data handler fixture"""
    # Write sample data to CSV
    csv_path = temp_data_dir / "TEST.csv"
    sample_ohlcv_data.to_csv(csv_path)
    return HistoricalDataHandler(symbols=["TEST"], data_dir=temp_data_dir)


@pytest.fixture
def execution_handler():
    """Simulated execution handler fixture"""
    return SimulatedExecutionHandler()


@pytest.fixture
def portfolio_handler(data_handler):
    """Portfolio handler fixture"""
    return PortfolioHandler(initial_capital=100000.0, data_handler=data_handler)


@pytest.fixture
def sample_ohlcv_data():
    """Basic OHLCV data for testing"""
    dates = pd.date_range(start="2024-01-01", periods=100, freq="1h")
    close_prices = 100 + np.cumsum(np.random.normal(0, 1, 100))
    data = pd.DataFrame(
        {
            "open": close_prices * 0.99,
            "high": close_prices * 1.01,
            "low": close_prices * 0.98,
            "close": close_prices,
            "volume": np.random.randint(100000, 500000, 100),
        },
        index=dates,
    )
    data["timestamp"] = dates  # Some tests expect a timestamp column
    data.attrs["symbol"] = "TEST"
    return data


@pytest.fixture
def simple_momentum_strategy():
    """Simple momentum strategy fixture"""
    from strategies.simple_momentum import SimpleMomentumStrategy

    return SimpleMomentumStrategy(symbols=["TEST"])


@pytest.fixture
def simple_mean_reversion_strategy():
    """Mean reversion strategy fixture"""
    from strategies.mean_reversion import MeanReversionStrategy

    return MeanReversionStrategy(symbols=["TEST"])


@pytest.fixture
def sample_returns():
    """Sample return series for testing performance metrics"""
    np.random.seed(42)
    return pd.Series(np.random.normal(0.001, 0.02, 100))
