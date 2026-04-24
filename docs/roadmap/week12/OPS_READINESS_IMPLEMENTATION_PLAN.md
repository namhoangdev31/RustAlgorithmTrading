# Ops Readiness Implementation Plan W12

## 1) Execution model

Chuỗi triển khai W12:

`Freeze -> Baseline Capture -> Readiness Rehearsal -> Governance Sync -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W12 mặc định là readiness/governance-focused. Chỉ mở thay đổi code tối thiểu khi không thể capture evidence bằng setup hiện có, và phải tạo `CR-W12-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W12_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | readiness checklist | `EV-W12-201..216` |
| `docs/roadmap/week12/OPS_READINESS_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W12-101..216` |
| `docs/roadmap/week12/ISSUE_REGISTER_WEEK12.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W12-202`,`EV-W12-203`,`EV-W12-401` |
| `docs/roadmap/week12/KPI_CHARTER_WEEK12.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng mô tả chung | KPI checks | `EV-W12-201..210` |
| `docs/roadmap/week12/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W12-401`,`EV-W12-402` |
| `docs/roadmap/week12/WEEK12_FINAL_REPORT_AND_WEEK13_START_PACK.md` | chốt final verdict theo evidence | W13 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W12-402` |
| `docs/roadmap/CHECKLIST_GATE_W01_W24.md` | sync W12 evidence range | readiness tick points | không tick GO/NO-GO thay evidence | checklist review | `EV-W12-402` |
| `docs/roadmap/EXECUTION_PLAN_24_WEEKS_2026-04-20_to_2026-10-04.md` | add W12 companion plan | no-date sync note | không đổi scope roadmap ngoài W12 sync | roadmap consistency | `EV-W12-402` |
| `PLAYBOOK.md` | add W12 file mapping | role/class/test mapping | không để file mới thiếu mapping | playbook sync audit | `EV-W12-402` |

## 3) Readiness contract

### 3.1 Technical readiness

- Command profile mandatory pass theo W12 baseline.
- Correlation/compliance audit findings = 0.
- Smoke critical path >=95%.
- Không có regression W09-W11.

### 3.2 Operational readiness

- P0/P1 ownership/escalation matrix complete.
- Incident + recovery rehearsals complete.
- Mandatory checklist items 100% complete.
- Manual toil watermark captured.

### 3.3 Governance readiness

- Baseline, issue register, KPI, gate notes, final report cùng một verdict.
- Evidence traceability complete.
- P0 open = 0, P1 unowned = 0.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Capture readiness mandatory checklist.
3. Run operational rehearsals (API/SLO, incident, recovery).
4. Run correlation/compliance audits.
5. Rerun baseline after hardening.
6. Reconcile artifacts by strict order.
7. Lock single verdict.

## 5) Rollback / recovery policy

- W12 docs/governance changes rollback by reverting W12 documents.
- Nếu có minimal code hook bằng `CR-W12`, rollback phải ghi file list, expected behavior sau rollback và validation command.
- Readiness fail không được che bằng cập nhật narrative; phải map issue + owner + ETA + rerun condition.

## 6) Dependency matrix

| Lane | Depends on | Blocks |
|---|---|---|
| Ownership/escalation readiness | W11 incident runbook outcomes | operational readiness |
| Technical readiness rehearsal | W09 observability + W10 API/SLO evidence | gate decision |
| Recovery readiness rehearsal | W11 runbook/recovery flow | gate decision |
| Governance reconciliation | baseline + issue + KPI data | final closeout |
| W13 handoff pack | final readiness verdict | strategy governance kickoff |

## 7) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi API behavior để capture readiness evidence, mở `CR-W12-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
