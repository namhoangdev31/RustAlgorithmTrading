# Final-Phase Gate 1 Implementation Plan W21

## 1) Execution model

Chuỗi triển khai W21:

`Freeze -> Baseline Capture -> Gate1 Rollout -> Debt Closure -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W21 mặc định là hard-gate1-focused. Chỉ mở thay đổi code tối thiểu khi không thể đóng mandatory evidence bằng setup hiện có, và phải tạo `CR-W21-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W21_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | gate checklist | `EV-W21-201..210` |
| `docs/roadmap/week21/FINAL_PHASE_GATE1_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W21-101..402` |
| `docs/roadmap/week21/ISSUE_REGISTER_WEEK21.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W21-401` |
| `docs/roadmap/week21/KPI_CHARTER_WEEK21.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W21-201..210` |
| `docs/roadmap/week21/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W21-401`,`EV-W21-402` |
| `docs/roadmap/week21/WEEK21_FINAL_REPORT_AND_WEEK22_START_PACK.md` | chốt final verdict theo evidence | W22 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W21-402` |
| `PLAYBOOK.md` | add W21 file mapping | role/test mapping | bỏ qua file mới | playbook sync audit | `EV-W21-402` |

## 3) Hard-gate1 contract

1. Full lint/type/static bắt buộc pass `100%`.
2. Full unit baseline bắt buộc pass `100%`.
3. Test debt phát sinh mới phải đóng trong tuần.
4. Rerun stability bắt buộc không phát sinh blocker mới.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Close lint/type/static blockers.
3. Close full unit baseline blockers.
4. Close debt items and rerun full profile.
5. Run correlation/compliance checks.
6. Reconcile artifacts by strict order.
7. Lock final verdict.

## 5) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi runtime/public contract để đóng W21 gate, mở `CR-W21-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
