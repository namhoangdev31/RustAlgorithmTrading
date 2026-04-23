# Issue Register v3 - Week 3

## Board schema
- Columns: `New -> Triage -> In Progress -> Blocked -> Done`
- Required metadata: `issue_id`, `severity`, `owner`, `due`, `exit_criteria`, `dependency`, `mitigation`

## Active issues

| Issue ID | Severity | Owner | Due | Status | Dependency | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|
| `W3-ISS-001` | P0 | coder | Pha 2 | New | v1 envelope enforcement | freeze v1 envelope + strict validation rules | v1 envelope enforce trên boundary critical |
| `W3-ISS-002` | P0 | coder | Pha 3 | New | signal mapping drift | rename/map `direction/strength` -> `action/confidence` | signal contract pass trên Python-Rust handoff |
| `W3-ISS-003` | P0 | coder | Pha 3 | New | risk decision drift | chuẩn hóa `decision/reason_code/limit_snapshot` | risk contract pass + replay context đầy đủ |
| `W3-ISS-004` | P1 | reviewer | Pha 3 | New | execution ack telemetry drift | chuẩn hóa `latency_bucket/retry_count` mapping | execution ack contract pass |
| `W3-ISS-005` | P1 | ops | Pha 3 | New | observability envelope drift | chuẩn hóa `trace_id/component/severity/timestamp` | observability envelope tests pass |
| `W3-ISS-006` | P1 | tester | Pha 2 | New | thiếu negative/version tests | mở rộng test matrix negative + mismatch | negative/version test suite pass baseline |
| `W3-ISS-007` | P2 | planner | Pha 7 | New | docs canonical drift sau migration | tạo hygiene backlog tuần 4 | mapping thay thế đầy đủ trong docs backlog |
| `W3-ISS-008` | P2 | tester | Pha 7 | New | edge-case test coverage chưa đủ | chuẩn bị expansion pack cho tuần 4 | tuần 4 có test expansion checklist |
| `W3-ISS-009` | P1 | tester + planner | Pha 5 | New | compatibility policy version drift (`COMPATIBILITY_POLICY_V1.md` vs `rust/Cargo.toml`) | sync policy doc với version/feature thực tế + thêm rule sync check vào weekly review | policy doc khớp workspace + checklist có rule update khi bump dependency |

## Triage clusters (Week 3)

- Schema/versioning:
  - `W3-ISS-001`, `W3-ISS-006`
- Semantics:
  - `W3-ISS-002`, `W3-ISS-003`, `W3-ISS-004`
- Observability:
  - `W3-ISS-005`
- Policy/compat governance:
  - `W3-ISS-009`
- Docs/testing backlog:
  - `W3-ISS-007`, `W3-ISS-008`

## Severity policy
- P0: chặn gate tuần 3 hoặc chặn kickoff tuần 4.
- P1: rủi ro cao, cần mitigation accepted trước gate.
- P2: hygiene/completeness theo dõi sang tuần 4.

---
Last updated: 2026-04-23
