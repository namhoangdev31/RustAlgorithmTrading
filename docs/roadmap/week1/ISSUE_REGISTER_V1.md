# Issue Register v1 - Week 1

## Board schema
- Columns: `New -> Triage -> In Progress -> Blocked -> Done`
- Required metadata: `issue_id`, `severity`, `owner`, `due`, `exit_criteria`, `dependency`

## Active issues

| Issue ID | Severity | Owner | Due | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|---|
| `W1-ISS-001` | P0 | tester | 2026-04-21 | Done | Python deps | `pytest` collection chạy cho unit core |
| `W1-ISS-006` | P0 | tester | 2026-04-21 | Done | PyO3/Python compat | ABI3 flag implemented in scripts |
| `W1-ISS-008` | P0 | coder | 2026-04-23 | Done | DuckDB/database tests | schema and test logic fixed |
| `W1-ISS-009` | P0 | ops | 2026-04-22 | Done | service startup | all 4 core services RUNNING |

## Canonical drift evidence (for W1-ISS-002)
Missing from canonical list (sample high-priority):
- `docs/QUICK_START_FIXED.md`
- `docs/OBSERVABILITY_DUCKDB.md`
- `docs/migration/DUCKDB_MIGRATION.md`
- `docs/testing/TESTING_GUIDE.md`
- `docs/testing/TEST_EXECUTION_SUMMARY.md`
- `docs/TEST_RECOMMENDATIONS.md`

## Severity policy
- P0: chặn baseline hoặc chặn quyết định tuần 2.
- P1: rủi ro cao, có workaround ngắn hạn.
- P2: consistency/hygiene, không chặn gate tuần 1.

---
Last updated: 2026-04-23
