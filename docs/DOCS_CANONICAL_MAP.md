# Documentation Canonical Map

## 1) Mandatory Reading Order

For non-trivial work, read in this exact order:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md`
3. `PLAYBOOK.md`

## 2) Canonical Operational Set

### A. Project Entry

- `README.md` | `README_VI.md` | `PLAYBOOK.md`

### B. Runtime & Operations

- `docs/deployment/PRODUCTION_DEPLOYMENT.md` (Live trading guide)
- `docs/operations/OPERATIONS_GUIDE.md` (Daily ops & DR)
- `docs/setup/DEVELOPMENT.md` (Local setup)

### C. Architecture & Interfaces

- `docs/architecture/SYSTEM_ARCHITECTURE.md` (Tri-Runtime Design)
- `docs/architecture/python-rust-separation.md` (Domain boundaries)
- `docs/api/ZMQ_PROTOCOL.md` (Messaging contract)

### D. Observability & Data Plane

- `docs/observability/OBSERVABILITY_OVERVIEW.md` (Port 8081 guide)
- `docs/observability/METRICS_CATALOG.md` (Metric definitions)
- `docs/observability/STORAGE_OPERATIONS.md` (DuckDB/PostgreSQL maintenance)
- `docs/observability/LOGGING_STANDARDS.md` (Logging format)

### E. Security & Optimization

- `docs/security/SECURITY_STANDARDS.md` (No-Panic & API safety)
- `docs/optimization/PERFORMANCE_GUIDE.md` (Rust & System tuning)

### F. Testing

- `docs/TEST_EXECUTION_GUIDE.md`
- `tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md`

### G. Machine Learning & Strategies

- `docs/guides/strategy-development.md`
- `docs/ml/ML_STRATEGY_GUIDE.md`

## 3) Project Status & Roadmap

- `docs/roadmap/COMPLETION_REPORT.md` (Final Status: Phase 3.5 Complete)

## 4) Active Technology Posture

- Broker: **Alpaca-only (active)**
- Metrics: **DuckDB-first (active)**
- Transactions: **PostgreSQL (active)**

---
**Status**: Authoritative Static Canon
