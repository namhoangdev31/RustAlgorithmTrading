# Final-Phase Gate 2 Implementation Plan W22

## 1) Execution model

Chuỗi triển khai W22:

`Freeze -> Baseline Capture -> Gate2 Rollout -> Debt Closure -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W22 mặc định là hard-gate2-focused. Chỉ mở thay đổi code tối thiểu khi không thể đóng mandatory evidence bằng setup hiện có, và phải tạo `CR-W22-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W22_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | gate checklist | `EV-W22-201..210` |
| `docs/roadmap/week22/FINAL_PHASE_GATE2_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W22-101..402` |
| `docs/roadmap/week22/ISSUE_REGISTER_WEEK22.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W22-401` |
| `docs/roadmap/week22/KPI_CHARTER_WEEK22.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W22-201..210` |
| `docs/roadmap/week22/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W22-401`,`EV-W22-402` |
| `docs/roadmap/week22/WEEK22_FINAL_REPORT_AND_WEEK23_START_PACK.md` | chốt final verdict theo evidence | W23 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W22-402` |
| `PLAYBOOK.md` | add W22 file mapping | role/test mapping | bỏ qua file mới | playbook sync audit | `EV-W22-402` |

## 3) Hard-gate2 contract

1. Full Python unit+integration bắt buộc pass `100%`.
2. Full Rust unit+integration bắt buộc pass `100%`.
3. Cross-runtime integration slices phải pass.
4. Integration debt phát sinh mới phải đóng trong tuần.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Close Python unit+integration blockers.
3. Close Rust unit+integration blockers.
4. Close cross-runtime debt items and rerun full profile.
5. Run correlation/compliance checks.
6. Reconcile artifacts by strict order.
7. Lock final verdict.

## 5) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi runtime/public contract để đóng W22 gate, mở `CR-W22-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
