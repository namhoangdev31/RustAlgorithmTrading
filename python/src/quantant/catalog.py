"""Immutable JSON-Schema strategy catalog exposed by the control-plane."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from strategies.mean_reversion import MeanReversionStrategy
from strategies.momentum import MomentumStrategy
from strategies.trend_following import TrendFollowingStrategy


def _number(default: float, minimum: float, maximum: float) -> dict[str, Any]:
    return {"type": "number", "default": default, "minimum": minimum, "maximum": maximum}


def _integer(default: int, minimum: int, maximum: int) -> dict[str, Any]:
    return {"type": "integer", "default": default, "minimum": minimum, "maximum": maximum}


STRATEGY_CATALOG: dict[str, dict[str, Any]] = {
    "momentum": {
        "key": "momentum",
        "schema_version": 1,
        "display_name": {"en": "Momentum", "vi": "Động lượng"},
        "description": "RSI and MACD momentum with volume and trailing-stop controls.",
        "parameters_schema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "rsi_period": _integer(14, 2, 100),
                "ema_fast": _integer(12, 2, 100),
                "ema_slow": _integer(26, 3, 300),
                "position_size": _number(0.15, 0.001, 1.0),
                "stop_loss_pct": _number(0.02, 0.001, 0.25),
                "take_profit_pct": _number(0.03, 0.001, 1.0),
                "trailing_stop_pct": _number(0.015, 0.001, 0.25),
            },
        },
    },
    "mean_reversion": {
        "key": "mean_reversion",
        "schema_version": 1,
        "display_name": {"en": "Mean Reversion", "vi": "Hồi quy trung bình"},
        "description": "Bollinger-band mean reversion with explicit stop and profit targets.",
        "parameters_schema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "bb_period": _integer(20, 2, 300),
                "bb_std": _number(2.0, 0.25, 6.0),
                "position_size": _number(0.15, 0.001, 1.0),
                "stop_loss_pct": _number(0.02, 0.001, 0.25),
                "take_profit_pct": _number(0.03, 0.001, 1.0),
                "touch_threshold": _number(1.001, 1.0, 1.1),
            },
        },
    },
    "trend_following": {
        "key": "trend_following",
        "schema_version": 1,
        "display_name": {"en": "Trend Following", "vi": "Theo xu hướng"},
        "description": "ADX and EMA alignment for persistent directional markets.",
        "parameters_schema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "ema_fast": _integer(9, 2, 100),
                "ema_medium": _integer(21, 3, 200),
                "ema_slow": _integer(50, 5, 400),
                "adx_period": _integer(14, 2, 100),
                "adx_threshold": _number(25.0, 1.0, 100.0),
                "position_size": _number(0.20, 0.001, 1.0),
                "stop_loss_pct": _number(0.025, 0.001, 0.25),
                "take_profit_pct": _number(0.05, 0.001, 1.0),
                "trailing_stop_pct": _number(0.02, 0.001, 0.25),
            },
        },
    },
}


def validate_parameters(template_key: str, parameters: dict[str, Any]) -> dict[str, Any]:
    template = STRATEGY_CATALOG.get(template_key)
    if template is None:
        raise ValueError(f"Unknown strategy template: {template_key}")
    properties = template["parameters_schema"]["properties"]
    unknown = set(parameters) - set(properties)
    if unknown:
        raise ValueError(f"Unknown strategy parameters: {sorted(unknown)}")
    normalized: dict[str, Any] = {}
    for name, definition in properties.items():
        value = parameters.get(name, definition["default"])
        expected = definition["type"]
        if expected == "integer" and (not isinstance(value, int) or isinstance(value, bool)):
            raise ValueError(f"{name} must be an integer")
        if expected == "number" and (not isinstance(value, (int, float)) or isinstance(value, bool)):
            raise ValueError(f"{name} must be a number")
        if value < definition["minimum"] or value > definition["maximum"]:
            raise ValueError(
                f"{name} must be between {definition['minimum']} and {definition['maximum']}"
            )
        normalized[name] = value
    return normalized


def strategy_version_hash(template_key: str, parameters: dict[str, Any]) -> str:
    normalized = validate_parameters(template_key, parameters)
    payload = {
        "template_key": template_key,
        "schema_version": STRATEGY_CATALOG[template_key]["schema_version"],
        "parameters": normalized,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def create_strategy(template_key: str, parameters: dict[str, Any]) -> "CatalogStrategyAdapter":
    normalized = validate_parameters(template_key, parameters)
    constructors = {
        "momentum": MomentumStrategy,
        "mean_reversion": MeanReversionStrategy,
        "trend_following": TrendFollowingStrategy,
    }
    return CatalogStrategyAdapter(template_key, constructors[template_key](**normalized))


class CatalogStrategyAdapter:
    """Adds the batch interface required by the Rust-only BacktestEngine."""

    def __init__(self, template_key: str, strategy: Any):
        self.template_key = template_key
        self.strategy = strategy
        self.name = strategy.name

    def generate_signal_frame(self, data_by_symbol: dict[str, Any], context: dict[str, Any]):
        import pandas as pd

        rows: list[dict[str, Any]] = []
        for symbol, source in data_by_symbol.items():
            frame = source.copy()
            frame.attrs["symbol"] = symbol
            for signal in self.strategy.generate_signals(frame, latest_only=False):
                rows.append(
                    {
                        "timestamp": signal.timestamp,
                        "symbol": symbol,
                        "signal_type": signal.signal_type.value,
                        "strength": float(signal.confidence),
                        "strategy_id": self.template_key,
                    }
                )
        return pd.DataFrame(
            rows,
            columns=["timestamp", "symbol", "signal_type", "strength", "strategy_id"],
        )
