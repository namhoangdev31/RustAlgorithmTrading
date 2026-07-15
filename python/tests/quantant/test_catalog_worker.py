from datetime import datetime, timezone

import pandas as pd
import pytest

from quantant.backtest_worker import BacktestWorker
from quantant.catalog import strategy_version_hash, validate_parameters
from quantant.models import BacktestJob
from quantant.questdb import dataset_hash


class MemoryPublisher:
    def __init__(self):
        self.events = []

    async def publish(self, subject, payload):
        self.events.append((subject, payload))


class CandleReader:
    def __init__(self, frames):
        self.frames = frames

    async def load(self, symbols, interval, start_at, end_at):
        return self.frames


def test_strategy_hash_is_order_independent():
    left = strategy_version_hash("mean_reversion", {"bb_std": 2.5, "bb_period": 30})
    right = strategy_version_hash("mean_reversion", {"bb_period": 30, "bb_std": 2.5})
    assert left == right


def test_catalog_rejects_unknown_parameters():
    with pytest.raises(ValueError, match="Unknown strategy parameters"):
        validate_parameters("momentum", {"unsafe_code": "buy_everything"})


@pytest.mark.asyncio
async def test_backtest_worker_preserves_reproducibility_contract():
    timestamp = pd.Timestamp("2026-01-02T00:00:00Z")
    frames = {
        "AAPL": pd.DataFrame(
            [{"timestamp": timestamp, "open": 1, "high": 2, "low": 1, "close": 2, "volume": 5}]
        )
    }
    publisher = MemoryPublisher()
    version_hash = strategy_version_hash("momentum", {})
    job = BacktestJob(
        run_id="run-1",
        strategy_version_hash=version_hash,
        template_key="momentum",
        parameters={},
        symbols=("AAPL",),
        interval="1m",
        start_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        end_at=datetime(2026, 1, 3, tzinfo=timezone.utc),
        dataset_hash=dataset_hash(frames),
        risk_snapshot={"max_notional": "1000"},
        seed=42,
        initial_capital="10000",
    )

    async def fake_engine(received_job, received_frames):
        return {"pnl": "12.00", "seed": received_job.seed}

    result = await BacktestWorker(CandleReader(frames), publisher, fake_engine).execute(job)
    assert result["dataset_hash"] == job.dataset_hash
    assert result["strategy_version_hash"] == version_hash
    assert result["seed"] == 42
    assert len(publisher.events) == 3
