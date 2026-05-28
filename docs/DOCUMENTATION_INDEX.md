# Documentation Index

Status: Operational Static Canon  
Updated: 2026-05-11

This index is organized for production maintenance, not weekly gate execution.

## 1) Start Here

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md`
3. `PLAYBOOK.md`
4. `docs/index.md`

## 2) Runtime Operations

- `docs/operations/OPERATIONS_GUIDE.md`
- `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- `docs/setup/DEVELOPMENT.md`

## 3) Architecture & Contracts

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/architecture/python-rust-separation.md`
- `docs/architecture/component-interfaces.md`
- `docs/architecture/RUST_MODULE_STRUCTURE.md`
- `docs/API_DOCUMENTATION.md`
- `docs/api/ALPACA_API.md`
- `docs/api/ZMQ_PROTOCOL.md`

## 4) Observability & Storage

- `docs/observability/BACKEND_API.md`
- `docs/STORAGE_GUIDE.md`
- `docs/observability/STORAGE_OPERATIONS.md`

## 5) Testing & Quality

- `docs/TEST_EXECUTION_GUIDE.md`
- `docs/testing/strategy/COMPREHENSIVE_TESTING_STRATEGY.md`

## 6) Script Inventory

- `ops/scripts/README.md`

## 7) Roadmap Summary

Weekly operation packs are consolidated in:

- `docs/roadmap/COMPLETION_REPORT.md`

## 8) Documentation Health Notes

- Canonical docs are expected to be link-clean and path-normalized.
- Non-canonical docs may contain historical design context and should not override canonical operational guidance.
- If any doc conflicts with runtime code, use runtime code + `PLAYBOOK.md` ownership map as source of truth.

## 9) Runtime Posture (Active)

- Provider: **Alpaca-only**
- Observability/persistence posture: **DuckDB-first**
- Public event envelope unchanged:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
