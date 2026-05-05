# Documentation Canonical Map

Updated: 2026-05-05  
Owner: Project maintainers  
Mode: **Operational Static Canon**

This file is the source-of-truth map for what to read first and what counts as active operational documentation.

## 1) Canonical Read Order (Mandatory)

1. `README.md`
2. `README_VI.md`
3. `docs/DOCUMENTATION_INDEX.md`
4. `docs/index.md`
5. `PLAYBOOK.md`

## 2) Canonical Domain Sets

### A. Runtime Architecture

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/architecture/python-rust-separation.md`
- `docs/architecture/component-interfaces.md`
- `docs/architecture/RUST_MODULE_STRUCTURE.md`

### B. Operations & Recovery

- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/DISASTER_RECOVERY.md`
- `docs/deployment/PRODUCTION_DEPLOYMENT.md`

### C. API & Contracts

- `docs/API_DOCUMENTATION.md`
- `docs/api/ALPACA_API.md`
- `docs/api/ZMQ_PROTOCOL.md`

### D. Observability & Storage

- `docs/observability/BACKEND_API.md`
- `docs/STORAGE_GUIDE.md`

### E. Testing

- `docs/TEST_EXECUTION_GUIDE.md`
- `tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md`

## 3) Roadmap Consolidation

Weekly artifacts have been consolidated into one static summary:

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md`

No weekly lifecycle file is part of the active operational truth.

## 4) Active Technology Posture

- Provider: **Alpaca-only** (active)
- Observability/Persistence posture: **DuckDB-first** (active)
- Any non-active alternative must be labeled `future/non-active`.

## 5) Path Policy

Use repo-relative paths or `[REPO_ROOT]/...`; avoid user-specific absolute paths.

## 6) Conflict Resolution

1. Runtime behavior in code/config overrides stale narrative docs.
2. Canonical files listed above override non-canonical text.
3. If a canonical file becomes stale, update it directly rather than adding parallel summaries.
