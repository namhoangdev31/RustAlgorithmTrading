# Portfolio Controls Implementation Plan W14

## 1) Execution model

Chuỗi triển khai W14:

`Freeze -> Baseline Capture -> Controls Rollout -> Risk Hardening -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W14 mặc định là portfolio-controls-focused. Chỉ mở thay đổi code tối thiểu khi không thể enforce controls bằng policy hiện có, và phải tạo `CR-W14-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/roadmap/W14_OPERATIONS_PLAN.md` | cập nhật task/status theo execution thực tế | decision log cutover | không tự set GO khi thiếu evidence | controls checklist | `EV-W14-201..216` |
| `docs/roadmap/week14/PORTFOLIO_CONTROLS_BASELINE_REPORT.md` | cập nhật expected/actual/status/evidence | issue mapping từ failures | không để placeholder cho dòng đã chạy | command profile + rehearsals | `EV-W14-101..216` |
| `docs/roadmap/week14/ISSUE_REGISTER_WEEK14.md` | map blocker theo severity/owner/ETA | blocking_of + mitigation rõ | không để P1 unowned tại gate cutoff | issue closure review | `EV-W14-209`,`EV-W14-210`,`EV-W14-401` |
| `docs/roadmap/week14/KPI_CHARTER_WEEK14.md` | cập nhật KPI actual/status/evidence | KPI threshold reconciliation | không pass KPI bằng narrative chung | KPI checks | `EV-W14-201..210` |
| `docs/roadmap/week14/GATE_REHEARSAL_NOTES.md` | ghi từng gate item pass/fail thật | rerun notes + blocker state | không dùng verdict kép | gate rehearsal | `EV-W14-401`,`EV-W14-402` |
| `docs/roadmap/week14/WEEK14_FINAL_REPORT_AND_WEEK15_START_PACK.md` | chốt final verdict theo evidence | W15 priorities + guardrails | không chốt GO nếu còn blocker | closeout review | `EV-W14-402` |
| `docs/guides/RISK_MANAGEMENT_GUIDE.md` | dùng làm reference limit policy mapping (nếu cần) | policy note link tới W14 pack | không đổi core risk policy chỉ vì narrative | risk-governance review | `EV-W14-201`,`EV-W14-202` |
| `PLAYBOOK.md` | add W14 file mapping | role/class/test mapping | không để file mới thiếu mapping | playbook sync audit | `EV-W14-402` |

## 3) Portfolio controls contract

### 3.1 Exposure controls

- Mọi lệnh/decision làm vượt `max_total_exposure` phải bị chặn theo policy.
- Breach mới do W14 changes phải bằng `0`.
- Exposure decision phải có reason, owner và evidence link.

### 3.2 Concentration controls

- Mọi lệnh/decision làm vượt `max_concentration_percent` phải bị chặn theo policy.
- Concentration breach mới do W14 changes phải bằng `0`.
- Concentration decision phải có reason, owner và evidence link.

### 3.3 Cross-strategy interactions

- Required scenarios phải cover tương tác đa strategy.
- Nếu một strategy pass riêng lẻ nhưng fail khi combined exposure, decision cuối vẫn phải `BLOCKED`.

## 4) Rehearsal flow

1. Run baseline command profile.
2. Run exposure control enforcement rehearsals.
3. Run concentration control enforcement rehearsals.
4. Run cross-strategy interaction rehearsals.
5. Run drift and governance consistency checks.
6. Rerun baseline after hardening.
7. Reconcile artifacts by strict order.
8. Lock final verdict.

## 5) Rollback / recovery policy

- W14 docs/governance changes rollback by reverting W14 documents.
- Nếu có minimal code hook bằng `CR-W14`, rollback phải ghi file list, expected behavior sau rollback và validation command.
- Controls fail không được che bằng narrative; phải map issue + owner + ETA + rerun condition.

## 6) Dependency matrix

| Lane | Depends on | Blocks |
|---|---|---|
| Exposure control enforcement | W13 governance verdict + risk policy mapping | concentration and cross-strategy checks |
| Concentration control enforcement | exposure controls | final risk-control pass |
| Cross-strategy interaction coverage | exposure + concentration controls | final gate readiness |
| Drift/risk guard | command profile + controls baseline | final gate readiness |
| W15 handoff pack | final readiness verdict | capital allocation kickoff |

## 7) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi portfolio decision payload/contract, mở `CR-W14-001` trước khi patch.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
