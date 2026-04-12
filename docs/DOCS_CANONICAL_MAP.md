# Documentation Canonical Map

Updated: 2026-04-12
Owner: Project maintainers
Purpose: Single source of truth for which docs to read first, which are reference-only, and which are historical/archive.

## 1) Canonical (Read First)

### A. Project Onboarding
- `/Users/hoangnam/Developer/RustAlgorithmTrading/README.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/QUICK_START_FIXED.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/workspace-structure.md`

### B. Runtime Architecture
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/architecture/SYSTEM_ARCHITECTURE.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/architecture/python-rust-separation.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/architecture/ARCHITECTURE_INDEX.md`

### C. Deployment & Operations
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/deployment/PRODUCTION_DEPLOYMENT.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/setup/DEVELOPMENT.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/operations/OPERATIONS_RUNBOOK.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/operations/DISASTER_RECOVERY.md`

### D. Observability & Storage
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/OBSERVABILITY_DUCKDB.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/migration/DUCKDB_MIGRATION.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/observability/BACKEND_API.md`

### E. Testing & Quality
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/testing/TESTING_GUIDE.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/testing/TEST_EXECUTION_SUMMARY.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/TEST_RECOMMENDATIONS.md`

### F. API Surface
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/API_DOCUMENTATION.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/api/ALPACA_API.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/api/ZMQ_PROTOCOL.md`

## 2) Reference (Use When Working In Specific Areas)

### Strategy & Backtesting
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/python-backtesting-guide.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/ENHANCED_MOMENTUM_QUICKSTART.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/strategy_comparison/FINAL_COMPARISON.md`

### Security
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/SECURITY_FIXES.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/security/UNWRAP_REPLACEMENT_REPORT.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/reviews/SECURITY_AUDIT.md`

### Performance
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/PERFORMANCE_ANALYSIS.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/PERFORMANCE_OPTIMIZATIONS.md`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/optimization/optimization-roadmap.md`

## 3) Archive / Historical (Do Not Use As Operational Truth)

Use these for change history, postmortems, and context only:
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/HIVE_*`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/WEEK*`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/fixes/*`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/analysis/*`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/review/*`
- `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/research/*`

## 4) Conflict Resolution Rules

### Rule 1: Newer fix beats older summary
If `FIXED`, `APPLIED`, or `VALIDATION` docs contradict older architecture/reports, prefer the newer fix doc.

### Rule 2: Runtime truth beats aspirational plans
If a doc describes future/target architecture but differs from current running code/config, treat it as roadmap.

### Rule 3: Storage convention
For observability storage, treat DuckDB docs as operational default.
PostgreSQL persistence docs remain architectural roadmap unless explicitly enabled in deployment config.

### Rule 4: Security handling
Any document containing live-looking credentials is invalid as a runbook source; rotate/remove credentials and replace with placeholders.

## 5) Known Documentation Issues (To Fix)

- `docs/README.md` and `docs/index.md` contain broken links to files that do not exist.
- Multiple reports claim “production ready” while parallel review docs still list critical blockers.
- Duplicate summaries across top-level docs create ambiguity (`*_SUMMARY.md`, `*_REPORT.md`, `HIVE_*`).

## 6) Maintenance Policy

- Keep this file as the source map.
- On each major release, update only this file plus any files in section 1.
- New audit/report docs should be placed under archive-oriented folders unless they replace canonical files.
