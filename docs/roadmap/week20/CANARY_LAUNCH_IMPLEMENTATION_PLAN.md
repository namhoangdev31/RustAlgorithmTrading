# Canary Launch Implementation Plan W20

## 1) Execution model

Chuỗi triển khai W20:

`Freeze -> Baseline Capture -> Canary Launch Rollout -> Boundary/Escalation Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W20 mặc định là controlled-canary-launch-focused. Chỉ mở thay đổi code tối thiểu khi không thể đóng mandatory evidence bằng setup hiện có, và phải tạo `CR-W20-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W20_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | gate checklist | `EV-W20-201..210` |
| `docs/roadmap/week20/CANARY_LAUNCH_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W20-101..402` |
| `docs/roadmap/week20/ISSUE_REGISTER_WEEK20.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W20-401` |
| `docs/roadmap/week20/KPI_CHARTER_WEEK20.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W20-201..210` |
| `docs/roadmap/week20/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W20-401`,`EV-W20-402` |
| `docs/roadmap/week20/WEEK20_FINAL_REPORT_AND_WEEK21_START_PACK.md` | chốt final verdict theo evidence | W21 hard-gate priorities + blockers | không chốt GO nếu còn blocker | closeout review | `EV-W20-402` |
| `PLAYBOOK.md` | add W20 file mapping | role/test mapping | bỏ qua file mới | playbook sync audit | `EV-W20-402` |

## 3) Canary launch contract

1. Launch mandatory scenarios phải có coverage `100%`.
2. Risk boundary breach unmitigated phải bằng `0`.
3. Kill-switch + rollback drills phải pass `100%` trước gate lock.
4. Incident escalation phải deterministic và traceable.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run controlled canary launch rehearsals.
3. Run boundary monitoring + breach-handling drills.
4. Run kill-switch/rollback and escalation checks.
5. Rerun baseline after hardening.
6. Reconcile artifacts by strict order.
7. Lock final verdict.

## 5) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi runtime/public contract để đóng W20 gate, mở `CR-W20-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
