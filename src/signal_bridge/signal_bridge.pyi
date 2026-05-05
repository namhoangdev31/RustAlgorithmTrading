from typing import List

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
    def compute_batch(self, bars: List[Bar]) -> List[List[float]]: ...
    def compute_microstructure(
        self, bid_price: float, ask_price: float, bid_depth: float, ask_depth: float
    ) -> List[float]: ...
