# Documentation Index

Status: Operational Static Canon  
Updated: 2026-05-05

This index is the active navigation layer for production operation and maintenance.
Weekly execution packs and gate-by-week artifacts are not part of active documentation anymore.

## 1) Core Entry Points

- `README.md`
- `README_VI.md`
- `docs/DOCS_CANONICAL_MAP.md`
- `docs/index.md`
- `PLAYBOOK.md`

## 2) Operations & Runtime

- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/DISASTER_RECOVERY.md`
- `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- `docs/setup/DEVELOPMENT.md`

## 3) Architecture & Interfaces

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/architecture/python-rust-separation.md`
- `docs/architecture/component-interfaces.md`
- `docs/architecture/RUST_MODULE_STRUCTURE.md`

## 4) API & Integration

- `docs/API_DOCUMENTATION.md`
- `docs/api/ALPACA_API.md`
- `docs/api/ZMQ_PROTOCOL.md`
- `docs/INTEGRATION_GUIDE.md`

## 5) Observability & Storage

- `docs/observability/BACKEND_API.md`
- `docs/STORAGE_GUIDE.md`
- `docs/DATA_MANAGEMENT.md`

## 6) Testing & Quality

- `docs/TEST_EXECUTION_GUIDE.md`
- `tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md`

## 7) Scripts & Tooling

- `scripts/README.md`

## 8) Roadmap Consolidation

The 24-week lifecycle artifacts have been replaced by one static summary:

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md`

## 9) Technology Posture (Active)

- Broker/API provider: **Alpaca-only**
- Analytics/observability posture: **DuckDB-first**
- Non-active alternatives must be explicitly labeled `future/non-active`.

## 10) Path Convention

Use either:

- repo-relative paths (e.g. `docs/operations/OPERATIONS_RUNBOOK.md`), or
- `[REPO_ROOT]/...` in environment-agnostic instructions.
