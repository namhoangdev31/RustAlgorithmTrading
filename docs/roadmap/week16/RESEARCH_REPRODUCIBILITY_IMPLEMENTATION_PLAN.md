# Research Reproducibility Implementation Plan W16

## 1) Execution model

Chuỗi triển khai W16:

`Freeze -> Baseline Capture -> Reproducibility Rollout -> Consistency Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W16 mặc định là reproducibility-focused. Chỉ mở thay đổi code tối thiểu khi không thể enforce reproducibility policy bằng setup hiện có, và phải tạo `CR-W16-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W16_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | reproducibility checklist | `EV-W16-201..216` |
| `docs/roadmap/week16/RESEARCH_REPRODUCIBILITY_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W16-101..216` |
| `docs/roadmap/week16/ISSUE_REGISTER_WEEK16.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W16-209`,`EV-W16-210`,`EV-W16-401` |
| `docs/roadmap/week16/KPI_CHARTER_WEEK16.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W16-201..210` |
| `docs/roadmap/week16/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W16-401`,`EV-W16-402` |
| `docs/roadmap/week16/WEEK16_FINAL_REPORT_AND_WEEK17_START_PACK.md` | chốt final verdict theo evidence | W17 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W16-402` |
| `docs/guides/backtesting.md` | dùng làm reference rerun/validation consistency mapping (nếu cần) | policy note link tới W16 pack | không đổi methodology chỉ vì narrative | reproducibility review | `EV-W16-202`,`EV-W16-205` |
| `PLAYBOOK.md` | add W16 file mapping | role/class/test mapping | không để file mới thiếu mapping | playbook sync audit | `EV-W16-402` |

## 3) Reproducibility contract

### 3.1 Seed control

- Mọi rerun bắt buộc phải có seed profile rõ.
- Missing seed info => `DEFER`.
- Seed policy violation => `BLOCKED`.

### 3.2 Deterministic rerun profile

- Required rerun scenarios phải đi qua deterministic profile.
- Scenario không deterministic theo policy => `BLOCKED`.
- Kết quả pass/fail phải map với drift threshold.

### 3.3 Exception handling

- Exception hợp lệ phải có reason + owner + ETA.
- Exception không có evidence => `BLOCKED`.
- Exception không được bypass gate blockers.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run seed-control enforcement rehearsals.
3. Run deterministic rerun profile rehearsals.
4. Run multi-rerun consistency rehearsals.
5. Run exception-handling consistency checks.
6. Rerun baseline after hardening.
7. Reconcile artifacts by strict order.
8. Lock final verdict.

## 5) Rollback / recovery policy

- W16 docs/governance changes rollback by reverting W16 documents.
- Nếu có minimal code hook bằng `CR-W16`, rollback phải ghi file list, expected behavior sau rollback và validation command.
- Reproducibility controls fail không được che bằng narrative; phải map issue + owner + ETA + rerun condition.

## 6) Dependency matrix

| Lane | Depends on | Blocks |
|---|---|---|
| Seed-control enforcement | W15 verdict + reproducibility policy mapping | deterministic profile checks |
| Deterministic rerun enforcement | seed control | consistency checks |
| Multi-rerun consistency | seed + deterministic profile | final reproducibility pass |
| Exception handling consistency | all reproducibility checks | final gate readiness |
| W17 handoff pack | final readiness verdict | staging hardening kickoff |

## 7) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi reproducibility decision payload/contract, mở `CR-W16-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
