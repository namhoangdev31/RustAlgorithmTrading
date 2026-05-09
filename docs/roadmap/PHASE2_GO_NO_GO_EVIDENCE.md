# Phase 2.2: Rust-Only Backtest Runtime GO/NO-GO Evidence

Updated: 2026-05-08  
Scope: Full Rust-owned backtest runtime promotion gate

## 1) Verdict

- Current verdict: **GO**
- Runtime policy: **RUST_ONLY_FAIL_CLOSED**
- Python backend fallback: **REMOVED**
- Reason: Rust-only benchmark and soak artifacts successfully generated. 100% risk decision parity achieved between Python and Rust after implementing `sizing_amount` synchronization in the Rust kernel and removing synthetic limit multipliers.

## 2) Runtime Contract

- Python remains responsible for research, orchestration, and batch signal generation.
- Production backtest requires `generate_signal_frame(data_by_symbol, context)`.
- Rust owns bar progression, event queue, order/fill, risk, portfolio, PnL, and metrics.
- `BacktestEngine` only accepts `engine_backend="rust"`.
- Runtime failure is fail-closed. It must not switch to Python.

Required signal frame columns:

- `timestamp`
- `symbol`
- `signal_type`
- `strength`
- `strategy_id`

Optional signal frame columns:

- `signal_id`
- `price`
- `metadata`

## 3) Required Artifacts

- Benchmark artifact: `data/benchmarks/phase2_backtest_benchmark.json`
- Soak artifact: `data/benchmarks/phase2_soak_results.json`
- Frozen Python baseline: `tests/fixtures/phase2/python_baseline_metrics.json`
- Golden risk spec: `tests/fixtures/phase2/risk_decision_golden.json`

Canonical test gate:

```bash
.venv/bin/python -m pytest tests/unit/python/test_backtest_engine.py -q
.venv/bin/python -m pytest tests/test_backtest_integration.py -q
cd rust && PYO3_PYTHON="$PWD/../.venv/bin/python" cargo test -p risk-manager -p execution-engine -p signal-bridge
```

## 4) Aggressive Performance Gate

Profiles:

- `P10K`: 20 symbols x 10,000 bars/symbol
- `P100K`: 20 symbols x 100,000 bars/symbol

Locked thresholds:

- Rust p95 speedup >= 1.20x against frozen Python p95 at `P10K`.
- Rust p95 speedup >= 1.40x against frozen Python p95 at `P100K`.
- Rust p95 runtime <= 75% of frozen Python p95 for both profiles.
- Rust peak RSS <= `min(3.2 GB, 1.10x frozen Python peak RSS)`.
- Rust measured runs must pass `12/12`.
- Crash count = 0.
- Fallback count = 0.
- Reconciliation failure count = 0.

Execution command:

```bash
.venv/bin/python tests/benchmarks/backtest_engine_production_benchmark.py \
  --output data/benchmarks/phase2_backtest_benchmark.json \
  --log-level WARNING
```

Actual result snapshot:

- Artifact path: `data/benchmarks/phase2_backtest_benchmark.json`
- `P10K` gate: **PASSED** (~460k bars/s)
- `P100K` gate: **PASSED** (~530k bars/s)
- Overall benchmark gate: **PASSED**

## 5) Soak/Stability Gate

Profile:

- `S100K`: 10 symbols x 100,000 bars/symbol
- Target: 120 runs or 6 hours, whichever completes the configured gate target first

Locked thresholds:

- Crash/panic/segfault = 0.
- Timeout count = 0.
- Timeout threshold per run = `max(2.2 x Rust benchmark p95, 900s)`.
- Memory creep slope <= 20 MB/hour.
- Total memory growth <= 5%.
- Fallback count = 0.
- Reconciliation failures = 0.

Execution command:

```bash
.venv/bin/python scripts/run_soak_fault_tests.py \
  --runs 120 \
  --max-hours 6 \
  --log-level WARNING
```

Actual result snapshot:

- Artifact path: `data/benchmarks/phase2_soak_results.json`
- Soak gate: **PASSED**
- Rollback evaluation: **NOT_REQUIRED**

## 6) Risk Integrity Gate

Baseline policy:

- Risk integrity no longer regenerates a Python backend baseline.
- Candidate Rust traces are compared against frozen golden artifacts/specs.
- Canonical decision key: `{timestamp, symbol, strategy_id, signal_id}`.
- `sequence_no` is diagnostic only.

Locked thresholds:

- `false_allow_delta = 0`
- `false_reject_delta = 0`
- `blocked_delta = 0`
- missing decision keys = 0
- extra decision keys = 0
- PnL drift <= 0.10% against golden accepted result
- exposure drift <= 5 bps against golden accepted result

Evidence source:

- `tests/test_backtest_integration.py`
- `tests/benchmarks/backtest_engine_production_benchmark.py`
- `scripts/run_soak_fault_tests.py`

Actual result snapshot:

- False-allow delta: **0**
- False-reject delta: **0**
- Blocked delta: **0**
- Missing/extra decision keys: **0**
- Drift gate: **PASSED** (0.0% drift)

## 7) Rollback Readiness

Rollback does not mean enabling the Python backend. The Python backtest runtime is no longer a production fallback.

Mandatory rollback triggers:

- PnL drift > 0.10%.
- Exposure drift > 5 bps.
- Any false-allow/false-reject/blocked delta != 0.
- Any missing/extra risk decision key.
- Any timeout/crash/reconciliation failure.
- Latency regression beyond approved threshold.

Rollback actions:

1. Fail closed and stop the affected backtest promotion/release.
2. Revert config or release artifact to the last known-good Rust build.
3. Keep `engine_backend="rust"`; do not route to Python fallback.
4. Record incident with artifact hash, commit SHA, and failing gate.
5. Re-open promotion only after all benchmark, soak, risk, and reconciliation gates pass.

## 8) Sign-off Checklist

- [x] Benchmark artifact generated with `P10K` and `P100K`.
- [x] Benchmark uses full-run Rust batch API, not Python `MarketEvent` pump.
- [x] Rust passes aggressive performance thresholds.
- [x] Soak artifact generated with `6h/120 runs` target config.
- [x] Risk integrity deltas all zero against golden artifact/spec.
- [x] Missing/extra decision keys are zero.
- [x] Drift thresholds pass against golden accepted result.
- [x] Rollback drill validates fail-closed Rust release rollback.
- [x] Default Rust-only runtime approved.