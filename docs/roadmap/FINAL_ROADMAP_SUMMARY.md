# FINAL_ROADMAP_SUMMARY.md

Updated: 2026-05-07  
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

- Keep Python focused on research, strategy development, model work, and offline backtest orchestration.
- Move live trading, risk, execution, and latency-sensitive runtime kernels to Rust.
- Replace the Python FastAPI observability/control API with Go so production service surfaces can evolve as microservices.
- Keep Go out of trading decision and execution hot paths.

Program success criteria:

- Reduce Python runtime pressure on hot paths.
- Preserve deterministic behavior and risk controls.
- Keep public envelope stable (`schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`).
- Maintain or improve reliability under targeted test and soak conditions.
- Improve latency where the bottleneck is inside the system, while recognizing that broker/API latency remains outside direct control.
- Sunset Python production API serving after Go parity is proven.

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
- Do not allow Go control-plane code to approve, reject, size, route, or execute trades.

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
- Existing FFI bridge available and hardened:
  - `src/bridge/rust_bridge.py`
  - `src/typings/signal_bridge.pyi` (IDE stubs)
  - `signal-bridge` Rust library (installed via maturin)
- Current Python observability/API surface targeted for Go replacement:
  - `src/observability/api/*`
  - `src/observability/metrics/*`
  - `src/observability/storage/*`

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
   - Go becomes the production control-plane and observability API layer, replacing FastAPI after parity is proven.

3. Stronger ML experimentation model:
   - Python can continue using the ML ecosystem for model research, validation, and signal design.
   - Rust can contain production execution surfaces so experimental strategy logic does not bypass risk, allocation, and envelope validation.

4. Better platform scalability:
   - Separating data ingest, signal generation, risk, execution, and observability into explicit services improves testability and deployment isolation.
   - Multi-tenant or multi-portfolio operation becomes possible only after state ownership, tenant isolation, and audit boundaries are made explicit.

## 6) Three-Phase Migration Roadmap (Python Research, Rust Trading, Go Control Plane)

### 6.1 Phase 1: Immediate Offload and Contract Hardening ✅ (Hardened)

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

Current implementation baseline:

- Rust backtest runtime is implemented in `rust/signal-bridge/src/backtest_runtime.rs` and exposed via PyO3 `BacktestRuntime`.
- Python adapter path is implemented in `src/bridge/backtest_bridge.py`.
- `BacktestEngine` is Rust-only for production backtests; Python fallback is removed and failures fail closed.
- Production strategies must provide `generate_signal_frame(data_by_symbol, context)` for the Rust full-run batch API.
- Risk integrity compares Rust traces against frozen golden artifacts instead of regenerating a Python backend baseline.
- Strict reconciliation gates are enforced in rust mode (`PnL <= 0.10%`, exposure `<= 5 bps`).
- Canonical Phase 2 Python gate file exists at `tests/test_backtest_integration.py`.
- Canonical Phase 2 evidence artifact is tracked in `docs/roadmap/PHASE2_GO_NO_GO_EVIDENCE.md`.

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

### 6.3 Phase 3: Go Control Plane and FastAPI Replacement

Primary objective:

- Replace the Python FastAPI observability/control surface with Go while keeping Python out of production API serving.

Adoption policy:

- Go is approved for observability, WebSocket fanout, health/readiness, admin/control APIs, auth/rate-limit, and service orchestration.
- Go must remain control-plane only and must not participate in strategy decisions, risk decisions, order sizing, order routing, or execution.

Primary migration targets:

1. Port `src/observability/api/*` to a Go service with response-schema parity.
2. Move WebSocket dashboard fanout from Python to Go.
3. Move health/readiness aggregation and service status endpoints to Go.
4. Move API auth, rate limiting, tenant boundaries, and admin controls to Go.
5. Keep Python observability code only as a temporary compatibility path until Go parity is signed off.

Candidate Go services:

- Observability API replacement for the current FastAPI app.
- WebSocket fanout gateway for dashboard clients.
- Lightweight metrics ingestion/aggregation worker.
- Runtime health and service registry facade.
- Non-critical operational control endpoints that cannot submit or approve trades.
- Multi-tenant API gateway only after authentication, tenant isolation, audit logging, and rate limiting are explicitly modeled.

Keep out of Go:

- Strategy research and model experimentation.
- Offline backtest orchestration.
- Live signal, risk, execution, and broker order lifecycle.
- Any state mutation that changes portfolio exposure.

Validation gate (minimum):

- `python -m pytest tests/observability -q`
- `python -m pytest tests/integration/test_observability_integration.py -q`
- Go unit and integration tests for API response parity, WebSocket fanout, auth/rate-limit, health/readiness, and metrics ingestion.
- Soak tests with p95/p99 latency and error-budget comparison against baseline.

Quality and exit criteria:

- End-to-end stability is maintained or improved.
- Go API response schemas match the current FastAPI public behavior until clients are migrated.
- Operational toil does not increase after FastAPI is retired.
- Observability path meets target latency and reliability envelopes.
- Go service boundaries improve measurable throughput, fanout capacity, or operational isolation.
- Python production API serving is disabled only after Go parity, soak tests, and rollback checks pass.

Rollback strategy:

- Keep FastAPI behind an internal compatibility flag until Go has passed parity and soak gates.
- Preserve deployment topology that can route dashboard/API traffic back to FastAPI during migration.

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

- Adding Go on top of Python and Rust increases CI, deployment, debugging, hiring, and on-call complexity.

Impact:

- Platform complexity can grow faster than performance benefit.

Mitigation:

- Keep Go scoped to control-plane and observability service boundaries.
- Require an explicit owner, CI path, runbook, and rollback route for every Go service.
- Keep Rust/Python as the only trading-decision path.

### 7.7 FastAPI to Go API Parity

Risk:

- Replacing FastAPI with Go can break dashboard clients, monitoring scripts, CORS behavior, response schemas, WebSocket message format, or error codes.

Impact:

- Observability may appear healthy internally while clients, dashboards, or operational scripts fail.

Mitigation:

- Create API parity tests against the current FastAPI behavior before porting.
- Version public endpoints and WebSocket message schemas.
- Run FastAPI and Go side by side during migration and compare responses on mirrored traffic.
- Keep a traffic rollback switch until Go passes soak and parity checks.

### 7.8 Control-Plane Authority Creep

Risk:

- A Go admin/control service may gradually gain the ability to mutate trading state, creating a second path for risk or execution decisions.

Impact:

- Safety controls can fragment and audits become harder because trade-affecting changes no longer flow only through Rust risk/execution.

Mitigation:

- Enforce read-mostly control-plane semantics by default.
- Route all trade-affecting commands through Rust risk/execution APIs with explicit audit records.
- Add contract tests proving Go cannot bypass Rust risk approval.

### 7.9 Go Runtime and Tail Latency

Risk:

- Go is operationally strong for APIs, but allocation-heavy services can still suffer tail-latency spikes from GC, lock contention, or large fanout bursts.

Impact:

- Dashboard/WebSocket p99 latency can degrade under load even if the trading core remains healthy.

Mitigation:

- Keep Go out of trading hot path.
- Profile allocation rate, heap size, goroutine count, lock contention, and WebSocket backpressure under soak tests.
- Tune `GOGC`/`GOMEMLIMIT` only after profiling, not by guesswork.

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

### 8.8 Go Control-Plane Implementation Gate

- Replace FastAPI with Go through side-by-side parity, not a single cutover.
- Do not put Go in the trading hot path.
- Allow Go to own observability API, WebSocket fanout, auth/rate-limit, health/readiness, service status, and admin/control endpoints.
- Require response-schema parity, WebSocket protocol parity, CORS/auth parity, OpenTelemetry propagation, owner, CI path, runbook, allocation profile, and rollback path before retiring FastAPI.
- Keep Python production API serving disabled after migration; Python remains for research, strategy, model, and offline backtest orchestration.

### 8.9 Final Target Role Split

- Python: research, strategy design, model training, model validation, offline backtest orchestration, reports, and experimental analytics.
- Rust: market data, signal runtime, risk manager, execution engine, live order lifecycle, authoritative live/paper trading state, and latency-sensitive kernels.
- Go: observability API, WebSocket fanout, control-plane APIs, health/readiness aggregation, auth/rate-limit, multi-tenant gateway, metrics ingestion facade, and service orchestration.
- Shared contracts: schema/versioned messages, trace context, audit records, state snapshots, and replay fixtures.

## 9) Change Impact Index

This index defines which files must be updated when the roadmap is implemented. It is intentionally explicit so implementation work does not drift across Python, Rust, Go, docs, and tests.

### 9.1 Documentation Updates

- `PLAYBOOK.md`
  - Update ownership tables so Go owns production observability/control-plane API surfaces.
  - Keep Python ownership for research, strategy, and offline backtest orchestration.
  - Add Go test routing for observability API parity, WebSocket fanout, auth/rate-limit, health/readiness, and metrics ingestion.

- `docs/DOCS_CANONICAL_MAP.md`
  - Promote any new Go control-plane docs into the canonical operational set.
  - Keep `docs/observability/BACKEND_API.md`, `docs/api/ZMQ_PROTOCOL.md`, and architecture docs as impacted canonical surfaces.

- `docs/DOCUMENTATION_INDEX.md` and `docs/index.md`
  - Add links to Go control-plane documentation once the Go service exists.
  - Mark Python FastAPI observability docs as compatibility/deprecation material after Go parity is accepted.

- `docs/observability/BACKEND_API.md`
  - Replace FastAPI-centric runtime descriptions with Go service behavior.
  - Preserve current endpoint contracts until client migration is complete.
  - Add WebSocket message schemas, error codes, CORS/auth behavior, and rollback routing notes.

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
  - Update component diagrams so Go owns observability API, WebSocket fanout, auth/rate-limit, health/readiness, and control-plane services.
  - Keep Rust as live trading core and Python as research/offline orchestration.

- `docs/architecture/python-rust-separation.md`
  - Rename posture from Python/Rust only to Python/Rust/Go role split.
  - Clarify that Python no longer serves production API traffic after Go parity.

- `docs/architecture/component-interfaces.md`
  - Add Go-facing control-plane interfaces.
  - Define read-only versus trade-affecting commands.
  - Require trade-affecting commands to route through Rust risk/execution.

- `docs/api/ZMQ_PROTOCOL.md`
  - Document whether Go consumes ZMQ directly or receives data through a schema-first gateway.
  - Add trace propagation requirements for `correlation_id`, `trace_id`, and `span_id`.

- `docs/API_DOCUMENTATION.md`
  - Add Go observability/control-plane endpoints once implemented.
  - Mark FastAPI endpoints as deprecated only after parity and soak gates pass.

- `docs/operations/OPERATIONS_RUNBOOK.md`
  - Add Go service startup, shutdown, health checks, rollback, dashboards, alert handling, and log locations.
  - Add incident triage paths for Python -> Rust -> Go observability flows.

- `docs/deployment/PRODUCTION_DEPLOYMENT.md`
  - Add Go build/deploy artifacts, environment variables, ports, service dependencies, and rollback routing.
  - Document FastAPI compatibility mode while both services run side by side.

- `docs/TEST_EXECUTION_GUIDE.md` and `tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md`
  - Add Go test commands and parity test expectations.
  - Add required mixed validation for Rust trading core plus Go control-plane.

- `rust/README.md`
  - Clarify Rust remains authoritative for live/paper trading state.
  - Document any new Rust APIs exposed to Go for health, snapshots, risk status, or execution state.

### 9.2 Rust Updates

- `rust/common/src/messaging.rs`
  - Keep the public envelope stable.
  - Add shared message/schema types needed by Go consumers if Go reads runtime events.
  - Add trace context fields only in a backward-compatible way.

- `rust/common/src/http.rs`
  - Expose stable health/status/snapshot helpers for Go control-plane polling if HTTP is used.
  - Keep trading mutations out of generic HTTP helpers unless routed through explicit risk/execution APIs.

- `rust/common/src/health.rs`
  - Standardize health/readiness payloads consumed by Go.
  - Include service name, status, build version, dependency status, and last event time.

- `rust/common/src/metrics.rs`
  - Align metric names/labels with the Go ingestion/fanout service.
  - Preserve current Prometheus compatibility where present.

- `rust/risk-manager/src/{limits.rs,pnl.rs,circuit_breaker.rs,main.rs}`
  - Ensure risk decisions, PnL, circuit breaker status, and limit breaches can be exported as read-only snapshots.
  - Add audit events for any command received from Go.

- `rust/execution-engine/src/{router.rs,retry.rs,slippage.rs,stop_loss_executor.rs,main.rs}`
  - Export order lifecycle, retry state, slippage summary, and fill status for Go observability.
  - Ensure Go cannot route around risk approval.

- `rust/market-data/src/{websocket.rs,publisher.rs,aggregation.rs,main.rs}`
  - Keep market data publishing compatible with Go observability consumers.
  - Add backpressure/heartbeat metrics needed by Go dashboards.

- `rust/signal-bridge/src/{bridge.rs,features.rs,indicators.rs,main.rs}`
  - Preserve PyO3 research/backtest compatibility.
  - Add batch/streaming feature metrics so Go can observe feature latency without owning signal decisions.

- `rust/database/src/*`
  - If Go reads DuckDB through Rust service APIs, expose read-only repositories/snapshots.
  - If Go writes observability metrics directly, document and test single-writer constraints.

### 9.3 Go Updates

- `go.mod` and Go service directory (new)
  - Add only when implementation begins.
  - Recommended ownership: `services/go/observability-api` or `go/observability-api`, not repository root.
  - If this creates new files, update `PLAYBOOK.md` in the same change.

- Go observability API service (new)
  - Implement REST endpoint parity for current FastAPI routes.
  - Implement WebSocket fanout parity for current dashboard clients.
  - Implement auth/rate-limit/CORS behavior explicitly.
  - Implement health/readiness and dependency checks for Rust/Python services.
  - Implement OpenTelemetry-compatible propagation and structured logs.

- Go metrics ingestion/fanout service (optional within Phase 3)
  - Batch writes and enforce backpressure before touching DuckDB.
  - Prefer one controlled writer path.
  - Keep trading decisions read-only from Go.

### 9.4 Python Updates

- `src/observability/api/*`
  - Keep as compatibility implementation during side-by-side migration.
  - Freeze public behavior for parity tests.
  - Deprecate after Go parity and soak gates pass.

- `src/observability/metrics/*`
  - Keep collectors until Go or Rust equivalents are ready.
  - Ensure emitted metric names/labels match Go ingestion expectations.

- `src/observability/storage/*`
  - Preserve DuckDB/SQLite behavior during transition.
  - Avoid adding new production API behavior here once Go owns the surface.

- `src/bridge/zmq_bridge.py`
  - Keep envelope compatibility for Python research/backtest flows.
  - Align trace propagation with Rust and Go consumers.

- `src/data/*`, `src/strategies/*`, `src/backtesting/*`, `src/research/*`
  - Keep as Python-owned research/offline domains.
  - Remove production API dependencies over time.

### 9.5 Test Updates

- `tests/observability/test_api.py`
  - Convert into parity reference tests for existing FastAPI behavior.
  - Add equivalent Go API parity checks when Go service exists.

- `tests/observability/test_log_streams.py`
  - Add WebSocket protocol parity cases for Go fanout.
  - Verify message format, heartbeat behavior, disconnect/reconnect behavior, and backpressure behavior.

- `tests/observability/test_startup.py`
  - Add Go health/readiness expectations.
  - Verify dependency failure reporting for Rust service downtime.

- `tests/observability/test_performance.py`
  - Add p95/p99 latency and fanout load checks for Go API/WebSocket paths.
  - Compare against current FastAPI baseline during migration.

- `tests/observability/test_duckdb_client.py` and `tests/observability/test_databases.py`
  - Add ingestion contention tests if Go writes metrics directly.
  - Verify single-writer/batch behavior.

- `tests/integration/test_observability_integration.py`
  - Add side-by-side FastAPI vs Go response comparison during migration.
  - Switch to Go-only assertions after FastAPI retirement.

- `tests/integration/test_risk_execution_observability.rs`
  - Verify Rust risk/execution emits read-only state snapshots consumed by Go.
  - Verify trade-affecting commands cannot bypass Rust risk approval.

- `tests/integration/test_end_to_end.rs`
  - Add end-to-end trace propagation checks across Rust trading core and Go observability.

- `tests/e2e/test_full_system.py`
  - Update startup expectations to include Go control-plane service.
  - Keep Python research/backtest service expectations separate from production API expectations.

- `tests/unit/test_common_types.rs` and `tests/unit/test_types.rs`
  - Add contract coverage for any backward-compatible envelope/schema additions.

- New Go tests
  - Add unit tests for handlers, auth/rate-limit, health/readiness, CORS, WebSocket hub, metrics ingestion, and trace propagation.
  - Add integration tests for Rust snapshot reads and FastAPI parity during migration.

### 9.6 Required Validation Matrix

- Phase 1 minimum:
  - `python -m pytest tests/unit/python/test_features.py -q`
  - `python -m pytest tests/integration/test_backtest_signal_flow.py -q`
  - `cd rust && cargo test -p signal-bridge -p common`

- Phase 2 minimum:
  - `python -m pytest tests/unit/python/test_backtest_engine.py -q`
  - `python -m pytest tests/test_backtest_integration.py -q`
  - `cd rust && cargo test -p risk-manager -p execution-engine -p signal-bridge`

- Phase 3 minimum:
  - `python -m pytest tests/observability -q`
  - `python -m pytest tests/integration/test_observability_integration.py -q`
  - Go unit/integration tests for observability API parity and WebSocket fanout.
  - `cd rust && cargo test -p common -p risk-manager -p execution-engine`
  - End-to-end smoke with Rust trading core, Go control-plane, and Python offline/research paths separated.

## 10) Continuous Backlog Themes

1. Runtime resilience hardening and failure-recovery rehearsal.
2. Cross-runtime contract validation automation.
3. Observability quality and toil reduction.
4. Performance envelope optimization for higher production load.
5. Provider abstraction research for future/non-active non-Alpaca adapters.
6. Transport evaluation for ZMQ, gRPC/Protobuf, and Aeron under realistic load.
7. Go observability API replacement plan for retiring FastAPI.
8. API/WebSocket parity fixtures for Go migration.

## 11) Notes

- This file is the canonical non-weekly summary roadmap.
- Public runtime envelope contract remains unchanged.
