#!/usr/bin/env python3
"""Refresh the compact Phase 2.2 golden risk baseline spec."""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT = REPO_ROOT / "tests" / "fixtures" / "phase2" / "risk_decision_golden.json"


def main() -> int:
    payload = {
        "version": 1,
        "description": "Compact golden risk decision spec for Phase 2.2 Rust-only gates.",
        "profiles": {
            **{
                name: {
                    "symbols": 20,
                    "bars_per_symbol": bars,
                    "first_timestamp": "2024-01-01T00:00:00+00:00",
                    "strategy_id": "BenchmarkSignalStrategy",
                    "cycle_period": 200,
                    "long_cycle": 25,
                    "decision": "ALLOW",
                    "reason_code": "NONE",
                }
                for name, bars in {"P10K": 10_000, "P100K": 100_000}.items()
            },
            "S100K": {
                "symbols": 10,
                "bars_per_symbol": 100_000,
                "first_timestamp": "2024-01-01T00:00:00+00:00",
                "strategy_id": "SoakSignalStrategy",
                "cycle_period": 180,
                "long_cycle": 30,
                "decision": "ALLOW",
                "reason_code": "NONE",
            },
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
