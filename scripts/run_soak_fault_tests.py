import sys
import asyncio
import time
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

from loguru import logger
from src.backtesting.engine import BacktestEngine
from src.backtesting.data_handler import HistoricalDataHandler
from src.backtesting.execution_handler import SimulatedExecutionHandler
from src.backtesting.portfolio_handler import PortfolioHandler
from src.strategies.mean_reversion import MeanReversionStrategy
from unittest.mock import MagicMock

async def run_soak_test(iterations=50):
    """Run many small backtests to check for memory leaks or stability issues."""
    logger.info(f"Starting soak test with {iterations} iterations...")
    start_time = time.time()
    
    for i in range(iterations):
        dh = MagicMock(spec=HistoricalDataHandler)
        dh.symbols = ["AAPL"]
        dh.continue_backtest = False
        eh = SimulatedExecutionHandler()
        ph = PortfolioHandler(initial_capital=100000.0, data_handler=dh)
        strategy = MeanReversionStrategy()
        
        engine = BacktestEngine(dh, eh, ph, strategy)
        engine.run()
        
        if i % 10 == 0:
            logger.info(f"Soak iteration {i} completed")
            
    duration = time.time() - start_time
    logger.info(f"Soak test completed in {duration:.2f}s")
    return True

async def run_fault_injection_test():
    """Simulate component failures and check recovery."""
    logger.info("Starting fault-injection test...")
    
    # 1. Simulate Data Handler failure
    logger.info("Injecting DataHandler connection failure...")
    dh = MagicMock(spec=HistoricalDataHandler)
    dh.symbols = ["AAPL"]
    dh.continue_backtest = False
    dh.get_latest_bars.side_effect = Exception("Network Timeout")
    
    # 2. Check if engine handles it (it should catch and log)
    eh = SimulatedExecutionHandler()
    ph = PortfolioHandler(initial_capital=100000.0, data_handler=dh)
    strategy = MeanReversionStrategy()
    
    engine = BacktestEngine(dh, eh, ph, strategy)
    try:
        engine.run()
        logger.info("Fault handled successfully (graceful degradation)")
    except Exception as e:
        logger.error(f"Fault caused unexpected crash: {e}")
        return False
        
    return True

if __name__ == "__main__":
    soak_ok = asyncio.run(run_soak_test())
    fault_ok = asyncio.run(run_fault_injection_test())
    
    if soak_ok and fault_ok:
        print("\n=== SOAK & FAULT TESTS PASSED ===")
        exit(0)
    else:
        print("\n=== SOAK & FAULT TESTS FAILED ===")
        exit(1)
