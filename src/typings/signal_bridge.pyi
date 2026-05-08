import numpy as np
from typing import Dict, List, Optional, Tuple

class Bar:
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: int
    def __init__(
        self,
        symbol: str,
        open: float,
        high: float,
        low: float,
        close: float,
        volume: float,
        timestamp: int,
    ) -> None: ...

class FeatureComputer:
    def __init__(self) -> None: ...
    def compute_streaming(self, bar: Bar) -> List[float]: ...
    def compute_batch_named(
        self,
        open: np.ndarray,
        high: np.ndarray,
        low: np.ndarray,
        close: np.ndarray,
        volume: np.ndarray,
        timestamp: Optional[np.ndarray] = ...,
    ) -> Tuple[Dict[str, np.ndarray], float]: ...
    def simulate_price_paths(
        self,
        initial_price: float,
        num_days: int,
        mu: float,
        sigma: float,
        num_paths: int,
        seed: int,
    ) -> List[List[float]]: ...
    def compute_microstructure(
        self, bid_price: float, ask_price: float, bid_depth: float, ask_depth: float
    ) -> List[float]: ...

class BacktestRuntime:
    def __init__(
        self,
        initial_capital: float,
        symbols: List[str],
        max_position_size: float = ...,
        max_notional_exposure: float = ...,
        max_open_positions: int = ...,
        stop_loss_percent: float = ...,
        max_loss_threshold: float = ...,
        seed: int = ...,
    ) -> None: ...
    def ingest_bar(
        self,
        symbol: str,
        timestamp: int,
        open: float,
        high: float,
        low: float,
        close: float,
        volume: float,
    ) -> None: ...
    def init_state(
        self,
        initial_capital: float,
        symbols: List[str],
        max_position_size: float = ...,
        max_notional_exposure: float = ...,
        max_open_positions: int = ...,
        stop_loss_percent: float = ...,
        max_loss_threshold: float = ...,
        seed: int = ...,
    ) -> None: ...
    def process_signal(
        self,
        symbol: str,
        signal_type: str,
        strength: float,
        strategy_id: str,
    ) -> None: ...
    def dispatch_until_idle(self) -> None: ...
    def get_new_fills(self) -> List[Dict]: ...
    def get_new_risk_decisions(self) -> List[Dict]: ...
    def state_snapshot(self) -> Dict: ...
    def execution_stats_snapshot(self) -> Dict: ...
    def metrics_snapshot(self) -> Dict: ...
    def reset(self, seed: int) -> None: ...
    def get_equity(self) -> float: ...
    def load_market_data_columnar(
        self,
        symbol: str,
        timestamp: np.ndarray,
        open: np.ndarray,
        high: np.ndarray,
        low: np.ndarray,
        close: np.ndarray,
        volume: np.ndarray,
    ) -> None: ...
    def load_signals_columnar(
        self,
        timestamp: np.ndarray,
        symbol: List[str],
        signal_type: List[str],
        strength: np.ndarray,
        strategy_id: List[str],
        signal_id: Optional[List[str]] = ...,
    ) -> None: ...
    def run_to_completion(self) -> None: ...
    def risk_decision_trace(self) -> List[Dict]: ...
