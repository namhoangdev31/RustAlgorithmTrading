# Issue Register v1 - Week 1 (No-Date Mode)

## Board schema
- Columns: `New -> Triage -> In Progress -> Blocked -> Done`
- Required metadata: `issue_id`, `severity`, `owner`, `eta`, `exit_criteria`, `dependency`

## Active issues

| Issue ID | Severity | Owner | ETA | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|---|
| `W1-ISS-001` | P0 | tester | `W01-D2` | Done | Python deps | `pytest` collection chạy cho unit core |
| `W1-ISS-006` | P0 | tester | `W01-D2` | Done | PyO3/Python compat | ABI3 flag implemented in scripts |
| `W1-ISS-008` | P0 | coder | `W01-D4` | Done | DuckDB/database tests | schema and test logic fixed |
| `W1-ISS-009` | P0 | ops | `W01-D3` | Done | service startup | all 4 core services RUNNING |
| `W1-ISS-011` | P1 | coder | `W02-D2` | Triage | Python tests | 3/5 integration tests failing |
| `W1-ISS-012` | P1 | ops | `W02-D1` | Done | Env Drift | Missing pandas/dotenv/pytz |
| `W1-ISS-013` | P0 | coder | `W02-D1` | New | Observability | 0% correlation_id coverage in logs |

## Canonical drift evidence (for W1-ISS-002)
- `docs/QUICK_START_FIXED.md`
- `docs/OBSERVABILITY_DUCKDB.md`
- `docs/migration/DUCKDB_MIGRATION.md`
- `docs/testing/TESTING_GUIDE.md`
- `docs/testing/TEST_EXECUTION_SUMMARY.md`
- `docs/TEST_RECOMMENDATIONS.md`

## Severity policy
- P0: chặn baseline hoặc chặn quyết định W02.
- P1: rủi ro cao, có workaround ngắn hạn.
- P2: consistency/hygiene, không chặn gate W01.

---
Last updated: W01 no-date mode sync
