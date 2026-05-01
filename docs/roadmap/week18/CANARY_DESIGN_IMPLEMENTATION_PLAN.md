# Canary Design Implementation Plan W18

## 1) Execution model

Chuỗi triển khai W18:

`Freeze -> Baseline Capture -> Canary Rollout -> Breach/Recovery Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W18 mặc định là canary-design-focused. Chỉ mở thay đổi code tối thiểu khi không thể đóng mandatory evidence bằng setup hiện có, và phải tạo `CR-W18-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W18_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | gate checklist | `EV-W18-201..210` |
| `docs/roadmap/week18/CANARY_DESIGN_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W18-101..402` |
| `docs/roadmap/week18/ISSUE_REGISTER_WEEK18.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W18-401` |
| `docs/roadmap/week18/KPI_CHARTER_WEEK18.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W18-201..210` |
| `docs/roadmap/week18/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W18-401`,`EV-W18-402` |
| `docs/roadmap/week18/WEEK18_FINAL_REPORT_AND_WEEK19_START_PACK.md` | chốt final verdict theo evidence | W19 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W18-402` |
| `PLAYBOOK.md` | add W18 file mapping | role/test mapping | bỏ qua file mới | playbook sync audit | `EV-W18-402` |

## 3) Canary contract

1. Canary mandatory scenarios phải có coverage `100%`.
2. Rollback drills phải pass `100%` trước gate lock.
3. Breach handling phải deterministic, có trace đầy đủ.
4. Risk boundary breach unmitigated phải bằng `0`.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run canary scenario rehearsals.
3. Run rollback and kill-switch rehearsals.
4. Run fault-injection and breach-handling checks.
5. Rerun baseline after hardening.
6. Reconcile artifacts by strict order.
7. Lock final verdict.

## 5) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi runtime/public contract để đóng W18 gate, mở `CR-W18-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
