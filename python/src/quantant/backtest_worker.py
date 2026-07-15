from __future__ import annotations

import asyncio
import json
import random
import tempfile
from pathlib import Path
from typing import Any, Awaitable, Callable, Protocol

import numpy as np

from backtesting.data_handler import HistoricalDataHandler
from backtesting.engine import BacktestEngine
from backtesting.portfolio_handler import PortfolioHandler
from bridge.backtest_bridge import RustBacktestBridge

from .catalog import create_strategy, strategy_version_hash
from .models import BacktestJob
from .questdb import QuestDBCandleReader, dataset_hash


class EventPublisher(Protocol):
    async def publish(self, subject: str, payload: bytes) -> None: ...


class BacktestWorker:
    def __init__(
        self,
        candle_reader: QuestDBCandleReader,
        publisher: EventPublisher,
        engine_runner: Callable[[BacktestJob, dict[str, Any]], Awaitable[dict[str, Any]]] | None = None,
    ):
        self.candle_reader = candle_reader
        self.publisher = publisher
        self.engine_runner = engine_runner or self._run_engine

    async def execute(self, job: BacktestJob) -> dict[str, Any]:
        expected_version = strategy_version_hash(job.template_key, job.parameters)
        if expected_version != job.strategy_version_hash:
            raise ValueError("strategy_version_hash does not match immutable parameters")
        await self._progress(job.run_id, 5, "loading_data")
        frames = await self.candle_reader.load(
            job.symbols, job.interval, job.start_at, job.end_at
        )
        actual_dataset_hash = dataset_hash(frames)
        if actual_dataset_hash != job.dataset_hash:
            raise ValueError("dataset_hash mismatch; refusing non-reproducible backtest")
        random.seed(job.seed)
        np.random.seed(job.seed % (2**32))
        await self._progress(job.run_id, 30, "running")
        result = await self.engine_runner(job, frames)
        envelope = {
            "schema_version": 1,
            "type": "backtest.completed",
            "run_id": job.run_id,
            "strategy_version_hash": job.strategy_version_hash,
            "dataset_hash": actual_dataset_hash,
            "risk_snapshot": job.risk_snapshot,
            "seed": job.seed,
            "result": result,
        }
        await self.publisher.publish(
            "quantant.backtest.events", json.dumps(envelope, default=str).encode("utf-8")
        )
        return envelope

    async def _progress(self, run_id: str, percent: int, stage: str) -> None:
        await self.publisher.publish(
            "quantant.backtest.events",
            json.dumps(
                {
                    "schema_version": 1,
                    "type": "backtest.progress",
                    "run_id": run_id,
                    "progress_percent": str(percent),
                    "stage": stage,
                }
            ).encode("utf-8"),
        )

    async def _run_engine(self, job: BacktestJob, frames: dict[str, Any]) -> dict[str, Any]:
        return await asyncio.to_thread(self._run_engine_blocking, job, frames)

    @staticmethod
    def _run_engine_blocking(job: BacktestJob, frames: dict[str, Any]) -> dict[str, Any]:
        with tempfile.TemporaryDirectory(prefix="quantant-backtest-") as directory:
            path = Path(directory)
            for symbol, frame in frames.items():
                frame.to_csv(path / f"{symbol}.csv", index=False)
            data = HistoricalDataHandler(
                list(job.symbols), path, start_date=job.start_at, end_date=job.end_at
            )
            capital = float(job.initial_capital)
            portfolio = PortfolioHandler(capital, data_handler=data)
            strategy = create_strategy(job.template_key, job.parameters)
            runtime = RustBacktestBridge(
                capital,
                list(job.symbols),
                risk_config=job.risk_snapshot,
                seed=job.seed,
            )
            engine = BacktestEngine(
                data,
                portfolio_handler=portfolio,
                strategy=strategy,
                start_date=job.start_at,
                end_date=job.end_at,
                rust_backtest_runtime=runtime,
            )
            return engine.run(seed_profile_id=f"quantant-{job.run_id}-{job.seed}")
