# Contract Compatibility Matrix v1 (Week 2)

## Scope
Ma trận owner và compatibility boundary cho audit Python <-> Rust, tập trung critical path signal -> risk -> execution + observability.

## Boundary inventory

| Boundary ID | Contract surface | Python owner file | Rust owner file | Primary tests | Status |
|---|---|---|---|---|---|
| `W2-BND-001` | Messaging Envelope | `src/bridge/zmq_bridge.py` | `rust/common/src/messaging.rs` | `tests/integration/test_backtest_signal_flow.py` | `VERIFIED` |
| `W2-BND-002` | Signal Payload | `src/bridge/zmq_bridge.py` (Signal) | `rust/common/src/types.rs` (Signal) | `cd rust && cargo test -p common` | `MISMATCH` |
| `W2-BND-003` | Risk Decision | `src/strategies/strategy_router.py` | `rust/common/src/messaging.rs` | `cd rust && cargo test -p risk-manager` | `MISMATCH` |
| `W2-BND-004` | Execution Ack | `src/backtesting/execution_handler.py` | `rust/execution-engine/src/router.rs` | `cd rust && cargo test -p execution-engine` | `MISMATCH` |
| `W2-BND-005` | Logging Envelope | `src/observability/logging/structured_logger.py` | `rust/common/src/messaging.rs` | `tests/integration/test_observability_integration.py` | `MISMATCH` |
| `W2-BND-006` | Runtime Policy | `scripts/setup_python_deps.sh` | `rust/Cargo.toml` | `bash scripts/audit_rerun.sh` | `VERIFIED` |

## Contract fields coverage matrix (Audit Findings)

| Contract type | Mismatch Details | Severity | Mitigation Plan |
|---|---|---|---|
| `Signal` | `direction` vs `action`, `strength` vs `confidence`, `timestamp` (int vs DateTime) | P0 | Unify naming in `v1` interface spec |
| `RiskDecision` | `approved`/`reason` (Rust) vs `decision`/`reason_code`/`limit_snapshot` (Spec) | P0 | Update Rust struct to include snapshots |
| `ExecutionAck` | `FillEvent` (Py) vs `AlpacaOrderResponse` (Rust) mismatch | P1 | Map Alpaca fields to internal FillEvent |
| `Observability` | `correlation_id` (Py) vs `trace_id` (Rust), `timestamp` format mismatch | P1 | Unify logging envelope in `messaging.rs` |

## Compatibility policy checkpoints
- Runtime: dùng policy chuẩn cho PyO3/Python trong local/dev/CI.
- Schema: tuần 2 audit + spec delta, tuần 3 mới triển khai migration versioning.
- Documentation: mọi mismatch docs được map issue và đưa vào backlog hygiene.

---
Last updated: 2026-04-23
