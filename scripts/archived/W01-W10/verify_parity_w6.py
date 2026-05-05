#!/usr/bin/env python3
"""Week 6 stop-loss parity harness.

Runs the same stop-loss scenarios through a small Python reference model and the
Rust risk-manager helper binary. The harness fails on missing correlation_id,
trigger drift, reason drift, or numeric drift beyond one tick.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

DEFAULT_TICK = 1e-8
DEFAULT_CORRELATION_ID = "w6-parity-cid"


@dataclass(frozen=True)
class StopLossConfig:
    stop_type: str
    percentage: float | None = None
    price_level: float | None = None
    max_loss_value: float | None = None

    def to_wire(self) -> dict[str, Any]:
        data: dict[str, Any] = {"stop_type": self.stop_type}
        if self.percentage is not None:
            data["percentage"] = self.percentage
        if self.price_level is not None:
            data["price_level"] = self.price_level
        if self.max_loss_value is not None:
            data["max_loss_value"] = self.max_loss_value
        return data


@dataclass(frozen=True)
class PricePoint:
    price: float
    pnl: float


@dataclass(frozen=True)
class Scenario:
    name: str
    symbol: str
    side: str
    entry: float
    quantity: float
    config: StopLossConfig
    stream: list[PricePoint]
    correlation_id: str = DEFAULT_CORRELATION_ID


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def is_long(side: str) -> bool:
    return side.lower() in {"long", "bid", "buy"}


def reason_code(config: StopLossConfig, loss_triggered: bool) -> str:
    if loss_triggered:
        return "MAX_LOSS_EXCEEDED"
    return "STOP_LOSS_TRIGGERED"


def python_reference(scenario: Scenario, tick: float) -> dict[str, Any]:
    config = scenario.config
    highest = scenario.entry
    lowest = scenario.entry

    if config.stop_type in {"STATIC", "TRAILING"}:
        if config.percentage is None:
            raise ValueError(f"{scenario.name}: percentage required")
        trigger_price = (
            scenario.entry * (1.0 - config.percentage / 100.0)
            if is_long(scenario.side)
            else scenario.entry * (1.0 + config.percentage / 100.0)
        )
    elif config.stop_type == "ABSOLUTE":
        if config.price_level is None:
            raise ValueError(f"{scenario.name}: price_level required")
        trigger_price = config.price_level
    elif config.stop_type == "MAX_LOSS":
        if config.max_loss_value is None:
            raise ValueError(f"{scenario.name}: max_loss_value required")
        trigger_price = scenario.entry
    else:
        raise ValueError(f"{scenario.name}: unsupported stop_type {config.stop_type}")

    for idx, point in enumerate(scenario.stream):
        current = point.price
        pnl = point.pnl

        if current > highest:
            highest = current
        if current < lowest:
            lowest = current

        if config.stop_type == "TRAILING":
            assert config.percentage is not None
            if is_long(scenario.side):
                candidate = highest * (1.0 - config.percentage / 100.0)
                trigger_price = max(trigger_price, candidate)
            else:
                candidate = lowest * (1.0 + config.percentage / 100.0)
                trigger_price = min(trigger_price, candidate)

        price_triggered = False
        if config.stop_type != "MAX_LOSS":
            if is_long(scenario.side):
                price_triggered = current <= trigger_price
            else:
                price_triggered = current >= trigger_price

        loss_triggered = False
        if config.max_loss_value is not None:
            loss_triggered = pnl <= -config.max_loss_value

        if price_triggered or loss_triggered:
            return {
                "triggered": True,
                "trigger_index": idx,
                "stop_type": config.stop_type,
                "reason_code": reason_code(config, loss_triggered),
                "correlation_id": scenario.correlation_id,
                "trigger_price": trigger_price,
                "current_price": current,
            }

    return {
        "triggered": False,
        "trigger_index": None,
        "stop_type": None,
        "reason_code": None,
        "correlation_id": scenario.correlation_id,
        "trigger_price": None,
        "current_price": None,
    }


def run_rust(scenario: Scenario) -> dict[str, Any]:
    root = repo_root()
    rust_dir = root / "rust" / "risk-manager"
    request = {
        "symbol": scenario.symbol,
        "side": scenario.side,
        "entry_price": scenario.entry,
        "quantity": scenario.quantity,
        "correlation_id": scenario.correlation_id,
        "config": scenario.config.to_wire(),
        "price_stream": [point.__dict__ for point in scenario.stream],
    }

    process = subprocess.run(
        ["cargo", "run", "--quiet", "--bin", "verify_stop"],
        cwd=rust_dir,
        input=json.dumps(request),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "PYO3_USE_ABI3_FORWARD_COMPATIBILITY": "1"},
        check=False,
    )
    if process.returncode != 0:
        raise RuntimeError(
            f"Rust helper failed for {scenario.name}:\nSTDOUT:\n{process.stdout}\nSTDERR:\n{process.stderr}"
        )
    try:
        return json.loads(process.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Rust helper returned non-JSON output: {process.stdout}") from exc


def assert_match(name: str, py: dict[str, Any], rust: dict[str, Any], tick: float) -> list[str]:
    errors: list[str] = []
    for key in ["triggered", "trigger_index", "stop_type", "reason_code", "correlation_id"]:
        if py.get(key) != rust.get(key):
            errors.append(f"{name}: {key} mismatch python={py.get(key)!r} rust={rust.get(key)!r}")

    if rust.get("triggered") and not rust.get("correlation_id"):
        errors.append(f"{name}: rust trigger missing correlation_id")

    for key in ["trigger_price", "current_price"]:
        py_value = py.get(key)
        rust_value = rust.get(key)
        if py_value is None or rust_value is None:
            if py_value != rust_value:
                errors.append(f"{name}: {key} mismatch python={py_value!r} rust={rust_value!r}")
            continue
        if abs(float(py_value) - float(rust_value)) > tick:
            errors.append(
                f"{name}: {key} drift {abs(float(py_value) - float(rust_value)):.12f} > tick {tick}"
            )

    return errors


def scenarios(tick: float) -> list[Scenario]:
    return [
        Scenario(
            name="static_long_no_trigger_then_trigger",
            symbol="BTCUSDT",
            side="long",
            entry=50_000.0,
            quantity=1.0,
            config=StopLossConfig("STATIC", percentage=5.0),
            stream=[PricePoint(47_500.0 + tick, -2_499.0), PricePoint(47_500.0, -2_500.0)],
        ),
        Scenario(
            name="static_short_no_trigger_then_trigger",
            symbol="ETHUSDT",
            side="short",
            entry=3_000.0,
            quantity=10.0,
            config=StopLossConfig("STATIC", percentage=5.0),
            stream=[PricePoint(3_150.0 - tick, -1_499.0), PricePoint(3_150.0, -1_500.0)],
        ),
        Scenario(
            name="trailing_long_peak_then_drop",
            symbol="BTCUSDT",
            side="long",
            entry=50_000.0,
            quantity=1.0,
            config=StopLossConfig("TRAILING", percentage=3.0),
            stream=[
                PricePoint(52_000.0, 2_000.0),
                PricePoint(51_000.0, 1_000.0),
                PricePoint(50_440.0, 440.0),
            ],
        ),
        Scenario(
            name="trailing_short_trough_then_rise",
            symbol="ETHUSDT",
            side="short",
            entry=3_000.0,
            quantity=10.0,
            config=StopLossConfig("TRAILING", percentage=3.0),
            stream=[
                PricePoint(2_850.0, 1_500.0),
                PricePoint(2_900.0, 1_000.0),
                PricePoint(2_935.5, 645.0),
            ],
        ),
        Scenario(
            name="absolute_long_boundary",
            symbol="SOLUSDT",
            side="long",
            entry=100.0,
            quantity=5.0,
            config=StopLossConfig("ABSOLUTE", price_level=95.0),
            stream=[PricePoint(95.0 + tick, -24.999999), PricePoint(95.0, -25.0)],
        ),
        Scenario(
            name="max_loss_only",
            symbol="BTCUSDT",
            side="long",
            entry=50_000.0,
            quantity=1.0,
            config=StopLossConfig("MAX_LOSS", max_loss_value=2_000.0),
            stream=[PricePoint(49_000.0, -1_999.0), PricePoint(49_500.0, -2_000.0)],
        ),
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Week 6 Python/Rust stop-loss parity.")
    parser.add_argument(
        "--fail-on-drift", action="store_true", help="Return non-zero when parity drift is found."
    )
    parser.add_argument(
        "--tick", type=float, default=DEFAULT_TICK, help="Maximum allowed numeric drift."
    )
    args = parser.parse_args()

    all_errors: list[str] = []
    print(f"[i] Week 6 stop-loss parity harness starting (tick={args.tick:g})")

    for scenario in scenarios(args.tick):
        py = python_reference(scenario, args.tick)
        rust = run_rust(scenario)
        errors = assert_match(scenario.name, py, rust, args.tick)
        status = "PASS" if not errors else "FAIL"
        print(
            f"[{status}] {scenario.name}: triggered={rust.get('triggered')} "
            f"idx={rust.get('trigger_index')} stop_type={rust.get('stop_type')} "
            f"reason={rust.get('reason_code')} cid={rust.get('correlation_id')}"
        )
        all_errors.extend(errors)

    if all_errors:
        print("[x] Parity drift detected:")
        for error in all_errors:
            print(f"  - {error}")
        return 1 if args.fail_on_drift else 0

    print("[ok] Week 6 stop-loss parity passed with 0 drift findings.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
