# Phase 1: GO/NO-GO Evidence Report

## Executive Summary

Phase 1 implements Immediate Offload and Contract Hardening while keeping Python as the default research/backtest path and Rust as an opt-in backend.

Current verdict:

- Phase 1 source implementation: GO.
- Rust backend as default: GO after Phase 1.1 columnar FFI redesign met the benchmark gate.

Reason: Rust crate tests confirm source-level kernels and envelope validation. Python parity/reproducibility tests pass against the rebuilt local PyO3 extension. The new NumPy-columnar contract removes per-row object conversion and benchmark now shows end-to-end Rust speedup > 1.0x at both 10,000 and 100,000 bars.

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
- Batch-oriented FFI is NumPy-columnar (`open/high/low/close/volume[/timestamp]`) with fail-fast validation on invalid batch inputs.

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
| 1,000 bars | 9.86 ms | 2.77 ms | 0.79 ms | Pass (speedup 3.56x) |
| 10,000 bars | 13.45 ms | 1.32 ms | 0.02 ms | Pass (speedup 10.18x) |
| 100,000 bars | 71.57 ms | 6.72 ms | 0.13 ms | Pass (speedup 10.64x) |

Default promotion rule:

- Rust default is enabled when speedup is > 1.0x for both 10,000 and 100,000 bars.
- Hybrid threshold mode is intentionally disabled for Phase 1.1.

## 5. Validation Snapshot

Latest local validation:

- Combined Python validation: 40 passed, 0 skipped, 7 warnings.
- `tests/unit/python/test_features.py`: 17 passed.
- `tests/unit/python/test_rust_feature_parity.py`: 4 passed.
- `tests/unit/python/test_monte_carlo_reproducibility.py`: 4 passed.
- `tests/integration/test_backtest_signal_flow.py`: 16 passed, 7 warnings.
- `cd rust && cargo test -p signal-bridge -p common`: passed.
- `python tests/benchmarks/feature_backend_benchmark.py`: completed; gate `speedup > 1.0x` passed at both 10k and 100k.

## 6. GO/NO-GO Verdict

GO for Phase 1 code integration because:

- Rust is now the default `FeatureEngine` backend after benchmark gate pass.
- Rust offload uses columnar batch FFI and removes per-row object conversion bottlenecks.
- Fallback to Python/NumPy remains available.
- Rust source tests cover deterministic seed behavior and invalid numeric rejection.
- ZMQ validation is centralized and rejects invalid envelopes safely.
- No Go code is introduced.

Default-Rust gate is now GO because:

- `speedup > 1.0x` at both `10k` and `100k` bars.
- FFI boundary overhead is materially below compute+pipeline savings at target batch sizes.

## 7. Final Phase 1 Acceptance Checklist

Sign-off reference date: **May 7, 2026**.

### 7.1 Scope Completion

- [x] Feature offload migrated to NumPy-columnar FFI contract (`open/high/low/close/volume[/timestamp]`).
- [x] Legacy per-row object conversion bottleneck removed from feature-offload path.
- [x] Monte Carlo seed control remains explicit and deterministic across backends.
- [x] ZMQ envelope validation hardened with strict/compatibility mode behavior and fail-fast REJECT blocking.
- [x] No Go implementation introduced in Phase 1.

### 7.2 Contract and Safety Gates

- [x] Batch input validation enforces fail-fast on `NaN`, `inf`, and `close <= 0`.
- [x] Stable output feature columns preserved: `close`, `log_returns`, `momentum_10`, `volume`, `range_pct`.
- [x] Python fallback behavior remains available when Rust backend errors.
- [x] Correlation-id traceability is preserved in publish/receive logging paths.

### 7.3 Test Evidence Gates

- [x] `tests/unit/python/test_features.py` passes.
- [x] `tests/unit/python/test_rust_feature_parity.py` passes.
- [x] `tests/unit/python/test_monte_carlo_reproducibility.py` passes.
- [x] `tests/integration/test_backtest_signal_flow.py` passes.
- [x] `cargo test -p signal-bridge -p common` passes.

### 7.4 Performance Promotion Gate

- [x] Benchmark command executed: `python tests/benchmarks/feature_backend_benchmark.py`.
- [x] `10,000` bars speedup > `1.0x`.
- [x] `100,000` bars speedup > `1.0x`.
- [x] Rust default promotion rule satisfied (non-hybrid policy).

### 7.5 Documentation and Operational Readiness

- [x] Evidence report updated with latest benchmark and verdict.
- [x] Python/Rust API usage examples updated to columnar contract.
- [x] Type stubs (`src/typings/signal_bridge.pyi`) updated to current public interface.
- [x] Build path uses `.venv` toolchain for `maturin` and extension installation.

### 7.6 Final Sign-off Decision

- [x] **Phase 1 implementation status: GO**
- [x] **Default Rust feature backend status: GO**
- [x] **Ready to start Phase 2 planning**
