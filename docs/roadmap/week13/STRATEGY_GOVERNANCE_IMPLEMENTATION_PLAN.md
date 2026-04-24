# Strategy Governance Implementation Plan W13

## 1) Execution model

Chuỗi triển khai W13:

`Freeze -> Baseline Capture -> Governance Rollout -> Drift Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W13 mặc định là strategy-governance-focused. Chỉ mở thay đổi code tối thiểu khi không thể enforce evidence gate bằng policy hiện có, và phải tạo `CR-W13-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W13_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | governance checklist | `EV-W13-201..216` |
| `docs/roadmap/week13/STRATEGY_GOVERNANCE_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W13-101..216` |
| `docs/roadmap/week13/ISSUE_REGISTER_WEEK13.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W13-209`,`EV-W13-210`,`EV-W13-401` |
| `docs/roadmap/week13/KPI_CHARTER_WEEK13.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W13-201..210` |
| `docs/roadmap/week13/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W13-401`,`EV-W13-402` |
| `docs/roadmap/week13/WEEK13_FINAL_REPORT_AND_WEEK14_START_PACK.md` | chốt final verdict theo evidence | W14 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W13-402` |
| `docs/guides/strategy-development.md` | dùng làm reference checklist mapping (nếu cần làm rõ policy) | policy note link tới W13 pack | không đổi kỹ thuật strategy nếu không có CR | strategy governance review | `EV-W13-201`,`EV-W13-202` |
| `docs/guides/backtesting.md` | dùng làm reference walk-forward/OOS criteria (nếu cần) | criteria mapping note | không đổi phương pháp test vì mục tiêu narrative | backtesting governance review | `EV-W13-202`,`EV-W13-205` |
| `PLAYBOOK.md` | add W13 file mapping | role/class/test mapping | không để file mới thiếu mapping | playbook sync audit | `EV-W13-402` |

## 3) Governance contract

### 3.1 OOS/walk-forward enforcement

- Strategy submission thiếu OOS evidence => `BLOCKED`.
- Strategy submission thiếu walk-forward evidence => `BLOCKED`.
- Strategy có evidence nhưng format drift => `IN_PROGRESS` + remediation required.

### 3.2 Strategy decision workflow

Mỗi decision phải có:

1. strategy identifier.
2. decision status (`APPROVE`, `REJECT`, `DEFER`, `BLOCKED`).
3. owner.
4. rationale ngắn gọn, kiểm chứng được.
5. evidence IDs.
6. next action + ETA.

### 3.3 Drift and risk guard

- Reproducibility drift target `<=1%`.
- Exposure/concentration breach mới do W13 changes target `=0`.
- Nếu vượt ngưỡng => block promotion và mở issue severity tương ứng.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run OOS checklist enforcement rehearsal.
3. Run walk-forward checklist enforcement rehearsal.
4. Run decision traceability audit.
5. Run drift and risk guard audits.
6. Rerun baseline after hardening.
7. Reconcile artifacts by strict order.
8. Lock final verdict.

## 5) Rollback / recovery policy

- W13 docs/governance changes rollback by reverting W13 documents.
- Nếu có minimal code hook bằng `CR-W13`, rollback phải ghi file list, expected behavior sau rollback và validation command.
- Governance fail không được che bằng narrative; phải map issue + owner + ETA + rerun condition.

## 6) Dependency matrix

| Lane | Depends on | Blocks |
|---|---|---|
| OOS/walk-forward checklist enforcement | W12 readiness verdict + strategy docs | strategy evidence gate |
| Strategy evidence gate | checklist enforcement | decision workflow |
| Decision traceability | evidence gate | final gate readiness |
| Drift/risk guard | command profile + strategy baseline | final gate readiness |
| W14 handoff pack | final readiness verdict | portfolio controls kickoff |

## 7) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi strategy decision payload/contract, mở `CR-W13-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
