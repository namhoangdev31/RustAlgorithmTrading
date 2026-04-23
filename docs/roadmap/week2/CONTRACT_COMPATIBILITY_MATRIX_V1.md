# Contract Compatibility Matrix v1 (W02)

## Scope
Ma trận owner + compatibility boundary cho audit Python <-> Rust trên critical path signal -> risk -> execution + observability.

## Boundary inventory

| Boundary ID | Contract surface | Python owner file | Rust owner file | Primary tests | Status |
|---|---|---|---|---|---|
| `W2-BND-001` | Messaging Envelope | `src/bridge/zmq_bridge.py` | `rust/common/src/messaging.rs` | `tests/integration/test_backtest_signal_flow.py` | `VERIFIED` |
| `W2-BND-002` | Signal Payload | `src/bridge/zmq_bridge.py` | `rust/common/src/types.rs` | `cd rust && cargo test -p common` | `MISMATCH` |
| `W2-BND-003` | Risk Decision | `src/strategies/strategy_router.py` | `rust/common/src/messaging.rs` | `cd rust && cargo test -p risk-manager` | `MISMATCH` |
| `W2-BND-004` | Execution Ack | `src/backtesting/execution_handler.py` | `rust/execution-engine/src/router.rs` | `cd rust && cargo test -p execution-engine` | `MISMATCH` |
| `W2-BND-005` | Logging Envelope | `src/observability/logging/structured_logger.py` | `rust/common/src/messaging.rs` | `tests/integration/test_observability_integration.py` | `VERIFIED` |
| `W2-BND-006` | Runtime Policy | `scripts/setup_python_deps.sh` | `rust/Cargo.toml` | `bash scripts/audit_rerun.sh` | `VERIFIED` |

## Contract fields coverage matrix

| Contract type | Mismatch Details | Severity | Mitigation Plan |
|---|---|---|---|
| `Signal` | `direction` vs `action`, `strength` vs `confidence`, `timestamp` mismatch | P0 | unify naming in v1 delta spec |
| `RiskDecision` | thiếu `reason_code`/`limit_snapshot` | P0 | update Rust struct and mapping |
| `ExecutionAck` | shape Python vs Rust chưa đồng bộ | P1 | map fields to canonical ack schema |
| `Observability` | legacy ID alias còn xuất hiện ở một số path | P1 | khóa canonical `correlation_id` trên public/logging contract |

## Compatibility policy checkpoints
- Runtime: policy chuẩn cho local/dev/CI.
- Schema: W02 audit + spec delta, W03 triển khai.
- Documentation: mọi mismatch docs map thành issue + backlog hygiene.

---
Last updated: W02 no-date mode sync
