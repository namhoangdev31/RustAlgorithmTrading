# FINAL_ROADMAP_SUMMARY.md

Updated: 2026-05-06  
Mode: Static Operational Summary (post-weekly lifecycle)

## 1) System Status

- Documentation model: **production-first static canon**
- Weekly artifact packs: **retired from active tree**
- Legacy docs bundle: **retired from active tree**
- Runtime posture:
  - Provider: **Alpaca-only** (active)
  - Observability/persistence posture: **DuckDB-first** (active)

## 2) Executive Summary (Non-Weekly)

This roadmap is now managed as a continuous program, not a week-by-week lifecycle.
The core strategy is:

- Keep Python strong for research velocity and strategy experimentation.
- Move CPU-bound and low-latency runtime kernels to Rust.
- Consider Go only for optional control-plane separation when scale and ops signals justify it.

Program success criteria:

- Reduce Python runtime pressure on hot paths.
- Preserve deterministic behavior and risk controls.
- Keep public envelope stable (`schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`).
- Maintain or improve reliability under targeted test and soak conditions.
- Improve latency where the bottleneck is inside the system, while recognizing that broker/API latency remains outside direct control.

## 3) Operating Model and Governance

Operational control is maintained through:

- Canonical docs: `docs/DOCS_CANONICAL_MAP.md`, `docs/DOCUMENTATION_INDEX.md`
- Runbooks: `docs/operations/*`
- Runtime scripts: `scripts/README.md`
- Ownership and test routing: `PLAYBOOK.md`

Mandatory governance rules:

- Diagnose owner module and nearest tests before patching.
- Keep cross-runtime contract symmetry for Python/Rust changes.
- Roll out each migration behind integration flags or isolated adapters.
- Record GO/NO-GO with evidence chain: docs -> code -> tests.
- Treat new language adoption as an operational decision, not only an engineering optimization.

## 4) Baseline Snapshot

Current technical baseline:

- Python source (`src/**/*.py`): 72 files, 26,381 lines.
- Largest Python layers:
  - `src/strategies`: 9,850 lines
  - `src/observability`: 7,658 lines
  - `src/backtesting`: 2,751 lines
- Active Rust crates:
  - `rust/market-data`
  - `rust/signal-bridge`
  - `rust/risk-manager`
  - `rust/execution-engine`
  - `rust/database`
  - `rust/common`
- Existing FFI bridge already available:
  - `src/bridge/rust_bridge.py`
  - `src/signal_bridge/signal_bridge.so`

## 5) Long-Term Capability Outlook

If the migration program succeeds, the system can move from a Python-led research/runtime stack toward a production-grade hybrid trading platform.

Expected capability gains:

1. Lower-latency trading core:
   - Moving feature kernels, simulation primitives, risk checks, and execution mechanics into Rust can push internal decision latency toward sub-millisecond targets on controlled workloads.
   - This improves suitability for fast intraday, market-making-adjacent, and arbitrage-style strategies where internal processing speed matters.
   - This does not by itself make the system a full HFT platform; true HFT also depends on broker/venue access, colocated infrastructure, market data entitlements, FIX/DMA connectivity, and strict latency measurement.

2. Safer polyglot runtime boundary:
   - Python remains the research and strategy authoring layer.
   - Rust becomes the deterministic runtime and risk enforcement layer.
   - Go is reserved for control-plane fanout only when operational scale justifies it.

3. Stronger ML experimentation model:
   - Python can continue using the ML ecosystem for model research, validation, and signal design.
   - Rust can contain production execution surfaces so experimental strategy logic does not bypass risk, allocation, and envelope validation.

4. Better platform scalability:
   - Separating data ingest, signal generation, risk, execution, and observability into explicit services improves testability and deployment isolation.
   - Multi-tenant or multi-portfolio operation becomes possible only after state ownership, tenant isolation, and audit boundaries are made explicit.

## 6) Three-Phase Migration Roadmap (Rust-First, Go-Selective)

### 6.1 Phase 1: Immediate Offload and Contract Hardening

Primary objective:

- Offload low-risk, high-return CPU kernels from Python to Rust without changing trading behavior.

In-scope components:

- Feature/indicator path:
  - `src/data/features.py`
  - `src/data/indicators.py`
  - `rust/signal-bridge/src/{bridge.rs,features.rs,indicators.rs}`
- Simulation kernel candidate:
  - `src/simulations/monte_carlo.py`
- Cross-runtime envelope guardrail:
  - `src/bridge/zmq_bridge.py`
  - `rust/common/src/*`
  - `docs/api/ZMQ_PROTOCOL.md`

Detailed deliverables:

1. Add adapter path so Python feature engine can invoke Rust feature computation selectively.
2. Introduce parity checks between Python and Rust feature outputs on shared fixtures.
3. Move Monte Carlo numeric inner loops to Rust-backed callable surface where feasible.
4. Enforce strict envelope validation and typed decode/encode checks at bridge boundaries.
5. Prefer batch/vectorized FFI calls over per-tick calls.
6. Measure FFI overhead separately from Rust compute time.

Validation gate (minimum):

- `python -m pytest tests/unit/python/test_features.py -q`
- `python -m pytest tests/integration/test_backtest_signal_flow.py -q`
- `cd rust && cargo test -p signal-bridge -p common`

Quality and exit criteria:

- Feature throughput improvement meets target benchmark uplift.
- No contract shape regression in public envelope fields.
- Cross-language parity tests pass on agreed fixture set.
- FFI call pattern is batch-oriented for historical/backtest workloads and bounded for live workloads.

Rollback strategy:

- Keep Python feature path as fallback switch until parity and stability are accepted.

### 6.2 Phase 2: Core Backtesting and Risk-Execution Alignment

Primary objective:

- Migrate simulation core mechanics to Rust while preserving Python strategy expressiveness.

In-scope components:

- Event-driven engine kernel:
  - `src/backtesting/engine.py`
- Execution simulation model:
  - `src/backtesting/execution_handler.py`
- Shared allocation/risk control alignment:
  - `src/risk/allocation_manager.py`
  - Rust risk and execution interfaces (`rust/risk-manager`, `rust/execution-engine`)

Detailed deliverables:

1. Extract event queue, dispatch loop, and bar progression core into Rust runtime module.
2. Port slippage, market-impact, and fill simulation primitives to Rust with deterministic tests.
3. Define compatibility boundary so Python strategies continue to generate decisions with unchanged APIs.
4. Align backtest risk gating with live risk semantics to reduce model drift between offline and online paths.
5. Define one authoritative state owner for portfolio, position, and PnL during each runtime mode.
6. Evaluate whether ZMQ remains sufficient or whether schema-first transport such as gRPC/Protobuf is needed for contract safety. Aeron remains a future low-latency candidate only if latency goals exceed ZMQ/gRPC capability.

Validation gate (minimum):

- `python -m pytest tests/unit/python/test_backtest_engine.py -q`
- `python -m pytest tests/test_backtest_integration.py -q`
- `cd rust && cargo test -p risk-manager -p execution-engine -p signal-bridge`

Quality and exit criteria:

- Backtest runtime improves materially on reference datasets.
- PnL and risk metrics drift remain within approved tolerance bands.
- No increase in false-allow or false-reject risk decisions.
- State reconciliation proves Python-visible state and Rust-owned state agree at checkpoint boundaries.

Rollback strategy:

- Preserve Python execution/backtest core path until numeric equivalence and risk integrity are signed off.

### 6.3 Phase 3: Control Plane Optimization and Optional Go Adoption

Primary objective:

- Optimize control-plane services and decide if Go is necessary for operational scale.

Adoption policy:

- Go is optional and only adopted when measurable bottlenecks persist after Rust-focused migration.

Trigger conditions for Go consideration:

1. Sustained observability/API fanout bottleneck under production-like load.
2. Rust migrations from prior phases are stable and operationally accepted.
3. Team readiness exists for additional language ownership in CI/CD, on-call, and runbook maintenance.

Candidate scope if Go is approved:

- WebSocket fanout gateway in front of observability API.
- Lightweight metrics ingestion/aggregation worker.
- Non-critical operational control endpoints.
- Multi-tenant API gateway only after authentication, tenant isolation, audit logging, and rate limiting are explicitly modeled.

Keep in Python/Rust if Go is not approved:

- `src/observability/api/*`
- `src/observability/metrics/*`
- `src/observability/storage/*`

Validation gate (minimum):

- `python -m pytest tests/observability -q`
- `python -m pytest tests/integration/test_observability_integration.py -q`
- Soak tests with p95/p99 latency and error-budget comparison against baseline.

Quality and exit criteria:

- End-to-end stability is maintained or improved.
- Operational toil does not increase after service split.
- Observability path meets target latency and reliability envelopes.
- Added service boundaries improve measurable throughput or reliability enough to justify the extra operational surface.

Rollback strategy:

- Keep deployment topology reversible to Python/Rust-only mode until sustained production readiness is demonstrated.

## 7) Risk Register and Mitigations

### 7.1 FFI Boundary Overhead

Risk:

- Python calling Rust once per tick or once per indicator can spend more time crossing the FFI boundary than computing in Rust.

Impact:

- Backtests and live feature generation may fail to improve, or may regress.

Mitigation:

- Batch historical feature computation.
- Use streaming Rust state machines for live indicators.
- Benchmark Python-only, Rust-only, and Python-to-Rust paths separately.

### 7.2 Split-Brain Debugging

Risk:

- Failures may span Python strategy logic, ZMQ transport, Rust validation, Rust execution, and observability storage.

Impact:

- MTTR can increase unless traces and correlation IDs remain consistent across every boundary.

Mitigation:

- Require `correlation_id` propagation through all runtime services.
- Add cross-runtime trace fixtures and incident replay tests.
- Keep runbooks aligned with service ownership in `PLAYBOOK.md`.

### 7.3 State Synchronization Drift

Risk:

- Python portfolio objects and Rust runtime state can disagree after partial fills, rejected orders, delayed messages, or replay recovery.

Impact:

- PnL, exposure, and risk decisions can diverge between backtest, paper, and live paths.

Mitigation:

- Assign one authoritative state owner per mode.
- Add checkpoint reconciliation for portfolio, positions, orders, fills, and PnL.
- Treat unexplained drift above tolerance as a blocking release condition.

### 7.4 Observability and DuckDB Write Pressure

Risk:

- DuckDB is excellent for analytics but must be handled carefully for sustained concurrent writes and tick-level ingestion.

Impact:

- Observability can become the bottleneck even after trading hot paths improve.

Mitigation:

- Keep DuckDB as analytics-first storage.
- Funnel writes through a controlled writer path or ingestion buffer.
- Export cold/high-volume data to Parquet and evaluate a separate streaming/time-series store if write pressure exceeds DuckDB limits.

### 7.5 Provider and Venue Bottleneck

Risk:

- Alpaca-only REST/WebSocket connectivity may become the latency ceiling after internal Rust paths improve.

Impact:

- Internal sub-millisecond execution cannot translate to venue-level HFT if broker/API latency dominates.

Mitigation:

- Keep Alpaca as active provider while documenting its latency ceiling.
- Add future/non-active research track for FIX, DMA, or alternate broker/venue adapters.
- Do not claim full HFT readiness until broker, market data, and execution venue constraints are validated.

### 7.6 Polyglot Operational Complexity

Risk:

- Adding Go on top of Python and Rust can increase CI, deployment, debugging, hiring, and on-call complexity.

Impact:

- Platform complexity can grow faster than performance benefit.

Mitigation:

- Keep Go conditional.
- Require a measured bottleneck and an explicit owner before adding any Go service.
- Prefer Rust/Python-only deployment for single-fund or internal-only operation unless control-plane scale requires otherwise.

## 8) Best-Practice Risk Solutions

This section converts the risk register into implementation decisions. These are the preferred controls unless measurement proves a stronger alternative is needed.

### 8.1 Benchmark Before Migration

- Build a benchmark harness before moving more runtime behavior across languages.
- Track p50, p95, p99 latency, throughput, CPU, memory, FFI overhead, PnL drift, and state drift.
- Report `Python-only`, `Rust-only`, and `Python->Rust` paths separately so the FFI boundary is visible.

### 8.2 FFI Batching Policy

- Batch historical feature generation and Monte Carlo inputs.
- Keep live feature paths as stateful Rust streaming calculators instead of per-indicator Python calls.
- Avoid converting large object graphs across PyO3; prefer arrays, compact structs, or contiguous buffers.

### 8.3 Cross-Runtime Debugging Standard

- Preserve `correlation_id` and add OpenTelemetry-compatible trace/span propagation at service boundaries.
- Require every signal, order, risk decision, fill, and portfolio update to be traceable through Python, transport, Rust, and observability.
- Add incident replay fixtures for common failure paths.

### 8.4 Authoritative State and Reconciliation

- Define one authoritative owner for portfolio, positions, orders, fills, exposure, and PnL in each runtime mode.
- Use Rust risk/execution state as the preferred live/paper source of truth.
- Treat checkpoint drift above tolerance as a release blocker.

### 8.5 DuckDB Ingestion Pattern

- Keep DuckDB as analytics-first storage, not a multi-process OLTP writer.
- Route writes through one controlled writer path with batching and backpressure.
- Use Parquet export for cold or high-volume tick data.
- Evaluate Postgres, a streaming log, or another time-series/write store only when measured write pressure exceeds DuckDB limits.

### 8.6 Provider Abstraction

- Keep Alpaca as the active provider, but isolate broker behavior behind an adapter boundary.
- Add local rate limiting, order caching, retry policy, and WebSocket-first fill/account updates.
- Track FIX, DMA, and alternate broker/venue adapters as future/non-active research until provider latency becomes the dominant bottleneck.

### 8.7 Transport Decision Rule

- Keep ZMQ for current low-latency brokerless messaging while envelope validation remains stable.
- Evaluate gRPC/Protobuf when schema enforcement, generated clients, and operational tooling matter more than lowest possible latency.
- Evaluate Aeron only for proven microsecond-level transport requirements that ZMQ/gRPC cannot meet under realistic load.

### 8.8 Go Adoption Gate

- Do not put Go in the trading hot path.
- Use Go only for observability/API/WebSocket fanout or other control-plane workloads with measured bottlenecks.
- Require an owner, CI path, runbook, allocation profile, and rollback path before approving any Go service.

## 9) Continuous Backlog Themes

1. Runtime resilience hardening and failure-recovery rehearsal.
2. Cross-runtime contract validation automation.
3. Observability quality and toil reduction.
4. Performance envelope optimization for higher production load.
5. Provider abstraction research for future/non-active non-Alpaca adapters.
6. Transport evaluation for ZMQ, gRPC/Protobuf, and Aeron under realistic load.

## 10) Notes

- This file is the canonical non-weekly summary roadmap.
- Public runtime envelope contract remains unchanged.
