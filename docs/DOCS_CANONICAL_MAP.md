# Documentation Canonical Map

Updated: 2026-05-05  
Owner: Project maintainers  
Mode: **Operational Static Canon (AGENTS-aligned)**

This map defines what is authoritative for day-to-day maintenance and incident response.

## 1) Mandatory Reading Order (from `AGENTS.md`)

For non-trivial work, read in this exact order:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md`
3. `PLAYBOOK.md`
4. Domain docs by scope:
   - `docs/`
   - `rust/docs/`
   - `tests/docs/`
   - `medium/` (strategy rationale only)

## 2) Canonical Operational Set

### A. Project Entry

- `README.md`
- `README_VI.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/index.md`
- `PLAYBOOK.md`

### B. Runtime & Operations

- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/DISASTER_RECOVERY.md`
- `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- `docs/setup/DEVELOPMENT.md`

### C. Architecture & Interfaces

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/architecture/python-rust-separation.md`
- `docs/architecture/component-interfaces.md`
- `docs/architecture/RUST_MODULE_STRUCTURE.md`

### D. API / Contract Surface

- `docs/API_DOCUMENTATION.md`
- `docs/api/ALPACA_API.md`
- `docs/api/ZMQ_PROTOCOL.md`

### E. Observability & Data Plane

- `docs/observability/BACKEND_API.md`
- `docs/STORAGE_GUIDE.md`
- `docs/DATA_MANAGEMENT.md`

### F. Testing

- `docs/TEST_EXECUTION_GUIDE.md`
- `tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md`

## 3) Roadmap Lifecycle Consolidation

Weekly lifecycle artifacts are retired from active operations and consolidated to:

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md`
- `docs/roadmap/PHASE1_GO_NO_GO_EVIDENCE.md`
- `docs/roadmap/PHASE2_GO_NO_GO_EVIDENCE.md`
- `docs/roadmap/PHASE3_GO_NO_GO_EVIDENCE.md`

## 4) Active Technology Posture

- Broker/API provider: **Alpaca-only (active)**
- Observability/persistence posture: **DuckDB-first (active)**
- Any alternative stack must be labeled `future/non-active`.

## 5) Canon vs Non-Canon Rule

- Files in section 2 are authoritative for operations.
- Other docs can remain as contextual/reference material but are non-canonical unless promoted here.
- When canonical docs and non-canonical docs conflict, follow canonical docs and runtime code.

## 6) Path & Reference Policy

- Use repo-relative paths or `[REPO_ROOT]/...`.
- Do not use user-specific absolute paths in active docs.
- Keep links valid inside the repository tree.

## 7) Maintenance Protocol

When changing runtime behavior or ownership:

1. Update `PLAYBOOK.md` first (doc -> code -> test routing).
2. Update impacted canonical docs in section 2.
3. Run quick link sanity for updated docs before merge.
