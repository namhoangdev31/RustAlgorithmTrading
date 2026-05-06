import numpy as np
from typing import List, Dict

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
    def compute_batch_columnar(
        self,
        open: np.ndarray,
        high: np.ndarray,
        low: np.ndarray,
        close: np.ndarray,
        volume: np.ndarray,
    ) -> Dict[str, np.ndarray]: ...
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
