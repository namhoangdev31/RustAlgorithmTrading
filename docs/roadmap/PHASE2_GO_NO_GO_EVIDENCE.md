# Phase 2: GO/NO-GO Evidence Report

Updated: 2026-05-07  
Scope: Rust backtest core default promotion gate

## 1) Verdict

- Current verdict: **PENDING_EXECUTION**
- Rust default promotion status: **NOT_FLIPPED**
- Reason: Full production-like benchmark (`P10K`, `P100K`) and soak (`6h/120 runs`) artifacts must be executed and attached first.

## 2) Required Artifacts

- Benchmark artifact: `data/benchmarks/phase2_backtest_benchmark.json`
- Soak artifact: `data/benchmarks/phase2_soak_results.json`
- Canonical test gate:
  - `python -m pytest tests/unit/python/test_backtest_engine.py -q`
  - `python -m pytest tests/test_backtest_integration.py -q`
  - `cd rust && cargo test -p risk-manager -p execution-engine -p signal-bridge`

Validation snapshot (executed on 2026-05-07):

- `tests/unit/python/test_backtest_engine.py`: PASS
- `tests/test_backtest_integration.py`: PASS
- `cargo test -p risk-manager -p execution-engine -p signal-bridge`: PASS
- Remaining blockers to full GO: production-like benchmark + 6h soak artifacts

## 3) Aggressive Performance Gate (Production-like)

Profiles:

- `P10K`: 20 symbols x 10,000 bars/symbol
- `P100K`: 20 symbols x 100,000 bars/symbol

Locked thresholds:

- Speedup (Python p95 / Rust p95) >= 1.20x at `P10K`
- Speedup >= 1.40x at `P100K`
- Rust p95 runtime <= 75% Python p95 at both profiles
- Rust peak RSS <= `min(3.2 GB, 1.10x Python peak RSS)`
- Rust measured runs must pass `12/12` with no crash, no fallback, no reconciliation failure

Execution command:

```bash
python tests/benchmarks/backtest_engine_production_benchmark.py
```

Actual result snapshot:

- Artifact path: `data/benchmarks/phase2_backtest_benchmark.json`
- `P10K` gate: PENDING
- `P100K` gate: PENDING
- Overall benchmark gate: PENDING

## 4) Soak/Stability Gate (Rust Runtime)

Locked soak profile:

- `S100K`: 10 symbols x 100,000 bars/symbol
- Duration target: 6 hours
- Iterations target: 120 runs

Locked thresholds:

- Crash/panic/segfault = 0
- Timeout count = 0
- Timeout threshold per run = `max(2.2 x rust_benchmark_p95, 900s)`
- Memory creep slope <= 20 MB/hour
- Total memory growth <= 5%
- Rust fallback-to-python count = 0
- Reconciliation failures = 0

Execution command:

```bash
python scripts/run_soak_fault_tests.py
```

Actual result snapshot:

- Artifact path: `data/benchmarks/phase2_soak_results.json`
- Soak gate: PENDING
- Rollback evaluation: PENDING

## 5) Risk Integrity Gate

Locked thresholds:

- `false_allow_delta = 0`
- `false_reject_delta = 0`
- `blocked_delta = 0`
- Reconciliation checkpoints pass 100% at end-of-bar, end-of-day, end-of-run
- Drift strict remains: `PnL <= 0.10%`, exposure `<= 5 bps`

Evidence source:

- `tests/test_backtest_integration.py`
- risk trace in benchmark/soak artifacts (`risk_integrity` / `risk_integrity_snapshot`)

Actual result snapshot:

- False-allow delta: PENDING
- False-reject delta: PENDING
- Blocked delta: PENDING
- Reconciliation pass-rate: PENDING

## 6) Rollback Readiness

Mandatory rollback triggers:

- PnL drift > 0.10%
- Exposure drift > 5 bps
- Any false-allow/false-reject/blocked delta != 0
- Any timeout/crash/fallback/reconciliation failure
- Latency regression beyond approved threshold

Rollback actions:

1. Set `BACKTEST_ENGINE_BACKEND_DEFAULT=python`.
2. Keep `rust_fallback_to_python=True`.
3. Record incident with artifact hash and failing gate.
4. Re-open promotion only after rerun proves all gates pass.

## 7) Sign-off Checklist

- [ ] Benchmark artifact generated with `P10K` and `P100K`.
- [ ] Soak artifact generated with `6h/120 runs` target config.
- [ ] Risk integrity deltas all zero.
- [ ] Reconciliation checkpoints pass 100%.
- [ ] Rollback drill validated.
- [ ] Default backend switch approved.
