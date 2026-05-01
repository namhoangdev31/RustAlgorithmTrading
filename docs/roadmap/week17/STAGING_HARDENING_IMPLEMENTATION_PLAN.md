# Staging Hardening Implementation Plan W17

## 1) Execution model

Chuỗi triển khai W17:

`Freeze -> Baseline Capture -> Staging Rollout -> Resilience Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W17 mặc định là staging-hardening-focused. Chỉ mở thay đổi code tối thiểu khi không thể đóng mandatory evidence bằng setup hiện có, và phải tạo `CR-W17-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W17_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | gate checklist | `EV-W17-201..210` |
| `docs/roadmap/week17/STAGING_HARDENING_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W17-101..402` |
| `docs/roadmap/week17/ISSUE_REGISTER_WEEK17.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W17-401` |
| `docs/roadmap/week17/KPI_CHARTER_WEEK17.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W17-201..210` |
| `docs/roadmap/week17/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W17-401`,`EV-W17-402` |
| `docs/roadmap/week17/WEEK17_FINAL_REPORT_AND_WEEK18_START_PACK.md` | chốt final verdict theo evidence | W18 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W17-402` |
| `PLAYBOOK.md` | add W17 file mapping | role/test mapping | bỏ qua file mới | playbook sync audit | `EV-W17-402` |

## 3) Hardening contract

1. Soak mandatory scenarios phải có evidence thật.
2. Kill-switch response bắt buộc đo được và so với ngưỡng `<=60s`.
3. Rollback drills bắt buộc deterministic và traceable.
4. Incident->mitigation->rollback->confirm phải có ownership trail.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run soak stability rehearsals.
3. Run kill-switch and rollback rehearsals.
4. Run fault-injection and recovery consistency checks.
5. Rerun baseline after hardening.
6. Reconcile artifacts by strict order.
7. Lock final verdict.

## 5) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi runtime/public contract để đóng W17 gate, mở `CR-W17-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
