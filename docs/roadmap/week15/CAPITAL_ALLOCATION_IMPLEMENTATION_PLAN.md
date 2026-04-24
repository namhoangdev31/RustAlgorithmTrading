# Capital Allocation Implementation Plan W15

## 1) Execution model

Chuỗi triển khai W15:

`Freeze -> Baseline Capture -> Allocation Rollout -> Risk Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W15 mặc định là capital-allocation-focused. Chỉ mở thay đổi code tối thiểu khi không thể enforce allocation policy bằng setup hiện có, và phải tạo `CR-W15-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W15_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | allocation checklist | `EV-W15-201..216` |
| `docs/roadmap/week15/CAPITAL_ALLOCATION_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W15-101..216` |
| `docs/roadmap/week15/ISSUE_REGISTER_WEEK15.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W15-209`,`EV-W15-210`,`EV-W15-401` |
| `docs/roadmap/week15/KPI_CHARTER_WEEK15.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W15-201..210` |
| `docs/roadmap/week15/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W15-401`,`EV-W15-402` |
| `docs/roadmap/week15/WEEK15_FINAL_REPORT_AND_WEEK16_START_PACK.md` | chốt final verdict theo evidence | W16 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W15-402` |
| `docs/guides/RISK_MANAGEMENT_GUIDE.md` | dùng làm reference volatility/drawdown policy mapping (nếu cần) | policy note link tới W15 pack | không đổi core risk policy chỉ vì narrative | risk-governance review | `EV-W15-201`,`EV-W15-205` |
| `PLAYBOOK.md` | add W15 file mapping | role/class/test mapping | không để file mới thiếu mapping | playbook sync audit | `EV-W15-402` |

## 3) Capital allocation contract

### 3.1 Volatility/regime sizing

- Mọi sizing decision phải có volatility bucket + regime class.
- Missing volatility/regime context => decision `DEFER`.
- Sizing outside policy band => `REJECT`/`BLOCKED`.

### 3.2 Drawdown adherence

- Mọi allocation decision phải check drawdown policy trước promotion.
- Drawdown policy violation => `BLOCKED`.
- Violation resolution phải có mitigation + ETA.

### 3.3 Cross-strategy interaction

- Combined allocation scenarios phải không tạo exposure/concentration breach mới.
- Nếu combined scenario fail, final decision phải `BLOCKED` dù từng strategy pass đơn lẻ.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run volatility/regime sizing rehearsals.
3. Run drawdown adherence rehearsals.
4. Run cross-strategy allocation interaction rehearsals.
5. Run drift and governance consistency checks.
6. Rerun baseline after hardening.
7. Reconcile artifacts by strict order.
8. Lock final verdict.

## 5) Rollback / recovery policy

- W15 docs/governance changes rollback by reverting W15 documents.
- Nếu có minimal code hook bằng `CR-W15`, rollback phải ghi file list, expected behavior sau rollback và validation command.
- Allocation controls fail không được che bằng narrative; phải map issue + owner + ETA + rerun condition.

## 6) Dependency matrix

| Lane | Depends on | Blocks |
|---|---|---|
| Volatility sizing enforcement | W14 controls verdict + risk policy mapping | regime/drawdown checks |
| Regime-aware sizing enforcement | volatility checks | drawdown and cross-strategy checks |
| Drawdown adherence | volatility + regime sizing | final allocation pass |
| Cross-strategy allocation coverage | all allocation checks | final gate readiness |
| W16 handoff pack | final readiness verdict | reproducibility kickoff |

## 7) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi allocation decision payload/contract, mở `CR-W15-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
