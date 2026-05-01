# Safety Guardrails Implementation Plan W19

## 1) Execution model

Chuỗi triển khai W19:

`Freeze -> Baseline Capture -> Safety Rollout -> Resilience Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W19 mặc định là safety-guardrails-focused. Chỉ mở thay đổi code tối thiểu khi không thể đóng mandatory evidence bằng setup hiện có, và phải tạo `CR-W19-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W19_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | gate checklist | `EV-W19-201..210` |
| `docs/roadmap/week19/SAFETY_GUARDRAILS_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W19-101..402` |
| `docs/roadmap/week19/ISSUE_REGISTER_WEEK19.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W19-401` |
| `docs/roadmap/week19/KPI_CHARTER_WEEK19.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W19-201..210` |
| `docs/roadmap/week19/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W19-401`,`EV-W19-402` |
| `docs/roadmap/week19/WEEK19_FINAL_REPORT_AND_WEEK20_START_PACK.md` | chốt final verdict theo evidence | W20 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W19-402` |
| `PLAYBOOK.md` | add W19 file mapping | role/test mapping | bỏ qua file mới | playbook sync audit | `EV-W19-402` |

## 3) Safety guardrails contract

1. Kill-switch mandatory scenarios phải có evidence timing.
2. Risk-off playbook phải deterministic và traceable.
3. Rollback drills phải pass `100%` trước gate lock.
4. Risk boundary breach unmitigated phải bằng `0`.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run kill-switch response rehearsals.
3. Run risk-off and rollback rehearsals.
4. Run fault-injection and boundary checks.
5. Rerun baseline after hardening.
6. Reconcile artifacts by strict order.
7. Lock final verdict.

## 5) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi runtime/public contract để đóng W19 gate, mở `CR-W19-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
