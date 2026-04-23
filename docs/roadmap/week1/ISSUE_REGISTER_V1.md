# Issue Register v1 - Week 1

## Board schema
- Columns: `New -> Triage -> In Progress -> Blocked -> Done`
- Required metadata: `issue_id`, `severity`, `owner`, `due`, `exit_criteria`, `dependency`

## Active issues

| Issue ID | Severity | Owner | Due | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|---|
| `W1-ISS-001` | P0 | tester | 2026-04-21 | In Progress | Python deps | `pytest` collection chạy cho unit core |
| `W1-ISS-002` | P0 | planner | 2026-04-23 | New | Canonical map audit | mapping doc canonical path tồn tại + action fix tuần 2 |
| `W1-ISS-003` | P1 | coder | 2026-04-24 | New | rust/market-data TODO | technical note + ETA tuần 2/3 |
| `W1-ISS-004` | P1 | ops | 2026-04-24 | New | runbook update | đề xuất command/procedure circuit breaker |
| `W1-ISS-005` | P2 | planner | 2026-04-26 | New | docs hygiene batch | backlog tuần 2 đã tạo |
| `W1-ISS-006` | P0 | tester | 2026-04-21 | In Progress | PyO3/Python compat | xác định env chuẩn (ABI3 flag hoặc python version pin) |
| `W1-ISS-007` | P2 | coder | 2026-04-26 | New | Rust warnings | warning cleanup backlog với impact assessment |
| `W1-ISS-008` | P0 | coder | 2026-04-23 | Blocked | DuckDB/database tests | xác định root-cause + tách nhóm fail deterministic |
| `W1-ISS-009` | P0 | ops | 2026-04-22 | In Progress | service startup | có ít nhất 1 health run toàn service ở trạng thái up |

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
Last updated: 2026-04-14
