# Phase 1: GO/NO-GO Evidence Report

## Executive Summary

Phase 1 implements Immediate Offload and Contract Hardening while keeping Python as the default research/backtest path and Rust as an opt-in backend.

Current verdict:

- Phase 1 source implementation: GO.
- Rust backend as default: NO-GO because benchmark evidence shows the current Python wrapper/object conversion path is slower than Python for larger batches.

Reason: Rust crate tests confirm the new source-level kernels and envelope validation. Python parity/reproducibility tests now run against the rebuilt local PyO3 extension with no skips. Benchmark evidence shows Rust kernel time is low, but Python-side conversion into `MarketBar` objects dominates end-to-end latency.

## 1. Feature Parity

Validated by:

- `python -m pytest tests/unit/python/test_features.py -q`
- `python -m pytest tests/unit/python/test_rust_feature_parity.py -q`
- `cd rust && cargo test -p signal-bridge -p common`

Results:

- Python default `FeatureEngine` path passes and remains the default.
- Rust backend fallback behavior passes.
- Rust source-level batch helpers pass crate tests.
- Python wrapper parity passes against the rebuilt local `signal_bridge` extension.

Contract under test:

- Stable Rust wrapper columns: `close`, `log_returns`, `momentum_10`, `volume`, `range_pct`.
- Batch-oriented FFI only; no per-tick feature offload is promoted.

## 2. Monte Carlo Reproducibility

Validated by:

- `python -m pytest tests/unit/python/test_monte_carlo_reproducibility.py -q`
- `cd rust && cargo test -p signal-bridge -p common`

Results:

- Python Monte Carlo with the same explicit seed is deterministic.
- Rust source-level Monte Carlo with the same explicit seed is deterministic in crate tests.
- Rust PyO3 Monte Carlo with the same explicit seed is deterministic.
- Python/Rust terminal price statistical parity passes for mean, standard deviation, and selected percentiles.

Design rule:

- Python owns seed orchestration.
- Rust receives explicit `seed: u64`.
- Python/Rust parity is statistical, not bit-for-bit, because NumPy and Rust PRNG implementations differ.

## 3. ZMQ Validation Hardening

Validated by:

- `python -m pytest tests/integration/test_backtest_signal_flow.py -q`
- `cd rust && cargo test -p common`

Results:

- Missing `schema_version` is rejected.
- Wrong `schema_version` is rejected in strict mode.
- Wrong `schema_version` is accepted with warning in compatibility mode.
- Missing `correlation_id` is rejected.
- Missing or null `payload` is rejected.
- Malformed JSON is dropped without crashing `receive_one`.
- Valid `v1.0.0` envelope is accepted.
- `REJECT` payloads remain fail-fast blocked.

Traceability rule:

- Publish and receive logs include `[cid:{correlation_id}]` where available.
- Publishers generate and log a UUID when no correlation context exists.

## 4. Benchmark Threshold

Benchmark script:

- `python tests/benchmarks/feature_backend_benchmark.py`

Current status:

- Executed with the current local environment.
- `signal_bridge` was rebuilt with `maturin develop --release --features extension-module`.
- Type stubs are managed in `src/typings/signal_bridge.pyi` to avoid naming collisions with the binary module.
- Runtime imports now correctly resolve to the `.venv` installed package.

Acceptance threshold before default promotion:

| Dataset Size | Python Baseline | Rust Wrapper + Compute | Estimated FFI/Object Overhead | Promotion Rule |
|---|---|---|---|---|
| 1,000 bars | 34.28 ms | 48.23 ms | 0.95 ms | Keep Python default |
| 10,000 bars | 82.00 ms | 339.26 ms | 4.92 ms | Keep Python default |
| 100,000 bars | 152.82 ms | 5052.43 ms | 41.21 ms | Keep Python default |

Default promotion rule:

- Keep Python for batches below 1,000 bars unless measured Rust latency is lower.
- Consider Rust default only after replacing `iterrows`/per-object `MarketBar` conversion with a columnar or NumPy-array FFI contract and proving Rust wrapper plus compute is consistently faster for 10,000+ bars.

## 5. Validation Snapshot

Latest local validation:

- Combined Python validation: 39 passed, 0 skipped, 7 warnings.
- `tests/unit/python/test_features.py`: 16 passed.
- `tests/unit/python/test_rust_feature_parity.py`: 3 passed.
- `tests/unit/python/test_monte_carlo_reproducibility.py`: 4 passed.
- `tests/integration/test_backtest_signal_flow.py`: 16 passed, 7 warnings.
- `cd rust && cargo test -p signal-bridge -p common`: passed.
- `python tests/benchmarks/feature_backend_benchmark.py`: completed with Rust rows populated.

## 6. GO/NO-GO Verdict

GO for Phase 1 code integration because:

- Python remains the default backend.
- Rust offload is opt-in and batch-oriented.
- Fallback to Python/NumPy remains available.
- Rust source tests cover deterministic seed behavior and invalid numeric rejection.
- ZMQ validation is centralized and rejects invalid envelopes safely.
- No Go code is introduced.

NO-GO for making Rust the default backend until:

- The Rust feature FFI contract is redesigned to avoid Python `iterrows` and per-row object conversion.
- Benchmark evidence shows end-to-end Rust wrapper plus compute beats Python for intended batch sizes.
- Benchmark evidence confirms the FFI boundary does not erase Rust gains for intended batch sizes.
