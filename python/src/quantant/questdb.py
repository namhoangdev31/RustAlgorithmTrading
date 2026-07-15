from __future__ import annotations

import asyncio
import hashlib
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

import pandas as pd

_SAFE_SYMBOL = re.compile(r"^[A-Z0-9:./_-]{1,96}$")
_SAFE_INTERVAL = re.compile(r"^[A-Za-z0-9_-]{1,16}$")


class QuestDBCandleReader:
    def __init__(self, http_url: str, timeout_seconds: float = 10.0):
        self.http_url = http_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    async def load(
        self,
        symbols: tuple[str, ...],
        interval: str,
        start_at: datetime,
        end_at: datetime,
    ) -> dict[str, pd.DataFrame]:
        if not symbols or any(not _SAFE_SYMBOL.fullmatch(symbol) for symbol in symbols):
            raise ValueError("Invalid candle symbol")
        if not _SAFE_INTERVAL.fullmatch(interval):
            raise ValueError("Invalid candle interval")
        frames = await asyncio.gather(
            *(self._load_symbol(symbol, interval, start_at, end_at) for symbol in symbols)
        )
        return dict(zip(symbols, frames, strict=True))

    async def _load_symbol(
        self, symbol: str, interval: str, start_at: datetime, end_at: datetime
    ) -> pd.DataFrame:
        start = _utc(start_at).isoformat().replace("+00:00", "Z")
        end = _utc(end_at).isoformat().replace("+00:00", "Z")
        query = (
            "SELECT timestamp, open, high, low, close, volume "
            "FROM quant_candles_v2 "
            f"WHERE symbol = '{symbol}' AND interval = '{interval}' "
            f"AND timestamp >= '{start}' AND timestamp <= '{end}' "
            "ORDER BY timestamp"
        )
        response = await asyncio.to_thread(self._query, query)
        columns = [column["name"] for column in response.get("columns", [])]
        frame = pd.DataFrame(response.get("dataset", []), columns=columns)
        if frame.empty:
            raise ValueError(f"No QuestDB candles for {symbol}")
        frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True)
        return frame

    def _query(self, query: str) -> dict[str, Any]:
        url = f"{self.http_url}/exec?{urllib.parse.urlencode({'query': query, 'fmt': 'json'})}"
        with urllib.request.urlopen(url, timeout=self.timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))


def dataset_hash(frames: dict[str, pd.DataFrame]) -> str:
    digest = hashlib.sha256()
    for symbol in sorted(frames):
        digest.update(symbol.encode("utf-8"))
        normalized = frames[symbol].copy().sort_values("timestamp")
        normalized["timestamp"] = pd.to_datetime(normalized["timestamp"], utc=True).astype("int64")
        digest.update(
            normalized[["timestamp", "open", "high", "low", "close", "volume"]]
            .to_csv(index=False, header=False, float_format="%.12g")
            .encode("utf-8")
        )
    return digest.hexdigest()


def _utc(value: datetime) -> datetime:
    return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
