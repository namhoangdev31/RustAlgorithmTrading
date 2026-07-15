from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class BacktestJob:
    run_id: str
    strategy_version_hash: str
    template_key: str
    parameters: dict[str, Any]
    symbols: tuple[str, ...]
    interval: str
    start_at: datetime
    end_at: datetime
    dataset_hash: str
    risk_snapshot: dict[str, Any]
    seed: int
    initial_capital: str


@dataclass(frozen=True)
class DeploymentJob:
    deployment_id: str
    strategy_version_hash: str
    template_key: str
    parameters: dict[str, Any]
    symbols: tuple[str, ...]
    mode: str
    risk_snapshot: dict[str, Any]
