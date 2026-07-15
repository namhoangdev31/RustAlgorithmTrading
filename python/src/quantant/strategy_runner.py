from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Protocol

import pandas as pd

from .catalog import create_strategy, strategy_version_hash
from .models import DeploymentJob


class CommandPublisher(Protocol):
    async def publish(self, subject: str, payload: bytes) -> None: ...


class StrategyRunner:
    """Turns normalized ZMQ bar envelopes into idempotent execution commands."""

    def __init__(self, deployment: DeploymentJob, publisher: CommandPublisher):
        expected = strategy_version_hash(deployment.template_key, deployment.parameters)
        if expected != deployment.strategy_version_hash:
            raise ValueError("Deployment strategy version is not immutable")
        if deployment.mode not in {"paper", "live"}:
            raise ValueError("Deployment mode must be paper or live")
        self.deployment = deployment
        self.publisher = publisher
        self.strategy = create_strategy(deployment.template_key, deployment.parameters).strategy
        self.frames: dict[str, pd.DataFrame] = {}

    async def on_market_bar(self, envelope: dict[str, Any]) -> None:
        payload = envelope.get("payload", envelope)
        symbol = str(payload["symbol"])
        if symbol not in self.deployment.symbols:
            return
        row = {
            "timestamp": pd.to_datetime(payload["timestamp"], utc=True),
            "open": float(payload["open"]),
            "high": float(payload["high"]),
            "low": float(payload["low"]),
            "close": float(payload["close"]),
            "volume": float(payload["volume"]),
        }
        frame = pd.concat([self.frames.get(symbol, pd.DataFrame()), pd.DataFrame([row])]).tail(1000)
        frame = frame.sort_values("timestamp").drop_duplicates("timestamp", keep="last")
        frame.attrs["symbol"] = symbol
        self.frames[symbol] = frame
        signals = self.strategy.generate_signals(frame, latest_only=True)
        for signal in signals:
            if signal.signal_type.value not in {"LONG", "SHORT"}:
                continue
            await self._publish_signal(signal, payload)

    async def _publish_signal(self, signal: Any, market_payload: dict[str, Any]) -> None:
        observed_at = pd.Timestamp(market_payload["timestamp"]).to_pydatetime()
        identity = (
            f"{self.deployment.deployment_id}:{self.deployment.strategy_version_hash}:"
            f"{signal.symbol}:{observed_at.isoformat()}:{signal.signal_type.value}"
        )
        idempotency_key = hashlib.sha256(identity.encode("utf-8")).hexdigest()
        command = {
            "schema_version": 1,
            "command_id": idempotency_key,
            "correlation_id": idempotency_key,
            "type": "submit_order",
            "payload": {
                "account_id": "quantant-desk",
                "client_order_id": idempotency_key,
                "idempotency_key": idempotency_key,
                "symbol": signal.symbol,
                "side": "buy" if signal.signal_type.value == "LONG" else "sell",
                "order_type": "market",
                "quantity": str(Decimal(str(signal.quantity or 1))),
                "limit_price": None,
                "stop_price": None,
                "mode": self.deployment.mode,
                "market_data_observed_at": observed_at.astimezone(timezone.utc).isoformat(),
                "risk_snapshot_hash": hashlib.sha256(
                    json.dumps(
                        self.deployment.risk_snapshot, sort_keys=True, separators=(",", ":")
                    ).encode("utf-8")
                ).hexdigest(),
                "strategy_version_hash": self.deployment.strategy_version_hash,
                "live_session_expires_at": None,
            },
        }
        await self.publisher.publish(
            "quantant.execution.commands", json.dumps(command).encode("utf-8")
        )
