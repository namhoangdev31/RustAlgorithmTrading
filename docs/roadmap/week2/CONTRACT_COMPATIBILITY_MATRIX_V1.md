# Contract Compatibility Matrix v1 (Week 2)

## Scope
Ma trận owner và compatibility boundary cho audit Python <-> Rust, tập trung critical path signal -> risk -> execution + observability.

## Boundary inventory

| Boundary ID | Contract surface | Python owner file | Rust owner file | Primary tests | Status |
|---|---|---|---|---|---|
| `W2-BND-001` | ZMQ envelope + message framing | `src/bridge/zmq_bridge.py` | `rust/common/src/messaging.rs` | `tests/integration/test_backtest_signal_flow.py`, `cd rust && cargo test -p common` | `IN_AUDIT` |
| `W2-BND-002` | Signal payload handoff | `src/bridge/rust_bridge.py` | `rust/signal-bridge/src/bridge.rs` | `tests/integration/test_backtest_signal_flow.py`, `cd rust && cargo test -p signal-bridge` | `IN_AUDIT` |
| `W2-BND-003` | Risk decision semantics | `src/strategies/strategy_router.py` | `rust/risk-manager/src/limits.rs` | `tests/unit/test_strategy_signals.py`, `cd rust && cargo test -p risk-manager` | `IN_AUDIT` |
| `W2-BND-004` | Execution acknowledgement fields | `src/backtesting/execution_handler.py` | `rust/execution-engine/src/router.rs` | `tests/test_backtest_integration.py`, `cd rust && cargo test -p execution-engine` | `IN_AUDIT` |
| `W2-BND-005` | Observability event envelope | `src/observability/logging/structured_logger.py` | `rust/common/src/messaging.rs` | `tests/observability -q`, `tests/integration/test_observability_integration.py` | `IN_AUDIT` |
| `W2-BND-006` | Runtime compatibility policy | `scripts/setup_python_deps.sh` | `rust/Cargo.toml` | `python -m pytest ...`, `cd rust && cargo check --workspace` | `IN_AUDIT` |

## Contract fields coverage matrix

| Contract type | Required fields | Current policy target | Audit owner |
|---|---|---|---|
| `schema_version` envelope | `schema_version`, `trace_id`, `event_type`, `timestamp`, `payload` | strict required in `v1`, documented fallback for `v0` | planner + coder |
| `RiskDecision` | `decision`, `reason_code`, `limit_snapshot` | reject nếu thiếu `reason_code` hoặc `limit_snapshot` | coder + reviewer |
| `ExecutionAck` | `order_id`, `route`, `latency_bucket`, `retry_count` | ack phải có full telemetry fields | reviewer + coder |
| `ObservabilityEvent` | `trace_id`, `component`, `severity`, `timestamp`, `payload` | thống nhất mapping severity cross-service | ops + reviewer |

## Compatibility policy checkpoints
- Runtime: dùng policy chuẩn cho PyO3/Python trong local/dev/CI.
- Schema: tuần 2 audit + spec delta, tuần 3 mới triển khai migration versioning.
- Documentation: mọi mismatch docs được map issue và đưa vào backlog hygiene.

---
Last updated: 2026-04-23
