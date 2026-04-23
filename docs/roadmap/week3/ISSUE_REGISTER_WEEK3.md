# Issue Register Week 3 (One-pass)

## Board schema
- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn:
  - `A-Incompatibility`
  - `B-SemanticDrift`
  - `C-ObservabilityGap`

## Active issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W3-ISS-001` | A-Incompatibility | P0 | coder | Pha 2 | done | `DONE` | contract parser freeze | bổ sung timestamp negative testcase + rerun parser matrix | `EV-W3-201..207` full `CAPTURED_PASS` | `EV-W3-201`,`EV-W3-202`,`EV-W3-203`,`EV-W3-205` | Gate |
| `W3-ISS-002` | B-SemanticDrift | P0 | coder | Pha 3 | done | `DONE` | bridge mapping | giữ mapping Signal đã pass, không mở rộng scope | Python->Rust handoff pass | `EV-W3-208` | Gate |
| `W3-ISS-003` | B-SemanticDrift | P0 | coder | Pha 3 | done | `DONE` | models/types mapping | fix observability import blocker để mở Rust->Python validation | Rust->Python handoff pass | `EV-W3-209` | Gate |
| `W3-ISS-004` | B-SemanticDrift | P1 | reviewer | Pha 3 | done | `DONE` | execution telemetry | giữ contract ExecutionAck + verify không regression | execution contract tests pass | `EV-W3-103` | KPI |
| `W3-ISS-005` | C-ObservabilityGap | P1 | ops | Pha 3 | done | `DONE` | observability cutover | sửa lỗi syntax import path observability và rerun integration | observability integration pass | `EV-W3-102`,`EV-W3-105`,`EV-W3-210` | Gate |
| `W3-ISS-006` | A-Incompatibility | P1 | tester | Pha 2 | done | `DONE` | negative coverage | thêm test sai timestamp format để đóng gap parser | all negative tests pass | `EV-W3-202..207` | Gate |
| `W3-ISS-007` | C-ObservabilityGap | P2 | planner | Pha 7 | done | `DONE` | docs hygiene | sync toàn bộ artifact sau khi gate state cố định | no contradiction in final docs | `EV-W3-901` | Week4 handoff |
| `W3-ISS-008` | B-SemanticDrift | P2 | tester | Pha 7 | week4 carry | `NEW` | edge-case backlog | chuyển sang week4 sau khi gate tuần 3 GO | week4 checklist ready | `EV-W3-902` | Week4 handoff |
| `W3-ISS-009` | B-SemanticDrift | P1 | tester + planner | Pha 5 | done | `DONE` | policy drift | đã sync policy/runtime qua cargo workspace check | policy check done | `EV-W3-104` | Gate |
| `W3-ISS-010` | A-Incompatibility | P1 | tester | Pha 7 | done | `DONE` | fuzzing stability | giữ fuzz parser trong baseline gate | `W3-T19` pass | `EV-W3-211` | Gate |
| `W3-ISS-011` | C-ObservabilityGap | P1 | ops + tester | Pha 7 | done | `DONE` | trace continuity | compliance/source audit đã pass, rehearsal shadow audit pass | `W3-T20` pass + compliance pass | `EV-W3-106`,`EV-W3-210`,`EV-W3-212` | Gate |
| `W3-ISS-012` | C-ObservabilityGap | P1 | ops | Pha 7 | done | `DONE` | source audit | giữ `audit_correlation.py` trong gate profile | `0 findings` | `EV-W3-107` | Gate |
| `W3-ISS-013` | C-ObservabilityGap | P1 | planner + reviewer | Pha 7 | done | `DONE` | playbook sync | sync class/type + contract behavior map | `W3-T21` pass | `EV-W3-213` | Gate |
| `W3-ISS-014` | A-Incompatibility | P1 | tester + ops | Pha 7 | done | `DONE` | network resilience | kịch bản disconnect và capture evidence pass | `W3-T22` pass | `EV-W3-214` | Gate |
| `W3-ISS-015` | B-SemanticDrift | P2 | tester | Pha 7 | done | `DONE` | perf watermark | bổ sung `max_ms` + `signal_to_ack` metrics | `W3-T23` pass | `EV-W3-215..220` | KPI |

## Gate blockers
- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong baseline matrix.
- [x] Toàn bộ exit criteria đạt được.

---
Last updated: 2026-04-23 (Final Week 3 Closeout)
