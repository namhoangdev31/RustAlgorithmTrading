from typing import Any


class SimulatedExecutionHandler:
    """
    No-network execution handler shim for backtesting legacy compatibility.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        pass

    def execute_order(self, *args: Any, **kwargs: Any) -> Any:
        pass
