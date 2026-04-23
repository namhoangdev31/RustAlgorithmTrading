# Issue Register v3 - Week 3

## Board schema
- Columns: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Required metadata: `issue_id`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`

## Active issues

| Issue ID | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|
| `W3-ISS-001` | P0 | coder | Pha 2 | 1 phase | `NEW` | v1 envelope enforcement | freeze v1 envelope + strict validation rules | v1 envelope enforce trên boundary critical | `EV-W3-201,EV-W3-206` | Gate |
| `W3-ISS-002` | P0 | coder | Pha 3 | 1 phase | `NEW` | signal mapping drift | map `direction/strength` -> `action/confidence` + ISO timestamp | signal contract pass trên Python-Rust handoff | `EV-W3-207` | Gate |
| `W3-ISS-003` | P0 | coder | Pha 3 | 1 phase | `NEW` | risk decision drift | chuẩn hóa `decision/reason_code/limit_snapshot` | risk contract pass + replay context đầy đủ | `EV-W3-208` | Gate |
| `W3-ISS-004` | P1 | reviewer | Pha 3 | 1 phase | `NEW` | execution ack telemetry drift | chuẩn hóa `latency_bucket/retry_count` mapping | execution ack contract pass | `EV-W3-208` | KPI |
| `W3-ISS-005` | P1 | ops | Pha 3 | 1 phase | `NEW` | observability envelope drift | chuẩn hóa `trace_id/component/severity/timestamp` | observability envelope tests pass | `EV-W3-102,EV-W3-209` | KPI |
| `W3-ISS-006` | P1 | tester | Pha 2 | 1 phase | `NEW` | thiếu negative/version tests | mở rộng test matrix negative + mismatch | negative/version test suite pass baseline | `EV-W3-202..EV-W3-206` | Gate |
| `W3-ISS-007` | P2 | planner | Pha 7 | 1 phase | `NEW` | docs canonical drift sau migration | tạo hygiene backlog tuần 4 | mapping thay thế đầy đủ trong docs backlog | `EV-W3-901` | Week4 handoff |
| `W3-ISS-008` | P2 | tester | Pha 7 | 1 phase | `NEW` | edge-case test coverage chưa đủ | chuẩn bị expansion pack cho tuần 4 | tuần 4 có test expansion checklist | `EV-W3-902` | Week4 handoff |
| `W3-ISS-009` | P1 | tester + planner | Pha 5 | 1 phase | `NEW` | policy drift (`COMPATIBILITY_POLICY_V1.md` vs `rust/Cargo.toml`) | sync policy doc + rule sync check khi bump dependency | policy doc khớp workspace + checklist có rule update | `EV-W3-104` | Gate |

## Severity policy
- P0: chặn gate tuần 3 hoặc chặn kickoff tuần 4.
- P1: rủi ro cao, cần mitigation accepted trước gate.
- P2: hygiene/completeness theo dõi sang tuần 4.

## Gate-specific rule
- Không được set `GO` khi còn bất kỳ P0 ở `NEW/IN_PROGRESS/BLOCKED`.
- Không được set `GO` khi `W3-ISS-009` chưa `DONE`.

---
Last updated: 2026-04-23
